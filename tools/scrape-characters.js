// Run with: node tools/scrape-characters.js
// Requires: npm install cheerio

const fs = require('fs');
const path = require('path');

async function scrape() {
  let cheerio;
  try {
    cheerio = require('cheerio');
  } catch {
    console.error('Install cheerio first: npm install cheerio');
    process.exit(1);
  }

  console.log('Fetching characters from dblegends.net...');
  const res = await fetch('https://dblegends.net/characters');
  const html = await res.text();
  const $ = cheerio.load(html);

  const characters = [];

  $('a.chara-list').each((i, el) => {
    const $el = $(el);
    const id = parseInt($el.attr('href')?.match(/character\/(\d+)/)?.[1] || i);
    const name = $el.attr('data-charaname') || 'Unknown';
    const formName = $el.attr('data-charaformname') || '';
    const element = $el.attr('data-element') || '';
    const rarity = $el.attr('data-rarity') || '';
    const zenkai = $el.attr('data-zenkai') === '1';
    const lf = $el.attr('data-lf') === '1';
    const tags = ($el.attr('data-tags') || '').trim();

    // Get image src
    const img = $el.find('img').first();
    let image = img.attr('src') || img.attr('data-src') || '';
    if (image && !image.startsWith('http')) {
      image = 'https://dblegends.net' + image;
    }

    characters.push({
      id,
      name,
      formName,
      element,
      rarity,
      zenkai,
      lf,
      tags,
      image
    });
  });

  console.log(`Found ${characters.length} characters`);

  const outPath = path.join(__dirname, '..', 'data', 'characters.json');
  fs.writeFileSync(outPath, JSON.stringify(characters, null, 2));
  console.log(`Saved to ${outPath}`);
}

scrape().catch(err => {
  console.error('Scrape failed:', err.message);
  process.exit(1);
});
