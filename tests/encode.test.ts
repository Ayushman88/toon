import { encode } from '../src/encode';

describe('encode', () => {
  describe('Arrays', () => {
    test('simple string array', () => {
      const data = { tags: ['jazz', 'chill', 'lofi'] };
      expect(encode(data)).toBe('tags[3]jazz,chill,lofi');
    });

    test('empty array', () => {
      const data = { tags: [] };
      expect(encode(data)).toBe('tags[0]');
    });

    test('array with numbers', () => {
      const data = { numbers: [1, 2, 3] };
      expect(encode(data)).toBe('numbers[3]1,2,3');
    });

    test('array with booleans', () => {
      const data = { flags: [true, false, true] };
      expect(encode(data)).toBe('flags[3]true,false,true');
    });

    test('array with mixed types', () => {
      const data = { mixed: ['hello', 42, true] };
      expect(encode(data)).toBe('mixed[3]hello,42,true');
    });

    test('nested arrays', () => {
      const data = { nested: [[1, 2], [3, 4]] };
      expect(encode(data)).toBe('nested[2][2]1,2,[2]3,4');
    });

    test('deeply nested arrays', () => {
      const data = [[1, 2]];
      expect(encode(data)).toBe('[1][2]1,2');
    });

    test('array with quoted strings', () => {
      const data = { titles: ['Hello World', 'Test, Value'] };
      expect(encode(data)).toBe('titles[2]"Hello World","Test, Value"');
    });

    test('compact booleans in array', () => {
      const data = { flags: [true, false] };
      expect(encode(data, { compactBooleans: true })).toBe('flags[2]1,0');
    });
  });

  describe('Objects', () => {
    test('simple object', () => {
      const data = { name: 'John', age: 30 };
      expect(encode(data)).toBe('name:John,age:30');
    });

    test('object with boolean', () => {
      const data = { name: 'John', active: true };
      expect(encode(data)).toBe('name:John,active:true');
    });

    test('object with null', () => {
      const data = { name: 'John', value: null };
      expect(encode(data)).toBe('name:John,value:null');
    });

    test('compact null', () => {
      const data = { name: 'John', value: null };
      expect(encode(data, { compactNull: true })).toBe('name:John,value:~');
    });

    test('empty object', () => {
      const data = { config: {} };
      expect(encode(data)).toBe('config');
    });

    test('object with quoted keys', () => {
      const data = { 'my key': 'value' };
      expect(encode(data)).toBe('"my key":value');
    });
  });

  describe('Nested Objects', () => {
    test('nested object', () => {
      const data = { user: { name: 'John', age: 30 } };
      expect(encode(data)).toBe('user{name:John,age:30}');
    });

    test('deeply nested object', () => {
      const data = { user: { profile: { name: 'John' } } };
      expect(encode(data)).toBe('user{profile{name:John}}');
    });

    test('nested object with array', () => {
      const data = { user: { name: 'John', tags: ['admin', 'user'] } };
      expect(encode(data)).toBe('user{name:John,tags[2]admin,user}');
    });
  });

  describe('Arrays of Objects', () => {
    test('array of objects', () => {
      const data = { users: [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }] };
      // Tabular format: uses tabs by default (best tokenization)
      // Includes semantic header for LLM context: keyName[count]{fields}:
      // Tabs are shown as spaces in string representation but are actually \t characters
      expect(encode(data)).toBe('users[2]{name,age}:\nAlice\t25\nBob\t30');
    });

    test('array of nested objects', () => {
      const data = { items: [{ id: 1, data: { name: 'test' } }] };
      expect(encode(data)).toBe('items[1]{id:1,data{name:test}}');
    });
  });

  describe('Primitives', () => {
    test('string', () => {
      expect(encode('hello')).toBe('hello');
    });

    test('quoted string', () => {
      expect(encode('hello world')).toBe('"hello world"');
    });

    test('number', () => {
      expect(encode(42)).toBe('42');
    });

    test('negative number', () => {
      expect(encode(-5)).toBe('-5');
    });

    test('float', () => {
      expect(encode(99.99)).toBe('99.99');
    });

    test('boolean true', () => {
      expect(encode(true)).toBe('true');
    });

    test('boolean false', () => {
      expect(encode(false)).toBe('false');
    });

    test('compact boolean true', () => {
      expect(encode(true, { compactBooleans: true })).toBe('1');
    });

    test('compact boolean false', () => {
      expect(encode(false, { compactBooleans: true })).toBe('0');
    });

    test('null', () => {
      expect(encode(null)).toBe('null');
    });

    test('compact null', () => {
      expect(encode(null, { compactNull: true })).toBe('~');
    });

    test('undefined', () => {
      expect(encode(undefined)).toBe('null');
    });
  });

  describe('Readable Mode', () => {
    test('readable array', () => {
      const data = { tags: ['jazz', 'chill', 'lofi'] };
      expect(encode(data, { readable: true })).toBe('tags[3] jazz, chill, lofi');
    });

    test('readable object', () => {
      const data = { name: 'John', age: 30 };
      expect(encode(data, { readable: true })).toBe('name: John, age: 30');
    });
  });

  describe('Edge Cases', () => {
    test('string with colon', () => {
      expect(encode('key: value')).toBe('"key: value"');
    });

    test('string with comma', () => {
      expect(encode('a, b, c')).toBe('"a, b, c"');
    });

    test('string with brackets', () => {
      expect(encode('test[123]')).toBe('"test[123]"');
    });

    test('string with braces', () => {
      expect(encode('test{value}')).toBe('"test{value}"');
    });

    test('complex nested structure', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin'], active: true },
          { id: 2, name: 'Bob', tags: ['user'], active: false }
        ]
      };
      const result = encode(data);
      // Non-uniform array (has nested arrays) uses list format
      expect(result).toBe('users[2]{id:1,name:Alice,tags[1]admin,active:true},{id:2,name:Bob,tags[1]user,active:false}');
    });

    test('all compact options', () => {
      const data = { active: true, value: null };
      expect(encode(data, { compactBooleans: true, compactNull: true })).toBe('active:1,value:~');
    });
  });

  describe('Token Comparison Examples', () => {
    test('example from spec - simple array', () => {
      const data = { tags: ['jazz', 'chill', 'lofi'] };
      const toon = encode(data);
      expect(toon).toBe('tags[3]jazz,chill,lofi');
      // JSON: { "tags": ["jazz", "chill", "lofi"] } (~15 tokens)
      // TOON: tags[3]jazz,chill,lofi (~7 tokens - aggressive optimization)
    });

    test('example from spec - object', () => {
      const data = { name: 'John', age: 30, active: true };
      const toon = encode(data, { compactBooleans: true });
      expect(toon).toBe('name:John,age:30,active:1');
      // JSON: { "name": "John", "age": 30, "active": true } (~15 tokens)
      // TOON: name:John,age:30,active:1 (~8 tokens)
    });

    test('example from spec - nested', () => {
      const data = { user: { name: 'John', tags: ['admin', 'user'] } };
      const toon = encode(data);
      expect(toon).toBe('user{name:John,tags[2]admin,user}');
      // JSON: { "user": { "name": "John", "tags": ["admin", "user"] } } (~20 tokens)
      // TOON: user{name:John,tags[2]admin,user} (~10 tokens - aggressive optimization)
    });
  });
});

