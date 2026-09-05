const fs = require('fs');
const path = require('path');

const buildDir = path.join(process.cwd(), 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create an uncompressed 32-bit BMP DIB ICO format that NSIS and Windows Explorer 100% support
function createBmpIcoEntry(size) {
  const width = size;
  const height = size;
  
  // BITMAPINFOHEADER (40 bytes)
  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0);                 // biSize
  bih.writeInt32LE(width, 4);               // biWidth
  bih.writeInt32LE(height * 2, 8);          // biHeight (doubled for ICO mask)
  bih.writeUInt16LE(1, 12);                 // biPlanes
  bih.writeUInt16LE(32, 14);                // biBitCount (32-bit RGBA)
  bih.writeUInt32LE(0, 16);                 // biCompression (BI_RGB)
  bih.writeUInt32LE(width * height * 4, 20); // biSizeImage

  // Pixel data (BGRA, bottom-to-top)
  const pixelData = Buffer.alloc(width * height * 4);
  const half = size / 2;
  const radius = half - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - half;
      const dy = y - half;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        const factor = dist / radius;
        // Cyan-to-indigo gradient
        pixelData[idx] = Math.floor(240 - 10 * factor);     // Blue
        pixelData[idx + 1] = Math.floor(182 - 60 * factor); // Green
        pixelData[idx + 2] = Math.floor(6 + 140 * factor);  // Red
        pixelData[idx + 3] = 255;                          // Alpha
      } else {
        pixelData[idx] = 0;
        pixelData[idx + 1] = 0;
        pixelData[idx + 2] = 0;
        pixelData[idx + 3] = 0;
      }
    }
  }

  // 1-bit AND mask
  const maskRowBytes = Math.ceil(width / 32) * 4;
  const mask = Buffer.alloc(maskRowBytes * height, 0);

  const dibData = Buffer.concat([bih, pixelData, mask]);
  return {
    size,
    dibData
  };
}

function buildMultiIco() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const entries = sizes.map(createBmpIcoEntry);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // Reserved
  header.writeUInt16LE(1, 2);              // Type: ICO
  header.writeUInt16LE(entries.length, 4); // Image Count

  let offset = 6 + entries.length * 16;
  const direntries = [];
  const dibBuffers = [];

  for (const entry of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = entry.size === 256 ? 0 : entry.size; // Width
    dir[1] = entry.size === 256 ? 0 : entry.size; // Height
    dir[2] = 0;                                  // Color count
    dir[3] = 0;                                  // Reserved
    dir.writeUInt16LE(1, 4);                     // Color planes
    dir.writeUInt16LE(32, 6);                    // Bits per pixel
    dir.writeUInt32LE(entry.dibData.length, 8);  // Data size
    dir.writeUInt32LE(offset, 12);               // Data offset

    direntries.push(dir);
    dibBuffers.push(entry.dibData);
    offset += entry.dibData.length;
  }

  const fullIco = Buffer.concat([header, ...direntries, ...dibBuffers]);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), fullIco);
  console.log(`[IconGenerator] Generated multi-resolution BMP ICO (16, 32, 48, 64, 128, 256 px): ${fullIco.length} bytes`);
}

buildMultiIco();
