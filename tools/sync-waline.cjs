// Keep pinned browser assets in the repository: GitHub Pages needs no npm build.
const fs = require('node:fs');
const path = require('node:path');
const packagePath = require.resolve('@waline/client/package.json');
const source = path.dirname(packagePath);
const destination = path.resolve(__dirname, '../assets/vendor/waline');
fs.mkdirSync(destination, { recursive: true });
for (const file of ['waline.js', 'waline.css']) {
  const content = fs.readFileSync(path.join(source, 'dist', file), 'utf8')
    .replace(/\/\/[#@] sourceMappingURL=.*$/gm, '')
    .replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
  fs.writeFileSync(path.join(destination, file), content);
}
console.log(`Waline ${JSON.parse(fs.readFileSync(packagePath, 'utf8')).version}: browser assets synchronized.`);
