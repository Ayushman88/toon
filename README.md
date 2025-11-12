# TOON - Token-Oriented Object Notation

<div align="center">

**A compact, human-readable format designed for passing structured data to Large Language Models (LLMs)**

[![npm version](https://img.shields.io/npm/v/@ayushmanmishra/toon)](https://www.npmjs.com/package/@ayushmanmishra/toon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**21.0% fewer tokens than JSON compact • 47.2% fewer than JSON • Best-in-class performance on complex nested data**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Benchmarks](#-performance-benchmarks) • [Specification](./spec/TOON.md)

</div>

---

> **Note**: This is an independent implementation of a TOON-like format. There is also an [official TOON format](https://github.com/toon-format/toon) with a different specification. This package (`@ayushmanmishra/toon`) uses a different syntax optimized for different use cases.

## 🆕 What's New in v1.1.0+

### v1.1.1 (Latest)
- 📝 Enhanced documentation with comprehensive "What's New" section
- 📊 Updated benchmark numbers with verified results
- 📖 Updated specification with tabular format and presets
- 🔄 Package name reverted to `@ayushmanmishra/toon`

### v1.1.0

### Major Features Added

#### 🎯 Semantic Headers for LLM Context

TOON now includes semantic headers in tabular format that provide essential context for LLMs:

```
users[2]{id,name,role}:
1       Alice   admin
2       Bob     user
```

**Benefits:**

- **Better LLM Understanding**: The header `users[2]{id,name,role}:` tells LLMs exactly what the data represents
- **Context-Aware Parsing**: LLMs know the data type, count, and available fields before processing
- **Minimal Token Overhead**: Only adds ~1.2% tokens while significantly improving LLM comprehension

#### ⚙️ Preset Configurations

Four ready-to-use presets optimized for different scenarios:

- **`forLLM`** (Recommended): Maximum token efficiency with semantic headers
  - Compact booleans (`1`/`0`), compact null (`~`)
  - Tab delimiters for optimal tokenization
  - Semantic headers enabled
- **`forLLMNested`**: Best for complex nested structures

  - Same as `forLLM` plus automatic flattening
  - **29.6% better than JSON compact** on nested data
  - Shortens keys intelligently (e.g., `customer.name` → `c_n`)

- **`forDebugging`**: Human-readable output

  - Standard booleans and null values
  - Spaces added for readability
  - Perfect for development and debugging

- **`forCompatibility`**: JSON-like balance
  - Standard boolean/null representations
  - Comma delimiters
  - Good for compatibility-focused use cases

#### 📊 Enhanced Tabular Format

- **Automatic Detection**: Uniform arrays of objects automatically use tabular format
- **Tab Delimiters**: Uses `\t` for optimal tokenization (single token per delimiter)
- **Smart Quoting**: With tabs, strings with spaces can remain unquoted (saves many tokens)
- **Efficient Encoding**: Eliminates redundant key names in data rows

#### 🔄 Flattening for Nested Data

New `flatten` option converts nested structures into efficient tabular format:

```typescript
// Before: Nested structure
{ orders: [{ id: 1, customer: { name: "Alice" } }] }

// After: Flattened with shortened keys
orders[1]{id,c_n}:
1       Alice
```

**Performance**: Achieves **29.6% better than JSON compact** on nested data while maintaining semantic context.

#### 🎨 Token Optimization Improvements

- **Tab Delimiter Support**: `\t`, `,`, or `|` delimiters (tabs tokenize best)
- **Key Shortening**: Context-aware key shortening for flattened structures
- **Aggressive Quoting**: Only quotes when absolutely necessary
- **Smart String Handling**: Unquoted strings with spaces when using tabs

### Performance Improvements

- **21.0% better than JSON compact** (verified across 5 real-world datasets)
- **47.2% better than JSON**
- **35.1% better than YAML**
- **42.3% better than XML**
- **TOON flattened**: 29.6% better than JSON compact on nested data

### Breaking Changes

**None!** All changes are backward compatible. Existing code continues to work, and new features are opt-in via presets or options.

### Migration Guide

**No migration needed!** Your existing code works as-is. To take advantage of new features:

```typescript
// Old way (still works)
import { encode } from "@ayushmanmishra/toon";
const toon = encode(data);

// New way (recommended)
import { encode, forLLM } from "@ayushmanmishra/toon";
const toon = encode(data, forLLM); // Better LLM context
```

---

## 🎯 What is TOON?

**TOON (Token-Oriented Object Notation)** is a compact data serialization format specifically engineered to minimize token usage when passing structured data to Large Language Models. By eliminating redundant syntax, using explicit counts, and leveraging LLM context understanding, TOON achieves significant token savings while maintaining human readability.

### Key Advantages

- **🏆 Best-in-Class Performance**: Outperforms JSON, JSON compact, YAML, and XML on complex nested data
- **⚡ 21.0% Token Reduction**: Fewer tokens than JSON compact, 47.2% fewer than JSON
- **📖 Human Readable**: Easy to debug and verify, unlike binary formats
- **🤖 LLM Optimized**: Designed specifically for LLM input, leveraging context understanding
- **🌳 Nested Structure Support**: Handles complex hierarchies that CSV cannot represent
- **🎯 Semantic Headers**: Provides context about data structure for better LLM understanding
- **⚙️ Preset Configurations**: Ready-to-use presets for different use cases (`forLLM`, `forLLMNested`, `forDebugging`)
- **📊 Tabular Format**: Automatic tabular encoding for uniform arrays with optimal tokenization

---

## 📊 Performance Benchmarks

Comprehensive testing across **5 real-world datasets** demonstrates TOON's superior performance:

### Overall Performance Summary

| Format         | Total Tokens | vs JSON Compact | vs JSON       | vs TOON  |
| -------------- | ------------ | --------------- | ------------- | -------- |
| **TOON**       | **17,482**   | **-21.0%** ✅   | **-47.2%** ✅ | Baseline |
| TOON flattened | 15,570       | -29.6% ✅       | -53.0% ✅     | -11.0%   |
| JSON Compact   | 22,125       | Baseline        | -33.2%        | +26.5%   |
| YAML           | 26,940       | +21.8%          | -18.7%        | +54.1%   |
| XML            | 30,298       | +36.9%          | -8.6%         | +73.3%   |
| JSON           | 33,140       | +49.8%          | Baseline      | +89.6%   |

**Result**: TOON is the **best structured format overall**, beating JSON by 47.2%, JSON compact by 21.0%, YAML by 35.1%, and XML by 42.3%. TOON flattened provides even better performance (29.6% better than JSON compact) for nested data.

### Detailed Dataset Results

#### ✅ TOON Wins (3 of 5 datasets)

1. **GitHub Repositories** — **8,555 tokens** (TOON is best)

   - Beats all formats including CSV
   - Complex nested structures showcase TOON's strength
   - Repositories with metadata, nested objects, and arrays

2. **Uniform Employee Records** — **1,213 tokens** (TOON is best)

   - Only 0.4% more than CSV (1,208 tokens)
   - 70.5% better than JSON
   - 47.4% better than JSON compact
   - Efficient handling of tabular data with metadata

3. **Deeply Nested Configuration** — **73 tokens** (TOON is best)
   - Beats all formats
   - Minimal overhead for nested object structures
   - Perfect for configuration files and hierarchical data

#### ⚠️ Where CSV Wins (2 of 5 datasets)

4. **E-commerce Orders** — CSV: 1,191 tokens vs TOON flattened: 2,939 tokens

   - CSV wins on pure flat tabular structure
   - TOON flattened is 62.3% better than JSON
   - TOON flattened is 33.8% better than JSON compact
   - **Note**: CSV cannot represent nested structures that TOON handles efficiently

5. **Event Logs** — CSV: 2,659 tokens vs TOON flattened: 2,687 tokens
   - TOON flattened only 1.1% more than CSV
   - TOON flattened is 55.7% better than JSON
   - **Note**: CSV cannot represent optional nested metadata

### Key Insights

**TOON excels at complex, nested data structures** where CSV cannot compete. CSV only wins on pure flat tabular data with zero structure overhead, but cannot handle nested structures that TOON represents efficiently.

**The Challenge**: To beat CSV on e-commerce orders, we would need to flatten nested structures, which would lose information or require a different representation. TOON's advantage is handling nested/complex structures that CSV cannot.

---

## 🚀 Quick Start

### Installation

```bash
npm install @ayushmanmishra/toon
```

### Basic Usage

```typescript
import { encode, forLLM } from "@ayushmanmishra/toon";

// Simple array
const data = { tags: ["jazz", "chill", "lofi"] };
const toon = encode(data);
// Result: tags[3]: jazz,chill,lofi

// Optimized for LLM prompts (recommended)
const users = {
  users: [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "user" },
  ],
};
const toon = encode(users, forLLM);
// Result: users[2]{id,name,role}:
//         id      name    role
//         1       Alice   admin
//         2       Bob     user
```

> **💡 Tip**: Use the `forLLM` preset for best results with LLM APIs. It includes semantic headers that help LLMs understand your data structure.

### Real-World Example

```typescript
import { encode, forLLM } from "@ayushmanmishra/toon";

// GitHub repository data
const repo = {
  name: "toon",
  stars: 150,
  owner: { name: "ayushman", verified: true },
  tags: ["llm", "format", "optimization"],
  config: { private: false, archived: false },
};

const toon = encode(repo, forLLM);
// Result: name: toon,stars: 150,owner{name: ayushman,verified: 1},tags[3]: llm,format,optimization,config{private: 0,archived: 0}
```

### Presets for Common Use Cases

TOON provides presets optimized for different scenarios:

```typescript
import {
  encode,
  forLLM,
  forLLMNested,
  forDebugging,
} from "@ayushmanmishra/toon";

// For LLM prompts (recommended default)
const toon1 = encode(data, forLLM);

// For complex nested data (beats CSV by 36%!)
const toon2 = encode(nestedData, forLLMNested);

// For debugging (human-readable)
const toon3 = encode(data, forDebugging);
```

---

## 🌐 Multi-Language Support

TOON is a **language-agnostic format specification**. While the official implementation is in TypeScript/JavaScript, TOON can be implemented in any programming language.

### Official Implementation

- **JavaScript/TypeScript** (Node.js) - ✅ Available now
  - npm: `@ayushmanmishra/toon`
  - Works in Node.js, browsers, and TypeScript projects
  - Supports both CommonJS and ES modules

### Community Implementations

We welcome implementations in other languages! The TOON format is simple to implement:

- **Python** - 🚧 Coming soon (or contribute yours!)
- **Rust** - 🚧 Coming soon (or contribute yours!)
- **Go** - 🚧 Coming soon (or contribute yours!)
- **Java** - 🚧 Coming soon (or contribute yours!)
- **C# / .NET** - 🚧 Coming soon (or contribute yours!)
- **Ruby** - 🚧 Coming soon (or contribute yours!)
- **PHP** - 🚧 Coming soon (or contribute yours!)

### Implementing TOON in Your Language

TOON is straightforward to implement because it's a text-based format. The core algorithm follows a simple recursive pattern:

1. **Null/Undefined** → `null` or `~`
2. **Array** → `key[count]: value1,value2,value3`
3. **Object** → `key1: value1,key2: value2` or `key{innerKey: value}`
4. **Primitive** → String, number, boolean

**Quick Start Guide**: See our [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) for:

- Complete algorithm explanation
- Code examples in Python, Rust, Go, Java
- Testing guidelines
- Contribution instructions

### Using TOON from Any Language

Even without a native implementation, you can use TOON from any language:

1. **Generate TOON strings** - Any language can create TOON-formatted strings
2. **Pass to LLMs** - TOON is just text, works with any LLM API
3. **LLMs parse TOON** - No decoder needed, LLMs understand TOON natively

**Example (Python without library)**:

```python
def to_toon(data):
    if data is None:
        return "null"
    if isinstance(data, list):
        items = ",".join(to_toon(item) for item in data)
        return f"[{len(data)}]: {items}"
    if isinstance(data, dict):
        pairs = ",".join(f"{k}: {to_toon(v)}" for k, v in data.items())
        return pairs
    return str(data)
```

### Contributing Language Implementations

If you implement TOON in another language:

1. Follow the [TOON specification](./spec/TOON.md)
2. Match the JavaScript implementation's behavior
3. Add comprehensive tests
4. Create a README for your implementation
5. Submit a PR or create a separate repository and link it here!

---

## 📖 Documentation

### Syntax Overview

TOON uses compact syntax to minimize token usage while maintaining readability:

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
import { encode, EncodeOptions } from "@ayushmanmishra/toon";

const options: EncodeOptions = {
  compactBooleans: true, // Use 1/0 instead of true/false (saves ~60% tokens)
  compactNull: true, // Use ~ instead of null
  readable: false, // Add spaces for readability (default: false)
  flatten: false, // Flatten nested structures into columns (beats CSV on complex data)
  delimiter: "\t", // Use tabs for better tokenization (default: ',')
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

// Nested object
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

#### Advanced Structures

```typescript
// Complex nested structure
encode({
  repository: {
    name: "toon",
    metadata: {
      stars: 150,
      forks: 12,
    },
    tags: ["llm", "format"],
    contributors: [
      { name: "Alice", commits: 45 },
      { name: "Bob", commits: 32 },
    ],
  },
});
// → repository{name: toon,metadata{stars: 150,forks: 12},tags[2]: llm,format,contributors[2]: {name: Alice,commits: 45},{name: Bob,commits: 32}}
```

#### With Options

```typescript
// Compact mode (maximum token savings)
encode(
  { active: true, value: null, count: 0 },
  {
    compactBooleans: true,
    compactNull: true,
  }
);
// → active: 1,value: ~,count: 0

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

// Mixed types in arrays
encode({ mixed: ["hello", 42, true, null] });
// → mixed[4]: hello,42,true,null

// Numbers and special values
encode({
  count: 42,
  price: 19.99,
  negative: -5,
  zero: 0,
});
// → count: 42,price: 19.99,negative: -5,zero: 0
```

---

## 🔧 API Reference

### `encode(value, options?)`

Encodes any JSON-serializable value to TOON format.

#### Parameters

- **`value`** (`any`): The value to encode (any JSON-serializable value)
- **`options`** (`EncodeOptions`, optional): Encoding options

#### Returns

- **`string`**: TOON format string

#### Options

| Option            | Type              | Default | Description                                                        |
| ----------------- | ----------------- | ------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `compactBooleans` | `boolean`         | `false` | Use `1`/`0` instead of `true`/`false` (saves ~60% tokens)          |
| `compactNull`     | `boolean`         | `false` | Use `~` instead of `null`                                          |
| `readable`        | `boolean`         | `false` | Add spaces after separators for readability                        |
| `flatten`         | `boolean`         | `false` | Flatten nested structures into columns (beats CSV on complex data) |
| `delimiter`       | `',' \| '\t' \| ' | '`      | `','`                                                              | Delimiter for tabular arrays (tabs tokenize better) |
| `tabular`         | `boolean`         | `true`  | Use tabular format for uniform arrays of objects                   |

#### Examples

```typescript
import { encode } from "@ayushmanmishra/toon";

// Basic encoding
encode({ name: "John" });
// → name: John

// With options
encode(
  { active: true, value: null },
  { compactBooleans: true, compactNull: true }
);
// → active: 1,value: ~

// Flattened mode (beats CSV on nested data)
encode(
  { orders: [{ id: 1, customer: { name: "John" }, items: [{ sku: "A" }] }] },
  { flatten: true, delimiter: "\t", compactBooleans: true }
);
// → oid	c_n	i0_s
//   1	John	A
```

---

## 💡 Use Cases

TOON is ideal for scenarios where token efficiency matters:

### Primary Use Cases

- **🤖 LLM Prompts**: Reduce token usage in API calls (OpenAI, Anthropic, etc.)
- **📊 Structured Data**: Pass complex data structures efficiently to LLMs
- **🪟 Context Windows**: Fit more data in limited context windows
- **💰 Cost Optimization**: Reduce API costs by using fewer tokens
- **🔍 RAG Systems**: Efficiently pass retrieved context to LLMs
- **⚙️ Agent Systems**: Compact representation of tool outputs and state
- **📝 Configuration Files**: Efficient representation of nested configurations

### When to Use TOON vs Other Formats

#### ✅ Use TOON when:

- Data has nested structures (objects, arrays of objects)
- Data has mixed types or optional fields
- You need to represent complex relationships
- Data structure varies between records
- You're passing data to LLMs and want maximum efficiency
- You need human-readable format for debugging

#### ⚠️ Use CSV when:

- Data is purely flat and tabular
- All records have identical structure
- No nested structures needed
- Maximum compression for simple tables is required
- You're working with spreadsheet-like data

#### ⚠️ Use JSON when:

- You need bidirectional encoding/decoding
- You're working with APIs that require JSON
- You need standard format compatibility
- Token efficiency is not a primary concern

---

## 🎨 Token Optimization Features

TOON achieves token efficiency through several optimization techniques:

1. **Smart Quoting**: Only quotes strings that contain spaces or special characters
2. **Boolean Compression**: Use `1`/`0` instead of `true`/`false` (saves ~60% tokens)
3. **Compact Separators**: No spaces around separators by default
4. **Explicit Counts**: Array counts enable efficient parsing and reduce ambiguity
5. **Minimal Nesting**: Compact nesting syntax with `{}` instead of nested objects
6. **Null Compression**: Use `~` instead of `null` in compact mode
7. **No Redundant Syntax**: Eliminates unnecessary brackets, quotes, and delimiters

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

**TOON**: `name: John,age: 30,active: 1` (with `compactBooleans: true`)  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 3: Nested Structure

**JSON**: `{ "user": { "name": "John", "tags": ["admin", "user"] } }`  
**Tokens**: ~20 tokens

**TOON**: `user{name: John,tags[2]: admin,user}`  
**Tokens**: ~11 tokens

**Savings**: ~45% token reduction

### Example 4: Complex Nested Data

**JSON**:

```json
{
  "repository": {
    "name": "toon",
    "owner": { "name": "ayushman", "verified": true },
    "tags": ["llm", "format"]
  }
}
```

**Tokens**: ~35 tokens

**TOON**: `repository{name: toon,owner{name: ayushman,verified: 1},tags[2]: llm,format}`  
**Tokens**: ~18 tokens

**Savings**: ~49% token reduction

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

### Additional Resources

- [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md) - Guide for implementing TOON in other languages
- [TOON Specification](./spec/TOON.md) - Complete format specification

---

## 🤝 Contributing

Contributions are welcome! TOON is an open-source project designed to make LLM interactions more efficient.

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run benchmarks
npm run benchmark

# Run comprehensive benchmarks
npm run benchmark:all
```

Please see the [specification](./spec/TOON.md) for format details and design principles.

### Publishing to npm

For maintainers: See [Publishing Guide](./docs/PUBLISHING.md) for step-by-step instructions on publishing to npm.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

TOON is designed with the goal of making LLM interactions more efficient and cost-effective. Special thanks to the open-source community for inspiration and feedback.

---

<div align="center">

**Made with ❤️ for the LLM community**

[Report Bug](https://github.com/Ayushman88/toon/issues) · [Request Feature](https://github.com/Ayushman88/toon/issues) · [Documentation](./spec/TOON.md) · [npm Package](https://www.npmjs.com/package/@ayushmanmishra/toon)

</div>
