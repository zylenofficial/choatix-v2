const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function convert() {
  const src = 'C:\\Users\\evald\\Downloads\\phantomo.png';
  const out = path.join(__dirname, 'assets', 'icon.ico');
  
  const img = await loadImage(src);
  const sizes = [256, 48, 32, 16];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const buf = canvas.toBuffer('image/png');
    pngBuffers.push({ size, buf });
  }
  
  const numImages = pngBuffers.length;
  const headerSize = 6 + numImages * 16;
  let dataOffset = headerSize;
  const dirEntries = [];
  
  for (const { size, buf } of pngBuffers) {
    dirEntries.push({ width: size >= 256 ? 0 : size, height: size >= 256 ? 0 : size, size: buf.length, offset: dataOffset });
    dataOffset += buf.length;
  }
  
  const totalSize = headerSize + pngBuffers.reduce((s, p) => s + p.buf.length, 0);
  const result = Buffer.alloc(totalSize);
  result.writeUInt16LE(0, 0);
  result.writeUInt16LE(1, 2);
  result.writeUInt16LE(numImages, 4);
  
  let pos = 6;
  for (const e of dirEntries) {
    result.writeUInt8(e.width, pos++);
    result.writeUInt8(e.height, pos++);
    result.writeUInt8(0, pos++);
    result.writeUInt8(0, pos++);
    result.writeUInt16LE(1, pos); pos += 2;
    result.writeUInt16LE(32, pos); pos += 2;
    result.writeUInt32LE(e.size, pos); pos += 4;
    result.writeUInt32LE(e.offset, pos); pos += 4;
  }
  
  for (const { buf } of pngBuffers) {
    buf.copy(result, pos);
    pos += buf.length;
  }
  
  fs.writeFileSync(out, result);
  console.log('icon.ico created:', result.length, 'bytes');
}

convert().catch(console.error);
