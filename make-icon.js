const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'Icon_Insel_0.1.png');
const out = path.join(__dirname, 'icon-1024.png');

async function run() {
  await sharp(src)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 11, g: 26, b: 11, alpha: 1 }
    })
    .flatten({ background: { r: 11, g: 26, b: 11 } })
    .png()
    .toFile(out);
  console.log('icon-1024.png erstellt');
}

run().catch(err => console.error(err));
