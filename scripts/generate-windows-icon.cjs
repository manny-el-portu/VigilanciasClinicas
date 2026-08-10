const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function resizePNG(srcPng, targetWidth, targetHeight) {
  const dstPng = new PNG({ width: targetWidth, height: targetHeight });
  const srcW = srcPng.width;
  const srcH = srcPng.height;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // Area box sampling for crisp downscaling
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
  const sourcePath = path.join(__dirname, '../src-tauri/icons/128x128.png');
  const targetPath = path.join(__dirname, '../src-tauri/icons/icon.ico');

  const baseImage = PNG.sync.read(fs.readFileSync(sourcePath));
  const sizes = [16, 24, 32, 48, 64, 128];

  const pngs = sizes.map(sz => resizePNG(baseImage, sz, sz));
  const icoBuffer = createUncompressedIco(pngs);

  fs.writeFileSync(targetPath, icoBuffer);
  console.log(`Generated uncompressed Windows icon.ico (${icoBuffer.length} bytes) with sizes: ${sizes.join(', ')}`);
}

generate();
