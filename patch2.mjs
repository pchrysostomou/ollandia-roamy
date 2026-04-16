import fs from 'fs';
import path from 'path';
import { places, categories } from './src/data/netherlands.js';

const filePath = path.join(process.cwd(), 'src/data/netherlands.js');

function main() {
  let fileContent = `export const places = [\n`;
  places.forEach((p, idx) => {
      // Use Picsum with seed for guaranteed valid, beautiful, unique image per place!
      const img = `https://picsum.photos/seed/${p.id}/600/400`;
      fileContent += `  { id: "${p.id}", name: "${p.name.replace(/"/g, '\\"')}", city: "${p.city}", description: "${p.description.replace(/"/g, '\\"')}", category: "${p.category}", rating: ${p.rating}, lat: ${p.lat}, lng: ${p.lng}, image: "${img}" }${idx === places.length -1 ? '' : ','}\n`;
  });
  fileContent += `];\n\n`;
  fileContent += `export const categories = [\n  "Culture", "Nature", "Sights", "Explore", "History"\n];\n`;
  
  fs.writeFileSync(filePath, fileContent);
  console.log("Fixed images with valid Picsum seeds!");
}
main();
