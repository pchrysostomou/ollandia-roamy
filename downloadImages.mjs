import fs from 'fs';
import path from 'path';
import axios from 'axios';

const cities = {
  "amsterdam": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/KeizersgrachtReguliersgrachtAmsterdam.jpg/600px-KeizersgrachtReguliersgrachtAmsterdam.jpg",
  "rotterdam": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Rotterdam_Skyline_Zuid_Kop_van_Zuid_2016.jpg/600px-Rotterdam_Skyline_Zuid_Kop_van_Zuid_2016.jpg",
  "utrecht": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Oudegracht_Utrecht.jpg/600px-Oudegracht_Utrecht.jpg",
  "The_Hague": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Hofvijver_The_Hague.jpg/600px-Hofvijver_The_Hague.jpg",
  "leiden": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leiden_Galgewater.jpg/600px-Leiden_Galgewater.jpg",
  "giethoorn": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Giethoorn_-_Binnenpad_-_NL.jpg/600px-Giethoorn_-_Binnenpad_-_NL.jpg"
};

const dir = path.join(process.cwd(), 'public', 'cities');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const [city, url] of Object.entries(cities)) {
    console.log(`Downloading ${city}...`);
    try {
      const response = await axios({ 
        url, 
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      fs.writeFileSync(path.join(dir, `${city}.jpg`), response.data);
      console.log(`Saved ${city}.jpg`);
    } catch(e) {
      console.error(`Failed ${city}: ${e.message}`);
    }
  }
}

download();
