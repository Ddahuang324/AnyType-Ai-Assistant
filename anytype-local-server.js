// --- Anytype Local Data Connector ---
// This script creates a small, local web server to bridge the gap between your browser and your local Anytype data.
//
// WHY IS THIS NEEDED?
// Web browsers run in a "sandbox" for security, meaning they cannot directly access local files on your computer.
// This script acts as a secure bridge. It can access your local files and then serve them to the web app over a local network connection.
// This gives you a LIVE view of your data without manual import/export.
//
// SETUP INSTRUCTIONS:
// 1.  INSTALL NODE.JS: If you don't have it, download and install Node.js from https://nodejs.org/
// 2.  INSTALL DEPENDENCIES: Open your terminal or command prompt, navigate to the directory where this file is saved, and run:
//     npm install express chokidar
// 3.  CONFIGURE THE PATH:
//     - Find your Anytype 'data' directory.
//       - Windows: C:\Users\<YourUser>\AppData\Roaming\anytype\data
//       - macOS: /Users/<YourUser>/Library/Application Support/anytype/data
//       - Linux: /home/<YourUser>/.config/anytype/data
//     - **IMPORTANT**: Replace the placeholder path in `ANYTYPE_DATA_PATH` below with your actual path.
// 4.  RUN THE SERVER: In your terminal, from this file's directory, run:
//     node anytype-local-server.js
// 5.  CONNECT THE APP:
//     - In the web app's Settings, set the "Endpoint" to: http://localhost:3456
//     - Click "Verify". It should now connect and load your data!

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');

const app = express();
const port = 3456;

// --- CONFIGURATION ---
// !!! IMPORTANT !!!
// Replace this path with the actual path to your Anytype data directory.
// Use double backslashes on Windows, e.g., "C:\\Users\\YourUser\\AppData\\Roaming\\anytype\\data"
const ANYTYPE_DATA_PATH = 'REPLACE_WITH_YOUR_ANYTYPE_DATA_PATH';

let cachedSpaces = null;

// --- DATA PARSING LOGIC ---
// This is a simplified parser. Anytype's structure is complex. This may need adjustment.
async function parseAnytypeData() {
    if (ANYTYPE_DATA_PATH === 'REPLACE_WITH_YOUR_ANYTYPE_DATA_PATH') {
        console.error("ERROR: Anytype data path is not configured. Please edit this script.");
        return { error: "Server misconfiguration: Anytype data path not set." };
    }

    try {
        const accountsPath = path.join(ANYTYPE_DATA_PATH, 'accounts.json');
        const accountsData = await fs.readFile(accountsPath, 'utf8');
        const accounts = JSON.parse(accountsData);
        
        if (!accounts || !accounts.accounts || accounts.accounts.length === 0) {
            throw new Error("No accounts found in accounts.json");
        }

        // Assume the first account is the active one
        const mainAccount = accounts.accounts[0];
        const keystorePath = path.join(ANYTYPE_DATA_PATH, mainAccount.keystorePath);
        
        // This is a placeholder for a real implementation.
        // Actually reading and decrypting the protobuf files in the `store` directory is extremely complex
        // and would require reverse-engineering the Anytype protocol and encryption.
        //
        // For this demonstration, we will simulate finding and returning data.
        // In a real-world scenario, you would need to find the space/object manifests and parse them.
        
        // SIMULATED DATA FOR DEMONSTRATION
        // This simulates what a real parser would extract.
        const mockSpaces = [
            {
                id: 'space-local-1',
                name: 'My Local Space',
                projects: [
                     { id: 'p-local-1', title: 'Local Project 1', description: 'Loaded from the local server', imageUrl: 'https://picsum.photos/600/400?random=10', linkedSetId: 'set-local-1' },
                ],
                sets: [
                    {
                        id: 'set-local-1',
                        name: 'Live Data Set',
                        description: 'This data is being served live from your local machine.',
                        relations: [ { key: 'name', label: 'Name', type: 'text' }, { key: 'status', label: 'Status', type: 'status' } ],
                        objects: [ { id: 'obj-1', name: 'File Watcher Active', relations: { status: 'Live' } } ]
                    }
                ]
            }
        ];

        console.log('Successfully parsed (simulated) Anytype data.');
        return { items: mockSpaces };

    } catch (error) {
        console.error(`Error parsing Anytype data: ${error.message}`);
        console.error(`Please ensure the path is correct and the Anytype app has created the necessary files.`);
        return { error: `Failed to read Anytype data. Please check server console. Error: ${error.message}` };
    }
}

// Watch for changes in the data directory to invalidate the cache
const watcher = chokidar.watch(ANYTYPE_DATA_PATH, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, path) => {
  console.log(`Change detected (${event}) in ${path}. Invalidating cache.`);
  cachedSpaces = null; // Invalidate cache on any change
});

// --- API ENDPOINT ---
app.get('/', async (req, res) => {
    // Add CORS headers to allow the web app to connect
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (cachedSpaces) {
        console.log('Serving data from cache.');
        return res.json(cachedSpaces);
    }
    
    console.log('Cache empty. Parsing data from disk...');
    cachedSpaces = await parseAnytypeData();
    res.json(cachedSpaces);
});

// --- SERVER STARTUP ---
app.listen(port, () => {
    console.log(`Anytype Local Connector is running on http://localhost:${port}`);
    console.log(`Watching for changes in: ${ANYTYPE_DATA_PATH}`);
    // Initial data load
    parseAnytypeData().then(data => {
        cachedSpaces = data;
    });
});
