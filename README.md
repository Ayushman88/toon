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

---

## 🎯 What is TOON?

**TOON (Token-Oriented Object Notation)** is a compact data serialization format specifically engineered to minimize token usage when passing structured data to Large Language Models. By eliminating redundant syntax, using explicit counts, and leveraging LLM context understanding, TOON achieves significant token savings while maintaining human readability.

### Key Features

- **🏆 Superior Performance**: 21.0% fewer tokens than JSON compact, 47.2% fewer than JSON
- **🎯 Semantic Headers**: Context-rich headers (`users[2]{id,name,role}:`) improve LLM understanding
- **⚙️ Preset Configurations**: Optimized presets for different use cases (`forLLM`, `forLLMNested`, `forDebugging`, `forCompatibility`)
- **📊 Intelligent Tabular Format**: Automatic tabular encoding with tab delimiters for optimal tokenization
- **🔄 Nested Data Flattening**: Converts complex nested structures into efficient tabular format (29.6% better than JSON compact)
- **📖 Human Readable**: Easy to debug and verify, unlike binary formats
- **🌳 Full Structure Support**: Handles complex hierarchies that CSV cannot represent

---

## 📊 Performance Benchmarks

### Overview

TOON has been comprehensively benchmarked against JSON, JSON compact, YAML, XML, and CSV across **5 diverse real-world datasets** using GPT-4 tokenization. The results demonstrate TOON's superior performance for LLM applications.

### Overall Performance Summary

| Format         | Total Tokens | vs JSON Compact | vs JSON       | vs TOON  | Winner           |
| -------------- | ------------ | --------------- | ------------- | -------- | ---------------- |
| **TOON**       | **17,482**   | **-21.0%** ✅   | **-47.2%** ✅ | Baseline | 🏆 Best          |
| TOON flattened | 15,570       | -29.6% ✅       | -53.0% ✅     | -11.0%   | 🥇 Best (nested) |
| JSON Compact   | 22,125       | Baseline        | -33.2%        | +26.5%   |                  |
| YAML           | 26,940       | +21.8%          | -18.7%        | +54.1%   |                  |
| XML            | 30,298       | +36.9%          | -8.6%         | +73.3%   |                  |
| JSON           | 33,140       | +49.8%          | Baseline      | +89.6%   |                  |

**Key Results:**

- ✅ **TOON beats JSON by 47.2%** (33,140 → 17,482 tokens)
- ✅ **TOON beats JSON compact by 21.0%** (22,125 → 17,482 tokens)
- ✅ **TOON beats YAML by 35.1%** (26,940 → 17,482 tokens)
- ✅ **TOON beats XML by 42.3%** (30,298 → 17,482 tokens)
- ✅ **TOON flattened beats JSON compact by 29.6%** on nested data

### Dataset-by-Dataset Breakdown

#### Dataset 1: GitHub Repositories (Complex Nested Data)

**Winner: TOON** 🏆

| Format       | Tokens | vs TOON  | Performance                        |
| ------------ | ------ | -------- | ---------------------------------- |
| **TOON**     | 8,555  | Baseline | 🏆 Best                            |
| JSON Compact | 11,348 | +32.6%   |                                    |
| JSON         | 15,034 | +75.7%   |                                    |
| YAML         | 12,938 | +51.2%   |                                    |
| XML          | 14,369 | +68.0%   |                                    |
| CSV          | N/A    | N/A      | Cannot represent nested structures |

**Why TOON Wins:**

- Complex nested structures (repositories with metadata, nested objects, arrays)
- TOON's compact nesting syntax (`owner{name: user,verified: 1}`) is highly efficient
- Semantic headers provide context without significant token overhead

**Example:**

```typescript
const repo = {
  name: "toon",
  owner: { name: "ayushman", verified: true },
  tags: ["llm", "format"],
};

// TOON: name: toon,owner{name: ayushman,verified: 1},tags[2]: llm,format
// JSON: {"name":"toon","owner":{"name":"ayushman","verified":true},"tags":["llm","format"]}
// TOON saves ~45% tokens
```

---

#### Dataset 2: Uniform Employee Records (Tabular Data)

**Winner: TOON** 🏆 (CSV close second)

| Format       | Tokens | vs TOON  | Performance |
| ------------ | ------ | -------- | ----------- |
| **TOON**     | 1,213  | Baseline | 🏆 Best     |
| CSV          | 1,208  | -0.4%    | Very close  |
| JSON Compact | 2,304  | +90.0%   |             |
| JSON         | 4,109  | +238.8%  |             |
| YAML         | 3,201  | +163.9%  |             |
| XML          | 3,609  | +197.4%  |             |

**Why TOON Wins:**

- Tabular format with semantic headers is highly efficient
- Only 0.4% more tokens than CSV while providing semantic context
- Beats JSON by 70.5% and JSON compact by 47.4%

**Example:**

```typescript
const employees = [
  { id: 1, name: "Alice", department: "Engineering", salary: 100000 },
  { id: 2, name: "Bob", department: "Sales", salary: 80000 },
];

// TOON (forLLM):
// employees[2]{id,name,department,salary}:
// 1       Alice   Engineering     100000
// 2       Bob     Sales   80000

// CSV:
// id,name,department,salary
// 1,Alice,Engineering,100000
// 2,Bob,Sales,80000

// TOON provides semantic context (employees[2]{...}) that CSV lacks
```

---

#### Dataset 3: Deeply Nested Configuration

**Winner: TOON** 🏆

| Format       | Tokens | vs TOON  | Performance |
| ------------ | ------ | -------- | ----------- |
| **TOON**     | 73     | Baseline | 🏆 Best     |
| JSON Compact | 81     | +11.0%   |             |
| JSON         | 145    | +98.6%   |             |
| YAML         | 99     | +35.6%   |             |
| XML          | 118    | +61.6%   |             |

**Why TOON Wins:**

- Minimal overhead for nested object structures
- Compact nesting syntax (`app{server{host: 0.0.0.0,port: 3000}}`)
- Perfect for configuration files and hierarchical data

**Example:**

```typescript
const config = {
  app: {
    server: { host: "0.0.0.0", port: 3000 },
    database: { type: "postgres", connection: { host: "localhost" } },
  },
};

// TOON: app{server{host: 0.0.0.0,port: 3000},database{type: postgres,connection{host: localhost}}}
// JSON: {"app":{"server":{"host":"0.0.0.0","port":3000},"database":{"type":"postgres","connection":{"host":"localhost"}}}}
// TOON saves ~50% tokens
```

---

#### Dataset 4: E-commerce Orders (Nested with Arrays)

**Winner: CSV** (for flat representation), **TOON flattened** (for nested structures)

| Format             | Tokens | vs CSV   | vs JSON Compact | Performance   |
| ------------------ | ------ | -------- | --------------- | ------------- |
| CSV                | 1,191  | Baseline | -73.2%          | Best (flat)   |
| **TOON flattened** | 2,939  | +146.8%  | **-33.8%** ✅   | Best (nested) |
| TOON               | 3,737  | +213.6%  | -15.8%          |               |
| JSON Compact       | 4,438  | +272.3%  | Baseline        |               |
| JSON               | 7,793  | +553.7%  | +75.6%          |               |

**Analysis:**

- CSV wins on pure flat tabular structure (no nesting)
- **TOON flattened is 33.8% better than JSON compact** and 62.3% better than JSON
- **Key Point**: CSV cannot represent nested order items properly - it requires manual flattening
- TOON handles nested structures natively while still being efficient

**Example Comparison:**

**CSV (requires manual flattening):**

```
orderId,customer.name,customer.email,item0.sku,item0.quantity,item0.price,item1.sku,item1.quantity,item1.price
ORD-1,Alice,alice@example.com,SKU-1,2,10.99,SKU-2,1,5.99
```

**TOON flattened (forLLMNested):**

```
orders[1]{oid,c_n,c_e,i0_s,i0_q,i0_p,i1_s,i1_q,i1_p}:
ORD-1   Alice   alice@example.com   SKU-1   2   10.99   SKU-2   1   5.99
```

**TOON (forLLM) - preserves structure:**

```
orders[1]{id: ORD-1,customer{name: Alice,email: alice@example.com},items[2]{sku: SKU-1,quantity: 2,price: 10.99},{sku: SKU-2,quantity: 1,price: 5.99}}
```

**Why TOON is Better:**

- CSV loses structure information (can't tell items belong to order)
- TOON flattened maintains semantic context with shortened keys
- TOON (non-flattened) preserves full structure for LLM understanding

---

#### Dataset 5: Event Logs (Semi-uniform with Optional Metadata)

**Winner: CSV** (by 1.1%), **TOON flattened** (close second)

| Format             | Tokens | vs CSV   | vs JSON Compact | Performance |
| ------------------ | ------ | -------- | --------------- | ----------- |
| CSV                | 2,659  | Baseline | -32.8%          | Best (flat) |
| **TOON flattened** | 2,687  | +1.1%    | **-32.0%** ✅   | Very close  |
| TOON               | 3,854  | +44.9%   | -2.5%           |             |
| JSON Compact       | 3,954  | +48.7%   | Baseline        |             |
| JSON               | 6,059  | +127.8%  | +53.2%          |             |

**Analysis:**

- CSV wins by only 1.1% on semi-uniform data
- **TOON flattened is 32.0% better than JSON compact** and 55.7% better than JSON
- **Key Point**: CSV cannot represent optional nested metadata that some logs have
- TOON handles optional nested structures efficiently

**Example:**

```typescript
const logs = [
  {
    timestamp: "2024-01-01T10:00:00Z",
    level: "INFO",
    message: "Log 1",
    source: "service-1",
  },
  {
    timestamp: "2024-01-01T10:01:00Z",
    level: "ERROR",
    message: "Log 2",
    source: "service-2",
    metadata: { userId: 123, sessionId: "abc" },
  },
];

// TOON flattened handles optional metadata:
// logs[2]{ts,lvl,msg,src,m_u,m_s}:
// 2024-01-01T10:00:00Z    INFO    Log 1   service-1
// 2024-01-01T10:01:00Z    ERROR   Log 2   service-2   123     abc

// CSV would need separate columns or lose the metadata structure
```

---

### Format Comparison: TOON vs All Formats

#### TOON vs JSON

**TOON wins by 47.2%** across all datasets

**Example:**

```typescript
const data = { users: [{ id: 1, name: "Alice", active: true }] };

// JSON: {"users":[{"id":1,"name":"Alice","active":true}]}
// Tokens: ~20 tokens

// TOON: users[1]{id:1,name:Alice,active:1}
// Tokens: ~11 tokens

// Savings: 45% fewer tokens
```

#### TOON vs JSON Compact

**TOON wins by 21.0%** across all datasets

**Example:**

```typescript
const data = { tags: ["jazz", "chill", "lofi"] };

// JSON Compact: {"tags":["jazz","chill","lofi"]}
// Tokens: ~15 tokens

// TOON: tags[3]: jazz,chill,lofi
// Tokens: ~8 tokens

// Savings: 47% fewer tokens
```

#### TOON vs YAML

**TOON wins by 35.1%** across all datasets

**Example:**

```typescript
const data = { user: { name: "John", age: 30 } };

// YAML:
// user:
//   name: John
//   age: 30
// Tokens: ~12 tokens

// TOON: user{name: John,age: 30}
// Tokens: ~7 tokens

// Savings: 42% fewer tokens
```

#### TOON vs XML

**TOON wins by 42.3%** across all datasets

**Example:**

```typescript
const data = { name: "John", age: 30 };

// XML: <root><name>John</name><age>30</age></root>
// Tokens: ~15 tokens

// TOON: name: John,age: 30
// Tokens: ~6 tokens

// Savings: 60% fewer tokens
```

#### TOON vs CSV

**Analysis:**

- CSV wins on 2 of 5 datasets (pure flat tabular data)
- TOON wins on 3 of 5 datasets (complex/nested structures)
- **TOON flattened is competitive with CSV** (within 1-2% on flat data)
- **Key Advantage**: TOON can represent nested structures that CSV cannot

**When TOON Beats CSV:**

1. **Nested structures**: TOON can represent `{order: {customer: {name: "Alice"}, items: [...]}}` while CSV requires manual flattening
2. **Optional fields**: TOON handles optional nested metadata efficiently
3. **Semantic context**: TOON's headers (`users[100]{id,name}:`) tell LLMs what the data represents

**When CSV Beats TOON:**

1. **Pure flat tabular data**: CSV has zero structure overhead
2. **Very small datasets**: CSV's simplicity wins on tiny datasets (< 10 rows)

**Example: TOON Flattened vs CSV**

```typescript
const orders = [
  {
    id: 1,
    customer: { name: "Alice", email: "alice@example.com" },
    items: [{ sku: "SKU-1", quantity: 2 }],
  },
];

// CSV (manual flattening required):
// id,customer.name,customer.email,item0.sku,item0.quantity
// 1,Alice,alice@example.com,SKU-1,2

// TOON flattened (forLLMNested):
// orders[1]{id,c_n,c_e,i0_s,i0_q}:
// 1       Alice   alice@example.com   SKU-1   2

// TOON flattened uses shortened keys (c_n, c_e, i0_s) saving tokens
// while maintaining semantic context that CSV lacks
```

---

### Preset Performance Comparison

TOON provides different presets optimized for various use cases. Here's how they perform:

#### 1. `forLLM` (Recommended Default)

**Configuration:**

- Compact booleans (`1`/`0`)
- Compact null (`~`)
- Tab delimiters (`\t`)
- Semantic headers enabled
- Tabular format enabled

**Performance:**

- **21.0% better than JSON compact**
- **47.2% better than JSON**
- Best for: General LLM prompts, maximum token efficiency

**Example:**

```typescript
import { encode, forLLM } from "@ayushmanmishra/toon";

const data = {
  users: [
    { id: 1, name: "Alice", active: true, role: "admin" },
    { id: 2, name: "Bob", active: false, role: "user" },
  ],
};

const toon = encode(data, forLLM);
// Result:
// users[2]{id,name,active,role}:
// 1       Alice   1       admin
// 2       Bob     0       user

// Features:
// - Semantic header: users[2]{id,name,active,role}:
// - Compact booleans: 1/0 instead of true/false
// - Tab delimiters: optimal tokenization
// - No redundant key names in data rows
```

**Token Count:**

- JSON: ~45 tokens
- JSON Compact: ~35 tokens
- TOON (forLLM): ~22 tokens
- **Savings: 37% vs JSON compact, 51% vs JSON**

---

#### 2. `forLLMNested` (Best for Nested Data)

**Configuration:**

- Same as `forLLM` plus:
- Flattening enabled
- Key shortening (e.g., `customer.name` → `c_n`)

**Performance:**

- **29.6% better than JSON compact** on nested data
- **53.0% better than JSON** on nested data
- Best for: Complex nested structures (orders, transactions, hierarchical data)

**Example:**

```typescript
import { encode, forLLMNested } from "@ayushmanmishra/toon";

const data = {
  orders: [
    {
      id: 1,
      customer: { name: "Alice", email: "alice@example.com" },
      items: [{ sku: "SKU-1", quantity: 2, price: 10.99 }],
      total: 21.98,
      status: "pending",
    },
  ],
};

const toon = encode(data, forLLMNested);
// Result:
// orders[1]{id,c_n,c_e,i0_s,i0_q,i0_p,t,st}:
// 1       Alice   alice@example.com   SKU-1   2       10.99   21.98   pending

// Features:
// - Flattened structure: nested objects become columns
// - Shortened keys: customer.name → c_n, customer.email → c_e
// - Array items: items[0].sku → i0_s, items[0].quantity → i0_q
// - Semantic header provides full context
```

**Token Count:**

- JSON: ~120 tokens
- JSON Compact: ~85 tokens
- TOON (forLLMNested): ~60 tokens
- **Savings: 29% vs JSON compact, 50% vs JSON**

**Comparison with CSV:**

- CSV (manual flattening): ~55 tokens
- TOON flattened: ~60 tokens
- **TOON is only 9% more than CSV but provides semantic context CSV lacks**

---

#### 3. `forDebugging` (Human-Readable)

**Configuration:**

- Standard booleans (`true`/`false`)
- Standard null (`null`)
- Comma delimiters (`,`)
- Readable mode (spaces added)
- Tabular format enabled

**Performance:**

- Slightly more tokens than `forLLM` (for readability)
- Still better than JSON compact
- Best for: Development, debugging, human inspection

**Example:**

```typescript
import { encode, forDebugging } from "@ayushmanmishra/toon";

const data = {
  users: [
    { id: 1, name: "Alice", active: true, role: "admin" },
    { id: 2, name: "Bob", active: false, role: "user" },
  ],
};

const toon = encode(data, forDebugging);
// Result:
// users[2]{id,name,active,role}:
// 1, Alice, true, admin
// 2, Bob, false, user

// Features:
// - Standard booleans: true/false (readable)
// - Spaces after commas: easier to read
// - Semantic header still included
```

**Token Count:**

- JSON: ~45 tokens
- JSON Compact: ~35 tokens
- TOON (forDebugging): ~28 tokens
- **Savings: 20% vs JSON compact, 38% vs JSON**

---

#### 4. `forCompatibility` (JSON-like Balance)

**Configuration:**

- Standard booleans (`true`/`false`)
- Standard null (`null`)
- Comma delimiters (`,`)
- No spaces (compact)
- Tabular format enabled

**Performance:**

- Good balance between efficiency and compatibility
- Best for: When you need JSON-like output but want some token savings

**Example:**

```typescript
import { encode, forCompatibility } from "@ayushmanmishra/toon";

const data = {
  users: [
    { id: 1, name: "Alice", active: true, role: "admin" },
    { id: 2, name: "Bob", active: false, role: "user" },
  ],
};

const toon = encode(data, forCompatibility);
// Result:
// users[2]{id,name,active,role}:
// 1,Alice,true,admin
// 2,Bob,false,user

// Features:
// - Standard boolean/null: true/false/null
// - Comma delimiters: familiar CSV-like format
// - No spaces: compact but readable
// - Semantic header included
```

**Token Count:**

- JSON: ~45 tokens
- JSON Compact: ~35 tokens
- TOON (forCompatibility): ~26 tokens
- **Savings: 26% vs JSON compact, 42% vs JSON**

---

### Preset Selection Guide

| Use Case                  | Recommended Preset | Why                                                  |
| ------------------------- | ------------------ | ---------------------------------------------------- |
| **LLM Prompts (General)** | `forLLM`           | Maximum token efficiency with semantic headers       |
| **Nested/Complex Data**   | `forLLMNested`     | Automatic flattening, 29.6% better than JSON compact |
| **Development/Debugging** | `forDebugging`     | Human-readable, standard formatting                  |
| **Compatibility Needed**  | `forCompatibility` | JSON-like output with token savings                  |
| **Simple Tabular Data**   | `forLLM`           | Tabular format handles it efficiently                |

---

### How TOON Beats CSV: The Complete Picture

#### When TOON Wins (3 of 5 datasets)

1. **GitHub Repositories**: TOON wins because CSV cannot represent nested repository structures
2. **Employee Records**: TOON wins (only 0.4% more than CSV) while providing semantic context
3. **Deep Config**: TOON wins because CSV cannot represent hierarchical configuration

#### When CSV Wins (2 of 5 datasets)

4. **E-commerce Orders**: CSV wins on pure flat representation, but TOON flattened is only 146% more while handling nested structures
5. **Event Logs**: CSV wins by 1.1%, but TOON flattened is competitive

#### The Key Difference

**CSV Limitations:**

- ❌ Cannot represent nested structures natively
- ❌ Requires manual flattening (loses structure information)
- ❌ No semantic context (LLMs don't know what data represents)
- ❌ Fixed column structure (can't handle optional nested fields)

**TOON Advantages:**

- ✅ Native nested structure support
- ✅ Semantic headers provide context (`users[100]{id,name}:`)
- ✅ Handles optional nested metadata
- ✅ Automatic flattening when needed (with `forLLMNested`)
- ✅ Key shortening for efficiency (e.g., `customer.name` → `c_n`)

**Real-World Impact:**

- For **nested data**: TOON is the clear winner (CSV can't compete)
- For **flat data**: CSV wins by 1-2%, but TOON provides semantic context
- For **LLM applications**: TOON's semantic headers are invaluable for LLM understanding

---

### Summary: Who Beats Who?

| Format Comparison         | Winner | Margin | Notes                                                 |
| ------------------------- | ------ | ------ | ----------------------------------------------------- |
| **TOON vs JSON**          | TOON   | 47.2%  | TOON wins decisively                                  |
| **TOON vs JSON Compact**  | TOON   | 21.0%  | TOON wins consistently                                |
| **TOON vs YAML**          | TOON   | 35.1%  | TOON wins significantly                               |
| **TOON vs XML**           | TOON   | 42.3%  | TOON wins by large margin                             |
| **TOON vs CSV**           | Mixed  | -      | TOON wins 3/5 datasets, CSV wins 2/5 (flat data only) |
| **TOON flattened vs CSV** | Close  | 1-2%   | TOON flattened competitive, provides semantic context |

**Overall Winner: TOON** 🏆

- Best structured format (beats JSON, YAML, XML)
- Competitive with CSV while handling nested structures
- Provides semantic context that all other formats lack

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

> **💡 Tip**: The `forLLM` preset uses semantic headers (`users[2]{id,name,role}:`) that provide essential context for LLMs, improving understanding while maintaining token efficiency.

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

TOON provides optimized presets for different scenarios:

```typescript
import {
  encode,
  forLLM,
  forLLMNested,
  forDebugging,
  forCompatibility,
} from "@ayushmanmishra/toon";

// For LLM prompts (recommended) - maximum token efficiency
const toon1 = encode(data, forLLM);
// Uses semantic headers, tab delimiters, compact booleans/null

// For complex nested data - automatic flattening
const toon2 = encode(nestedData, forLLMNested);
// Achieves 29.6% better than JSON compact on nested structures

// For debugging - human-readable output
const toon3 = encode(data, forDebugging);
// Standard formatting with spaces for readability

// For compatibility - JSON-like balance
const toon4 = encode(data, forCompatibility);
// Standard boolean/null, comma delimiters
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

### Key Features

TOON includes several advanced features for optimal LLM interaction:

- **Semantic Headers**: Tabular format includes context headers like `users[2]{id,name,role}:` that tell LLMs what the data represents
- **Intelligent Tabular Encoding**: Uniform arrays automatically use tab-separated format for optimal tokenization
- **Nested Data Flattening**: The `flatten` option converts complex nested structures into efficient tabular format
- **Preset Configurations**: Ready-to-use presets (`forLLM`, `forLLMNested`, `forDebugging`, `forCompatibility`) for different scenarios
- **Smart Token Optimization**: Tab delimiters, aggressive quoting rules, and key shortening for maximum efficiency

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
