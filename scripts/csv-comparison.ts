import { encode } from '../src/encode';
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
 * Convert JSON array to CSV format
 */
function jsonToCSV(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    // Check if all items are objects
    if (data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      const firstItem = data[0] as Record<string, unknown>;
      const keys = Object.keys(firstItem);
      
      // Check if all objects have same keys and all values are primitives
      const isUniform = data.every(item => {
        const obj = item as Record<string, unknown>;
        const itemKeys = Object.keys(obj);
        if (itemKeys.length !== keys.length) return false;
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
      
      if (isUniform) {
        // Generate CSV
        const header = keys.join(',');
        const rows = data.map(item => {
          const obj = item as Record<string, unknown>;
          return keys.map(key => {
            const value = obj[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') {
              // Escape quotes and wrap in quotes if contains comma, newline, or quote
              if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }
            return String(value);
          }).join(',');
        });
        return `${header}\n${rows.join('\n')}`;
      }
    }
  } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // Check if it's a single-key object with an array value
    const entries = Object.entries(data);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (Array.isArray(value)) {
        // Add key as a comment/header line
        return `# ${key}\n${jsonToCSV(value)}`;
      }
    }
  }
  
  return JSON.stringify(data);
}

/**
 * Create test datasets
 */
function createSimpleUsersDataset() {
  return {
    users: [
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob', role: 'user' },
      { id: 3, name: 'Charlie', role: 'user' },
      { id: 4, name: 'Diana', role: 'admin' },
      { id: 5, name: 'Eve', role: 'user' }
    ]
  };
}

function createLargeUsersDataset(count: number = 1000) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: ['admin', 'user', 'moderator'][i % 3],
      active: i % 10 !== 0,
      score: Math.floor(Math.random() * 1000)
    });
  }
  return { users };
}

function createNestedOrdersDataset(count: number = 100) {
  const orders = [];
  for (let i = 1; i <= count; i++) {
    const items = [];
    for (let j = 1; j <= 3; j++) {
      items.push({
        sku: `SKU-${i}-${j}`,
        quantity: j,
        price: 10.99 * j,
        name: `Product ${i}-${j}`
      });
    }
    orders.push({
      orderId: `ORD-${i}`,
      customer: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        address: {
          street: `${i} Main St`,
          city: 'San Francisco',
          zip: 94100 + i
        }
      },
      items: items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: ['pending', 'shipped', 'delivered'][i % 3],
      createdAt: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`
    });
  }
  return { orders };
}

function createDeeplyNestedDataset() {
  return {
    company: {
      name: 'Tech Corp',
      departments: [
        {
          name: 'Engineering',
          teams: [
            {
              name: 'Frontend',
              members: [
                { id: 1, name: 'Alice', role: 'Senior Engineer', skills: ['React', 'TypeScript'] },
                { id: 2, name: 'Bob', role: 'Engineer', skills: ['Vue', 'JavaScript'] }
              ]
            },
            {
              name: 'Backend',
              members: [
                { id: 3, name: 'Charlie', role: 'Senior Engineer', skills: ['Node.js', 'Python'] },
                { id: 4, name: 'Diana', role: 'Engineer', skills: ['Go', 'Rust'] }
              ]
            }
          ]
        },
        {
          name: 'Product',
          teams: [
            {
              name: 'Design',
              members: [
                { id: 5, name: 'Eve', role: 'Designer', skills: ['Figma', 'Sketch'] }
              ]
            }
          ]
        }
      ]
    }
  };
}

interface ComparisonResult {
  name: string;
  csvTokens: number;
  toonCommaTokens: number;
  toonTabTokens: number;
  toonFlattenedTokens: number;
  jsonCompactTokens: number;
  csvSize: number;
  toonCommaSize: number;
  toonTabSize: number;
  toonFlattenedSize: number;
  jsonCompactSize: number;
}

function compareFormats(name: string, data: unknown): ComparisonResult {
  // Generate CSV
  const csv = jsonToCSV(data);
  
  // Generate TOON formats
  const toonComma = encode(data, { compactBooleans: true, compactNull: true, delimiter: ',' });
  const toonTab = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  const toonFlattened = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t', flatten: true });
  
  // Generate JSON compact
  const jsonCompact = JSON.stringify(data);
  
  // Count tokens
  const csvTokens = countTokens(csv);
  const toonCommaTokens = countTokens(toonComma);
  const toonTabTokens = countTokens(toonTab);
  const toonFlattenedTokens = countTokens(toonFlattened);
  const jsonCompactTokens = countTokens(jsonCompact);
  
  // Count bytes
  const csvSize = Buffer.byteLength(csv, 'utf8');
  const toonCommaSize = Buffer.byteLength(toonComma, 'utf8');
  const toonTabSize = Buffer.byteLength(toonTab, 'utf8');
  const toonFlattenedSize = Buffer.byteLength(toonFlattened, 'utf8');
  const jsonCompactSize = Buffer.byteLength(jsonCompact, 'utf8');
  
  return {
    name,
    csvTokens,
    toonCommaTokens,
    toonTabTokens,
    toonFlattenedTokens,
    jsonCompactTokens,
    csvSize,
    toonCommaSize,
    toonTabSize,
    toonFlattenedSize,
    jsonCompactSize
  };
}

function formatComparison(result: ComparisonResult) {
  const minTokens = Math.min(result.csvTokens, result.toonCommaTokens, result.toonTabTokens, result.toonFlattenedTokens);
  const maxTokens = Math.max(result.csvTokens, result.toonCommaTokens, result.toonTabTokens, result.toonFlattenedTokens);
  
  const csvVsToonComma = ((result.csvTokens - result.toonCommaTokens) / result.csvTokens * 100).toFixed(1);
  const csvVsToonTab = ((result.csvTokens - result.toonTabTokens) / result.csvTokens * 100).toFixed(1);
  const csvVsToonFlattened = ((result.csvTokens - result.toonFlattenedTokens) / result.csvTokens * 100).toFixed(1);
  
  console.log(`\n${result.name}`);
  console.log('─'.repeat(80));
  console.log(`CSV:              ${result.csvTokens.toLocaleString().padStart(8)} tokens  (${result.csvSize.toLocaleString()} bytes)`);
  console.log(`TOON (comma):     ${result.toonCommaTokens.toLocaleString().padStart(8)} tokens  (${result.toonCommaSize.toLocaleString()} bytes)  ${csvVsToonComma.startsWith('-') ? '+' : ''}${csvVsToonComma}% vs CSV`);
  console.log(`TOON (tab):      ${result.toonTabTokens.toLocaleString().padStart(8)} tokens  (${result.toonTabSize.toLocaleString()} bytes)  ${csvVsToonTab.startsWith('-') ? '+' : ''}${csvVsToonTab}% vs CSV`);
  console.log(`TOON (flattened):${result.toonFlattenedTokens.toLocaleString().padStart(8)} tokens  (${result.toonFlattenedSize.toLocaleString()} bytes)  ${csvVsToonFlattened.startsWith('-') ? '+' : ''}${csvVsToonFlattened}% vs CSV`);
  console.log(`JSON (compact):  ${result.jsonCompactTokens.toLocaleString().padStart(8)} tokens  (${result.jsonCompactSize.toLocaleString()} bytes)`);
  
  // Show winner
  const winner = result.toonFlattenedTokens < result.toonTabTokens 
    ? (result.toonFlattenedTokens < result.toonCommaTokens ? 'TOON (flattened)' : 'TOON (comma)')
    : (result.toonTabTokens < result.toonCommaTokens ? 'TOON (tab)' : 'TOON (comma)');
  
  if (result.toonFlattenedTokens < result.csvTokens || result.toonTabTokens < result.csvTokens || result.toonCommaTokens < result.csvTokens) {
    const bestSavings = Math.min(parseFloat(csvVsToonFlattened), parseFloat(csvVsToonTab), parseFloat(csvVsToonComma));
    console.log(`\n🏆 Winner: ${winner} beats CSV by ${bestSavings.toFixed(1)}%`);
  } else {
    console.log(`\n⚠️  CSV is still more efficient for this dataset`);
  }
}

function main() {
  console.log('🚀 TOON vs CSV Comparison Benchmark\n');
  console.log('Testing at scale with nested structures...\n');
  
  const datasets = [
    { name: '📊 Simple Users (5 items)', data: createSimpleUsersDataset() },
    { name: '👥 Large Users (1,000 items)', data: createLargeUsersDataset(1000) },
    { name: '👥 Large Users (10,000 items)', data: createLargeUsersDataset(10000) },
    { name: '🛒 Nested Orders (100 items)', data: createNestedOrdersDataset(100) },
    { name: '🛒 Nested Orders (1,000 items)', data: createNestedOrdersDataset(1000) },
    { name: '🏢 Deeply Nested Company Structure', data: createDeeplyNestedDataset() }
  ];
  
  const results = datasets.map(d => compareFormats(d.name, d.data));
  
  results.forEach(result => {
    formatComparison(result);
  });
  
  // Overall summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 OVERALL SUMMARY');
  console.log('═'.repeat(80));
  
  const totalCsv = results.reduce((sum, r) => sum + r.csvTokens, 0);
  const totalToonComma = results.reduce((sum, r) => sum + r.toonCommaTokens, 0);
  const totalToonTab = results.reduce((sum, r) => sum + r.toonTabTokens, 0);
  const totalToonFlattened = results.reduce((sum, r) => sum + r.toonFlattenedTokens, 0);
  const totalJson = results.reduce((sum, r) => sum + r.jsonCompactTokens, 0);
  
  const overallCsvVsToonComma = ((totalCsv - totalToonComma) / totalCsv * 100).toFixed(1);
  const overallCsvVsToonTab = ((totalCsv - totalToonTab) / totalCsv * 100).toFixed(1);
  const overallCsvVsToonFlattened = ((totalCsv - totalToonFlattened) / totalCsv * 100).toFixed(1);
  
  console.log(`Total CSV tokens:        ${totalCsv.toLocaleString()}`);
  console.log(`Total TOON (comma):      ${totalToonComma.toLocaleString()}  ${overallCsvVsToonComma.startsWith('-') ? '+' : ''}${overallCsvVsToonComma}% vs CSV`);
  console.log(`Total TOON (tab):       ${totalToonTab.toLocaleString()}  ${overallCsvVsToonTab.startsWith('-') ? '+' : ''}${overallCsvVsToonTab}% vs CSV`);
  console.log(`Total TOON (flattened): ${totalToonFlattened.toLocaleString()}  ${overallCsvVsToonFlattened.startsWith('-') ? '+' : ''}${overallCsvVsToonFlattened}% vs CSV`);
  console.log(`Total JSON (compact):   ${totalJson.toLocaleString()}`);
  
  // Save sample outputs
  const outputDir = path.join(__dirname, '..', 'output', 'csv-comparison');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save a sample of each format
  const sampleData = createLargeUsersDataset(100);
  const sampleCsv = jsonToCSV(sampleData);
  const sampleToonComma = encode(sampleData, { compactBooleans: true, compactNull: true, delimiter: ',' });
  const sampleToonTab = encode(sampleData, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  
  fs.writeFileSync(path.join(outputDir, 'sample-users-100.csv'), sampleCsv);
  fs.writeFileSync(path.join(outputDir, 'sample-users-100.toon.comma'), sampleToonComma);
  fs.writeFileSync(path.join(outputDir, 'sample-users-100.toon.tab'), sampleToonTab);
  
  console.log(`\n💾 Sample outputs saved to ./output/csv-comparison/`);
}

if (require.main === module) {
  main();
}

