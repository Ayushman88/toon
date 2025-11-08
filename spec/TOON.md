# Token-Oriented Object Notation (TOON) Specification

## Overview

Token-Oriented Object Notation (TOON) is a compact, human-readable format designed specifically for passing structured data to Large Language Models (LLMs) with significantly reduced token usage. TOON achieves approximately 50% token reduction compared to JSON by eliminating redundant syntax and using explicit counts.

**Purpose**: TOON is intended for LLM input, not output. It optimizes for token efficiency while maintaining human readability.

## Design Principles

1. **Token Efficiency**: Minimize token count through compact syntax
2. **Human Readability**: Maintain readability for debugging and verification
3. **Type Inference**: Leverage LLM context understanding to avoid explicit type markers
4. **Explicit Counts**: Use array counts to enable efficient parsing
5. **Minimal Syntax**: Remove unnecessary quotes, brackets, and separators

## Syntax Rules

### Arrays

Arrays are represented with an explicit count in square brackets followed by comma-separated values.

**Syntax**: `key[count]: value1,value2,value3`

**Example**:
```
tags[3]: jazz,chill,lofi
```

**JSON Equivalent**: `{ "tags": ["jazz", "chill", "lofi"] }`

**Token Savings**: ~50% (removes quotes, brackets, spaces)

### Objects

Objects are represented as comma-separated key-value pairs.

**Syntax**: `key1: value1, key2: value2`

**Example**:
```
name: John, age: 30, active: true
```

**JSON Equivalent**: `{ "name": "John", "age": 30, "active": true }`

### Nested Objects

Nested objects use curly braces for nesting.

**Syntax**: `key{innerKey1: value1, innerKey2: value2}`

**Example**:
```
user{name: John, age: 30}
```

**JSON Equivalent**: `{ "user": { "name": "John", "age": 30 } }`

### Complex Nested Structures

**Example**:
```
users[2]: {name: Alice, age: 25}, {name: Bob, age: 30}
```

**JSON Equivalent**: 
```json
{ "users": [{ "name": "Alice", "age": 25 }, { "name": "Bob", "age": 30 }] }
```

### Primitive Values

#### Strings

Strings are unquoted unless they contain special characters that require quoting:
- Spaces
- Colons (`:`)
- Commas (`,`)
- Curly braces (`{`, `}`)
- Square brackets (`[`, `]`)

**Examples**:
```
name: John
title: "Software Engineer"
description: "Hello, world!"
```

#### Numbers

Numbers are represented directly without quotes or type markers.

**Examples**:
```
age: 30
price: 99.99
count: -5
```

#### Booleans

Booleans can be represented as:
- `true`/`false` (standard)
- `1`/`0` (compact mode, saves ~60% tokens)

**Examples**:
```
active: true
enabled: 1
```

#### Null

Null values are represented as:
- `null` (standard)
- `~` (compact mode, saves 4 tokens)
- Empty string for array elements (when unambiguous)

**Examples**:
```
value: null
value: ~
```

### Empty Values

#### Empty Arrays

**Syntax**: `key[0]:`

**Example**:
```
tags[0]:
```

**JSON Equivalent**: `{ "tags": [] }`

#### Empty Objects

**Syntax**: `key{}`

**Example**:
```
config{}
```

**JSON Equivalent**: `{ "config": {} }`

## Token Optimization Features

### 1. Smart Quoting

Quotes are only added when necessary. Strings containing spaces, colons, commas, or special characters are quoted.

**Optimization**: Saves ~2 tokens per unquoted string.

### 2. Boolean Compression

Use `1`/`0` instead of `true`/`false` in compact mode.

**Optimization**: Saves ~60% tokens for boolean values.

### 3. Compact Separators

No spaces around separators. Use single-character separators.

**Optimization**: Saves 1 token per separator.

### 4. Explicit Counts

Array counts enable efficient parsing without trailing commas.

**Optimization**: Saves tokens by removing brackets and commas.

### 5. Minimal Nesting Syntax

Use `{` for nesting, avoid closing `}` when possible through context.

**Optimization**: Reduces nesting syntax overhead.

## Comparison with JSON

### Example 1: Simple Array

**JSON**: `{ "tags": ["jazz", "chill", "lofi"] }`  
**Tokens**: ~15 tokens

**TOON**: `tags[3]: jazz,chill,lofi`  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 2: Object with Multiple Fields

**JSON**: `{ "name": "John", "age": 30, "active": true }`  
**Tokens**: ~15 tokens

**TOON**: `name: John, age: 30, active: 1`  
**Tokens**: ~8 tokens

**Savings**: ~47% token reduction

### Example 3: Nested Structure

**JSON**: `{ "user": { "name": "John", "tags": ["admin", "user"] } }`  
**Tokens**: ~20 tokens

**TOON**: `user{name: John, tags[2]: admin,user}`  
**Tokens**: ~11 tokens

**Savings**: ~45% token reduction

## Encoding Rules

### Priority Order

1. **Null/Undefined**: Check first, use `null` or `~`
2. **Array**: Check if value is array, use `key[count]: values`
3. **Object**: Check if value is object, use `key{...}` or `key: value, ...`
4. **Primitive**: Handle string, number, boolean

### String Encoding

1. Check if string needs quoting (contains special chars)
2. If no special chars: use unquoted string
3. If special chars: wrap in double quotes and escape as needed

### Number Encoding

1. Use direct representation
2. Support integers, floats, negative numbers
3. No type markers needed

### Boolean Encoding

1. Standard mode: use `true`/`false`
2. Compact mode: use `1`/`0`

## Edge Cases

### Empty Values
- Empty array: `key[0]:`
- Empty object: `key{}`
- Null: `key: null` or `key: ~`
- Undefined: `key: null` or `key: ~`

### Special Characters in Strings
- Must be quoted
- Escape quotes within strings if needed
- Preserve original string content

### Nested Arrays
- Support arrays of arrays
- Use explicit counts for each level

### Mixed Types
- Support arrays with mixed types
- Support objects with mixed value types

## Implementation Notes

- TOON is designed for one-way encoding (JSON → TOON)
- Decoding is not a primary use case (LLMs can parse TOON)
- Focus on compact representation for LLM prompts
- Maintain readability for human verification

## Version

This specification is version 1.0.0.
