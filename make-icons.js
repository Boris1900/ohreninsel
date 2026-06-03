const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, 'icon-1024.png');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
// Hintergrundfarbe = Himmel-Türkis des Insel-Icons (Fallback, vom randfüllenden Motiv eh verdeckt)
const bg = { r: 87, g: 203, b: 204 };

const densities = [
  { name: 'mipmap-mdpi',    size: 48,  fgSize: 108 },
  { name: 'mipmap-hdpi',    size: 72,  fgSize: 162 },
  { name: 'mipmap-xhdpi',   size: 96,  fgSize: 216 },
  { name: 'mipmap-xxhdpi',  size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function makeSquare(size) {
  return sharp(src)
    .resize(size, size, { fit: 'contain', background: { ...bg, alpha: 1 } })
    .flatten({ background: bg })
    .png()
    .toBuffer();
}

async function makeRound(size) {
  const img = await makeSquare(size);
  const r = size / 2;
  const mask = Buffer.from(
    `<svg><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
  return sharp(img)
    .composite([{ input: mask, blend: 'dest-in' }])
    .flatten({ background: bg })
    .png()
    .toBuffer();
}

// Vordergrund randfüllend: das ganze Insel-Motiv füllt die adaptive-icon-Leinwand.
// Android maskiert selbst zu Kreis/Squircle (wie iOS), das zentrale Motiv bleibt,
// nur die äußeren Himmel/Wasser-Ränder werden je nach Launcher-Form beschnitten.
async function makeForeground(fgSize) {
  return makeSquare(fgSize);
}

async function run() {
  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    fs.mkdirSync(dir, { recursive: true });

    const square = await makeSquare(d.size);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), square);

    const round = await makeRound(d.size);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), round);

    const fg = await makeForeground(d.fgSize);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fg);

    console.log(`${d.name}: ${d.size}px ok`);
  }
  console.log('Alle Icons generiert.');
}

run().catch(err => console.error(err));
