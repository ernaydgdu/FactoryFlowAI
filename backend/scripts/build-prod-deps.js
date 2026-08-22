// Electron paketlemesi için sadece production bağımlılıklarını içeren,
// devDependencies'ten (jest, typescript, eslint, ts-node, @nestjs/cli vb.)
// arındırılmış ayrı bir node_modules üretir. Normal backend/node_modules'e
// (geliştirme ve testler için gerekli) dokunmaz - tamamen izole bir
// backend/deploy/ klasöründe çalışır.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');

const root = path.join(__dirname, '..');
// Masaüstü altındaki klasörler Windows Search tarafından indekslenip
// kilitlenebiliyor (electron-builder çıktısında da aynı sorun yaşandı) -
// bu yüzden prod-only node_modules, indekslenmeyen bir konumda üretiliyor.
const deployDir = path.join(os.homedir(), 'AppData', 'Local', 'FactoryFlowAI-backend-deploy');

console.log(`Prod-only node_modules hazırlanıyor: ${deployDir}`);

fs.rmSync(deployDir, { recursive: true, force: true });
fs.mkdirSync(deployDir, { recursive: true });

fs.copyFileSync(
  path.join(root, 'package.json'),
  path.join(deployDir, 'package.json'),
);
fs.copyFileSync(
  path.join(root, 'package-lock.json'),
  path.join(deployDir, 'package-lock.json'),
);

execSync('npm ci --omit=dev', { cwd: deployDir, stdio: 'inherit' });

console.log(`Tamamlandı: ${deployDir}\\node_modules (sadece production bağımlılıkları)`);
