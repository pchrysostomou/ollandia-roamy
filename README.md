# The Netherlands Diaries 🇳🇱

A modern web application built with React and Vite that allows users to explore the beautiful cities and sights of the Netherlands. 

## 🚀 Features

* **City Showcases:** Explore details and stunning visuals for popular Dutch destinations including Amsterdam, Rotterdam, The Hague, Utrecht, Leiden, and Giethoorn.
* **Modern UI:** Fast and responsive user interface built with React.
* **Backend Integration:** Powered by Supabase for fast, secure, and scalable database management.
* **Automated Utilities:** Built-in Node.js scripts to easily fetch, patch, and manage image assets.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite
* **Backend/Database:** Supabase
* **Styling:** CSS
* **Scripts:** Node.js (Image fetching and patching utilities)

## 📦 Getting Started

Follow these instructions to get a local copy of the project up and running on your machine.

### Prerequisites

* Node.js (v16 or higher recommended)
* npm or yarn
* A Supabase account (for database integration)

### Installation

1. Clone the repository:
git clone https://github.com/pchrysostomou/The-Netherlands-Diaries.git
cd ollandia-roamy

2. Install dependencies:
npm install

3. Environment Variables:
Create a .env file in the root directory and add your Supabase credentials:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run the development server:
npm run dev

The application should now be running on http://localhost:5173.

## ⚙️ Utility Scripts

The project includes several utility scripts for managing image assets (located in the root directory). You can run them using Node:

* node fetchImages.mjs - Fetches required images.
* node downloadImages.mjs - Downloads images locally to the public/ folder.
* node patch_images.mjs - Patches image data.
* node test_supabase.mjs - Utility to test the Supabase connection.

## 📁 Project Structure

* /src: Contains the React components, CSS, and main application logic.
  * /src/data: Contains local data files (e.g., netherlands.js).
* /public: Static assets including favicons and downloaded city images.
* supabaseClient.js / supabase.js: Supabase configuration and initialization files.
