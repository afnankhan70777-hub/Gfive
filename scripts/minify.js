const fs = require('fs');

// Read index.html
let html = fs.readFileSync('dist8/index.html', 'utf8');

// Replace all individual chunk references with single minified files
html = html.replace(/<script src="[^"]*chunks[^"]*\.js"[^>]*><\/script>/g, '');
html = html.replace(/<link rel="stylesheet" href="[^"]*chunks[^"]*\.css"[^>]*>/g, '');

// Add single minified files before closing </head>
const minFiles = '<link rel="stylesheet" href="app.min.css"><script src="app.min.js" defer></script>';
html = html.replace('</head>', minFiles + '</head>');

// Minify HTML
const minHtml = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .replace(/\n\s*/g, '');

fs.writeFileSync('dist8/index.min.html', minHtml);
console.log('Minified HTML created');
console.log('Original size:', html.length, 'bytes');
console.log('Minified size:', minHtml.length, 'bytes');
