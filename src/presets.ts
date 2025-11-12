/**
 * Preset configurations for common use cases
 * These presets optimize TOON encoding for specific scenarios
 */

import { EncodeOptions } from './types';

/**
 * Preset for LLM prompts - optimized for maximum token efficiency
 * Uses compact booleans, compact null, and tab delimiters
 * 
 * @example
 * ```typescript
 * import { encode, forLLM } from '@am/toon';
 * 
 * const data = { users: [{ id: 1, name: 'Alice' }] };
 * const toon = encode(data, forLLM);
 * // Result includes semantic header: users[1]{id,name}:
 * ```
 */
export const forLLM: EncodeOptions = {
  compactBooleans: true,
  compactNull: true,
  delimiter: '\t',
  tabular: true,
  flatten: false,
  readable: false,
};

/**
 * Preset for LLM prompts with nested data - uses flattening to beat CSV
 * Best for complex nested structures like orders, transactions, etc.
 * 
 * @example
 * ```typescript
 * import { encode, forLLMNested } from '@am/toon';
 * 
 * const data = { 
 *   orders: [{ 
 *     id: 1, 
 *     customer: { name: 'Alice' },
 *     items: [{ sku: 'A' }]
 *   }] 
 * };
 * const toon = encode(data, forLLMNested);
 * // Result: flattened format with shortened keys
 * ```
 */
export const forLLMNested: EncodeOptions = {
  compactBooleans: true,
  compactNull: true,
  delimiter: '\t',
  tabular: true,
  flatten: true,
  readable: false,
};

/**
 * Preset for human-readable output - useful for debugging
 * Adds spaces and uses standard boolean/null representations
 * 
 * @example
 * ```typescript
 * import { encode, forDebugging } from '@am/toon';
 * 
 * const data = { name: 'John', active: true };
 * const toon = encode(data, forDebugging);
 * // Result: name: John, active: true (with spaces)
 * ```
 */
export const forDebugging: EncodeOptions = {
  compactBooleans: false,
  compactNull: false,
  delimiter: ',',
  tabular: true,
  flatten: false,
  readable: true,
};

/**
 * Preset for maximum compatibility - closest to JSON-like output
 * Useful when you need a balance between efficiency and readability
 * 
 * @example
 * ```typescript
 * import { encode, forCompatibility } from '@am/toon';
 * 
 * const data = { name: 'John', active: true };
 * const toon = encode(data, forCompatibility);
 * // Result: name: John,active: true
 * ```
 */
export const forCompatibility: EncodeOptions = {
  compactBooleans: false,
  compactNull: false,
  delimiter: ',',
  tabular: true,
  flatten: false,
  readable: false,
};

