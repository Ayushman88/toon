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
      // Fallback to cl100k_base if gpt-4 not available
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
    // Fallback to simple approximation if tiktoken fails
    return Math.ceil(text.length / 4);
  }
}

/**
 * Create a simple e-commerce products dataset
 */
function createProductsDataset() {
  return {
    store: {
      name: "TechMart",
      products: [
        { id: 1, name: "Laptop", price: 999.99, inStock: true, category: "Electronics" },
        { id: 2, name: "Phone", price: 699.99, inStock: true, category: "Electronics" },
        { id: 3, name: "Tablet", price: 399.99, inStock: false, category: "Electronics" }
      ],
      stats: {
        totalProducts: 3,
        inStock: 2,
        avgPrice: 699.99
      }
    }
  };
}

/**
 * Create a user profile dataset with minimal nesting
 */
function createUserDataset() {
  return {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com", active: true, score: 95 },
      { id: 2, name: "Bob", email: "bob@example.com", active: false, score: 87 },
      { id: 3, name: "Charlie", email: "charlie@example.com", active: true, score: 92 }
    ]
  };
}

/**
 * Create a complex nested configuration dataset
 */
function createConfigDataset() {
  return {
    app: {
      name: "MyApp",
      version: "1.0.0",
      settings: {
        debug: false,
        logLevel: "info",
        features: {
          auth: { enabled: true, provider: "oauth" },
          cache: { enabled: true, ttl: 3600 },
          api: { enabled: true, rateLimit: 100 }
        }
      },
      endpoints: ["/api/v1", "/api/v2", "/health"]
    }
  };
}

/**
 * Create a complex books dataset with nested structures and all data types
 */
function createBooksDataset() {
  return {
    library: {
      name: "Central Public Library",
      location: {
        city: "San Francisco",
        state: "CA",
        zipCode: 94102,
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      books: [
        {
          id: 1,
          title: "The Great Gatsby",
          author: {
            firstName: "F. Scott",
            lastName: "Fitzgerald",
            birthYear: 1896,
            nationality: "American"
          },
          isbn: "978-0-7432-7356-5",
          published: 1925,
          genres: ["Fiction", "Classic", "American Literature"],
          pages: 180,
          rating: 4.2,
          inStock: true,
          price: 12.99,
          reviews: [
            {
              reviewer: "John Doe",
              rating: 5,
              comment: "A masterpiece of American literature",
              date: "2023-01-15",
              verified: true
            },
            {
              reviewer: "Jane Smith",
              rating: 4,
              comment: "Beautiful prose, timeless story",
              date: "2023-02-20",
              verified: true
            }
          ],
          tags: ["bestseller", "classic", "required-reading"],
          metadata: {
            edition: "First Edition",
            language: "English",
            format: "Paperback",
            dimensions: {
              width: 5.5,
              height: 8.5,
              depth: 0.5
            }
          }
        },
        {
          id: 2,
          title: "1984",
          author: {
            firstName: "George",
            lastName: "Orwell",
            birthYear: 1903,
            nationality: "British"
          },
          isbn: "978-0-452-28423-4",
          published: 1949,
          genres: ["Dystopian", "Fiction", "Political Fiction"],
          pages: 328,
          rating: 4.7,
          inStock: false,
          price: 14.99,
          reviews: [
            {
              reviewer: "Alice Johnson",
              rating: 5,
              comment: "Prophetic and chilling",
              date: "2023-03-10",
              verified: true
            }
          ],
          tags: ["dystopian", "classic", "warning"],
          metadata: {
            edition: "Penguin Classics",
            language: "English",
            format: "Hardcover",
            dimensions: {
              width: 5.8,
              height: 8.7,
              depth: 1.2
            }
          }
        },
        {
          id: 3,
          title: "To Kill a Mockingbird",
          author: {
            firstName: "Harper",
            lastName: "Lee",
            birthYear: 1926,
            nationality: "American"
          },
          isbn: "978-0-06-112008-4",
          published: 1960,
          genres: ["Fiction", "Classic", "Southern Gothic"],
          pages: 376,
          rating: 4.8,
          inStock: true,
          price: 13.99,
          reviews: [],
          tags: ["classic", "southern", "coming-of-age"],
          metadata: {
            edition: "50th Anniversary Edition",
            language: "English",
            format: "Paperback",
            dimensions: {
              width: 5.2,
              height: 8.0,
              depth: 0.8
            }
          }
        },
        {
          id: 4,
          title: "Pride and Prejudice",
          author: {
            firstName: "Jane",
            lastName: "Austen",
            birthYear: 1775,
            nationality: "British"
          },
          isbn: "978-0-14-143951-8",
          published: 1813,
          genres: ["Romance", "Classic", "Regency"],
          pages: 432,
          rating: 4.6,
          inStock: true,
          price: 11.99,
          reviews: [
            {
              reviewer: "Emily Chen",
              rating: 5,
              comment: "Timeless romance and wit",
              date: "2023-04-05",
              verified: false
            },
            {
              reviewer: "Michael Brown",
              rating: 4,
              comment: "Classic British literature",
              date: "2023-05-12",
              verified: true
            },
            {
              reviewer: "Sarah Wilson",
              rating: 5,
              comment: "One of my all-time favorites",
              date: "2023-06-01",
              verified: true
            }
          ],
          tags: ["romance", "classic", "british-literature"],
          metadata: {
            edition: "Penguin Classics",
            language: "English",
            format: "Paperback",
            dimensions: {
              width: 5.0,
              height: 7.8,
              depth: 1.0
            }
          }
        },
        {
          id: 5,
          title: "The Catcher in the Rye",
          author: {
            firstName: "J.D.",
            lastName: "Salinger",
            birthYear: 1919,
            nationality: "American"
          },
          isbn: "978-0-316-76948-0",
          published: 1951,
          genres: ["Fiction", "Coming-of-Age", "Literary Fiction"],
          pages: 234,
          rating: 3.9,
          inStock: true,
          price: 12.49,
          reviews: [
            {
              reviewer: "David Lee",
              rating: 4,
              comment: "Relatable teenage angst",
              date: "2023-07-15",
              verified: true
            }
          ],
          tags: ["coming-of-age", "american", "classic"],
          metadata: {
            edition: "Little, Brown and Company",
            language: "English",
            format: "Paperback",
            dimensions: {
              width: 5.3,
              height: 8.2,
              depth: 0.7
            }
          }
        }
      ],
      statistics: {
        totalBooks: 5,
        totalPages: 1550,
        averageRating: 4.44,
        genres: ["Fiction", "Classic", "American Literature", "Dystopian", "Political Fiction", "Southern Gothic", "Romance", "Regency", "Coming-of-Age", "Literary Fiction"],
        languages: ["English"],
        totalReviews: 7,
        booksInStock: 4,
        booksOutOfStock: 1
      },
      settings: {
        allowReservations: true,
        maxLoanDays: 21,
        finePerDay: 0.25,
        notificationsEnabled: true,
        autoRenewal: false,
        maxBooksPerUser: 10
      }
    }
  };
}

/**
 * Compare JSON vs TOON for a single dataset
 */
function compareDataset(name: string, data: unknown) {
  // Convert to JSON
  const jsonCompact = JSON.stringify(data);
  
  // Convert to TOON
  const toon = encode(data);
  const toonCompact = encode(data, { compactBooleans: true, compactNull: true });
  // Tabular format with tabs (best tokenization)
  const toonTabular = encode(data, { compactBooleans: true, compactNull: true, delimiter: '\t' });
  
  // Calculate token counts using tiktoken
  const jsonTokens = countTokens(jsonCompact);
  const toonTokens = countTokens(toon);
  const toonCompactTokens = countTokens(toonCompact);
  const toonTabularTokens = countTokens(toonTabular);
  
  // Calculate savings
  const savings = ((jsonTokens - toonTokens) / jsonTokens * 100);
  const savingsCompact = ((jsonTokens - toonCompactTokens) / jsonTokens * 100);
  const savingsTabular = ((jsonTokens - toonTabularTokens) / jsonTokens * 100);
  
  return {
    name,
    jsonTokens,
    toonTokens,
    toonCompactTokens,
    toonTabularTokens,
    savings,
    savingsCompact,
    savingsTabular,
    jsonCompact,
    toon,
    toonCompact,
    toonTabular
  };
}

function main() {
  console.log('🔢 Counting tokens with tiktoken (GPT-4 tokenizer)...\n');
  
  // Test with multiple datasets
  const datasets = [
    { name: 'Books Dataset', data: createBooksDataset() },
    { name: 'Products Dataset', data: createProductsDataset() },
    { name: 'User Dataset', data: createUserDataset() },
    { name: 'Config Dataset', data: createConfigDataset() }
  ];
  
  const results = datasets.map(ds => compareDataset(ds.name, ds.data));
  
  // Aggregate results
  let totalJsonTokens = 0;
  let totalToonTokens = 0;
  let totalToonCompactTokens = 0;
  let totalToonTabularTokens = 0;
  
  // Display results for each dataset
  console.log('='.repeat(80));
  console.log('TOKEN COUNT COMPARISON (Per Dataset)');
  console.log('='.repeat(80));
  console.log();
  
  results.forEach(result => {
    totalJsonTokens += result.jsonTokens;
    totalToonTokens += result.toonTokens;
    totalToonCompactTokens += result.toonCompactTokens;
    totalToonTabularTokens += result.toonTabularTokens || 0;
    
    console.log(`📦 ${result.name}:`);
    console.log(`   JSON (compact):        ${result.jsonTokens.toLocaleString()} tokens`);
    console.log(`   TOON (standard):       ${result.toonTokens.toLocaleString()} tokens (${result.savings >= 0 ? '+' : ''}${result.savings.toFixed(2)}%)`);
    console.log(`   TOON (compact):        ${result.toonCompactTokens.toLocaleString()} tokens (${result.savingsCompact >= 0 ? '+' : ''}${result.savingsCompact.toFixed(2)}%)`);
    if (result.toonTabularTokens) {
      console.log(`   TOON (tabular+tabs):   ${result.toonTabularTokens.toLocaleString()} tokens (${result.savingsTabular >= 0 ? '+' : ''}${result.savingsTabular.toFixed(2)}%)`);
    }
    console.log();
  });
  
  // Overall summary
  const overallSavings = ((totalJsonTokens - totalToonTokens) / totalJsonTokens * 100);
  const overallSavingsCompact = ((totalJsonTokens - totalToonCompactTokens) / totalJsonTokens * 100);
  const overallSavingsTabular = ((totalJsonTokens - totalToonTabularTokens) / totalJsonTokens * 100);
  
  console.log('='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  console.log(`📊 Total JSON (compact):        ${totalJsonTokens.toLocaleString()} tokens`);
  console.log(`📊 Total TOON (standard):       ${totalToonTokens.toLocaleString()} tokens`);
  console.log(`📊 Total TOON (compact):        ${totalToonCompactTokens.toLocaleString()} tokens`);
  console.log(`📊 Total TOON (tabular+tabs):   ${totalToonTabularTokens.toLocaleString()} tokens`);
  console.log();
  
  console.log(`💰 Token Savings (standard): ${overallSavings >= 0 ? '+' : ''}${overallSavings.toFixed(2)}% (${(totalJsonTokens - totalToonTokens).toLocaleString()} tokens saved)`);
  console.log(`💰 Token Savings (compact): ${overallSavingsCompact >= 0 ? '+' : ''}${overallSavingsCompact.toFixed(2)}% (${(totalJsonTokens - totalToonCompactTokens).toLocaleString()} tokens saved)`);
  console.log(`💰 Token Savings (tabular): ${overallSavingsTabular >= 0 ? '+' : ''}${overallSavingsTabular.toFixed(2)}% (${(totalJsonTokens - totalToonTabularTokens).toLocaleString()} tokens saved)`);
  console.log();
  
  // Save the books dataset output (most complex one)
  const booksResult = results.find(r => r.name === 'Books Dataset')!;
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, 'books.json.compact'), booksResult.jsonCompact);
  fs.writeFileSync(path.join(outputDir, 'books.toon'), booksResult.toon);
  fs.writeFileSync(path.join(outputDir, 'books.toon.compact'), booksResult.toonCompact);
  
  console.log('💾 Sample output files saved to ./output/');
  console.log('   - books.json.compact');
  console.log('   - books.toon');
  console.log('   - books.toon.compact');
  console.log();
  
  // Show sample of each format
  console.log('='.repeat(80));
  console.log('SAMPLE OUTPUT (Books Dataset - first 500 characters)');
  console.log('='.repeat(80));
  console.log();
  
  console.log('JSON (compact):');
  console.log(booksResult.jsonCompact.substring(0, 500) + '...');
  console.log();
  
  console.log('TOON (compact):');
  console.log(booksResult.toonCompact.substring(0, 500) + '...');
  console.log();
}

if (require.main === module) {
  main();
}

