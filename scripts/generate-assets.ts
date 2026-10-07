// Jednorazowy generator ikon PWA: ręczny zapis PNG, bez dodatkowych paczek
// npm typu sharp/canvas.
import { writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

type Rgb = [number, number, number]

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
// Kolor marki aplikacji (#2563eb) - jednolite tło ikony.
const BRAND: Rgb = [37, 99, 235]
const ICON_SIZES = [192, 512]

function uint32(value: number): Buffer {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(value >>> 0, 0)
  return buf
}

// Chunk PNG: długość danych, typ + dane, CRC z typu i danych.
function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  return Buffer.concat([uint32(data.length), body, uint32(crc32(body))])
}

function encodePng(width: number, height: number, pixelAt: (x: number, y: number) => Rgb): Buffer {
  // Każdy wiersz: bajt filtra (0 = None) + 3 bajty na piksel.
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let offset = 0
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelAt(x, y)
      raw[offset++] = r
      raw[offset++] = g
      raw[offset++] = b
    }
  }
  // IHDR: wymiary, 8 bitów na kanał, typ koloru 2 (RGB); kompresja, filtr
  // i przeplot zostają zerami.
  const ihdr = Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 2, 0, 0, 0])])
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

for (const size of ICON_SIZES) {
  writeFileSync(`public/icons/icon-${size}.png`, encodePng(size, size, () => BRAND))
}

console.log('Wygenerowano ikony PWA.')
