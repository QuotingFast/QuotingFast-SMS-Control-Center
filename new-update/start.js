// IONOS Node.js startup script
const { spawn } = require('child_process');
const path = require('path');

// Start the main application
const app = spawn('node', [path.join(__dirname, 'src/app.js')]);

app.stdout.on('data', (data) => {
  console.log(`[APP] ${data}`);
});

app.stderr.on('data', (data) => {
  console.error(`[APP ERROR] ${data}`);
});

app.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
});
