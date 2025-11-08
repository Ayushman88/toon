# TOON - Token-Oriented Object Notation

<div align="center">

**A compact, human-readable format designed for passing structured data to Large Language Models (LLMs)**

[![npm version](https://img.shields.io/npm/v/@ayushmanmishra/toon)](https://www.npmjs.com/package/@ayushmanmishra/toon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**21.9% fewer tokens than JSON compact • Best-in-class performance on complex nested data**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Benchmarks](#-performance-benchmarks) • [Specification](./spec/TOON.md)

</div>

---

## 🎯 What is TOON?

**TOON (Token-Oriented Object Notation)** is a compact data serialization format specifically engineered to minimize token usage when passing structured data to Large Language Models. By eliminating redundant syntax, using explicit counts, and leveraging LLM context understanding, TOON achieves significant token savings while maintaining human readability.

### Key Advantages

- **🏆 Best-in-Class Performance**: Outperforms JSON, JSON compact, YAML, and XML on complex nested data
- **⚡ 21.9% Token Reduction**: Fewer tokens than JSON compact on average across real-world datasets
- **📖 Human Readable**: Easy to debug and verify, unlike binary formats
- **🤖 LLM Optimized**: Designed specifically for LLM input, leveraging context understanding
- **🌳 Nested Structure Support**: Handles complex hierarchies that CSV cannot represent

---

## 📊 Performance Benchmarks

Comprehensive testing across **5 real-world datasets** demonstrates TOON's superior performance:

### Overall Performance Summary

| Format       | Total Tokens | vs JSON Compact | vs TOON  |
| ------------ | ------------ | --------------- | -------- |
| **TOON**     | **17,277**   | **-21.9%** ✅   | Baseline |
| JSON Compact | 22,125       | Baseline        | +28.1%   |
| JSON         | 24,891       | +12.5%          | +44.1%   |
| YAML         | 28,234       | +27.6%          | +63.4%   |
| XML          | 31,456       | +42.2%          | +82.1%   |

**Result**: TOON is the **best format overall**, winning in 3 of 5 datasets and beating all structured formats (JSON, YAML, XML).

### Detailed Dataset Results

#### ✅ TOON Wins (3 of 5 datasets)

1. **GitHub Repositories** — **8,555 tokens** (TOON is best)

   - Beats all formats including CSV
   - Complex nested structures showcase TOON's strength
   - Repositories with metadata, nested objects, and arrays

2. **Uniform Employee Records** — **1,207 tokens** (TOON is best)

   - Beats CSV
   - Efficient handling of tabular data with metadata
   - Demonstrates TOON's versatility beyond pure nesting

3. **Deeply Nested Configuration** — **73 tokens** (TOON is best)
   - Beats all formats
   - Minimal overhead for nested object structures
   - Perfect for configuration files and hierarchical data

#### ⚠️ Where CSV Wins (2 of 5 datasets)

4. **E-commerce Orders** — CSV: 1,191 tokens vs TOON: 3,538 tokens

   - CSV wins due to pure flat tabular structure
   - Nested order items prevent pure tabular format in TOON
   - **Note**: CSV cannot represent nested structures that TOON handles efficiently

5. **Event Logs** — CSV: 2,659 tokens vs TOON: 3,854 tokens
   - CSV wins on semi-uniform data
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
import { encode } from "@ayushmanmishra/toon";

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

### Real-World Example

```typescript
import { encode } from "@ayushmanmishra/toon";

// GitHub repository data
const repo = {
  name: "toon",
  stars: 150,
  owner: { name: "ayushman", verified: true },
  tags: ["llm", "format", "optimization"],
  config: { private: false, archived: false },
};

const toon = encode(repo, { compactBooleans: true });
// Result: name: toon,stars: 150,owner{name: ayushman,verified: 1},tags[3]: llm,format,optimization,config{private: 0,archived: 0}
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

| Option            | Type      | Default | Description                                               |
| ----------------- | --------- | ------- | --------------------------------------------------------- |
| `compactBooleans` | `boolean` | `false` | Use `1`/`0` instead of `true`/`false` (saves ~60% tokens) |
| `compactNull`     | `boolean` | `false` | Use `~` instead of `null`                                 |
| `readable`        | `boolean` | `false` | Add spaces after separators for readability               |

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

[Report Bug](https://github.com/ayushmanmishra/toon/issues) · [Request Feature](https://github.com/ayushmanmishra/toon/issues) · [Documentation](./spec/TOON.md) · [npm Package](https://www.npmjs.com/package/@ayushmanmishra/toon)

</div>
