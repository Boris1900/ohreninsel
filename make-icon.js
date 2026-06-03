const sharp = require('sharp');
const path = require('path');

// Quelle: neues Insel-Icon (Palme + Ohr-Sonne)
const src = path.join(__dirname, 'Icon_ohreninsel_Insel_0.3.png');
const out = path.join(__dirname, 'icon-1024.png');

// Das Quellbild hat einen weißen Rand + abgerundete Ecken eingebrannt.
// Auf iOS würde das einen weißen Rand ums Icon erzeugen (iOS rundet selbst).
// Darum die Ecken + Rand zentral wegschneiden → randvolles, opakes Quadrat.
// iOS rundet dann sauber, kein weißer Rand. (Eck-Eindringtiefe gemessen: ~106px)
const CROP = 114;

async function run() {
  const meta = await sharp(src).metadata();
  await sharp(src)
    .extract({
      left: CROP, top: CROP,
      width: meta.width - 2 * CROP,
      height: meta.height - 2 * CROP
    })
    .resize(1024, 1024)
    .removeAlpha()
    .png()
    .toFile(out);
  console.log('icon-1024.png erstellt (randvoll, ohne weißen Rand – iOS-tauglich)');
}

run().catch(err => console.error(err));
