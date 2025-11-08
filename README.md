# TOON - Token-Oriented Object Notation

A compact, human-readable format designed for passing structured data to Large Language Models (LLMs) with **~50% fewer tokens** than JSON.

## Installation

```bash
npm install @ayushman/toon
```

## Usage

```typescript
import { encode } from '@ayushman/toon';

// Simple array
const data = { tags: ['jazz', 'chill', 'lofi'] };
const toon = encode(data);
// Result: tags[3]: jazz,chill,lofi

// Object
const user = { name: 'John', age: 30, active: true };
const toon = encode(user);
// Result: name: John,age: 30,active: true

// Nested structure
const nested = { user: { name: 'John', tags: ['admin', 'user'] } };
const toon = encode(nested);
// Result: user{name: John,tags[2]: admin,user}
```

## Options

```typescript
import { encode, EncodeOptions } from '@ayushman/toon';

const options: EncodeOptions = {
  compactBooleans: true,  // Use 1/0 instead of true/false
  compactNull: true,      // Use ~ instead of null
  readable: false         // Add spaces for readability (default: false)
};

const data = { active: true, value: null };
const toon = encode(data, options);
// Result: active: 1,value: ~
```

## Token Comparison

### Example 1: Simple Array

**JSON**: `{ "tags": ["jazz", "chill", "lofi"] }`  
**Tokens**: ~15 tokens

**TOON**: `tags[3]: jazz,chill,lofi`  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 2: Object with Multiple Fields

**JSON**: `{ "name": "John", "age": 30, "active": true }`  
**Tokens**: ~15 tokens

**TOON**: `name: John, age: 30, active: 1` (with compactBooleans)  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 3: Nested Structure

**JSON**: `{ "user": { "name": "John", "tags": ["admin", "user"] } }`  
**Tokens**: ~20 tokens

**TOON**: `user{name: John,tags[2]: admin,user}`  
**Tokens**: ~11 tokens

**Savings**: ~45% token reduction

## Format Specification

TOON uses compact syntax to minimize token usage:

- **Arrays**: `key[count]: value1,value2,value3`
- **Objects**: `key1: value1, key2: value2`
- **Nested Objects**: `key{innerKey: value}`
- **Primitives**: No quotes unless needed (spaces, special chars)
- **Booleans**: `true`/`false` or `1`/`0` (compact mode)
- **Null**: `null` or `~` (compact mode)

See the [official specification](./spec/TOON.md) for complete details.

## Token Optimization Features

1. **Smart Quoting**: Only quotes strings that contain spaces or special characters
2. **Boolean Compression**: Use `1`/`0` instead of `true`/`false` (saves ~60% tokens)
3. **Compact Separators**: No spaces around separators
4. **Explicit Counts**: Array counts enable efficient parsing
5. **Minimal Nesting**: Compact nesting syntax

## Examples

### Basic Examples

```typescript
// Array
encode({ tags: ['jazz', 'chill', 'lofi'] })
// → tags[3]: jazz,chill,lofi

// Object
encode({ name: 'John', age: 30 })
// → name: John,age: 30

// Nested
encode({ user: { name: 'John', age: 30 } })
// → user{name: John,age: 30}

// Array of objects
encode({ users: [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }] })
// → users[2]: {name: Alice,age: 25},{name: Bob,age: 30}
```

### With Options

```typescript
// Compact mode
encode({ active: true, value: null }, { 
  compactBooleans: true, 
  compactNull: true 
})
// → active: 1,value: ~

// Readable mode
encode({ name: 'John', age: 30 }, { readable: true })
// → name: John, age: 30
```

### Special Cases

```typescript
// Strings with spaces (auto-quoted)
encode({ title: 'Hello World' })
// → title: "Hello World"

// Empty arrays
encode({ tags: [] })
// → tags[0]:

// Empty objects
encode({ config: {} })
// → config{}

// Mixed types
encode({ mixed: ['hello', 42, true] })
// → mixed[3]: hello,42,true
```

## API Reference

### `encode(value, options?)`

Encodes a value to TOON format.

**Parameters:**
- `value` (any): The value to encode (any JSON-serializable value)
- `options` (EncodeOptions, optional): Encoding options

**Returns:**
- `string`: TOON format string

**Options:**
- `compactBooleans?: boolean` - Use `1`/`0` instead of `true`/`false` (default: `false`)
- `compactNull?: boolean` - Use `~` instead of `null` (default: `false`)
- `readable?: boolean` - Add spaces after separators (default: `false`)

## Use Cases

TOON is designed for:
- **LLM Prompts**: Reduce token usage in API calls
- **Structured Data**: Pass complex data structures efficiently
- **Context Windows**: Fit more data in limited context windows
- **Cost Optimization**: Reduce API costs by using fewer tokens

## License

MIT

## Contributing

Contributions welcome! Please see the [specification](./spec/TOON.md) for format details.

# toon
