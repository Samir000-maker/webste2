import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, basename, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

const FRONTEND_JS = [
  'app.js', 'chat.js', 'call.js', 'mood.js', 'index.js',
  'pwa-install.js', 'social-club.js', 'matchmaking.js',
  'navigation-guard.js', 'state-manager.js', 'profile-cache.js',
  'chat-integration.js', 'discovery-integration.js',
];

const API_BRIDGE_FILES = [
  'api/client.js', 'api/chat.js', 'api/call.js', 'api/mood.js', 'api/social-club.js',
];

const HTML_FILES = [
  'index.html', 'chat.html', 'call.html', 'mood.html', 'discovery.html',
  'login.html', 'signup.html', 'username.html', 'profile-picture.html',
];

const STATIC_ASSETS = [
  'global.css', 'fluid-bg.css', 'sw.js', 'manifest.webmanifest',
  'join_room_sound.mp3', 'sitemap.xml',
];

function walkDir(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, base));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const { default: obfuscator } = await import('javascript-obfuscator');

  // Ensure dist structure
  for (const d of ['js', 'html', 'assets']) {
    const p = resolve(DIST, d);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
  }

  const OBFUSCATE_OPTS = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'mangled',
    renameGlobals: false,
    selfDefending: false,
    sourceMap: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    target: 'browser',
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  };

  // ── 1. Obfuscate JS files ──
  const allJs = [
    ...FRONTEND_JS,
    ...API_BRIDGE_FILES,
  ];

  for (const relPath of allJs) {
    const inputPath = resolve(ROOT, relPath);
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  Skipping ${relPath} (not found)`);
      continue;
    }

    const code = readFileSync(inputPath, 'utf-8');
    console.log(`🔐 Obfuscating ${relPath} (${code.length} bytes)...`);

    const result = obfuscator.obfuscate(code, OBFUSCATE_OPTS);

    const outputPath = resolve(DIST, 'js', relPath);
    const outDir = dirname(outputPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    writeFileSync(outputPath, result.getObfuscatedCode(), 'utf-8');
    const obfSize = Buffer.byteLength(result.getObfuscatedCode(), 'utf-8');
    const pct = ((1 - obfSize / code.length) * 100).toFixed(1);
    console.log(`   → ${outputPath} (${obfSize} bytes, ${pct}% smaller)`);
  }

  // ── 2. Update HTML files ──
  for (const file of HTML_FILES) {
    const inputPath = resolve(ROOT, file);
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  Skipping ${file} (not found)`);
      continue;
    }

    let html = readFileSync(inputPath, 'utf-8');

    // Rewrite script refs from root to dist/js/
    for (const jsFile of [...FRONTEND_JS]) {
      const origRef = `src="${jsFile}"`;
      const newRef = `src="dist/js/${jsFile}"`;
      if (existsSync(resolve(DIST, 'js', jsFile)) && html.includes(origRef)) {
        html = html.replaceAll(origRef, newRef);
      }
    }

    // Rewrite api/ script refs (import maps or direct script tags)
    for (const bridgeFile of API_BRIDGE_FILES) {
      const origRef = `src="${bridgeFile}"`;
      const newRef = `src="dist/js/${bridgeFile}"`;
      if (existsSync(resolve(DIST, 'js', bridgeFile)) && html.includes(origRef)) {
        html = html.replaceAll(origRef, newRef);
      }
    }

    const outputPath = resolve(DIST, 'html', file);
    writeFileSync(outputPath, html, 'utf-8');
    console.log(`   ✏️  Processed ${file} → ${outputPath}`);
  }

  // ── 3. Copy static assets ──
  for (const asset of STATIC_ASSETS) {
    const src = resolve(ROOT, asset);
    if (!existsSync(src)) {
      console.warn(`⚠️  Skipping asset ${asset} (not found)`);
      continue;
    }
    const dest = resolve(DIST, 'assets', asset);
    const destDir = dirname(dest);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    cpSync(src, dest);
    console.log(`   📦 Copied ${asset} → ${dest}`);
  }

  // ── 4. Copy env-config.js (scrubbed for public consumption) ──
  const envConfigSrc = resolve(ROOT, 'env-config.js');
  if (existsSync(envConfigSrc)) {
    const envConfigDest = resolve(DIST, 'js', 'env-config.js');
    const envDir = dirname(envConfigDest);
    if (!existsSync(envDir)) mkdirSync(envDir, { recursive: true });
    cpSync(envConfigSrc, envConfigDest);
    console.log(`   📦 Copied env-config.js (public config only)`);
  }

  console.log(`\n✅ Build complete. Deploy the 'dist/' folder to any static host.`);
  console.log(`   Point your server at dist/html/ for the web root.`);
}

main().catch(console.error);
