import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="115" fill="#2DB54E"/>
  <path d="M256 80 C256 80 368 155 368 240 C368 325 315 370 256 385 C197 370 144 325 144 240 C144 155 256 80 256 80Z" fill="none" stroke="white" stroke-width="18" stroke-linecap="round"/>
  <polyline points="210,240 235,270 302,195" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M175 340 Q256 310 337 340" stroke="white" stroke-width="12" fill="none" opacity="0.6"/>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(192,192).png().toFile('public/icon-192.png');
await sharp(buf).resize(512,512).png().toFile('public/icon-512.png');
await sharp(buf).resize(180,180).png().toFile('public/apple-touch-icon.png');

console.log('Íconos generados correctamente!');