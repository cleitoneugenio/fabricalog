import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const RES = 'android/app/src/main/res';

const SIZES = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

function iconSvg(size, round) {
  const r = round ? size / 2 : size * 0.22;
  const cx = size / 2;
  // Flame path scaled to size (original viewBox 64)
  const s = size / 64;
  const flame = `M${32*s} ${10*s}C${32*s} ${10*s} ${20*s} ${20*s} ${20*s} ${32*s}C${20*s} ${39.7*s} ${25.4*s} ${46*s} ${32*s} ${46*s}C${38.6*s} ${46*s} ${44*s} ${39.7*s} ${44*s} ${32*s}C${44*s} ${28.5*s} ${42.4*s} ${25.6*s} ${40.5*s} ${23.5*s}C${40.5*s} ${23.5*s} ${39.2*s} ${29*s} ${36.8*s} ${30.5*s}C${36.8*s} ${27*s} ${35.5*s} ${19.5*s} ${32*s} ${10*s}Z`;
  const dotCx = 32 * s;
  const dotCy = 39 * s;
  const dotR  = 4.5 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#EB5927"/>
  <path d="${flame}" fill="white" opacity="0.95"/>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#EB5927" opacity="0.55"/>
</svg>`;
}

async function generate() {
  for (const { folder, size } of SIZES) {
    const dir = join(RES, folder);

    // Square icon
    await sharp(Buffer.from(iconSvg(size, false)))
      .png()
      .toFile(join(dir, 'ic_launcher.png'));

    // Round icon
    await sharp(Buffer.from(iconSvg(size, true)))
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'));

    console.log(`✓ ${folder} (${size}px)`);
  }

  // Foreground for adaptive icon (mipmap-anydpi-v26)
  // Use 108dp canvas with safe zone at center 72dp → 108/72 = 1.5x
  const fgSize = 108;
  const fgDir  = 'android/app/src/main/res/drawable-v24';
  await sharp(Buffer.from(iconSvg(fgSize, false)))
    .png()
    .toFile(join(fgDir, 'ic_launcher_foreground.png'));

  console.log('✓ PNGs gerados (XMLs adaptativos preservados)');

  console.log('\nDone! Rebuild the APK in Android Studio.');
}

generate().catch(e => { console.error(e); process.exit(1); });
