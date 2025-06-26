// HistoryCleaner.js
const fs = require('fs');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const history = JSON.parse(fs.readFileSync('history.json', 'utf-8'));

async function dedupeHistory(history) {
  const prompt = `
Given the following transcription history, return a new array with duplicates and near-duplicates removed, keeping only the most relevant/unique entries:

${JSON.stringify(history, null, 2)}

Return only the cleaned array as JSON.
`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    model: "gemma-2-9b-it", // Use the correct model name
    temperature: 0.2,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null
  });

  let result = '';
  for await (const chunk of chatCompletion) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
    result += content;
  }
  // Optionally, parse and use the result as JSON
  // const cleaned = JSON.parse(result);
  // console.log("Cleaned history:", cleaned);
}

dedupeHistory(history);