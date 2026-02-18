const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.js');
const srcRoot = path.join(__dirname, '..', 'src');

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

const content = readFile(appPath);
if (!content) {
  console.error('Could not read src/App.js');
  process.exit(1);
}

const importRegex = /import\s+([\s\S]+?)\s+from\s+['"](.+?)['"];?/g;
const imports = [];
let m;
while ((m = importRegex.exec(content))) {
  const spec = m[1].trim();
  const from = m[2];
  // Skip node modules and css
  if (from.startsWith('.') ) {
    imports.push({ spec, from });
  }
}

console.log('Found local imports in App.js:');
imports.forEach((imp) => {
  // Resolve relative to src/App.js
  const fromPath = imp.from.replace(/^\.\//, '');
  const resolved = path.join(srcRoot, fromPath);
  const candidates = [resolved + '.js', path.join(resolved, 'index.js')];
  const file = candidates.find((c) => fs.existsSync(c));
  if (!file) {
    console.log(` - ${imp.from} -> NOT FOUND`);
    return;
  }
  const text = readFile(file);
  const hasDefault = /export\s+default\s+/m.test(text);
  console.log(` - ${imp.from} -> ${file} : default export? ${hasDefault}`);
});
