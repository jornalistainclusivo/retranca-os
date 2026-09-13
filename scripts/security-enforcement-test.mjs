import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libRsPath = path.join(__dirname, '../src-tauri/src/lib.rs');

try {
  const content = fs.readFileSync(libRsPath, 'utf-8');

  // Verify that the file contains start_inference and start_ollama_inference in the invoke_handler
  if (!content.includes('start_inference') || !content.includes('start_ollama_inference')) {
    console.error('❌ Failed: Could not find the inference commands in lib.rs.');
    process.exit(1);
  }

  // Ensure they are strictly preceded by #[cfg(debug_assertions)]
  const lines = content.split('\n').map(l => l.trim());
  
  let inInvokeHandler = false;
  let hasStartInference = false;
  let hasStartOllamaInference = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('tauri::generate_handler![')) {
      inInvokeHandler = true;
      continue;
    }

    if (inInvokeHandler && line.includes('])')) {
      inInvokeHandler = false;
      continue;
    }

    if (inInvokeHandler) {
      if (line.startsWith('start_inference') || line.startsWith('start_inference,')) {
        hasStartInference = true;
        const prevLine = lines[i - 1];
        if (prevLine !== '#[cfg(debug_assertions)]') {
          console.error('❌ Security Violation: start_inference is not protected by #[cfg(debug_assertions)] in invoke_handler!');
          process.exit(1);
        }
      }
      
      if (line.startsWith('start_ollama_inference') || line.startsWith('start_ollama_inference,')) {
        hasStartOllamaInference = true;
        const prevLine = lines[i - 1];
        if (prevLine !== '#[cfg(debug_assertions)]') {
          console.error('❌ Security Violation: start_ollama_inference is not protected by #[cfg(debug_assertions)] in invoke_handler!');
          process.exit(1);
        }
      }
    }
  }

  if (!hasStartInference || !hasStartOllamaInference) {
    console.error('❌ Security Enforcement Test Failed: Could not find commands inside generate_handler!');
    process.exit(1);
  }

  console.log('✅ Security Enforcement Test Passed: raw prompt IPC commands (start_inference, start_ollama_inference) are securely stripped from release builds.');
  process.exit(0);

} catch (e) {
  console.error('❌ Error reading src-tauri/src/lib.rs', e);
  process.exit(1);
}
