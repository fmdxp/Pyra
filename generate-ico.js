const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  const inputPath = path.join(__dirname, 'public', 'icon.png');
  const icoOutputPath = path.join(__dirname, 'public', 'icon.ico');

  // Generate multiple sizes for ICO
  const sizes = [16, 32, 48, 64, 128, 256];
  const buffers = [];

  for (const size of sizes) {
    const buf = await sharp(inputPath)
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push({ size, buf });
  }

  // Build ICO file manually
  // ICO Header: 6 bytes
  // ICO Dir Entry: 16 bytes per image
  // Then image data
  const numImages = buffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  let dataOffset = headerSize + dirSize;

  // ICO Header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  // Dir entries
  const dirEntries = [];
  const offsets = [];
  for (const { size, buf } of buffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size < 256 ? size : 0, 0); // Width (0 means 256)
    entry.writeUInt8(size < 256 ? size : 0, 1); // Height (0 means 256)
    entry.writeUInt8(0, 2);   // Color palette
    entry.writeUInt8(0, 3);   // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image data size
    entry.writeUInt32LE(dataOffset, 12); // Offset to image data
    dirEntries.push(entry);
    offsets.push(dataOffset);
    dataOffset += buf.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...dirEntries,
    ...buffers.map(b => b.buf),
  ]);

  fs.writeFileSync(icoOutputPath, icoBuffer);
  console.log('Generated icon.ico at:', icoOutputPath);

  // Also save a clean 256x256 PNG for electron-builder
  await sharp(inputPath)
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon_256.png'));
  console.log('Generated icon_256.png');
}

generateIco().catch(console.error);
