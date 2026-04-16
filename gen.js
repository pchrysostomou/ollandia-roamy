import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = "Act as a data generator. Create a JSON array of 75 real tourist attractions in the Netherlands. Generate exactly 15 places for each of these 5 cities: Utrecht, Rotterdam, The Hague, Leiden, and Giethoorn. Ensure a good mix of the following categories: 'Culture', 'Nature', 'Sights', 'History', 'Explore'. Each object in the JSON array must follow this exact schema: { \"id\": \"unique_string_id\", \"name\": \"Real name of the place (e.g., Dom Tower)\", \"city\": \"City Name\", \"description\": \"A realistic, engaging 2-sentence description in English.\", \"category\": \"Must be exactly one of: Culture, Nature, Sights, History, Explore\", \"rating\": 4.5, \"lat\": 52.09, \"lng\": 5.12, \"image\": \"https://placehold.co/600x400?text=\" }. For the image field, append the URL-encoded City Name and Place Name to the text parameter. Example: https://placehold.co/600x400?text=Utrecht+Dom+Tower . Output ONLY the valid JSON array, without any markdown formatting or introductory text.";

async function main() {
  console.log("Requesting data from OpenAI...");
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });
  
  let jsonStr = response.choices[0].message.content.trim();
  jsonStr = jsonStr.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
  
  try {
    const data = JSON.parse(jsonStr);
    console.log("Parsed successful. Found " + data.length + " items.");
    const fileContent = "export const places = " + JSON.stringify(data, null, 2) + ";\n\nexport const categories = [\"Culture\", \"Nature\", \"Sights\", \"Explore\", \"History\"];\n";
    fs.writeFileSync('src/data/netherlands.js', fileContent, 'utf8');
    console.log("Done!");
  } catch (err) {
    console.error("Failed to parse JSON", err);
  }
}

main();
