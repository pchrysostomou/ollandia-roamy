import fs from 'fs';
import path from 'path';
import { places, categories } from './src/data/netherlands.js';

const filePath = path.join(process.cwd(), 'src/data/netherlands.js');

function generateSVG(text) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="#222222"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30px" font-weight="600" fill="#ffffff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function main() {
  let fileContent = `export const places = [\n`;
  places.forEach((p, idx) => {
      const img = generateSVG(p.name);
      fileContent += `  { id: "${p.id}", name: "${p.name.replace(/"/g, '\\"')}", city: "${p.city}", description: "${p.description.replace(/"/g, '\\"')}", category: "${p.category}", rating: ${p.rating}, lat: ${p.lat}, lng: ${p.lng}, image: "${img}" }${idx === places.length -1 ? '' : ','}\n`;
  });
  fileContent += `];\n\n`;
  fileContent += `export const categories = [\n  "Culture", "Nature", "Sights", "Explore", "History"\n];\n`;
  
  fs.writeFileSync(filePath, fileContent);
  console.log("Reverted places back to inline SVG text boxes! 100% offline proof!");
}
main();
