import { spawn } from 'child_process';

console.log('[DEV] Starting Fixture Server...');
const fixture = spawn('node', ['scripts/dev/model-fixture-server.mjs'], { stdio: 'inherit', shell: true });

console.log('[DEV] Starting synthetic fixtures in a separate app-data namespace (not the normal Ollama workflow)...');
const tauri = spawn('npx', ['tauri', 'dev', '--features', 'dev-fixtures', '--config', 'src-tauri/tauri.fixture.conf.json'], { stdio: 'inherit', shell: true });

function cleanup() {
  fixture.kill('SIGINT');
  tauri.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
