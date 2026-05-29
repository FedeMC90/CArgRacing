/**
 * Remueve el fondo gris sólido de imágenes PNG generadas por IA.
 * Uso: npx ts-node scripts/remove-bg.ts <input.png> [output.png]
 * Si no se especifica output, sobreescribe el archivo original.
 *
 * Tolerancia: pixeles dentro de ±40 de cada canal RGB del color de fondo
 * quedan transparentes. Ajustá TOLERANCE si corta partes del auto o deja
 * restos del fondo.
 */

import sharp from 'sharp';
import path from 'path';

const TOLERANCE = 40;

async function removeBg(inputPath: string, outputPath: string): Promise<void> {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Tomar el color de fondo desde la esquina superior izquierda
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  console.log(`Fondo detectado: rgb(${bgR}, ${bgG}, ${bgB})`);

  const pixels = new Uint8ClampedArray(data.buffer);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (
      Math.abs(r - bgR) <= TOLERANCE &&
      Math.abs(g - bgG) <= TOLERANCE &&
      Math.abs(b - bgB) <= TOLERANCE
    ) {
      pixels[i + 3] = 0; // transparente
    }
  }

  await sharp(Buffer.from(pixels.buffer), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);

  console.log(`Guardado: ${outputPath}`);
}

const [, , input, output] = process.argv;

if (!input) {
  console.error('Uso: npx ts-node scripts/remove-bg.ts <input.png> [output.png]');
  process.exit(1);
}

const resolvedInput = path.resolve(input);
const resolvedOutput = path.resolve(output ?? input);

removeBg(resolvedInput, resolvedOutput).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
