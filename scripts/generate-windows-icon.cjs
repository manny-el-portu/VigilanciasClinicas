const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

function loadSourceImage() {
  const imagesDir = path.join(__dirname, '../src/assets/images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const appIconFile = files.find(f => f.startsWith('app_icon_') && (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')));
    if (appIconFile) {
      const imgPath = path.join(imagesDir, appIconFile);
      console.log('Loading icon source image from:', imgPath);
      if (appIconFile.endsWith('.png')) {
        return PNG.sync.read(fs.readFileSync(imgPath));
      } else {
        const jpegData = fs.readFileSync(imgPath);
        const raw = jpeg.decode(jpegData, { useTolerant: true });
        const png = new PNG({ width: raw.width, height: raw.height });
        png.data = Buffer.from(raw.data);
        return png;
      }
    }
  }
  return null;
}

function resizeImage(srcPng, targetWidth, targetHeight) {
  const dstPng = new PNG({ width: targetWidth, height: targetHeight });
  const srcW = srcPng.width;
  const srcH = srcPng.height;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const x0 = Math.floor(x * srcW / targetWidth);
      const x1 = Math.min(srcW - 1, Math.floor((x + 1) * srcW / targetWidth));
      const y0 = Math.floor(y * srcH / targetHeight);
      const y1 = Math.min(srcH - 1, Math.floor((y + 1) * srcH / targetHeight));

      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let sy = y0; sy <= y1; sy++) {
        for (let sx = x0; sx <= x1; sx++) {
          const idx = (sy * srcW + sx) * 4;
          r += srcPng.data[idx];
          g += srcPng.data[idx + 1];
          b += srcPng.data[idx + 2];
          a += srcPng.data[idx + 3];
          count++;
        }
      }

      const dstIdx = (y * targetWidth + x) * 4;
      dstPng.data[dstIdx] = Math.round(r / count);
      dstPng.data[dstIdx + 1] = Math.round(g / count);
      dstPng.data[dstIdx + 2] = Math.round(b / count);
      dstPng.data[dstIdx + 3] = Math.round(a / count);
    }
  }
  return dstPng;
}

function drawFallbackIcon(width, height) {
  const png = new PNG({ width, height });
  const radius = Math.floor(width * 0.2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const nx = (x / (width - 1)) * 2 - 1;
      const ny = (y / (height - 1)) * 2 - 1;

      const cx = Math.max(0, Math.abs(x - width / 2) - (width / 2 - radius));
      const cy = Math.max(0, Math.abs(y - height / 2) - (height / 2 - radius));
      const dist = Math.sqrt(cx * cx + cy * cy);

      if (dist > radius) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      const t = (ny + 1) / 2;
      let r = Math.round(2 * (1 - t) + 15 * t);
      let g = Math.round(132 * (1 - t) + 23 * t);
      let b = Math.round(199 * (1 - t) + 42 * t);
      let a = 255;

      const isCrossVertical = Math.abs(nx) < 0.16 && Math.abs(ny) < 0.48;
      const isCrossHorizontal = Math.abs(ny) < 0.16 && Math.abs(nx) < 0.48;

      if (isCrossVertical || isCrossHorizontal) {
        r = 255;
        g = 255;
        b = 255;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  return png;
}

function createUncompressedIco(pngList) {
  const numImages = pngList.length;
  let headerSize = 6 + numImages * 16;
  let currentOffset = headerSize;

  const entries = [];
  const imageBuffers = [];

  for (let i = 0; i < numImages; i++) {
    const img = pngList[i];
    const w = img.width;
    const h = img.height;

    const bmpHeaderSize = 40;
    const xorSize = w * h * 4;
    const andRowSize = Math.ceil(w / 32) * 4;
    const andSize = andRowSize * h;
    const dataSize = bmpHeaderSize + xorSize + andSize;

    const dataBuf = Buffer.alloc(dataSize);

    // BITMAPINFOHEADER
    dataBuf.writeUInt32LE(40, 0);          // biSize
    dataBuf.writeInt32LE(w, 4);            // biWidth
    dataBuf.writeInt32LE(h * 2, 8);        // biHeight (2 * h)
    dataBuf.writeUInt16LE(1, 12);          // biPlanes
    dataBuf.writeUInt16LE(32, 14);         // biBitCount
    dataBuf.writeUInt32LE(0, 16);          // biCompression (BI_RGB)
    dataBuf.writeUInt32LE(xorSize, 20);    // biSizeImage
    dataBuf.writeInt32LE(0, 24);           // biXPelsPerMeter
    dataBuf.writeInt32LE(0, 28);           // biYPelsPerMeter
    dataBuf.writeUInt32LE(0, 32);          // biClrUsed
    dataBuf.writeUInt32LE(0, 36);          // biClrImportant

    // Pixel data: bottom-to-top BGRA
    let pos = 40;
    for (let y = h - 1; y >= 0; y--) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        dataBuf[pos] = img.data[idx + 2];     // Blue
        dataBuf[pos + 1] = img.data[idx + 1]; // Green
        dataBuf[pos + 2] = img.data[idx];     // Red
        dataBuf[pos + 3] = img.data[idx + 3]; // Alpha
        pos += 4;
      }
    }

    // AND mask (all zeros)
    dataBuf.fill(0, pos, pos + andSize);

    entries.push({
      width: w >= 256 ? 0 : w,
      height: h >= 256 ? 0 : h,
      dataSize: dataSize,
      offset: currentOffset
    });

    imageBuffers.push(dataBuf);
    currentOffset += dataSize;
  }

  const icoBuf = Buffer.alloc(currentOffset);

  // ICONDIR
  icoBuf.writeUInt16LE(0, 0);            // Reserved
  icoBuf.writeUInt16LE(1, 2);            // Type 1 = ICO
  icoBuf.writeUInt16LE(numImages, 4);    // Count

  // ICONDIRENTRY list
  for (let i = 0; i < numImages; i++) {
    const entry = entries[i];
    const offset = 6 + i * 16;
    icoBuf.writeUInt8(entry.width, offset);
    icoBuf.writeUInt8(entry.height, offset + 1);
    icoBuf.writeUInt8(0, offset + 2);        // Color count
    icoBuf.writeUInt8(0, offset + 3);        // Reserved
    icoBuf.writeUInt16LE(1, offset + 4);     // Planes
    icoBuf.writeUInt16LE(32, offset + 6);    // BitCount
    icoBuf.writeUInt32LE(entry.dataSize, offset + 8);
    icoBuf.writeUInt32LE(entry.offset, offset + 12);
  }

  // Copy Image Data
  let dataOffset = headerSize;
  for (let i = 0; i < numImages; i++) {
    imageBuffers[i].copy(icoBuf, dataOffset);
    dataOffset += imageBuffers[i].length;
  }

  return icoBuf;
}

function generate() {
  const iconsDir = path.join(__dirname, '../src-tauri/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sourcePng = loadSourceImage();
  function getIcon(w, h) {
    if (sourcePng) {
      return resizeImage(sourcePng, w, h);
    } else {
      return drawFallbackIcon(w, h);
    }
  }

  // Map of filenames to sizes
  const pngTargets = {
    '32x32.png': [32, 32],
    '64x64.png': [64, 64],
    '128x128.png': [128, 128],
    '128x128@2x.png': [256, 256],
    'icon.png': [512, 512],
    'Square30x30Logo.png': [30, 30],
    'Square44x44Logo.png': [44, 44],
    'Square71x71Logo.png': [71, 71],
    'Square89x89Logo.png': [89, 89],
    'Square107x107Logo.png': [107, 107],
    'Square142x142Logo.png': [142, 142],
    'Square150x150Logo.png': [150, 150],
    'Square284x284Logo.png': [284, 284],
    'Square310x310Logo.png': [310, 310],
    'StoreLogo.png': [50, 50]
  };

  for (const [filename, [w, h]] of Object.entries(pngTargets)) {
    const png = getIcon(w, h);
    const buf = PNG.sync.write(png);
    fs.writeFileSync(path.join(iconsDir, filename), buf);
  }
  console.log('Generated all clean PNG icon files successfully.');

  // Generate Windows .ico with uncompressed DIB images
  const icoSizes = [16, 24, 32, 48, 64, 128];
  const icoPngs = icoSizes.map(sz => getIcon(sz, sz));
  const icoBuffer = createUncompressedIco(icoPngs);

  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
  console.log(`Generated uncompressed Windows icon.ico (${icoBuffer.length} bytes) with sizes: ${icoSizes.join(', ')}`);
}

generate();
