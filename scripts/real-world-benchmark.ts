import { encode, forLLM, forLLMNested } from '../src/index';
import { encodingForModel, getEncoding } from 'js-tiktoken';

/**
 * Real-world backend API response simulation
 */

let tokenizer: ReturnType<typeof encodingForModel> | null = null;

function getTokenizer() {
  if (!tokenizer) {
    try {
      tokenizer = encodingForModel('gpt-4');
    } catch (e) {
      tokenizer = getEncoding('cl100k_base');
    }
  }
  return tokenizer;
}

function countTokens(text: string): number {
  try {
    const enc = getTokenizer();
    return enc.encode(text).length;
  } catch (e) {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Real-world backend response - mixed structures
 */
function createRealWorldUsers(count: number) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    // Mix of simple and nested structures
    if (i % 3 === 0) {
      // Some users have nested study object
      users.push({
        name: `User ${i}`,
        age: 18 + (i % 50),
        study: {
          field: ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Biology'][i % 5],
          university: `University ${i % 10}`,
          year: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'][i % 5],
          gpa: (3.0 + Math.random() * 1.5).toFixed(2)
        },
        email: `user${i}@example.com`,
        active: i % 5 !== 0
      });
    } else if (i % 5 === 0) {
      // Some users have work experience
      users.push({
        name: `User ${i}`,
        age: 18 + (i % 50),
        study: `Computer Science`,
        email: `user${i}@example.com`,
        work: {
          company: `Company ${i % 20}`,
          position: ['Developer', 'Engineer', 'Manager', 'Designer'][i % 4],
          years: i % 10
        },
        active: i % 5 !== 0
      });
    } else {
      // Simple users
      users.push({
        name: `User ${i}`,
        age: 18 + (i % 50),
        study: ['Computer Science', 'Engineering', 'Mathematics', 'Physics'][i % 4],
        email: `user${i}@example.com`,
        active: i % 5 !== 0
      });
    }
  }
  return { users };
}

/**
 * Real-world e-commerce API response
 */
function createRealWorldProducts(count: number) {
  const products = [];
  for (let i = 1; i <= count; i++) {
    if (i % 4 === 0) {
      // Some products have detailed specs
      products.push({
        id: i,
        name: `Product ${i}`,
        price: (Math.random() * 1000).toFixed(2),
        category: ['Electronics', 'Clothing', 'Books'][i % 3],
        inStock: i % 3 !== 0,
        specs: {
          brand: `Brand ${i % 10}`,
          model: `Model-${i}`,
          dimensions: {
            width: i * 0.5,
            height: i * 0.8,
            depth: i * 0.3
          },
          weight: `${i * 0.2}kg`
        },
        reviews: [
          { rating: 4, comment: 'Great product' },
          { rating: 5, comment: 'Excellent!' }
        ]
      });
    } else {
      // Simple products
      products.push({
        id: i,
        name: `Product ${i}`,
        price: (Math.random() * 1000).toFixed(2),
        category: ['Electronics', 'Clothing', 'Books'][i % 3],
        inStock: i % 3 !== 0
      });
    }
  }
  return { products };
}

/**
 * Real-world orders API response
 */
function createRealWorldOrders(count: number) {
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const items = [];
    const itemCount = (i % 3) + 1;
    for (let j = 1; j <= itemCount; j++) {
      items.push({
        sku: `SKU-${i}-${j}`,
        quantity: j,
        price: (10.99 * j).toFixed(2),
        name: `Product ${i}-${j}`
      });
    }
    
    if (i % 3 === 0) {
      // Some orders have shipping address
      orders.push({
        orderId: `ORD-${i.toString().padStart(6, '0')}`,
        customer: {
          name: `Customer ${i}`,
          email: `customer${i}@example.com`
        },
        items: items,
        shipping: {
          address: {
            street: `${i} Main St`,
            city: ['San Francisco', 'New York', 'Chicago'][i % 3],
            zip: 94100 + i,
            country: 'USA'
          },
          method: ['Standard', 'Express', 'Overnight'][i % 3]
        },
        total: items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2),
        status: ['pending', 'shipped', 'delivered'][i % 3]
      });
    } else {
      // Simple orders
      orders.push({
        orderId: `ORD-${i.toString().padStart(6, '0')}`,
        customer: {
          name: `Customer ${i}`,
          email: `customer${i}@example.com`
        },
        items: items,
        total: items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2),
        status: ['pending', 'shipped', 'delivered'][i % 3]
      });
    }
  }
  return { orders };
}

/**
 * CSV conversion with flattening
 */
function flattenForCSV(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            Object.assign(flattened, flattenForCSV(item as Record<string, unknown>, `${newKey}.${index}`));
          } else {
            flattened[`${newKey}.${index}`] = item;
          }
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(flattened, flattenForCSV(value as Record<string, unknown>, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  return flattened;
}

function jsonToCSV(data: unknown): string {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (Array.isArray(value) && value.length > 0) {
        if (value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
          const flattened = value.map(item => flattenForCSV(item as Record<string, unknown>));
          const allKeysSet = new Set<string>();
          flattened.forEach(obj => Object.keys(obj).forEach(k => allKeysSet.add(k)));
          const allKeys = Array.from(allKeysSet).sort();
          const header = allKeys.join(',');
          const rows = flattened.map(obj => {
            return allKeys.map(k => {
              const val = obj[k];
              if (val === null || val === undefined) return '';
              const str = String(val);
              if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            }).join(',');
          });
          return `${header}\n${rows.join('\n')}`;
        }
      }
    }
  }
  return JSON.stringify(data);
}

interface Result {
  name: string;
  size: number;
  jsonTokens: number;
  jsonChars: number;
  csvTokens: number;
  csvChars: number;
  toonLLMTokens: number;
  toonLLMChars: number;
  toonNestedTokens: number;
  toonNestedChars: number;
}

function benchmark(name: string, data: unknown): Result {
  const size = Array.isArray(data) 
    ? data.length 
    : (typeof data === 'object' && data !== null) 
      ? Object.values(data)[0]?.length || 0 
      : 0;

  const json = JSON.stringify(data);
  const csv = jsonToCSV(data);
  const toonLLM = encode(data, forLLM);
  const toonNested = encode(data, forLLMNested);

  return {
    name,
    size,
    jsonTokens: countTokens(json),
    jsonChars: json.length,
    csvTokens: countTokens(csv),
    csvChars: csv.length,
    toonLLMTokens: countTokens(toonLLM),
    toonLLMChars: toonLLM.length,
    toonNestedTokens: countTokens(toonNested),
    toonNestedChars: toonNested.length
  };
}

function main() {
  console.log('🌍 REAL-WORLD BACKEND API BENCHMARK\n');
  console.log('Testing with realistic backend responses: mixed structures, non-uniform fields\n');
  console.log('='.repeat(90));
  
  const datasets = [
    { name: '👥 Users API (Mixed Structures)', data: createRealWorldUsers(100) },
    { name: '👥 Users API (Large)', data: createRealWorldUsers(1000) },
    { name: '🛍️  Products API (Mixed Structures)', data: createRealWorldProducts(100) },
    { name: '🛍️  Products API (Large)', data: createRealWorldProducts(1000) },
    { name: '🛒 Orders API (Mixed Structures)', data: createRealWorldOrders(100) },
    { name: '🛒 Orders API (Large)', data: createRealWorldOrders(1000) }
  ];
  
  const results = datasets.map(d => benchmark(d.name, d.data));
  
  results.forEach(r => {
    const vsJsonLLM = ((r.jsonTokens - r.toonLLMTokens) / r.jsonTokens * 100).toFixed(1);
    const vsCsvLLM = ((r.csvTokens - r.toonLLMTokens) / r.csvTokens * 100).toFixed(1);
    const vsJsonNested = ((r.jsonTokens - r.toonNestedTokens) / r.jsonTokens * 100).toFixed(1);
    const vsCsvNested = ((r.csvTokens - r.toonNestedTokens) / r.csvTokens * 100).toFixed(1);
    
    console.log(`\n${r.name} - ${r.size.toLocaleString()} items`);
    console.log('-'.repeat(90));
    console.log(`JSON:              ${r.jsonTokens.toLocaleString().padStart(10)} tokens  (${r.jsonChars.toLocaleString()} chars)`);
    console.log(`CSV:               ${r.csvTokens.toLocaleString().padStart(10)} tokens  (${r.csvChars.toLocaleString()} chars)`);
    console.log(`TOON (forLLM):     ${r.toonLLMTokens.toLocaleString().padStart(10)} tokens  (${r.toonLLMChars.toLocaleString()} chars)  ${vsJsonLLM.padStart(6)}% vs JSON  ${vsCsvLLM.padStart(6)}% vs CSV`);
    console.log(`TOON (forLLMNested): ${r.toonNestedTokens.toLocaleString().padStart(10)} tokens  (${r.toonNestedChars.toLocaleString()} chars)  ${vsJsonNested.padStart(6)}% vs JSON  ${vsCsvNested.padStart(6)}% vs CSV`);
    
    const best = Math.min(r.toonLLMTokens, r.toonNestedTokens);
    const bestFormat = best === r.toonLLMTokens ? 'TOON (forLLM)' : 'TOON (forLLMNested)';
    const bestSavings = best === r.toonLLMTokens ? vsJsonLLM : vsJsonNested;
    console.log(`🏆 Best: ${bestFormat} - ${bestSavings}% vs JSON`);
  });
  
  // Overall summary
  const totalJson = results.reduce((sum, r) => sum + r.jsonTokens, 0);
  const totalCsv = results.reduce((sum, r) => sum + r.csvTokens, 0);
  const totalToonLLM = results.reduce((sum, r) => sum + r.toonLLMTokens, 0);
  const totalToonNested = results.reduce((sum, r) => sum + r.toonNestedTokens, 0);
  
  console.log('\n' + '='.repeat(90));
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(90));
  console.log(`Total JSON tokens:        ${totalJson.toLocaleString()}`);
  console.log(`Total CSV tokens:         ${totalCsv.toLocaleString()}`);
  console.log(`Total TOON (forLLM):      ${totalToonLLM.toLocaleString()}  ${((totalJson - totalToonLLM) / totalJson * 100).toFixed(1)}% vs JSON  ${((totalCsv - totalToonLLM) / totalCsv * 100).toFixed(1)}% vs CSV`);
  console.log(`Total TOON (forLLMNested): ${totalToonNested.toLocaleString()}  ${((totalJson - totalToonNested) / totalJson * 100).toFixed(1)}% vs JSON  ${((totalCsv - totalToonNested) / totalCsv * 100).toFixed(1)}% vs CSV`);
  
  const bestOverall = Math.min(totalToonLLM, totalToonNested);
  const bestFormat = bestOverall === totalToonLLM ? 'TOON (forLLM)' : 'TOON (forLLMNested)';
  const bestVsJson = ((totalJson - bestOverall) / totalJson * 100).toFixed(1);
  const bestVsCsv = ((totalCsv - bestOverall) / totalCsv * 100).toFixed(1);
  
  console.log(`\n🏆 OVERALL WINNER: ${bestFormat}`);
  console.log(`   ${bestVsJson}% token savings vs JSON`);
  console.log(`   ${bestVsCsv}% token savings vs CSV`);
  
  // Show example output
  console.log('\n' + '='.repeat(90));
  console.log('📝 EXAMPLE OUTPUT');
  console.log('='.repeat(90));
  const exampleData = createRealWorldUsers(5);
  console.log('\nOriginal JSON (first 500 chars):');
  console.log(JSON.stringify(exampleData, null, 2).substring(0, 500) + '...');
  console.log('\nTOON (forLLM):');
  console.log(encode(exampleData, forLLM).substring(0, 500) + '...');
  console.log('\nTOON (forLLMNested):');
  console.log(encode(exampleData, forLLMNested).substring(0, 500) + '...');
}

if (require.main === module) {
  main();
}

