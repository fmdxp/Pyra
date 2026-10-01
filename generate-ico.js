const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  const inputPath = path.join(__dirname, 'public', 'icon.png');
  const pngOutputPath = path.join(__dirname, 'public', 'icon_256.png');
  const icoOutputPath = path.join(__dirname, 'public', 'icon.ico');

  // Resize to 256x256 PNG first (required for ICO)
  await sharp(inputPath)
    .resize(256, 256)
    .png()
    .toFile(pngOutputPath);

  // Convert PNG to ICO
  const buf = await pngToIco(pngOutputPath);
  fs.writeFileSync(icoOutputPath, buf);

  console.log('Generated icon.ico at:', icoOutputPath);

  // Cleanup temp png
  fs.unlinkSync(pngOutputPath);
}

generateIco().catch(console.error);
