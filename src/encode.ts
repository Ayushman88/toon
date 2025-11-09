import { EncodeOptions, isPlainObject, isArray } from './types';

/**
 * Checks if a string needs to be quoted (aggressive optimization)
 * Only quote when absolutely necessary to avoid parsing ambiguity
 */
function needsQuoting(str: string, delimiter: string = '\t'): boolean {
  if (str === '') return true; // Empty string needs quotes
  
  // For tabs: only quote if contains tab, pipe (row separator), or structural chars
  if (delimiter === '\t') {
    if (/[\t|:\[\]{}]/.test(str)) {
      return true;
    }
    // ULTRA-OPTIMIZATION: With tabs, spaces don't break parsing - allow unquoted strings with spaces
    // This is a key optimization: tabs + spaces = no quotes needed (saves many tokens)
  } else {
    // For commas/pipes: quote if contains delimiter or structural chars
    if (new RegExp(`[${delimiter === ',' ? ',' : '|'}:\\[\\]{}]`).test(str)) {
      return true;
    }
    // Spaces still need quotes with commas (they break parsing)
    if (str.includes(' ')) {
      return true;
    }
  }
  
  // Quote if looks like boolean/number/null (could be ambiguous)
  if (/^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)$/.test(str)) {
    return true;
  }
  
  return false;
}

/**
 * Escapes a string for TOON format
 */
function escapeString(str: string): string {
  // Escape quotes if present
  return str.replace(/"/g, '\\"');
}

/**
 * Encodes a primitive value to TOON format
 */
function encodePrimitive(
  value: unknown,
  options: EncodeOptions = {}
): string {
  if (value === null || value === undefined) {
    return options.compactNull ? '~' : 'null';
  }

  if (typeof value === 'boolean') {
    if (options.compactBooleans) {
      return value ? '1' : '0';
    }
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    const str = value;
    const delimiter = options.delimiter || ',';
    if (needsQuoting(str, delimiter)) {
      return `"${escapeString(str)}"`;
    }
    // Return unquoted string - LLMs can parse this correctly
    return str;
  }

  // Fallback for other types (symbol, function, etc.)
  return String(value);
}

/**
 * Flattens a nested object into flat key-value pairs with underscore notation
 * Uses underscores instead of dots to save tokens (shorter, single token)
 * Example: { customer: { name: "John" }, items: [{ sku: "A" }] }
 * Returns: { "customer_name": "John", "item0_sku": "A" }
 */
/**
 * Shortens common key names to save tokens
 * Uses context-aware shortening to avoid collisions
 */
function shortenKey(key: string, context: string = ''): string {
  // Context-aware shortcuts to avoid collisions
  if (context.includes('item') || context.includes('i')) {
    // In item context, use different shortcuts
    const itemShortcuts: Record<string, string> = {
      'items': 'i',
      'item': 'i',
      'sku': 's',
      'quantity': 'q',
      'price': 'p',
    };
    if (itemShortcuts[key]) return itemShortcuts[key];
  }
  
  const shortcuts: Record<string, string> = {
    'items': 'i',
    'item': 'i',
    'customer': 'c',
    'quantity': 'q',
    'price': 'p',
    'orderId': 'oid',
    'status': 'st',
    'total': 't',
    'name': 'n',
    'email': 'e',
    'sku': 'sku', // Keep full to avoid collision with status
  };
  return shortcuts[key] || key;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string = '',
  maxArrayDepth: number = 10
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Shorten key to save tokens (pass prefix as context)
    const shortKey = shortenKey(key, prefix);
    // Use underscore separator (saves tokens vs dot notation)
    const newKey = prefix ? `${prefix}_${shortKey}` : shortKey;
    
    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (isArray(value)) {
      // Flatten arrays by creating indexed columns (i0, i1, etc.)
      if (value.length > 0 && maxArrayDepth > 0) {
        value.forEach((item, index) => {
          if (isPlainObject(item)) {
            // Use shorter prefix: "i0" instead of "items0"
            const arrayPrefix = prefix ? `${prefix}_${shortKey}${index}` : `${shortKey}${index}`;
            const nested = flattenObject(item, arrayPrefix, maxArrayDepth - 1);
            Object.assign(flattened, nested);
          } else if (isArray(item)) {
            // Nested arrays - flatten recursively
            item.forEach((subItem, subIndex) => {
              if (isPlainObject(subItem)) {
                const nestedPrefix = prefix ? `${prefix}_${shortKey}${index}_${subIndex}` : `${shortKey}${index}_${subIndex}`;
                const nested = flattenObject(subItem, nestedPrefix, maxArrayDepth - 1);
                Object.assign(flattened, nested);
              } else {
                const flatKey = prefix ? `${prefix}_${shortKey}${index}_${subIndex}` : `${shortKey}${index}_${subIndex}`;
                flattened[flatKey] = subItem;
              }
            });
          } else {
            // Primitive array item
            const flatKey = prefix ? `${prefix}_${shortKey}${index}` : `${shortKey}${index}`;
            flattened[flatKey] = item;
          }
        });
      } else {
        flattened[newKey] = value;
      }
    } else if (isPlainObject(value)) {
      // Flatten nested objects recursively
      const nested = flattenObject(value, newKey, maxArrayDepth);
      Object.assign(flattened, nested);
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Checks if an array contains uniform objects (same keys, all primitive values)
 * This enables tabular format encoding which is much more token-efficient
 */
function isUniformObjectArray(arr: unknown[]): {
  isUniform: boolean;
  keys?: string[];
} {
  if (arr.length === 0) {
    return { isUniform: false };
  }

  // All items must be plain objects
  if (!arr.every(item => isPlainObject(item))) {
    return { isUniform: false };
  }

  // Get keys from first object (preserve order, don't sort)
  const firstItem = arr[0] as Record<string, unknown>;
  const keys = Object.keys(firstItem);
  
  // Check if all objects have the same keys (order doesn't matter for comparison)
  const allSameKeys = arr.every(item => {
    const itemKeys = Object.keys(item as Record<string, unknown>);
    if (itemKeys.length !== keys.length) return false;
    // Check if all keys exist (order independent)
    return keys.every(key => itemKeys.includes(key));
  });

  if (!allSameKeys) {
    return { isUniform: false };
  }

  // Check if all values are primitives (no nested objects/arrays)
  const allPrimitives = arr.every(item => {
    const obj = item as Record<string, unknown>;
    return keys.every(key => {
      const value = obj[key];
      return (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      );
    });
  });

  return {
    isUniform: allPrimitives,
    keys: allPrimitives ? keys : undefined
  };
}

/**
 * Encodes a uniform array of objects in tabular format
 * ULTRA-COMPACT: Beat CSV by using pure CSV-like format with tabs
 * Format: field1\tfield2\nvalue1\tvalue2\nvalue3\tvalue4 (pure CSV-like, no overhead)
 */
function encodeTabularArray(
  arr: Record<string, unknown>[],
  keys: string[],
  keyName: string = '',
  options: EncodeOptions = {}
): string {
  // ULTRA-OPTIMIZATION: Always use tabs (best tokenization, single token)
  const delimiter = options.delimiter !== undefined ? options.delimiter : '\t';
  
  // ULTRA-OPTIMIZATION: Pure CSV-like format - no count, no brackets, no braces
  // This matches CSV exactly for tabular data, but TOON can handle nested structures
  const header = keys.join(delimiter);
  const rows = arr.map(obj => {
    const values = keys.map(key => {
      const value = obj[key];
      // For tabular format, be even more aggressive with quoting
      // Only quote if absolutely necessary (contains tab, newline, or quote)
      const encoded = encodePrimitive(value, { ...options, delimiter });
      // Remove quotes if value doesn't need them in tab context
      if (encoded.startsWith('"') && encoded.endsWith('"')) {
        const unquoted = encoded.slice(1, -1);
        // Only keep quotes if value contains tab, newline, or would be ambiguous
        if (!unquoted.includes('\t') && !unquoted.includes('\n') && !unquoted.includes('"')) {
          // Check if it looks like a number/boolean that needs quotes
          if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(unquoted) && unquoted !== 'true' && unquoted !== 'false' && unquoted !== 'null') {
            return unquoted;
          }
        }
      }
      return encoded;
    });
    return values.join(delimiter);
  });
  
  // Pure CSV format: header\nrow1\nrow2 (no indentation, no count, no brackets)
  return `${header}\n${rows.join('\n')}`;
}

/**
 * Encodes an array to TOON format
 */
function encodeArray(
  arr: unknown[],
  keyName: string = '',
  options: EncodeOptions = {}
): string {
  if (arr.length === 0) {
    // Keep brackets for structure clarity, remove colon (saves token)
    return '[0]';
  }

  // Check if we should use tabular format
  const useTabular = options.tabular !== false; // Default to true
  if (useTabular) {
    // If flatten mode is enabled, flatten nested structures first
    if (options.flatten && arr.every(item => isPlainObject(item))) {
      const flattened = arr.map(item => flattenObject(item as Record<string, unknown>));
      
      // Get all unique keys from all flattened objects
      const allKeysSet = new Set<string>();
      flattened.forEach(obj => {
        Object.keys(obj).forEach(key => allKeysSet.add(key));
      });
      const allKeys = Array.from(allKeysSet);
      
      // Create uniform array with all keys (fill missing with null)
      const uniform = flattened.map(obj => {
        const result: Record<string, unknown> = {};
        allKeys.forEach(key => {
          result[key] = key in obj ? obj[key] : null;
        });
        return result;
      });
      
      return encodeTabularArray(uniform, allKeys, keyName, options);
    }
    
    const uniformCheck = isUniformObjectArray(arr);
    if (uniformCheck.isUniform && uniformCheck.keys) {
      // Use tabular format for uniform arrays of objects
      return encodeTabularArray(
        arr as Record<string, unknown>[],
        uniformCheck.keys,
        keyName,
        options
      );
    }
  }

  // Use list format for non-uniform arrays or when tabular is disabled
  const separator = options.readable ? ', ' : ',';
  const values = arr.map((item) => {
    if (isArray(item)) {
      // Nested array - encodeArray already returns [count]: values format
      return encodeArray(item, '', options);
    } else if (isPlainObject(item)) {
      // Keep braces for structure clarity - helps LLMs parse object boundaries
      const objStr = encodeObject(item, options);
      return `{${objStr}}`;
    } else {
      return encodePrimitive(item, options);
    }
  });

  // Keep brackets for structure clarity - LLMs need this to parse correctly
  // Remove colon (saves token, brackets make structure clear)
  // Format: [5]value1,value2,value3 or [5] value1, value2, value3 (readable)
  const spaceAfterCount = options.readable ? ' ' : '';
  return `[${arr.length}]${spaceAfterCount}${values.join(separator)}`;
}

/**
 * Encodes an object to TOON format
 */
function encodeObject(
  obj: Record<string, unknown>,
  options: EncodeOptions = {}
): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    // Empty object - return empty string (caller handles display)
    return '';
  }

  const separator = options.readable ? ', ' : ',';
  const pairs = entries.map(([key, value]) => {
    // Keys with spaces must be quoted
    const encodedKey = (key.includes(' ') || needsQuoting(key)) ? `"${escapeString(key)}"` : key;

    if (isArray(value)) {
      const arrayStr = encodeArray(value, key, options);
      // For tabular format (CSV-like), optimize key prefix
      // Check if it's tabular format (contains newlines and doesn't start with [count])
      if (arrayStr.includes('\n') && !arrayStr.startsWith('[')) {
        // ULTRA-OPTIMIZATION: Check if this is the only field in the object
        // If it's the only field, we can skip the key prefix to match CSV exactly
        const isOnlyField = entries.length === 1;
        if (isOnlyField) {
          // Root-level tabular array - no key prefix, pure CSV format
          // This matches CSV exactly for single-field objects with tabular arrays
          return arrayStr;
        }
        // Multiple fields - need key prefix for structure
        // Format: key\nheader\nrow1\nrow2 (no colon, saves token)
        return `${encodedKey}\n${arrayStr}`;
      }
      return `${encodedKey}${arrayStr}`;
    } else if (isPlainObject(value)) {
      // Keep braces for nesting clarity - LLMs need this to understand structure
      const nested = encodeObject(value, options);
      // If nested is empty, just return key (no braces needed)
      if (nested === '') {
        return encodedKey;
      }
      return `${encodedKey}{${nested}}`;
    } else {
      const encodedValue = encodePrimitive(value, options);
      // Only add space after colon in readable mode
      // For quoted strings, no space saves tokens: name:"John" vs name: "John"
      // For unquoted values, no space saves tokens: name:John vs name: John
      const space = options.readable ? ' ' : '';
      return `${encodedKey}:${space}${encodedValue}`;
    }
  });

  return pairs.join(separator);
}

/**
 * Encodes a value to TOON format
 * @param value - The value to encode (can be any JSON-serializable value)
 * @param options - Encoding options
 * @returns TOON format string
 */
export function encode(
  value: unknown,
  options: EncodeOptions = {}
): string {
  if (value === null || value === undefined) {
    return options.compactNull ? '~' : 'null';
  }

  if (isArray(value)) {
    return encodeArray(value, '', options);
  }

  if (isPlainObject(value)) {
    return encodeObject(value, options);
  }

  return encodePrimitive(value, options);
}
