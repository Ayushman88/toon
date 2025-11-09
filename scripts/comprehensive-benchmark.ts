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
 * Convert to YAML format (simplified)
 */
function toYAML(data: unknown, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  
  if (data === null || data === undefined) {
    return 'null';
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map(item => `${indentStr}- ${toYAML(item, indent + 1)}`).join('\n');
  }
  
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) return '{}';
    return entries.map(([key, value]) => {
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return `${indentStr}${key}:\n${toYAML(value, indent + 1)}`;
      }
      return `${indentStr}${key}: ${toYAML(value, indent)}`;
    }).join('\n');
  }
  
  if (typeof data === 'string') {
    if (data.includes('\n') || data.includes(':') || data.includes('"')) {
      return `"${data.replace(/"/g, '\\"')}"`;
    }
    return data;
  }
  
  return String(data);
}

/**
 * Convert to XML format (simplified)
 */
function toXML(data: unknown, rootName: string = 'root'): string {
  if (data === null || data === undefined) {
    return `<${rootName}/>`;
  }
  
  if (Array.isArray(data)) {
    return data.map((item, idx) => toXML(item, 'item')).join('');
  }
  
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    let xml = `<${rootName}>`;
    entries.forEach(([key, value]) => {
      if (Array.isArray(value)) {
        xml += `<${key}>${value.map(item => toXML(item, 'item')).join('')}</${key}>`;
      } else if (typeof value === 'object' && value !== null) {
        xml += toXML(value, key);
      } else {
        const escaped = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        xml += `<${key}>${escaped}</${key}>`;
      }
    });
    xml += `</${rootName}>`;
    return xml;
  }
  
  const escaped = String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<${rootName}>${escaped}</${rootName}>`;
}

/**
 * Convert to CSV format (for tabular data only)
 */
function toCSV(data: unknown): string {
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
          // Tabular data - convert to CSV
          const keys = Object.keys(firstItem as Record<string, unknown>);
          const header = keys.join(',');
          const rows = (value as Record<string, unknown>[]).map(item => {
            return keys.map(k => {
              const val = item[k];
              if (val === null || val === undefined) return '';
              const str = String(val);
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
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

interface FormatComparison {
  format: string;
  tokens: number;
  size: number;
  vsJSON: number; // percentage
  vsJSONCompact: number; // percentage
}

function compareFormats(data: unknown, name: string): FormatComparison[] {
  // JSON formats
  const json = JSON.stringify(data, null, 2);
  const jsonCompact = JSON.stringify(data);
  
  // TOON formats
  const toon = encode(data);
  const toonCompact = encode(data, { compactBooleans: true, compactNull: true });
  const toonTabular = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  const toonFlattened = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t', flatten: true });
  
  // Other formats
  const yaml = toYAML(data);
  const xml = toXML(data, 'root');
  const csv = toCSV(data);
  
  // Count tokens
  const results: FormatComparison[] = [
    { format: 'JSON', tokens: countTokens(json), size: json.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'JSON compact', tokens: countTokens(jsonCompact), size: jsonCompact.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'TOON', tokens: countTokens(toon), size: toon.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'TOON compact', tokens: countTokens(toonCompact), size: toonCompact.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'TOON tabular', tokens: countTokens(toonTabular), size: toonTabular.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'TOON flattened', tokens: countTokens(toonFlattened), size: toonFlattened.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'YAML', tokens: countTokens(yaml), size: yaml.length, vsJSON: 0, vsJSONCompact: 0 },
    { format: 'XML', tokens: countTokens(xml), size: xml.length, vsJSON: 0, vsJSONCompact: 0 },
  ];
  
  // Add CSV if it's different from JSON
  if (csv !== JSON.stringify(data)) {
    results.push({ format: 'CSV', tokens: countTokens(csv), size: csv.length, vsJSON: 0, vsJSONCompact: 0 });
  }
  
  const jsonTokens = results.find(r => r.format === 'JSON')!.tokens;
  const jsonCompactTokens = results.find(r => r.format === 'JSON compact')!.tokens;
  
  // Calculate percentages
  results.forEach(result => {
    result.vsJSON = ((jsonTokens - result.tokens) / jsonTokens * 100);
    result.vsJSONCompact = ((jsonCompactTokens - result.tokens) / jsonCompactTokens * 100);
  });
  
  return results.sort((a, b) => a.tokens - b.tokens);
}

function formatBar(value: number, max: number, width: number = 20): string {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function main() {
  console.log('🚀 Comprehensive Format Comparison Benchmark\n');
  console.log('🔢 Counting tokens with tiktoken (GPT-4 tokenizer)...\n');
  
  // Load github_repos.json if it exists
  const githubReposPath = path.join(__dirname, '..', 'output', 'github_repos.json');
  let githubReposData: unknown = null;
  
  if (fs.existsSync(githubReposPath)) {
    try {
      const content = fs.readFileSync(githubReposPath, 'utf-8');
      githubReposData = JSON.parse(content);
      console.log('✅ Loaded github_repos.json from output folder\n');
    } catch (e) {
      console.log('⚠️  Could not load github_repos.json, using generated data\n');
    }
  }
  
  // Test datasets
  const datasets: Array<{ name: string; data: unknown; tabular: number }> = [];
  
  if (githubReposData) {
    datasets.push({ name: '⭐ GitHub Repositories (from file)', data: githubReposData, tabular: 100 });
  }
  
  // Add other test datasets
  datasets.push(
    { name: '👥 Uniform employee records', data: createEmployeesDataset(), tabular: 100 },
    { name: '🛒 E-commerce orders', data: createEcommerceOrdersDataset(), tabular: 33 },
    { name: '🧾 Semi-uniform event logs', data: createEventLogsDataset(), tabular: 50 },
    { name: '🧩 Deeply nested configuration', data: createDeepConfigDataset(), tabular: 0 }
  );
  
  // Benchmark each dataset
  const allResults: Array<{ name: string; results: FormatComparison[] }> = [];
  
  datasets.forEach(dataset => {
    const results = compareFormats(dataset.data, dataset.name);
    allResults.push({ name: dataset.name, results });
    
    console.log('='.repeat(80));
    console.log(`${dataset.name}  ┊  Tabular: ${dataset.tabular}%`);
    console.log('='.repeat(80));
    console.log();
    
    const maxTokens = Math.max(...results.map(r => r.tokens));
    const bestFormat = results[0];
    
    results.forEach(result => {
      const bar = formatBar(result.tokens, maxTokens);
      const vsJson = result.vsJSON >= 0 ? `(-${result.vsJSON.toFixed(1)}%)` : `(+${Math.abs(result.vsJSON).toFixed(1)}%)`;
      const vsJsonCompact = result.vsJSONCompact >= 0 ? `(-${result.vsJSONCompact.toFixed(1)}%)` : `(+${Math.abs(result.vsJSONCompact).toFixed(1)}%)`;
      const marker = result.format === bestFormat.format ? '→' : ' ';
      
      console.log(`${marker} ${result.format.padEnd(15)} ${bar}    ${result.tokens.toLocaleString().padStart(8)} tokens  ${vsJson} vs JSON  ${vsJsonCompact} vs JSON compact`);
    });
    console.log();
  });
  
  // Overall summary
  console.log('='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  const formatTotals: Record<string, number> = {};
  allResults.forEach(({ results }) => {
    results.forEach(result => {
      formatTotals[result.format] = (formatTotals[result.format] || 0) + result.tokens;
    });
  });
  
  const sortedFormats = Object.entries(formatTotals)
    .map(([format, tokens]) => ({ format, tokens }))
    .sort((a, b) => a.tokens - b.tokens);
  
  const maxTotal = Math.max(...sortedFormats.map(f => f.tokens));
  const jsonTotal = formatTotals['JSON'] || 0;
  const jsonCompactTotal = formatTotals['JSON compact'] || 0;
  
  sortedFormats.forEach(({ format, tokens }) => {
    const bar = formatBar(tokens, maxTotal);
    const vsJson = ((jsonTotal - tokens) / jsonTotal * 100);
    const vsJsonCompact = ((jsonCompactTotal - tokens) / jsonCompactTotal * 100);
    const vsJsonStr = vsJson >= 0 ? `(-${vsJson.toFixed(1)}%)` : `(+${Math.abs(vsJson).toFixed(1)}%)`;
    const vsJsonCompactStr = vsJsonCompact >= 0 ? `(-${vsJsonCompact.toFixed(1)}%)` : `(+${Math.abs(vsJsonCompact).toFixed(1)}%)`;
    const marker = format === sortedFormats[0].format ? '→' : ' ';
    
    console.log(`${marker} ${format.padEnd(15)} ${bar}    ${tokens.toLocaleString().padStart(8)} tokens  ${vsJsonStr} vs JSON  ${vsJsonCompactStr} vs JSON compact`);
  });
  console.log();
  
  // Identify where we're losing
  console.log('='.repeat(80));
  console.log('ANALYSIS: Where TOON is losing');
  console.log('='.repeat(80));
  console.log();
  
  allResults.forEach(({ name, results }) => {
    const toonTabular = results.find(r => r.format === 'TOON tabular');
    const jsonCompact = results.find(r => r.format === 'JSON compact');
    const best = results[0];
    
    if (toonTabular && jsonCompact && toonTabular.tokens > jsonCompact.tokens) {
      const diff = ((toonTabular.tokens - jsonCompact.tokens) / jsonCompact.tokens * 100).toFixed(1);
      console.log(`❌ ${name}: TOON tabular is ${diff}% worse than JSON compact`);
      console.log(`   Best format: ${best.format} (${best.tokens} tokens)`);
      console.log();
    } else if (toonTabular && toonTabular.format !== best.format) {
      const diff = ((toonTabular.tokens - best.tokens) / best.tokens * 100).toFixed(1);
      console.log(`⚠️  ${name}: TOON tabular is ${diff}% worse than best (${best.format})`);
      console.log();
    }
  });
}

// Helper functions for creating test datasets
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

function createEventLogsDataset() {
  const logs = [];
  for (let i = 1; i <= 100; i++) {
    if (i % 2 === 0) {
      logs.push({
        timestamp: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`,
        level: ['INFO', 'WARN', 'ERROR'][i % 3],
        message: `Log message ${i}`,
        source: `service-${i % 5}`
      });
    } else {
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
      }
    }
  };
}

if (require.main === module) {
  main();
}

