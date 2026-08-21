// Kepler dağ logosunu (public/kepler-mountain-logo.svg) Windows uygulama
// ikonuna (build/icon.ico) dönüştürür. Logo geniş bir dikdörtgen (1021x457)
// olduğu için kare bir tuval üzerine, beyaz zemine ortalanarak yerleştirilir.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.join(__dirname, '../public/kepler-mountain-logo.svg')
const outDir = path.join(__dirname, '../build')
const sizes = [16, 32, 48, 64, 128, 256]

async function main() {
  mkdirSync(outDir, { recursive: true })
  const svg = readFileSync(svgPath)

  const pngBuffers = []
  for (const size of sizes) {
    const logoSize = Math.round(size * 0.8)
    const logo = await sharp(svg).resize(logoSize, logoSize, { fit: 'inside' }).png().toBuffer()

    const canvas = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toBuffer()

    pngBuffers.push(canvas)
    if (size === 256) {
      writeFileSync(path.join(outDir, 'icon.png'), canvas)
    }
  }

  const icoBuffer = await pngToIco(pngBuffers)
  writeFileSync(path.join(outDir, 'icon.ico'), icoBuffer)
  console.log('İkon oluşturuldu: build/icon.ico')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
