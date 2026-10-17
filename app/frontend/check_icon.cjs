const fs = require('fs');

const p = 'frontend/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png';
const buf = fs.readFileSync(p);

// Read PNG width & height (IHDR chunk is at offset 8 + 4 bytes length + 4 bytes type)
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log('PNG dimensions:', width, 'x', height);
