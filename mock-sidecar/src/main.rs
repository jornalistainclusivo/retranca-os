use std::io::Write;
use std::thread::sleep;
use std::time::Duration;

fn main() {
    // Simulando startup
    println!(r#"{{"status": "ready"}}"#);
    std::io::stdout().flush().unwrap();
    sleep(Duration::from_millis(500));

    let tokens = vec!["Olá, ", "este ", "é ", "um ", "texto ", "gerado ", "pelo ", "Mock ", "Sidecar!"];

    for token in tokens {
        // Output no formato esperado pelo Supervisor
        // Para simplificar, o frontend espera JSON ou texto puro dependendo do parsing.
        // O Phase 5 assume stdout raw emitido via `ai-stream-token`.
        println!(r#"{{"token": "{}"}}"#, token);
        std::io::stdout().flush().unwrap();
        sleep(Duration::from_millis(150));
    }
}
