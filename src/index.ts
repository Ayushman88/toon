/**
 * Token-Oriented Object Notation (TOON)
 * 
 * A compact format for LLM prompts with ~50% fewer tokens than JSON
 * 
 * @example
 * ```typescript
 * import { encode, forLLM } from '@am/toon';
 * 
 * // Simple usage
 * const data = { tags: ['jazz', 'chill', 'lofi'] };
 * const toon = encode(data);
 * // Result: tags[3]: jazz,chill,lofi
 * 
 * // Optimized for LLM prompts
 * const users = { users: [{ id: 1, name: 'Alice' }] };
 * const toon = encode(users, forLLM);
 * // Result: users[1]{id,name}:
 * //         id      name
 * //         1       Alice
 * ```
 */

export { encode } from './encode';
export type { EncodeOptions } from './types';
export { 
  forLLM, 
  forLLMNested, 
  forDebugging, 
  forCompatibility 
} from './presets';
