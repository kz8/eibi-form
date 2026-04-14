#!/usr/bin/env node
/**
 * portal-src.html → portal.html 暗号化スクリプト
 * portal-admin-src.html → portal-admin.html も同時処理
 * Usage: node encrypt.mjs
 * パスワードをプロンプトで入力
 */
import { readFileSync, writeFileSync } from 'fs';
import { webcrypto } from 'crypto';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stderr });
const askPassword = () => new Promise(r => rl.question('パスワード: ', pw => { rl.close(); r(pw); }));

const pw = await askPassword();
if (!pw) { console.error('パスワードが入力されていません'); process.exit(1); }

const b64 = (a) => Buffer.from(a).toString('base64');
const enc = new TextEncoder();

async function encryptFile(srcPath, destPath) {
  const src = readFileSync(srcPath, 'utf8');
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await webcrypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 32, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const encrypted = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(src));
  const buf = new Uint8Array(encrypted);
  const data = buf.slice(0, -16);
  const tag = buf.slice(-16);
  const ENC_JSON = JSON.stringify({ salt: b64(salt), iv: b64(iv), tag: b64(tag), data: b64(data) });

  const existing = readFileSync(destPath, 'utf8');
  const updated = existing.replace(/var ENC = \{[^}]+\};/, 'var ENC = ' + ENC_JSON + ';');
  writeFileSync(destPath, updated);
  console.error(destPath + ' を更新しました');
}

await encryptFile('docs/portal-src.html', 'docs/portal.html');
await encryptFile('docs/portal-admin-src.html', 'docs/portal-admin.html');
