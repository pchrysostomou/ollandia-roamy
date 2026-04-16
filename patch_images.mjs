import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { places, categories } from './src/data/netherlands.js';

const filePath = path.join(process.cwd(), 'src/data/netherlands.js');

async function getWikiImage(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
    const searchRes = await axios.get(searchUrl);
    if (!searchRes.data.query.search.length) return null;
    const title = searchRes.data.query.search[0].title;
    
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600`;
    const imgRes = await axios.get(imgUrl);
    const pages = imgRes.data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pages[pageId].thumbnail) {
        return pages[pageId].thumbnail.source;
    }
  } catch(e) {
    console.error("Failed for", query);
  }
  return null;
}

const FALLBACKS = {
  "Amsterdam": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600&h=400&fit=crop",
  "Utrecht": "https://images.unsplash.com/photo-1542456424-8178aabacaf1?w=600&h=400&fit=crop",
  "Rotterdam": "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&h=400&fit=crop",
  "The Hague": "https://images.unsplash.com/photo-1582236378411-ae9d5d5bf4de?w=600&h=400&fit=crop",
  "Leiden": "https://images.unsplash.com/photo-1585641977759-9fcf151a6572?w=600&h=400&fit=crop",
  "Giethoorn": "https://images.unsplash.com/photo-1628178122605-6a5d7c4be909?w=600&h=400&fit=crop"
};

async function main() {
  console.log("Fetching images for", places.length, "places...");
  
  // Use map to fetch all concurrently to be extremely fast
  const updatedPlacesPromises = places.map(async (place) => {
      let img = await getWikiImage(place.name + " " + place.city);
      if(!img) img = await getWikiImage(place.name);
      if(!img) img = FALLBACKS[place.city] || "https://placehold.co/600x400?text=" + encodeURIComponent(place.name);
      
      console.log(`Fetched: ${place.name} -> ${img.substring(0,40)}...`);
      return { ...place, image: img };
  });
  
  const updatedPlaces = await Promise.all(updatedPlacesPromises);
  
  // Now reconstruct the netherlands.js file to keep it clean.
  let fileContent = `export const places = [\n`;
  updatedPlaces.forEach((p, idx) => {
      fileContent += `  { id: "${p.id}", name: "${p.name.replace(/"/g, '\\"')}", city: "${p.city}", description: "${p.description.replace(/"/g, '\\"')}", category: "${p.category}", rating: ${p.rating}, lat: ${p.lat}, lng: ${p.lng}, image: "${p.image}" }${idx === updatedPlaces.length -1 ? '' : ','}\n`;
  });
  fileContent += `];\n\n`;
  fileContent += `export const categories = [\n  "Culture", "Nature", "Sights", "Explore", "History"\n];\n`;
  
  fs.writeFileSync(filePath, fileContent);
  console.log("Successfully patched netherlands.js!");
}
main();
