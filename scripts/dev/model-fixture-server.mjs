import { createServer } from 'http';
import { createPrivateKey } from 'crypto';
import { sign } from 'crypto';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Raw DEV keys (hex)
const PUB_RAW_HEX = 'e820a2e5b3c8030ed980bee4a64246361516b058f484e15170f4de4bd6f5b93f';

// Load private key securely
let PRIV_RAW_HEX = process.env.DEV_PRIVATE_KEY_HEX;
if (!PRIV_RAW_HEX) {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DEV_PRIVATE_KEY_HEX=(.*)$/m);
    if (match) PRIV_RAW_HEX = match[1].trim();
  }
}

if (!PRIV_RAW_HEX) {
  console.error('[DEV FIXTURE ERROR] Missing DEV_PRIVATE_KEY_HEX in environment or .env.local');
  process.exit(1);
}

const PORT = 3142;

const DER_PREFIX = '302e020100300506032b657004220420';
const privKey = createPrivateKey({
  key: Buffer.concat([Buffer.from(DER_PREFIX, 'hex'), Buffer.from(PRIV_RAW_HEX, 'hex')]),
  format: 'der',
  type: 'pkcs8'
});

const baseManifest = {
  model_id: "dev-sidecar-model",
  version: "1.0.0",
  filename: "dev-model.gguf",
  size: 15,
  sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9", // SHA-256 for "hello dev world"
  download_url: `http://127.0.0.1:${PORT}/dev-model.gguf`,
  format: "GGUF",
  context: 4096,
  license: "MIT",
  minimum_app_version: "0.6.1"
};

const payload = JSON.stringify(baseManifest);
const signatureBuffer = sign(null, Buffer.from(payload), privKey);
const signatureBase64 = signatureBuffer.toString('base64');

const signedManifest = {
  ...baseManifest,
  signature: signatureBase64
};

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(signedManifest, null, 2));
    console.log(`[DEV FIXTURE] Served manifest.json`);
  } else if (req.url === '/dev-model.gguf') {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': '15'
    });
    res.end('hello dev world');
    console.log(`[DEV FIXTURE] Served dev-model.gguf`);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    console.log(`[DEV FIXTURE] 404: ${req.url}`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[DEV FIXTURE] Server running at http://127.0.0.1:${PORT}/`);
  console.log(`[DEV FIXTURE] DEV_PUBLIC_KEY_HEX: ${PUB_RAW_HEX}`);
});
