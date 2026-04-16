import fs from 'fs';
import { places, categories } from './src/data/netherlands.js';

const fetchWikiImage = async (query) => {
  try {
    // Stage 1: Find actual Wikipedia article title
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`);
    const searchData = await searchRes.json();
    if (!searchData.query.search || searchData.query.search.length === 0) return null;
    
    let title = searchData.query.search[0].title;
    
    // Stage 2: Get main image of that exact article
    const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}`);
    const imgData = await imgRes.json();
    
    const pages = imgData.query.pages;
    const pageKeys = Object.keys(pages);
    if (pageKeys.length > 0) {
      const page = pages[pageKeys[0]];
      if (page.original && page.original.source) {
        return page.original.source;
      }
    }
    return null;
  } catch (e) {
    console.error(`Error fetching image for ${query}:`, e.message);
    return null;
  }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log(`Will update ${places.length} places. This will take about 20-30 seconds...`);
  
  const updatedPlaces = [];
  
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    let query = `${p.name} ${p.city} Netherlands`;
    
    // Slight optimization for well known names
    if (p.name.includes("Museum")) query = `${p.name} ${p.city}`;
    
    let imageUrl = await fetchWikiImage(query);
    
    if (imageUrl) {
      console.log(`[${i+1}/${places.length}] OK: ${p.name} -> found!`);
      // Update image
      p.image = imageUrl;
    } else {
      console.log(`[${i+1}/${places.length}] FAIL: ${p.name} -> Keeping SVG placeholder.`);
      // Keep existing SVG
    }
    updatedPlaces.push(p);
    
    // Sleep to avoid rate limiting
    await delay(300);
  }
  
  let fileContent = `export const places = [\n`;
  updatedPlaces.forEach((p, idx) => {
      fileContent += `  { id: "${p.id}", name: "${p.name.replace(/"/g, '\\"')}", city: "${p.city}", description: "${p.description.replace(/"/g, '\\"')}", category: "${p.category}", rating: ${p.rating}, lat: ${p.lat}, lng: ${p.lng}, image: "${p.image}" }${idx === updatedPlaces.length -1 ? '' : ','}\n`;
  });
  fileContent += `];\n\n`;
  fileContent += `export const categories = [\n  "Culture", "Nature", "Sights", "Explore", "History"\n];\n`;
  
  fs.writeFileSync('src/data/netherlands.js', fileContent);
  console.log("Success! File saved as src/data/netherlands.js.");
}

main();
