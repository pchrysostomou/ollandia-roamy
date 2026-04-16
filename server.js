import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint 1: Smart Itinerary Builder
app.post('/api/itinerary', async (req, res) => {
  const { places, duration } = req.body;
  if (!places || places.length === 0) return res.json([]);
  
  const tripDurationDays = duration || 3; // Default to 3 if not provided

  const placesContext = places.map(p => `- ${p.name} in ${p.city}`).join("\n");
  
  const prompt = `You are an expert travel planner for the Netherlands.
I have the following unordered list of places:
${placesContext}

Organize these into a logical day-by-day itinerary FOR EXACTLY ${tripDurationDays} DAYS. 
If ${tripDurationDays} days is too few to see everything reasonably, group them by geographic proximity to minimize travel time on the same day. 
Respond ONLY with a JSON array in the exact format below:
[
  { "day": 1, "theme": "Amsterdam Central", "placeIds": ["id1", "id2"] }
]
Use the exact IDs supplied in this mapping: ${places.map(p => `Name: ${p.name}, ID: ${p.id}`).join(" | ")}. No markdown blocks, just raw JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const resultText = response.choices[0].message.content.trim();
    const cleanJson = resultText.replace(/```json\n|\n```|```/g, '');
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

// Endpoint 2: Scraper for URLs
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || "Unknown Location";
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || "Imported magically from a link.";
    const imageUrl = $('meta[property="og:image"]').attr('content') || "/hero_amsterdam_canal_1776289628576.png";

    const aiPrompt = `I scraped a URL and found this metadata:
Title: ${title}
Description: ${description}

Analyze this. It is likely a place in the Netherlands. Guess the best plausible name, city, latitude, and longitude for it.
Default to near Amsterdam Central (lat: 52.379189, lng: 4.899431).
Return strictly JSON formatting:
{ "name": "Place", "city": "City", "lat": 52.123, "lng": 4.123, "category": "Explore" }`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0
    });

    const cleanRes = aiRes.choices[0].message.content.trim().replace(/```json\n|\n```|```/g, '');
    const locationData = JSON.parse(cleanRes);

    res.json({
      id: "imported_" + Date.now(),
      name: locationData.name || title.substring(0, 30),
      city: locationData.city || "Amsterdam",
      description: description,
      category: locationData.category || "Explore",
      image: imageUrl,
      rating: 4.5,
      lat: locationData.lat || 52.3676,
      lng: locationData.lng || 4.9041
    });
  } catch (error) {
    console.error("Scrape Error:", error.message);
    res.json({
      id: "imported_" + Date.now(),
      name: "Social Media Spot (Protected)",
      city: "Netherlands",
      description: "Could not read exact details due to social media privacy blocks. Please edit manually.",
      category: "Explore",
      image: "/hero_amsterdam_canal_1776289628576.png",
      rating: 4.5,
      lat: 52.3676 + (Math.random() * 0.1),
      lng: 4.9041 + (Math.random() * 0.1)
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
