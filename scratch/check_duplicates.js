const fs = require('fs');
const path = require('path');

const icons = JSON.parse(fs.readFileSync('src/data/icons.json', 'utf8'));
const slugs = icons.map(icon => icon.slug);
const uniqueSlugs = new Set();
const duplicates = [];

for (const slug of slugs) {
    if (uniqueSlugs.has(slug)) {
        duplicates.push(slug);
    } else {
        uniqueSlugs.add(slug);
    }
}

if (duplicates.length > 0) {
    console.log('Duplicate slugs found:', duplicates);
} else {
    console.log('No duplicate slugs found.');
}
