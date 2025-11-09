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
 * Create uniform employee records dataset (100% tabular)
 */
function createEmployeesDataset() {
  const employees = [];
  for (let i = 1; i <= 100; i++) {
    employees.push({
      id: i,
      name: `Employee ${i}`,
      department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][i % 5],
      salary: 50000 + (i * 1000),
      active: i % 10 !== 0
    });
  }
  return { employees };
}

/**
 * Create e-commerce orders with nested structures (33% tabular)
 */
function createEcommerceOrdersDataset() {
  const orders = [];
  for (let i = 1; i <= 50; i++) {
    const items = [];
    for (let j = 1; j <= 3; j++) {
      items.push({
        sku: `SKU-${i}-${j}`,
        quantity: j,
        price: 10.99 * j
      });
    }
    orders.push({
      orderId: `ORD-${i}`,
      customer: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`
      },
      items: items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: ['pending', 'shipped', 'delivered'][i % 3]
    });
  }
  return { orders };
}

/**
 * Create semi-uniform event logs (50% tabular)
 */
function createEventLogsDataset() {
  const logs = [];
  for (let i = 1; i <= 100; i++) {
    if (i % 2 === 0) {
      // Uniform log entry
      logs.push({
        timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`,
        level: ['INFO', 'WARN', 'ERROR'][i % 3],
        message: `Log message ${i}`,
        source: `service-${i % 5}`
      });
    } else {
      // Non-uniform log entry with extra fields
      logs.push({
        timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`,
        level: ['INFO', 'WARN', 'ERROR'][i % 3],
        message: `Log message ${i}`,
        source: `service-${i % 5}`,
        metadata: {
          userId: i,
          sessionId: `session-${i}`
        }
      });
    }
  }
  return { logs };
}

/**
 * Create deeply nested configuration (0% tabular)
 */
function createDeepConfigDataset() {
  return {
    app: {
      name: "MyApp",
      version: "1.0.0",
      server: {
        host: "0.0.0.0",
        port: 3000,
        ssl: {
          enabled: true,
          cert: "/path/to/cert",
          key: "/path/to/key"
        }
      },
      database: {
        type: "postgres",
        connection: {
          host: "localhost",
          port: 5432,
          credentials: {
            username: "admin",
            password: "secret"
          }
        }
      },
      features: {
        auth: {
          enabled: true,
          provider: "oauth",
          config: {
            clientId: "client123",
            clientSecret: "secret456"
          }
        },
        cache: {
          enabled: true,
          ttl: 3600,
          strategy: "lru"
        }
      }
    }
  };
}

/**
 * Create time-series analytics data (100% tabular)
 */
function createTimeSeriesDataset() {
  const data = [];
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: 100 + Math.random() * 50,
      category: ['A', 'B', 'C'][i % 3],
      count: i * 10
    });
  }
  return { analytics: data };
}

/**
 * Create GitHub repositories dataset (100% tabular)
 */
function createGitHubReposDataset() {
  const repos = [];
  for (let i = 1; i <= 100; i++) {
    repos.push({
      id: i,
      name: `repo-${i}`,
      stars: Math.floor(Math.random() * 10000),
      forks: Math.floor(Math.random() * 1000),
      language: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust'][i % 5],
      description: `Repository ${i} description`
    });
  }
  return { repositories: repos };
}

interface BenchmarkResult {
  name: string;
  jsonTokens: number;
  jsonCompactTokens: number;
  toonTokens: number;
  toonCompactTokens: number;
  toonTabularTokens: number;
  toonFlattenedTokens: number;
  tabularPercent: number;
}

function benchmarkDataset(name: string, data: unknown, tabularPercent: number): BenchmarkResult {
  // Convert to JSON
  const json = JSON.stringify(data, null, 2);
  const jsonCompact = JSON.stringify(data);
  
  // Convert to TOON
  const toon = encode(data);
  const toonCompact = encode(data, { compactBooleans: true, compactNull: true });
  // Tabular format with tabs (best tokenization for large arrays)
  const toonTabular = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  // Flattened format (flattens nested structures to beat CSV)
  const toonFlattened = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t', flatten: true });
  
  // Calculate token counts
  const jsonTokens = countTokens(json);
  const jsonCompactTokens = countTokens(jsonCompact);
  const toonTokens = countTokens(toon);
  const toonCompactTokens = countTokens(toonCompact);
  const toonTabularTokens = countTokens(toonTabular);
  const toonFlattenedTokens = countTokens(toonFlattened);
  
  return {
    name,
    jsonTokens,
    jsonCompactTokens,
    toonTokens,
    toonCompactTokens,
    toonTabularTokens,
    toonFlattenedTokens,
    tabularPercent
  };
}

function formatBar(value: number, max: number, width: number = 20): string {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatComparison(result: BenchmarkResult) {
  const max = Math.max(result.jsonTokens, result.toonFlattenedTokens, result.toonTabularTokens);
  const toonBar = formatBar(result.toonTabularTokens, max);
  const flattenedBar = formatBar(result.toonFlattenedTokens, max);
  
  const vsJson = ((result.jsonTokens - result.toonTabularTokens) / result.jsonTokens * 100).toFixed(1);
  const vsJsonCompact = ((result.jsonCompactTokens - result.toonTabularTokens) / result.jsonCompactTokens * 100).toFixed(1);
  const flattenedVsJson = ((result.jsonTokens - result.toonFlattenedTokens) / result.jsonTokens * 100).toFixed(1);
  const flattenedVsJsonCompact = ((result.jsonCompactTokens - result.toonFlattenedTokens) / result.jsonCompactTokens * 100).toFixed(1);
  const flattenedVsTabular = ((result.toonTabularTokens - result.toonFlattenedTokens) / result.toonTabularTokens * 100).toFixed(1);
  
  console.log(`   │`);
  console.log(`   TOON tabular        ${toonBar}    ${result.toonTabularTokens.toLocaleString()} tokens`);
  console.log(`   TOON flattened      ${flattenedBar}    ${result.toonFlattenedTokens.toLocaleString()} tokens`);
  if (result.toonFlattenedTokens < result.toonTabularTokens) {
    console.log(`   ├─ vs TOON tabular  (-${flattenedVsTabular}%)`);
  }
  console.log(`   ├─ vs JSON          (${vsJson.startsWith('-') ? '' : '+'}${vsJson}%)               ${result.jsonTokens.toLocaleString()} tokens`);
  console.log(`   ├─ vs JSON compact  (${vsJsonCompact.startsWith('-') ? '' : '+'}${vsJsonCompact}%)                 ${result.jsonCompactTokens.toLocaleString()} tokens`);
}

function main() {
  console.log('🚀 Running TOON Benchmark Tests...\n');
  console.log('🔢 Counting tokens with tiktoken (GPT-4 tokenizer)...\n');
  
  const benchmarks = [
    { name: '👥 Uniform employee records', data: createEmployeesDataset(), tabular: 100 },
    { name: '🛒 E-commerce orders with nested structures', data: createEcommerceOrdersDataset(), tabular: 33 },
    { name: '🧾 Semi-uniform event logs', data: createEventLogsDataset(), tabular: 50 },
    { name: '🧩 Deeply nested configuration', data: createDeepConfigDataset(), tabular: 0 },
    { name: '📈 Time-series analytics data', data: createTimeSeriesDataset(), tabular: 100 },
    { name: '⭐ Top 100 GitHub repositories', data: createGitHubReposDataset(), tabular: 100 }
  ];
  
  const results = benchmarks.map(b => benchmarkDataset(b.name, b.data, b.tabular));
  
  // Display results
  results.forEach(result => {
    console.log(`${result.name}  ┊  Tabular: ${result.tabularPercent}%`);
    formatComparison(result);
    console.log();
  });
  
  // Overall summary
  const totalJson = results.reduce((sum, r) => sum + r.jsonTokens, 0);
  const totalJsonCompact = results.reduce((sum, r) => sum + r.jsonCompactTokens, 0);
  const totalToonTabular = results.reduce((sum, r) => sum + r.toonTabularTokens, 0);
  
  const overallVsJson = ((totalJson - totalToonTabular) / totalJson * 100).toFixed(1);
  const overallVsJsonCompact = ((totalJsonCompact - totalToonTabular) / totalJsonCompact * 100).toFixed(1);
  
  console.log('─'.repeat(80));
  console.log('──────────────────────────────────── Total ────────────────────────────────────');
  console.log();
  console.log(`   TOON                ${formatBar(totalToonTabular, totalJson)}    ${totalToonTabular.toLocaleString()} tokens`);
  console.log(`   ├─ vs JSON          (${overallVsJson.startsWith('-') ? '' : '+'}${overallVsJson}%)                ${totalJson.toLocaleString()} tokens`);
  console.log(`   ├─ vs JSON compact  (${overallVsJsonCompact.startsWith('-') ? '' : '+'}${overallVsJsonCompact}%)                ${totalJsonCompact.toLocaleString()} tokens`);
  console.log();
  
  // Save outputs
  const outputDir = path.join(__dirname, '..', 'output', 'benchmark');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  results.forEach((result, idx) => {
    const dataset = benchmarks[idx].data;
    const toonOutput = encode(dataset, { compactBooleans: true, compactNull: true, delimiter: '\t' });
    fs.writeFileSync(
      path.join(outputDir, `${result.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.toon.tabular`),
      toonOutput
    );
    fs.writeFileSync(
      path.join(outputDir, `${result.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json.compact`),
      JSON.stringify(dataset)
    );
  });
  
  console.log('💾 Benchmark outputs saved to ./output/benchmark/');
}

if (require.main === module) {
  main();
}

