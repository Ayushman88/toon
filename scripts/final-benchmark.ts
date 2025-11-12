import { encode, forLLM, forLLMNested } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
import { encodingForModel, getEncoding } from 'js-tiktoken';

/**
 * Count tokens using tiktoken (GPT-4 tokenizer)
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
 * Flatten nested object for CSV (similar to TOON's flatten)
 */
function flattenForCSV(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        // Handle arrays - take first item if it's an object, otherwise just index
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const nested = flattenForCSV(item as Record<string, unknown>, `${newKey}.${index}`);
            Object.assign(flattened, nested);
          } else {
            flattened[`${newKey}.${index}`] = item;
          }
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      const nested = flattenForCSV(value as Record<string, unknown>, newKey);
      Object.assign(flattened, nested);
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Convert JSON to CSV format (with proper nested structure flattening)
 */
function jsonToCSV(data: unknown): string {
  // Handle object with single array property
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (Array.isArray(value) && value.length > 0) {
        // Check if all items are objects
        if (value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
          // Flatten nested structures
          const flattened = value.map(item => flattenForCSV(item as Record<string, unknown>));
          
          // Get all unique keys
          const allKeysSet = new Set<string>();
          flattened.forEach(obj => {
            Object.keys(obj).forEach(k => allKeysSet.add(k));
          });
          const allKeys = Array.from(allKeysSet).sort();
          
          // Create CSV
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
  
  // Handle direct array
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    if (data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      // Check if all values are primitives (simple CSV)
      const firstItem = data[0] as Record<string, unknown>;
      const keys = Object.keys(firstItem);
      
      const allPrimitives = data.every(item => {
        const obj = item as Record<string, unknown>;
        return keys.every(key => {
          const value = obj[key];
          return (
            value === null ||
            value === undefined ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          );
        });
      });
      
      if (allPrimitives) {
        // Simple CSV - no flattening needed
        const header = keys.join(',');
        const rows = data.map(item => {
          const obj = item as Record<string, unknown>;
          return keys.map(key => {
            const value = obj[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') {
              if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }
            return String(value);
          }).join(',');
        });
        return `${header}\n${rows.join('\n')}`;
      } else {
        // Nested structures - flatten them
        const flattened = data.map(item => flattenForCSV(item as Record<string, unknown>));
        const allKeysSet = new Set<string>();
        flattened.forEach(obj => {
          Object.keys(obj).forEach(k => allKeysSet.add(k));
        });
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
  
  // Fallback to JSON for non-tabular data
  return JSON.stringify(data);
}

/**
 * Create test datasets
 */

// Simple tabular datasets
function createUsersDataset(count: number) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: ['admin', 'user', 'moderator'][i % 3],
      active: i % 10 !== 0,
      score: Math.floor(Math.random() * 1000),
      createdAt: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`
    });
  }
  return { users };
}

function createProductsDataset(count: number) {
  const products = [];
  for (let i = 1; i <= count; i++) {
    products.push({
      id: i,
      name: `Product ${i}`,
      category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
      price: (Math.random() * 1000).toFixed(2),
      inStock: i % 3 !== 0,
      rating: (Math.random() * 5).toFixed(1),
      tags: [`tag${i}`, `tag${i + 1}`].slice(0, i % 3 + 1)
    });
  }
  return { products };
}

// Nested datasets
function createOrdersDataset(count: number) {
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const items = [];
    for (let j = 1; j <= (i % 3) + 1; j++) {
      items.push({
        sku: `SKU-${i}-${j}`,
        quantity: j,
        price: (10.99 * j).toFixed(2),
        name: `Product ${i}-${j}`
      });
    }
    orders.push({
      orderId: `ORD-${i.toString().padStart(6, '0')}`,
      customer: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        address: {
          street: `${i} Main St`,
          city: ['San Francisco', 'New York', 'Chicago', 'Boston', 'Seattle'][i % 5],
          zip: 94100 + i
        }
      },
      items: items,
      total: items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2),
      status: ['pending', 'shipped', 'delivered', 'cancelled'][i % 4],
      createdAt: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`
    });
  }
  return { orders };
}

function createTransactionsDataset(count: number) {
  const transactions = [];
  for (let i = 1; i <= count; i++) {
    transactions.push({
      transactionId: `TXN-${i.toString().padStart(6, '0')}`,
      date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
      account: {
        accountNumber: `ACC-${i % 10}`,
        accountType: ['Checking', 'Savings', 'Credit'][i % 3],
        bank: ['Bank A', 'Bank B', 'Bank C'][i % 3]
      },
      amount: (Math.random() * 10000 - 5000).toFixed(2),
      category: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'][i % 5],
      merchant: `Merchant ${i % 20}`,
      description: `Transaction ${i} description`,
      status: ['Pending', 'Completed', 'Failed'][i % 3]
    });
  }
  return { transactions };
}

// Complex nested datasets
function createSocialMediaDataset(count: number) {
  const posts = [];
  for (let i = 1; i <= count; i++) {
    posts.push({
      id: i,
      author: {
        username: `user${i}`,
        displayName: `User ${i}`,
        verified: i % 5 === 0,
        followers: i * 100
      },
      content: `This is post ${i} with some content`,
      timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00:00Z`,
      likes: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      hashtags: [`#tag${i}`, `#tag${i + 1}`],
      location: i % 3 === 0 ? { city: 'San Francisco', country: 'USA' } : null
    });
  }
  return { posts };
}

interface BenchmarkResult {
  name: string;
  datasetType: 'simple' | 'nested' | 'complex';
  size: number;
  jsonTokens: number;
  jsonChars: number;
  csvTokens: number;
  csvChars: number;
  toonDefaultTokens: number;
  toonDefaultChars: number;
  toonLLMTokens: number;
  toonLLMChars: number;
  toonNestedTokens: number;
  toonNestedChars: number;
}

function benchmarkDataset(
  name: string,
  datasetType: 'simple' | 'nested' | 'complex',
  data: unknown
): BenchmarkResult {
  const size = Array.isArray(data) 
    ? data.length 
    : (typeof data === 'object' && data !== null) 
      ? Object.values(data)[0]?.length || 0 
      : 0;

  // JSON formats
  const json = JSON.stringify(data, null, 2);
  const jsonCompact = JSON.stringify(data);
  
  // CSV
  const csv = jsonToCSV(data);
  
  // TOON formats
  const toonDefault = encode(data);
  const toonLLM = encode(data, forLLM);
  const toonNested = encode(data, forLLMNested);
  
  // Count tokens
  const jsonTokens = countTokens(json);
  const jsonCompactTokens = countTokens(jsonCompact);
  const csvTokens = countTokens(csv);
  const toonDefaultTokens = countTokens(toonDefault);
  const toonLLMTokens = countTokens(toonLLM);
  const toonNestedTokens = countTokens(toonNested);
  
  // Count characters
  const jsonChars = json.length;
  const csvChars = csv.length;
  const toonDefaultChars = toonDefault.length;
  const toonLLMChars = toonLLM.length;
  const toonNestedChars = toonNested.length;
  
  return {
    name,
    datasetType,
    size,
    jsonTokens: jsonCompactTokens,
    jsonChars: jsonCompact.length,
    csvTokens,
    csvChars: csv.length,
    toonDefaultTokens,
    toonDefaultChars,
    toonLLMTokens,
    toonLLMChars,
    toonNestedTokens,
    toonNestedChars
  };
}

function formatResult(result: BenchmarkResult) {
  const vsJson = ((result.jsonTokens - result.toonLLMTokens) / result.jsonTokens * 100).toFixed(1);
  const vsCsv = ((result.csvTokens - result.toonLLMTokens) / result.csvTokens * 100).toFixed(1);
  const vsJsonNested = ((result.jsonTokens - result.toonNestedTokens) / result.jsonTokens * 100).toFixed(1);
  const vsCsvNested = ((result.csvTokens - result.toonNestedTokens) / result.csvTokens * 100).toFixed(1);
  
  console.log(`\n${'='.repeat(90)}`);
  console.log(`${result.name} (${result.datasetType}) - ${result.size.toLocaleString()} items`);
  console.log(`${'='.repeat(90)}`);
  
  console.log(`\n📊 TOKEN COUNTS:`);
  console.log(`  JSON (compact):     ${result.jsonTokens.toLocaleString().padStart(12)} tokens`);
  console.log(`  CSV:                ${result.csvTokens.toLocaleString().padStart(12)} tokens`);
  console.log(`  TOON (default):     ${result.toonDefaultTokens.toLocaleString().padStart(12)} tokens  ${((result.jsonTokens - result.toonDefaultTokens) / result.jsonTokens * 100).toFixed(1).padStart(6)}% vs JSON`);
  console.log(`  TOON (forLLM):      ${result.toonLLMTokens.toLocaleString().padStart(12)} tokens  ${vsJson.padStart(6)}% vs JSON  ${vsCsv.padStart(6)}% vs CSV`);
  
  if (result.datasetType === 'nested' || result.datasetType === 'complex') {
    console.log(`  TOON (forLLMNested): ${result.toonNestedTokens.toLocaleString().padStart(12)} tokens  ${vsJsonNested.padStart(6)}% vs JSON  ${vsCsvNested.padStart(6)}% vs CSV`);
  }
  
  console.log(`\n📏 CHARACTER COUNTS:`);
  console.log(`  JSON (compact):     ${result.jsonChars.toLocaleString().padStart(12)} chars`);
  console.log(`  CSV:                ${result.csvChars.toLocaleString().padStart(12)} chars`);
  console.log(`  TOON (default):     ${result.toonDefaultChars.toLocaleString().padStart(12)} chars  ${((result.jsonChars - result.toonDefaultChars) / result.jsonChars * 100).toFixed(1).padStart(6)}% vs JSON`);
  console.log(`  TOON (forLLM):      ${result.toonLLMChars.toLocaleString().padStart(12)} chars  ${((result.jsonChars - result.toonLLMChars) / result.jsonChars * 100).toFixed(1).padStart(6)}% vs JSON  ${((result.csvChars - result.toonLLMChars) / result.csvChars * 100).toFixed(1).padStart(6)}% vs CSV`);
  
  if (result.datasetType === 'nested' || result.datasetType === 'complex') {
    console.log(`  TOON (forLLMNested): ${result.toonNestedChars.toLocaleString().padStart(12)} chars  ${((result.jsonChars - result.toonNestedChars) / result.jsonChars * 100).toFixed(1).padStart(6)}% vs JSON  ${((result.csvChars - result.toonNestedChars) / result.csvChars * 100).toFixed(1).padStart(6)}% vs CSV`);
  }
  
  // Determine winner
  const bestTokens = Math.min(result.toonLLMTokens, result.toonNestedTokens || Infinity);
  const bestFormat = bestTokens === result.toonLLMTokens ? 'TOON (forLLM)' : 'TOON (forLLMNested)';
  const bestSavings = bestTokens === result.toonLLMTokens ? vsJson : vsJsonNested;
  
  console.log(`\n🏆 Best Format: ${bestFormat} - ${bestSavings}% token savings vs JSON`);
}

function main() {
  console.log('🚀 TOON Comprehensive Benchmark Test\n');
  console.log('Testing with large datasets across different complexity levels...\n');
  console.log('🔢 Counting tokens with tiktoken (GPT-4 tokenizer)\n');
  
  const datasets = [
    // Simple tabular datasets
    { name: '👥 Users Dataset', type: 'simple' as const, data: createUsersDataset(1000) },
    { name: '👥 Users Dataset (Large)', type: 'simple' as const, data: createUsersDataset(10000) },
    { name: '🛍️  Products Dataset', type: 'simple' as const, data: createProductsDataset(1000) },
    { name: '🛍️  Products Dataset (Large)', type: 'simple' as const, data: createProductsDataset(10000) },
    
    // Nested datasets
    { name: '🛒 Orders Dataset', type: 'nested' as const, data: createOrdersDataset(500) },
    { name: '🛒 Orders Dataset (Large)', type: 'nested' as const, data: createOrdersDataset(2000) },
    { name: '💰 Transactions Dataset', type: 'nested' as const, data: createTransactionsDataset(1000) },
    { name: '💰 Transactions Dataset (Large)', type: 'nested' as const, data: createTransactionsDataset(5000) },
    
    // Complex nested datasets
    { name: '📱 Social Media Posts', type: 'complex' as const, data: createSocialMediaDataset(1000) },
    { name: '📱 Social Media Posts (Large)', type: 'complex' as const, data: createSocialMediaDataset(5000) }
  ];
  
  const results = datasets.map(d => benchmarkDataset(d.name, d.type, d.data));
  
  // Display individual results
  results.forEach(result => {
    formatResult(result);
  });
  
  // Overall summary
  console.log(`\n${'='.repeat(90)}`);
  console.log('📊 OVERALL SUMMARY');
  console.log(`${'='.repeat(90)}`);
  
  const totalJsonTokens = results.reduce((sum, r) => sum + r.jsonTokens, 0);
  const totalCsvTokens = results.reduce((sum, r) => sum + r.csvTokens, 0);
  const totalToonDefaultTokens = results.reduce((sum, r) => sum + r.toonDefaultTokens, 0);
  const totalToonLLMTokens = results.reduce((sum, r) => sum + r.toonLLMTokens, 0);
  const totalToonNestedTokens = results.reduce((sum, r) => sum + r.toonNestedTokens, 0);
  
  const totalJsonChars = results.reduce((sum, r) => sum + r.jsonChars, 0);
  const totalCsvChars = results.reduce((sum, r) => sum + r.csvChars, 0);
  const totalToonDefaultChars = results.reduce((sum, r) => sum + r.toonDefaultChars, 0);
  const totalToonLLMChars = results.reduce((sum, r) => sum + r.toonLLMChars, 0);
  const totalToonNestedChars = results.reduce((sum, r) => sum + r.toonNestedChars, 0);
  
  console.log(`\n📊 TOTAL TOKEN COUNTS:`);
  console.log(`  JSON (compact):     ${totalJsonTokens.toLocaleString().padStart(12)} tokens`);
  console.log(`  CSV:                ${totalCsvTokens.toLocaleString().padStart(12)} tokens`);
  console.log(`  TOON (default):     ${totalToonDefaultTokens.toLocaleString().padStart(12)} tokens  ${((totalJsonTokens - totalToonDefaultTokens) / totalJsonTokens * 100).toFixed(1).padStart(6)}% vs JSON`);
  console.log(`  TOON (forLLM):      ${totalToonLLMTokens.toLocaleString().padStart(12)} tokens  ${((totalJsonTokens - totalToonLLMTokens) / totalJsonTokens * 100).toFixed(1).padStart(6)}% vs JSON  ${((totalCsvTokens - totalToonLLMTokens) / totalCsvTokens * 100).toFixed(1).padStart(6)}% vs CSV`);
  console.log(`  TOON (forLLMNested): ${totalToonNestedTokens.toLocaleString().padStart(12)} tokens  ${((totalJsonTokens - totalToonNestedTokens) / totalJsonTokens * 100).toFixed(1).padStart(6)}% vs JSON  ${((totalCsvTokens - totalToonNestedTokens) / totalCsvTokens * 100).toFixed(1).padStart(6)}% vs CSV`);
  
  console.log(`\n📏 TOTAL CHARACTER COUNTS:`);
  console.log(`  JSON (compact):     ${totalJsonChars.toLocaleString().padStart(12)} chars`);
  console.log(`  CSV:                ${totalCsvChars.toLocaleString().padStart(12)} chars`);
  console.log(`  TOON (default):     ${totalToonDefaultChars.toLocaleString().padStart(12)} chars  ${((totalJsonChars - totalToonDefaultChars) / totalJsonChars * 100).toFixed(1).padStart(6)}% vs JSON`);
  console.log(`  TOON (forLLM):      ${totalToonLLMChars.toLocaleString().padStart(12)} chars  ${((totalJsonChars - totalToonLLMChars) / totalJsonChars * 100).toFixed(1).padStart(6)}% vs JSON  ${((totalCsvChars - totalToonLLMChars) / totalCsvChars * 100).toFixed(1).padStart(6)}% vs CSV`);
  console.log(`  TOON (forLLMNested): ${totalToonNestedChars.toLocaleString().padStart(12)} chars  ${((totalJsonChars - totalToonNestedChars) / totalJsonChars * 100).toFixed(1).padStart(6)}% vs JSON  ${((totalCsvChars - totalToonNestedChars) / totalCsvChars * 100).toFixed(1).padStart(6)}% vs CSV`);
  
  // Best overall
  const bestOverallTokens = Math.min(totalToonLLMTokens, totalToonNestedTokens);
  const bestOverallFormat = bestOverallTokens === totalToonLLMTokens ? 'TOON (forLLM)' : 'TOON (forLLMNested)';
  const bestOverallSavings = ((totalJsonTokens - bestOverallTokens) / totalJsonTokens * 100).toFixed(1);
  const bestOverallSavingsCsv = ((totalCsvTokens - bestOverallTokens) / totalCsvTokens * 100).toFixed(1);
  
  console.log(`\n🏆 OVERALL WINNER: ${bestOverallFormat}`);
  console.log(`   ${bestOverallSavings}% token savings vs JSON`);
  console.log(`   ${bestOverallSavingsCsv}% token savings vs CSV`);
  
  // Breakdown by dataset type
  console.log(`\n${'='.repeat(90)}`);
  console.log('📈 BREAKDOWN BY DATASET TYPE');
  console.log(`${'='.repeat(90)}`);
  
  const simpleResults = results.filter(r => r.datasetType === 'simple');
  const nestedResults = results.filter(r => r.datasetType === 'nested');
  const complexResults = results.filter(r => r.datasetType === 'complex');
  
  function summarizeType(typeResults: BenchmarkResult[], typeName: string) {
    const json = typeResults.reduce((sum, r) => sum + r.jsonTokens, 0);
    const csv = typeResults.reduce((sum, r) => sum + r.csvTokens, 0);
    const toonLLM = typeResults.reduce((sum, r) => sum + r.toonLLMTokens, 0);
    const toonNested = typeResults.reduce((sum, r) => sum + r.toonNestedTokens, 0);
    const best = Math.min(toonLLM, toonNested);
    
    console.log(`\n${typeName}:`);
    console.log(`  JSON: ${json.toLocaleString()} tokens`);
    console.log(`  CSV:  ${csv.toLocaleString()} tokens`);
    console.log(`  TOON (forLLM): ${toonLLM.toLocaleString()} tokens  ${((json - toonLLM) / json * 100).toFixed(1)}% vs JSON  ${((csv - toonLLM) / csv * 100).toFixed(1)}% vs CSV`);
    if (typeName !== 'Simple') {
      console.log(`  TOON (forLLMNested): ${toonNested.toLocaleString()} tokens  ${((json - toonNested) / json * 100).toFixed(1)}% vs JSON  ${((csv - toonNested) / csv * 100).toFixed(1)}% vs CSV`);
    }
    console.log(`  Best: ${((json - best) / json * 100).toFixed(1)}% savings vs JSON`);
  }
  
  summarizeType(simpleResults, 'Simple Tabular');
  summarizeType(nestedResults, 'Nested Structures');
  summarizeType(complexResults, 'Complex Nested');
  
  console.log(`\n${'='.repeat(90)}`);
  console.log('✅ Benchmark complete!');
  console.log(`${'='.repeat(90)}\n`);
}

if (require.main === module) {
  main();
}

