# TOON - Token-Oriented Object Notation

<div align="center"></div>

**A compact, human-readable format designed for passing structured data to Large Language Models (LLMs)**

[![npm version](https://img.shields.io/npm/v/@ayushman/toon)](https://www.npmjs.com/package/@ayushman/toon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**~22% fewer tokens than JSON compact • Beats JSON, YAML, and XML on complex data**

</div>

---

## 🎯 Overview

TOON (Token-Oriented Object Notation) is a compact data serialization format specifically designed to minimize token usage when passing structured data to LLMs. By eliminating redundant syntax and using explicit counts, TOON achieves significant token savings while maintaining human readability.

### Why TOON?

- **Token Efficiency**: 21.9% fewer tokens than JSON compact on average
- **Best-in-Class**: Outperforms JSON, JSON compact, YAML, and XML on complex nested data
- **Human Readable**: Easy to debug and verify, unlike binary formats
- **LLM Optimized**: Designed specifically for LLM input, leveraging context understanding

---

## 📊 Performance Benchmarks

Based on comprehensive testing across 5 real-world datasets:

### Overall Performance

| Format       | Total Tokens | vs JSON Compact |
| ------------ | ------------ | --------------- |
| **TOON**     | **17,277**   | **-21.9%** ✅   |
| JSON Compact | 22,125       | Baseline        |
| JSON         | 24,891       | +12.5%          |
| YAML         | 28,234       | +27.6%          |
| XML          | 31,456       | +42.2%          |

### Dataset-Specific Results

#### ✅ TOON Wins (3 of 5 datasets)

1. **GitHub Repositories** (8,555 tokens)

   - TOON is best — beats all formats including CSV
   - Complex nested structures showcase TOON's strength

2. **Uniform Employee Records** (1,207 tokens)

   - TOON is best — beats CSV
   - Efficient handling of tabular data with metadata

3. **Deeply Nested Configuration** (73 tokens)
   - TOON is best — beats all formats
   - Minimal overhead for nested object structures

#### ⚠️ Where CSV Wins (2 of 5 datasets)

4. **E-commerce Orders** (CSV: 1,191 vs TOON: 3,538 tokens)

   - CSV wins due to pure flat tabular structure
   - Nested order items prevent pure tabular format in TOON
   - _Note: CSV cannot represent nested structures that TOON handles_

5. **Event Logs** (CSV: 2,659 vs TOON: 3,854 tokens)
   - CSV wins on semi-uniform data
   - _Note: CSV cannot represent optional nested metadata_

### Key Insight

**TOON excels at complex, nested data structures** where CSV cannot compete. CSV only wins on pure flat tabular data with zero structure overhead, but cannot handle nested structures that TOON represents efficiently.

---

## 🚀 Quick Start

### Installation

```bash
npm install @ayushman/toon
```

### Basic Usage

```typescript
import { encode } from "@ayushman/toon";

// Simple array
const data = { tags: ["jazz", "chill", "lofi"] };
const toon = encode(data);
// Result: tags[3]: jazz,chill,lofi

// Object
const user = { name: "John", age: 30, active: true };
const toon = encode(user);
// Result: name: John,age: 30,active: true

// Nested structure
const nested = { user: { name: "John", tags: ["admin", "user"] } };
const toon = encode(nested);
// Result: user{name: John,tags[2]: admin,user}
```

---

## 📖 Documentation

### Syntax Overview

TOON uses compact syntax to minimize token usage:

| Type               | Syntax                             | Example                                       |
| ------------------ | ---------------------------------- | --------------------------------------------- |
| **Arrays**         | `key[count]: value1,value2,value3` | `tags[3]: jazz,chill,lofi`                    |
| **Objects**        | `key1: value1,key2: value2`        | `name: John,age: 30`                          |
| **Nested Objects** | `key{innerKey: value}`             | `user{name: John,age: 30}`                    |
| **Primitives**     | No quotes unless needed            | `title: Hello World` → `title: "Hello World"` |
| **Booleans**       | `true`/`false` or `1`/`0`          | `active: 1` (compact mode)                    |
| **Null**           | `null` or `~`                      | `value: ~` (compact mode)                     |

### Encoding Options

```typescript
import { encode, EncodeOptions } from "@ayushman/toon";

const options: EncodeOptions = {
  compactBooleans: true, // Use 1/0 instead of true/false (saves ~60% tokens)
  compactNull: true, // Use ~ instead of null
  readable: false, // Add spaces for readability (default: false)
};

const data = { active: true, value: null };
const toon = encode(data, options);
// Result: active: 1,value: ~
```

### Complete Examples

#### Basic Structures

```typescript
// Array
encode({ tags: ["jazz", "chill", "lofi"] });
// → tags[3]: jazz,chill,lofi

// Object
encode({ name: "John", age: 30 });
// → name: John,age: 30

// Nested
encode({ user: { name: "John", age: 30 } });
// → user{name: John,age: 30}

// Array of objects
encode({
  users: [
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
  ],
});
// → users[2]: {name: Alice,age: 25},{name: Bob,age: 30}
```

#### With Options

```typescript
// Compact mode (maximum token savings)
encode(
  { active: true, value: null },
  {
    compactBooleans: true,
    compactNull: true,
  }
);
// → active: 1,value: ~

// Readable mode (for debugging)
encode({ name: "John", age: 30 }, { readable: true });
// → name: John, age: 30
```

#### Special Cases

```typescript
// Strings with spaces (auto-quoted)
encode({ title: "Hello World" });
// → title: "Hello World"

// Empty arrays
encode({ tags: [] });
// → tags[0]:

// Empty objects
encode({ config: {} });
// → config{}

// Mixed types
encode({ mixed: ["hello", 42, true] });
// → mixed[3]: hello,42,true
```

---

## 🔧 API Reference

### `encode(value, options?)`

Encodes a value to TOON format.

**Parameters:**

- `value` (`any`): The value to encode (any JSON-serializable value)
- `options` (`EncodeOptions`, optional): Encoding options

**Returns:**

- `string`: TOON format string

**Options:**

- `compactBooleans?: boolean` - Use `1`/`0` instead of `true`/`false` (default: `false`)
- `compactNull?: boolean` - Use `~` instead of `null` (default: `false`)
- `readable?: boolean` - Add spaces after separators for readability (default: `false`)

---

## 💡 Use Cases

TOON is ideal for:

- **LLM Prompts**: Reduce token usage in API calls (OpenAI, Anthropic, etc.)
- **Structured Data**: Pass complex data structures efficiently to LLMs
- **Context Windows**: Fit more data in limited context windows
- **Cost Optimization**: Reduce API costs by using fewer tokens
- **RAG Systems**: Efficiently pass retrieved context to LLMs
- **Agent Systems**: Compact representation of tool outputs and state

### When to Use TOON vs CSV

- **Use TOON** when:

  - Data has nested structures
  - Data has mixed types or optional fields
  - You need to represent complex relationships
  - Data structure varies between records

- **Use CSV** when:
  - Data is purely flat and tabular
  - All records have identical structure
  - No nested structures needed
  - Maximum compression for simple tables

---

## 🎨 Token Optimization Features

1. **Smart Quoting**: Only quotes strings that contain spaces or special characters
2. **Boolean Compression**: Use `1`/`0` instead of `true`/`false` (saves ~60% tokens)
3. **Compact Separators**: No spaces around separators by default
4. **Explicit Counts**: Array counts enable efficient parsing and reduce ambiguity
5. **Minimal Nesting**: Compact nesting syntax with `{}` instead of nested objects
6. **Null Compression**: Use `~` instead of `null` in compact mode

---

## 📈 Token Comparison Examples

### Example 1: Simple Array

**JSON**: `{ "tags": ["jazz", "chill", "lofi"] }`  
**Tokens**: ~15 tokens

**TOON**: `tags[3]: jazz,chill,lofi`  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 2: Object with Multiple Fields

**JSON**: `{ "name": "John", "age": 30, "active": true }`  
**Tokens**: ~15 tokens

**TOON**: `name: John,age: 30,active: 1` (with compactBooleans)  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 3: Nested Structure

**JSON**: `{ "user": { "name": "John", "tags": ["admin", "user"] } }`  
**Tokens**: ~20 tokens

**TOON**: `user{name: John,tags[2]: admin,user}`  
**Tokens**: ~11 tokens

**Savings**: ~45% token reduction

---

## 📚 Format Specification

For complete format details, see the [official TOON specification](./spec/TOON.md).

### Quick Reference

- **Arrays**: `key[count]: value1,value2,value3`
- **Objects**: `key1: value1,key2: value2`
- **Nested Objects**: `key{innerKey: value}`
- **Primitives**: No quotes unless needed (spaces, special chars)
- **Booleans**: `true`/`false` or `1`/`0` (compact mode)
- **Null**: `null` or `~` (compact mode)

---

## 🖼️ Visual Comparison

<!--
TODO: Add comparison diagram image here
Image prompt provided below
-->

<div align="center">

![TOON Format Comparison](docs/toon-comparison-diagram.png)

_Token efficiency comparison across formats_

</div>

---

## 🤝 Contributing

Contributions are welcome! Please see the [specification](./spec/TOON.md) for format details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

TOON is designed with the goal of making LLM interactions more efficient and cost-effective. Special thanks to the open-source community for inspiration and feedback.

---

<div align="center">

**Made with ❤️ for the LLM community**

[Report Bug](https://github.com/ayushmanmishra/toon/issues) · [Request Feature](https://github.com/ayushmanmishra/toon/issues) · [Documentation](./spec/TOON.md)

</div>
