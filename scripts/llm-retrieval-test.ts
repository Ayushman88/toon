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
    
    if (data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      const firstItem = data[0] as Record<string, unknown>;
      const keys = Object.keys(firstItem);
      
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
      }
    }
  } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (Array.isArray(value)) {
        return `# ${key}\n${jsonToCSV(value)}`;
      }
    }
  }
  
  return JSON.stringify(data);
}

/**
 * Create diverse test datasets
 */
function createEcommerceDataset(count: number = 50) {
  const products = [];
  for (let i = 1; i <= count; i++) {
    products.push({
      id: i,
      name: `Product ${i}`,
      category: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'][i % 5],
      price: (Math.random() * 1000).toFixed(2),
      inStock: i % 3 !== 0,
      rating: (Math.random() * 5).toFixed(1),
      tags: [`tag${i}`, `tag${i + 1}`, `tag${i + 2}`].slice(0, i % 3 + 1),
      metadata: {
        brand: `Brand ${i % 10}`,
        weight: `${i * 0.5}kg`,
        dimensions: `${i}x${i + 1}x${i + 2}`
      }
    });
  }
  return { products };
}

function createSocialMediaDataset(count: number = 100) {
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

function createFinancialDataset(count: number = 200) {
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

function createHealthcareDataset(count: number = 150) {
  const patients = [];
  for (let i = 1; i <= count; i++) {
    patients.push({
      patientId: `PAT-${i.toString().padStart(5, '0')}`,
      name: `Patient ${i}`,
      age: 20 + (i % 60),
      gender: ['M', 'F', 'Other'][i % 3],
      bloodType: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
      conditions: [
        { condition: 'Hypertension', diagnosed: `2020-${String(i % 12 + 1).padStart(2, '0')}-01`, severity: 'Moderate' },
        ...(i % 3 === 0 ? [{ condition: 'Diabetes', diagnosed: `2021-${String(i % 12 + 1).padStart(2, '0')}-01`, severity: 'Mild' }] : [])
      ],
      medications: [
        { name: `Medication ${i % 10}`, dosage: `${i % 5 + 1}mg`, frequency: 'Daily' }
      ],
      lastVisit: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
      insurance: {
        provider: `Insurance ${i % 5}`,
        policyNumber: `POL-${i}`,
        active: i % 10 !== 0
      }
    });
  }
  return { patients };
}

function createLogAnalyticsDataset(count: number = 500) {
  const logs = [];
  for (let i = 1; i <= count; i++) {
    logs.push({
      logId: `LOG-${i}`,
      timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
      level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][i % 4],
      service: `service-${i % 10}`,
      message: `Log message ${i} with details`,
      userId: i % 100 === 0 ? null : `user-${i % 100}`,
      sessionId: `session-${i % 50}`,
      ipAddress: `192.168.1.${i % 255}`,
      userAgent: `Browser-${i % 5}`,
      responseTime: Math.floor(Math.random() * 1000),
      statusCode: [200, 201, 400, 404, 500][i % 5],
      metadata: {
        requestId: `req-${i}`,
        endpoint: `/api/v1/endpoint${i % 10}`,
        method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4]
      }
    });
  }
  return { logs };
}

/**
 * Test LLM retrieval with a simple prompt
 * This simulates asking an LLM to extract specific information
 */
interface RetrievalTest {
  question: string;
  expectedAnswer: string;
  format: 'csv' | 'toon';
  data: string;
  tokens: number;
}

function createRetrievalTests(data: unknown, name: string): RetrievalTest[] {
  const csv = jsonToCSV(data);
  const toon = encode(data, { compactBooleans: true, compactNull: true, delimiter: ',' });
  
  const tests: RetrievalTest[] = [];
  
  // Test 1: Count items
  if (Array.isArray(data)) {
    tests.push({
      question: `How many items are in this ${name} dataset?`,
      expectedAnswer: data.length.toString(),
      format: 'csv',
      data: csv,
      tokens: countTokens(csv)
    });
    tests.push({
      question: `How many items are in this ${name} dataset?`,
      expectedAnswer: data.length.toString(),
      format: 'toon',
      data: toon,
      tokens: countTokens(toon)
    });
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      if (Array.isArray(value)) {
        tests.push({
          question: `How many ${key} are in this dataset?`,
          expectedAnswer: value.length.toString(),
          format: 'csv',
          data: csv,
          tokens: countTokens(csv)
        });
        tests.push({
          question: `How many ${key} are in this dataset?`,
          expectedAnswer: value.length.toString(),
          format: 'toon',
          data: toon,
          tokens: countTokens(toon)
        });
      }
    }
  }
  
  // Test 2: Find specific item
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0] as Record<string, unknown>;
    const keys = Object.keys(firstItem);
    if (keys.length > 0) {
      const testKey = keys[0];
      const testValue = String(firstItem[testKey]);
      tests.push({
        question: `What is the ${testKey} of the first item in this ${name} dataset?`,
        expectedAnswer: testValue,
        format: 'csv',
        data: csv,
        tokens: countTokens(csv)
      });
      tests.push({
        question: `What is the ${testKey} of the first item in this ${name} dataset?`,
        expectedAnswer: testValue,
        format: 'toon',
        data: toon,
        tokens: countTokens(toon)
      });
    }
  }
  
  return tests;
}

/**
 * Format comparison results
 */
interface FormatComparison {
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

function compareFormats(name: string, data: unknown): FormatComparison {
  const csv = jsonToCSV(data);
  const toonComma = encode(data, { compactBooleans: true, compactNull: true, delimiter: ',' });
  const toonTab = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  const toonFlattened = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t', flatten: true });
  const jsonCompact = JSON.stringify(data);
  
  return {
    name,
    csvTokens: countTokens(csv),
    toonCommaTokens: countTokens(toonComma),
    toonTabTokens: countTokens(toonTab),
    toonFlattenedTokens: countTokens(toonFlattened),
    jsonCompactTokens: countTokens(jsonCompact),
    csvSize: Buffer.byteLength(csv, 'utf8'),
    toonCommaSize: Buffer.byteLength(toonComma, 'utf8'),
    toonTabSize: Buffer.byteLength(toonTab, 'utf8'),
    toonFlattenedSize: Buffer.byteLength(toonFlattened, 'utf8'),
    jsonCompactSize: Buffer.byteLength(jsonCompact, 'utf8')
  };
}

function formatComparison(result: FormatComparison) {
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
  console.log('🚀 Comprehensive TOON vs CSV Benchmark with LLM Retrieval Tests\n');
  console.log('Testing diverse datasets at scale...\n');
  
  const datasets = [
    { name: '🛍️  E-commerce Products (50 items)', data: createEcommerceDataset(50) },
    { name: '🛍️  E-commerce Products (500 items)', data: createEcommerceDataset(500) },
    { name: '📱 Social Media Posts (100 items)', data: createSocialMediaDataset(100) },
    { name: '📱 Social Media Posts (1,000 items)', data: createSocialMediaDataset(1000) },
    { name: '💰 Financial Transactions (200 items)', data: createFinancialDataset(200) },
    { name: '💰 Financial Transactions (2,000 items)', data: createFinancialDataset(2000) },
    { name: '🏥 Healthcare Patients (150 items)', data: createHealthcareDataset(150) },
    { name: '📊 Log Analytics (500 items)', data: createLogAnalyticsDataset(500) },
    { name: '📊 Log Analytics (5,000 items)', data: createLogAnalyticsDataset(5000) }
  ];
  
  const results = datasets.map(d => {
    // Extract the key name for better naming
    const dataKey = Object.keys(d.data)[0];
    return compareFormats(`${d.name}`, d.data);
  });
  
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
  
  // LLM Retrieval Test Examples
  console.log('\n' + '═'.repeat(80));
  console.log('🤖 LLM RETRIEVAL TEST EXAMPLES');
  console.log('═'.repeat(80));
  console.log('\nThese are example prompts that would be sent to an LLM to test retrieval accuracy:');
  
  const sampleData = createEcommerceDataset(10);
  const retrievalTests = createRetrievalTests(sampleData, 'products');
  
  retrievalTests.forEach((test, idx) => {
    console.log(`\n--- Test ${idx + 1} (${test.format.toUpperCase()}) ---`);
    console.log(`Question: ${test.question}`);
    console.log(`Expected Answer: ${test.expectedAnswer}`);
    console.log(`Data tokens: ${test.tokens}`);
    console.log(`\nData preview (first 200 chars):`);
    console.log(test.data.substring(0, 200) + '...');
  });
  
  // Save sample outputs for manual LLM testing
  const outputDir = path.join(__dirname, '..', 'output', 'llm-retrieval-test');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save samples for each dataset type
  const samples = [
    { name: 'ecommerce-50', data: createEcommerceDataset(50) },
    { name: 'social-media-100', data: createSocialMediaDataset(100) },
    { name: 'financial-200', data: createFinancialDataset(200) },
    { name: 'healthcare-150', data: createHealthcareDataset(150) },
    { name: 'logs-500', data: createLogAnalyticsDataset(500) }
  ];
  
  samples.forEach(sample => {
    const csv = jsonToCSV(sample.data);
    const toonComma = encode(sample.data, { compactBooleans: true, compactNull: true, delimiter: ',' });
    const toonTab = encode(sample.data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
    const toonFlattened = encode(sample.data, { compactBooleans: true, compactNull: true, delimiter: '\t', flatten: true });
    
    fs.writeFileSync(path.join(outputDir, `${sample.name}.csv`), csv);
    fs.writeFileSync(path.join(outputDir, `${sample.name}.toon.comma`), toonComma);
    fs.writeFileSync(path.join(outputDir, `${sample.name}.toon.tab`), toonTab);
    fs.writeFileSync(path.join(outputDir, `${sample.name}.toon.flattened`), toonFlattened);
    
    // Create test prompts file
    const tests = createRetrievalTests(sample.data, sample.name);
    const promptsFile = tests.map(test => {
      return `=== ${test.format.toUpperCase()} Format Test ===
Question: ${test.question}
Expected Answer: ${test.expectedAnswer}
Tokens: ${test.tokens}

Data:
${test.data.substring(0, 1000)}${test.data.length > 1000 ? '\n... (truncated)' : ''}

---
`;
    }).join('\n');
    
    fs.writeFileSync(path.join(outputDir, `${sample.name}.test-prompts.txt`), promptsFile);
  });
  
  console.log(`\n💾 Sample outputs and test prompts saved to ./output/llm-retrieval-test/`);
  console.log(`\n📝 Next steps: Use these files to test actual LLM retrieval accuracy with OpenAI/Anthropic APIs`);
}

if (require.main === module) {
  main();
}

