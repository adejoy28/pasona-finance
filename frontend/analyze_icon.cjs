const fs = require('fs');
const zlib = require('zlib');

// Read PNG and parse IDAT
const buf = fs.readFileSync('android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

let pos = 8;
const chunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.slice(pos + 4, pos + 8).toString('ascii');
  if (type === 'IDAT') {
    chunks.push(buf.slice(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}

const idat = Buffer.concat(chunks);
const raw = zlib.inflateSync(idat);

// raw is scanlines: 1 filter byte + width * 4 bytes (RGBA)
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let y = 0; y < height; y++) {
  const lineStart = y * (1 + width * 4);
  for (let x = 0; x < width; x++) {
    const a = raw[lineStart + 1 + x * 4 + 3];
    if (a > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Image dimensions:', width, 'x', height);
console.log('Bounding box:', { minX, maxX, minY, maxY });
console.log('Content width:', maxX - minX + 1, 'Content height:', maxY - minY + 1);
console.log('Horizontal center of content:', (minX + maxX) / 2, 'vs canvas center:', width / 2);
console.log('Vertical center of content:', (minY + maxY) / 2, 'vs canvas center:', height / 2);
