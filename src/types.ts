/**
 * Options for encoding values to TOON format
 */
export interface EncodeOptions {
  /**
   * Use compact mode for booleans (1/0 instead of true/false)
   * @default false
   */
  compactBooleans?: boolean;

  /**
   * Use compact mode for null (~ instead of null)
   * @default false
   */
  compactNull?: boolean;

  /**
   * Add spaces after separators for readability
   * @default false
   */
  readable?: boolean;

  /**
   * Delimiter for tabular arrays (',' or '\t' or '|')
   * Tabs tokenize better than commas in many tokenizers
   * @default ','
   */
  delimiter?: ',' | '\t' | '|';

  /**
   * Use tabular format for uniform arrays of objects
   * @default true
   */
  tabular?: boolean;
}

/**
 * Type guard to check if a value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Type guard to check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
