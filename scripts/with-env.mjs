// Runs a command with variables from an env file loaded first:
//   node scripts/with-env.mjs .env.emulator next dev
// Next.js has no "--mode", but it never overrides variables already present in process.env,
// so values loaded here win over .env.local.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, resolve } from 'node:path';

const [file, ...command] = process.argv.slice(2);
if (!file || command.length === 0) {
  console.error('Usage: node scripts/with-env.mjs <env-file> <command> [...args]');
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`Env file not found: ${file}`);
  process.exit(1);
}

const env = { ...process.env };
// Make local binaries (next, vitest, …) resolvable even when this runs outside `npm run`.
const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
env[pathKey] = [resolve('node_modules/.bin'), env[pathKey]].filter(Boolean).join(delimiter);
for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const child = spawn(command[0], command.slice(1), { stdio: 'inherit', env, shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
