# TOON Implementation Guide for Other Languages

This guide helps you implement TOON (Token-Oriented Object Notation) in your preferred programming language.

## Overview

TOON is a text-based format specification, making it straightforward to implement in any language. The core algorithm is language-agnostic and follows a simple recursive encoding pattern.

## Core Algorithm

The encoding process follows this priority order:

1. **Null/Undefined** → `null` or `~` (if compact mode)
2. **Array** → `key[count]: value1,value2,value3`
3. **Object** → `key1: value1,key2: value2` or `key{innerKey: value}`
4. **Primitive** → String, number, boolean, or null

## Implementation Checklist

### Required Features

- [ ] Encode arrays with explicit counts: `key[count]: value1,value2`
- [ ] Encode objects as key-value pairs: `key1: value1,key2: value2`
- [ ] Encode nested objects: `key{innerKey: value}`
- [ ] Handle primitive types (string, number, boolean, null)
- [ ] Smart quoting (only quote strings with spaces/special chars)
- [ ] Support encoding options (compactBooleans, compactNull, readable)

### Optional Features

- [ ] Token counting (for benchmarking)
- [ ] Decoding (not required, LLMs can parse TOON)
- [ ] Validation
- [ ] Pretty printing

## Language-Specific Examples

### Python

```python
def encode(value, options=None):
    if options is None:
        options = {}
    
    if value is None:
        return "~" if options.get("compactNull") else "null"
    
    if isinstance(value, list):
        items = [encode(item, options) for item in value]
        return f"[{len(value)}]: {','.join(items)}"
    
    if isinstance(value, dict):
        pairs = [f"{k}: {encode(v, options)}" for k, v in value.items()]
        return ",".join(pairs)
    
    if isinstance(value, bool):
        return "1" if (value and options.get("compactBooleans")) else str(value).lower()
    
    if isinstance(value, str):
        return f'"{value}"' if needs_quoting(value) else value
    
    return str(value)

def needs_quoting(s):
    return ' ' in s or any(c in s for c in ':[]{}')
```

### Rust

```rust
pub struct EncodeOptions {
    pub compact_booleans: bool,
    pub compact_null: bool,
    pub readable: bool,
}

pub fn encode(value: &Value, options: &EncodeOptions) -> String {
    match value {
        Value::Null => {
            if options.compact_null {
                "~".to_string()
            } else {
                "null".to_string()
            }
        }
        Value::Array(arr) => {
            let items: Vec<String> = arr.iter()
                .map(|v| encode(v, options))
                .collect();
            format!("[{}]: {}", arr.len(), items.join(","))
        }
        Value::Object(obj) => {
            let pairs: Vec<String> = obj.iter()
                .map(|(k, v)| format!("{}: {}", k, encode(v, options)))
                .collect();
            pairs.join(",")
        }
        Value::Bool(b) => {
            if options.compact_booleans {
                if *b { "1" } else { "0" }.to_string()
            } else {
                b.to_string()
            }
        }
        Value::String(s) => {
            if needs_quoting(s) {
                format!("\"{}\"", s)
            } else {
                s.clone()
            }
        }
        Value::Number(n) => n.to_string(),
    }
}
```

### Go

```go
type EncodeOptions struct {
    CompactBooleans bool
    CompactNull     bool
    Readable        bool
}

func Encode(value interface{}, options EncodeOptions) string {
    switch v := value.(type) {
    case nil:
        if options.CompactNull {
            return "~"
        }
        return "null"
    case []interface{}:
        items := make([]string, len(v))
        for i, item := range v {
            items[i] = Encode(item, options)
        }
        return fmt.Sprintf("[%d]: %s", len(v), strings.Join(items, ","))
    case map[string]interface{}:
        pairs := make([]string, 0, len(v))
        for k, val := range v {
            pairs = append(pairs, fmt.Sprintf("%s: %s", k, Encode(val, options)))
        }
        return strings.Join(pairs, ",")
    case bool:
        if options.CompactBooleans {
            if v {
                return "1"
            }
            return "0"
        }
        return strconv.FormatBool(v)
    case string:
        if needsQuoting(v) {
            return fmt.Sprintf("\"%s\"", v)
        }
        return v
    case int, int64, float64:
        return fmt.Sprintf("%v", v)
    default:
        return fmt.Sprintf("%v", v)
    }
}
```

### Java

```java
public class ToonEncoder {
    public static class Options {
        public boolean compactBooleans = false;
        public boolean compactNull = false;
        public boolean readable = false;
    }
    
    public static String encode(Object value, Options options) {
        if (options == null) {
            options = new Options();
        }
        
        if (value == null) {
            return options.compactNull ? "~" : "null";
        }
        
        if (value instanceof List) {
            List<?> list = (List<?>) value;
            String items = list.stream()
                .map(item -> encode(item, options))
                .collect(Collectors.joining(","));
            return String.format("[%d]: %s", list.size(), items);
        }
        
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            String pairs = map.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + encode(entry.getValue(), options))
                .collect(Collectors.joining(","));
            return pairs;
        }
        
        if (value instanceof Boolean) {
            if (options.compactBooleans) {
                return ((Boolean) value) ? "1" : "0";
            }
            return value.toString();
        }
        
        if (value instanceof String) {
            String str = (String) value;
            return needsQuoting(str) ? "\"" + str + "\"" : str;
        }
        
        return value.toString();
    }
    
    private static boolean needsQuoting(String s) {
        return s.contains(" ") || s.contains(":") || 
               s.contains("[") || s.contains("]") || 
               s.contains("{") || s.contains("}");
    }
}
```

## Key Implementation Details

### 1. Smart Quoting

Only quote strings when necessary:
- Contains spaces
- Contains structural characters: `:`, `[`, `]`, `{`, `}`
- Could be ambiguous (looks like boolean/number/null)

### 2. Array Encoding

Always include explicit count: `key[count]: value1,value2,value3`

### 3. Object Encoding

- Flat objects: `key1: value1,key2: value2`
- Nested objects: `key{innerKey: value}`

### 4. Boolean Encoding

- Standard: `true` / `false`
- Compact: `1` / `0` (saves ~60% tokens)

### 5. Null Encoding

- Standard: `null`
- Compact: `~`

## Testing Your Implementation

Test with these examples:

```javascript
// Simple array
{ tags: ["jazz", "chill", "lofi"] }
// Expected: tags[3]: jazz,chill,lofi

// Object
{ name: "John", age: 30, active: true }
// Expected: name: John,age: 30,active: true

// Nested
{ user: { name: "John", tags: ["admin", "user"] } }
// Expected: user{name: John,tags[2]: admin,user}
```

## Contributing Implementations

If you implement TOON in another language:

1. Follow the [TOON specification](../spec/TOON.md)
2. Add tests matching the JavaScript implementation
3. Create a README for your language implementation
4. Submit a PR or create a separate repository

## Resources

- [TOON Specification](../spec/TOON.md)
- [JavaScript Reference Implementation](../src/encode.ts)
- [Test Suite](../tests/encode.test.ts)

