import { encode } from "../src/encode";
import * as fs from "fs";
import * as path from "path";

/**
 * Test LLM retrieval accuracy by sending prompts to OpenAI/Anthropic
 * This requires API keys to be set in environment variables
 */

interface RetrievalTestCase {
  name: string;
  question: string;
  expectedAnswer: string;
  csvData: string;
  toonData: string;
  csvTokens: number;
  toonTokens: number;
}

/**
 * Create test cases for LLM retrieval
 */
function createTestCases() {
  const testCases: RetrievalTestCase[] = [];

  // Test Case 1: Simple count
  const simpleUsers = {
    users: [
      { id: 1, name: "Alice", role: "admin" },
      { id: 2, name: "Bob", role: "user" },
      { id: 3, name: "Charlie", role: "user" },
    ],
  };

  const csv1 = `id,name,role
1,Alice,admin
2,Bob,user
3,Charlie,user`;

  const toon1 = encode(simpleUsers, {
    compactBooleans: true,
    compactNull: true,
    delimiter: ",",
  });

  testCases.push({
    name: "Count items",
    question: "How many users are in this dataset?",
    expectedAnswer: "3",
    csvData: csv1,
    toonData: toon1,
    csvTokens: csv1.length / 4, // rough estimate
    toonTokens: toon1.length / 4,
  });

  // Test Case 2: Find specific value
  testCases.push({
    name: "Find specific value",
    question: "What is the name of the user with id 2?",
    expectedAnswer: "Bob",
    csvData: csv1,
    toonData: toon1,
    csvTokens: csv1.length / 4,
    toonTokens: toon1.length / 4,
  });

  // Test Case 3: Filter/aggregate
  testCases.push({
    name: "Filter by condition",
    question: 'How many users have the role "admin"?',
    expectedAnswer: "1",
    csvData: csv1,
    toonData: toon1,
    csvTokens: csv1.length / 4,
    toonTokens: toon1.length / 4,
  });

  // Test Case 4: Nested data
  const nestedOrders = {
    orders: [
      {
        orderId: "ORD-1",
        customer: { name: "Alice", email: "alice@example.com" },
        items: [{ sku: "SKU-1", quantity: 2, price: 10.99 }],
        total: 21.98,
        status: "pending",
      },
      {
        orderId: "ORD-2",
        customer: { name: "Bob", email: "bob@example.com" },
        items: [{ sku: "SKU-2", quantity: 1, price: 5.99 }],
        total: 5.99,
        status: "shipped",
      },
    ],
  };

  const csv2 = `orderId,customer.name,customer.email,items.0.sku,items.0.quantity,items.0.price,total,status
ORD-1,Alice,alice@example.com,SKU-1,2,10.99,21.98,pending
ORD-2,Bob,bob@example.com,SKU-2,1,5.99,5.99,shipped`;

  const toon2 = encode(nestedOrders, {
    compactBooleans: true,
    compactNull: true,
    delimiter: ",",
  });
  const toon2Flattened = encode(nestedOrders, {
    compactBooleans: true,
    compactNull: true,
    delimiter: "\t",
    flatten: true,
  });

  testCases.push({
    name: "Nested data - find customer",
    question: "What is the email of the customer for order ORD-1?",
    expectedAnswer: "alice@example.com",
    csvData: csv2,
    toonData: toon2,
    csvTokens: csv2.length / 4,
    toonTokens: toon2.length / 4,
  });

  testCases.push({
    name: "Nested data - flattened format",
    question: "What is the email of the customer for order ORD-1?",
    expectedAnswer: "alice@example.com",
    csvData: csv2,
    toonData: toon2Flattened,
    csvTokens: csv2.length / 4,
    toonTokens: toon2Flattened.length / 4,
  });

  // Test Case 5: Large dataset
  const largeUsers = {
    users: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ["admin", "user", "moderator"][i % 3],
      active: i % 10 !== 0,
      score: Math.floor(Math.random() * 1000),
    })),
  };

  const csv3 = `id,name,email,role,active,score
${largeUsers.users
  .map((u) => `${u.id},${u.name},${u.email},${u.role},${u.active},${u.score}`)
  .join("\n")}`;

  const toon3 = encode(largeUsers, {
    compactBooleans: true,
    compactNull: true,
    delimiter: ",",
  });

  testCases.push({
    name: "Large dataset - find by ID",
    question: "What is the email of the user with id 50?",
    expectedAnswer: "user50@example.com",
    csvData: csv3,
    toonData: toon3,
    csvTokens: csv3.length / 4,
    toonTokens: toon3.length / 4,
  });

  return testCases;
}

/**
 * Test with OpenAI API (if available)
 */
async function testWithOpenAI(
  testCase: RetrievalTestCase,
  format: "csv" | "toon"
): Promise<{ answer: string; tokens: number } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const data = format === "csv" ? testCase.csvData : testCase.toonData;
    const prompt = `Given the following ${
      format === "csv" ? "CSV" : "TOON"
    } data:\n\n${data}\n\n${
      testCase.question
    }\n\nAnswer with just the value, no explanation.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that extracts information from structured data. Answer concisely with just the requested value.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = (await response.json()) as any;
    const answer = result.choices[0].message.content.trim();
    const tokens = result.usage?.total_tokens || 0;

    return { answer, tokens };
  } catch (error) {
    console.error(`Error testing with OpenAI: ${error}`);
    return null;
  }
}

/**
 * Test with Anthropic API (if available)
 */
async function testWithAnthropic(
  testCase: RetrievalTestCase,
  format: "csv" | "toon"
): Promise<{ answer: string; tokens: number } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const data = format === "csv" ? testCase.csvData : testCase.toonData;
    const prompt = `Given the following ${
      format === "csv" ? "CSV" : "TOON"
    } data:\n\n${data}\n\n${
      testCase.question
    }\n\nAnswer with just the value, no explanation.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const result = (await response.json()) as any;
    const answer = result.content[0].text.trim();
    const tokens =
      (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

    return { answer, tokens };
  } catch (error) {
    console.error(`Error testing with Anthropic: ${error}`);
    return null;
  }
}

/**
 * Test with Google Gemini API
 */
/**
 * Create an improved prompt with format explanation and examples
 */
function createPrompt(testCase: RetrievalTestCase, format: "csv" | "toon"): string {
  const data = format === "csv" ? testCase.csvData : testCase.toonData;
  
  if (format === "toon") {
    return `You are analyzing data in TOON (Token-Oriented Object Notation) format. TOON is a compact format for structured data.

TOON Format Guide:
- Arrays use format: keyName[count]{field1,field2,...}:
- The header shows: key name, item count, and field list
- Data rows follow with values separated by commas or tabs
- Example: users[2]{id,name,role}:\nid,name,role\n1,Alice,admin\n2,Bob,user

Given the following TOON data:

${data}

Question: ${testCase.question}

Instructions:
1. Parse the TOON format carefully
2. Find the exact answer in the data
3. Return ONLY the value, no explanation, no quotes, no extra text
4. If counting, return just the number
5. If finding a value, return exactly what appears in the data

Answer:`;
  } else {
    return `You are analyzing data in CSV (Comma-Separated Values) format.

Given the following CSV data:

${data}

Question: ${testCase.question}

Instructions:
1. Parse the CSV format (first line is headers, subsequent lines are data)
2. Find the exact answer in the data
3. Return ONLY the value, no explanation, no quotes, no extra text
4. If counting, return just the number
5. If finding a value, return exactly what appears in the data

Answer:`;
  }
}

async function testWithGemini(
  testCase: RetrievalTestCase,
  format: "csv" | "toon",
  apiKey: string
): Promise<{ answer: string; tokens: number } | null> {
  try {
    const prompt = createPrompt(testCase, format);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.statusText} - ${errorText}`
      );
    }

      const result = (await response.json()) as any;
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure: ${JSON.stringify(result)}`);
      }
      const answer = result.candidates[0].content.parts[0].text.trim();

    // Estimate tokens (Gemini doesn't always return usage in free tier)
    // Rough estimate: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(answer.length / 4);
    const tokens = inputTokens + outputTokens;

    return { answer, tokens };
    } catch (error) {
    // Try with gemini-2.5-flash-preview-05-20 as fallback
    try {
      const prompt = createPrompt(testCase, format);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // Check for rate limit - wait and retry with exponential backoff
        if (response.status === 429 || response.status === 503) {
          const waitTime = 30000; // 30 seconds for rate limits
          console.log(`  ⏳ Rate limited or overloaded, waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          // Retry once
          const retryResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  maxOutputTokens: 50,
                  temperature: 0,
                },
              }),
            }
          );
          if (!retryResponse.ok) {
            throw new Error(`Gemini API error: ${retryResponse.statusText}`);
          }
          const result = (await retryResponse.json()) as any;
          
          if (result.candidates && result.candidates[0] && result.candidates[0].finishReason === 'SAFETY') {
            throw new Error(`Response blocked by safety filter`);
          }
          
          if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
            throw new Error(`Invalid response structure: ${JSON.stringify(result)}`);
          }
          
          let answer = result.candidates[0].content.parts[0].text.trim();
          
          if (!answer || answer.length === 0) {
            throw new Error(`Empty response from API`);
          }
          const inputTokens = Math.ceil(prompt.length / 4);
          const outputTokens = Math.ceil(answer.length / 4);
          return { answer, tokens: inputTokens + outputTokens };
        }
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
      }

      const result = (await response.json()) as any;
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0]) {
        throw new Error(`Invalid response structure: ${JSON.stringify(result)}`);
      }
      const answer = result.candidates[0].content.parts[0].text.trim();
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(answer.length / 4);
      return { answer, tokens: inputTokens + outputTokens };
    } catch (fallbackError) {
      console.error(`Error testing with Gemini (both models): ${fallbackError}`);
      return null;
    }
  }
}

/**
 * Main test function
 */
async function main() {
  console.log("🤖 LLM Retrieval Accuracy Test\n");
  console.log(
    "Testing if LLMs can accurately parse and retrieve information from TOON vs CSV\n"
  );

  const testCases = createTestCases();

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const geminiKey =
    process.env.GEMINI_API_KEY || "AIzaSyDNk5EJL_ccgcWXHh7hq7N9cZMpatS5zTI";
  const hasGemini = !!geminiKey;

  if (!hasOpenAI && !hasAnthropic && !hasGemini) {
    console.log(
      "⚠️  No API keys found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to run actual LLM tests."
    );
    console.log("\n📝 Test cases prepared:");
    testCases.forEach((testCase, idx) => {
      console.log(`\n--- Test ${idx + 1}: ${testCase.name} ---`);
      console.log(`Question: ${testCase.question}`);
      console.log(`Expected Answer: ${testCase.expectedAnswer}`);
      console.log(`CSV tokens: ~${testCase.csvTokens}`);
      console.log(`TOON tokens: ~${testCase.toonTokens}`);
      console.log(`\nCSV data (first 200 chars):`);
      console.log(testCase.csvData.substring(0, 200) + "...");
      console.log(`\nTOON data (first 200 chars):`);
      console.log(testCase.toonData.substring(0, 200) + "...");
    });

    // Save test cases for manual testing
    const outputDir = path.join(
      __dirname,
      "..",
      "output",
      "llm-retrieval-test"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const testCasesFile = testCases
      .map((testCase, idx) => {
        return `=== Test ${idx + 1}: ${testCase.name} ===
Question: ${testCase.question}
Expected Answer: ${testCase.expectedAnswer}

CSV Format:
${testCase.csvData}

TOON Format:
${testCase.toonData}

---
`;
      })
      .join("\n\n");

    fs.writeFileSync(path.join(outputDir, "test-cases.txt"), testCasesFile);
    console.log(
      `\n💾 Test cases saved to ./output/llm-retrieval-test/test-cases.txt`
    );
    return;
  }

  console.log(
    `Using: ${hasOpenAI ? "OpenAI " : ""}${hasAnthropic ? "Anthropic " : ""}${
      hasGemini ? "Gemini 2.5 Flash" : ""
    }\n`
  );

  const results: Array<{
    testCase: RetrievalTestCase;
    csvResult: { answer: string; tokens: number; correct: boolean } | null;
    toonResult: { answer: string; tokens: number; correct: boolean } | null;
  }> = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}...`);

    let csvResult = null;
    let toonResult = null;

    if (hasOpenAI) {
      csvResult = await testWithOpenAI(testCase, "csv");
      toonResult = await testWithOpenAI(testCase, "toon");
    } else if (hasAnthropic) {
      csvResult = await testWithAnthropic(testCase, "csv");
      toonResult = await testWithAnthropic(testCase, "toon");
    } else if (hasGemini) {
      csvResult = await testWithGemini(testCase, "csv", geminiKey);
      // Add delay between CSV and TOON tests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      toonResult = await testWithGemini(testCase, "toon", geminiKey);
    }
    
    // Add delay between test cases to avoid rate limits
    if (hasGemini) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // More flexible answer matching - handle variations
    const normalizeAnswer = (answer: string): string => {
      return answer
        .toLowerCase()
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^the answer is\s*/i, '') // Remove "the answer is" prefix
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    const expectedNormalized = normalizeAnswer(testCase.expectedAnswer);
    
    const csvResultWithCorrect = csvResult
      ? {
          ...csvResult,
          correct: normalizeAnswer(csvResult.answer) === expectedNormalized,
        }
      : null;

    const toonResultWithCorrect = toonResult
      ? {
          ...toonResult,
          correct: normalizeAnswer(toonResult.answer) === expectedNormalized,
        }
      : null;

    results.push({
      testCase,
      csvResult: csvResultWithCorrect,
      toonResult: toonResultWithCorrect,
    });

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print results
  console.log("\n" + "═".repeat(80));
  console.log("📊 RESULTS");
  console.log("═".repeat(80));

  let csvCorrect = 0;
  let toonCorrect = 0;
  let csvTotalTokens = 0;
  let toonTotalTokens = 0;

  results.forEach((result, idx) => {
    console.log(`\n--- Test ${idx + 1}: ${result.testCase.name} ---`);
    console.log(`Question: ${result.testCase.question}`);
    console.log(`Expected: ${result.testCase.expectedAnswer}`);

    if (result.csvResult) {
      console.log(
        `CSV:      ${result.csvResult.answer} ${
          result.csvResult.correct ? "✅" : "❌"
        } (${result.csvResult.tokens} tokens)`
      );
      if (result.csvResult.correct) csvCorrect++;
      csvTotalTokens += result.csvResult.tokens;
    }

    if (result.toonResult) {
      console.log(
        `TOON:     ${result.toonResult.answer} ${
          result.toonResult.correct ? "✅" : "❌"
        } (${result.toonResult.tokens} tokens)`
      );
      if (result.toonResult.correct) toonCorrect++;
      toonTotalTokens += result.toonResult.tokens;
    }
  });

  console.log("\n" + "═".repeat(80));
  console.log("📈 SUMMARY");
  console.log("═".repeat(80));
  console.log(
    `CSV Accuracy:  ${csvCorrect}/${results.length} (${(
      (csvCorrect / results.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `TOON Accuracy: ${toonCorrect}/${results.length} (${(
      (toonCorrect / results.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`CSV Total Tokens:  ${csvTotalTokens}`);
  console.log(`TOON Total Tokens: ${toonTotalTokens}`);
  console.log(
    `Token Savings: ${(
      ((csvTotalTokens - toonTotalTokens) / csvTotalTokens) *
      100
    ).toFixed(1)}%`
  );
}

if (require.main === module) {
  main().catch(console.error);
}
