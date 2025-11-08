/**
 * Token-Oriented Object Notation (TOON)
 * 
 * A compact format for LLM prompts with ~50% fewer tokens than JSON
 * 
 * @example
 * ```typescript
 * import { encode } from '@ayushman/toon';
 * 
 * const data = { tags: ['jazz', 'chill', 'lofi'] };
 * const toon = encode(data);
 * // Result: tags[3]: jazz,chill,lofi
 * ```
 */

export { encode } from './encode';
export type { EncodeOptions } from './types';
