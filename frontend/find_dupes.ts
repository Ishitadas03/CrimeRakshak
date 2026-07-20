import fs from 'fs';

const content = fs.readFileSync('src/lib/translations.ts', 'utf-8');
const lines = content.split('\n');
const keys = new Set();
let count = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^\s*"([^"]+)":/);
  if (match) {
    const key = match[1];
    if (keys.has(key)) {
      console.log(`Duplicate found: "${key}" at line ${i + 1}`);
      count++;
    } else {
      keys.add(key);
    }
  }
}

if (count === 0) console.log("No duplicates found.");
