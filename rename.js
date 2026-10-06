const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replacements
    content = content.replace(/FoodExpress/g, 'SwiftBites');
    content = content.replace(/foodexpress/g, 'swiftbites');
    content = content.replace(/FOODEXPRESS/g, 'SWIFBITES');

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'rename.js') continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      // Only process text files (js, jsx, json, md, html, css)
      const ext = path.extname(fullPath).toLowerCase();
      if (['.js', '.jsx', '.json', '.md', '.html', '.css', '.env', '.txt'].includes(ext) || file === '.env') {
        replaceInFile(fullPath);
      }
    }
  }
}

walkDir(__dirname);
console.log("Renaming complete.");
