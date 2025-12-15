#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.js', '.ts', '.jsx', '.tsx', '.css', '.md', '.json', '.html']);
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'out']);

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    if (ignoreDirs.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walk(full));
    else if (exts.has(path.extname(name))) res.push(full);
  }
  return res;
}

const files = walk(root);
let found = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const col = line.indexOf('...');
    if (col !== -1) {
      console.log(`${f}:${idx + 1}:${col + 1}: ${line.trim()}`);
      found++;
    }
  });
}

if (found === 0) {
  console.log('No literal `...` occurrences found.');
  process.exit(0);
} else {
  console.log(`Found ${found} occurrences of literal '...' across ${files.length} files.`);
  process.exit(1);
}
