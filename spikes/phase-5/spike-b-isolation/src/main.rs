use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::time::Duration;
use std::thread;

fn main() {
    println!("Run `cargo test` to execute Spike B.");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subprocess_spawn_and_stream() {
        let mut child = Command::new("cargo")
            .args(["run", "--bin", "mock-llama"])
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to spawn mock-llama");

        let stdout = child.stdout.take().expect("Failed to open stdout");
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();

        let mut received = 0;
        for _ in 0..3 {
            reader.read_line(&mut line).unwrap();
            if line.contains("chunk_") {
                received += 1;
            }
            line.clear();
        }

        assert_eq!(received, 3, "Did not receive 3 chunks from child process");
        
        // Cleanup
        child.kill().expect("Failed to kill child process");
        child.wait().unwrap();
    }

    #[test]
    fn test_subprocess_force_kill() {
        let mut child = Command::new("cargo")
            .args(["run", "--bin", "mock-llama"])
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to spawn mock-llama");

        // Wait a bit for it to start
        thread::sleep(Duration::from_millis(200));

        // Kill it
        child.kill().expect("Failed to execute process.kill()");

        // Wait for it to exit
        let status = child.wait().expect("Failed to wait on child");
        
        assert!(!status.success(), "Process exited successfully but was supposed to be killed");
        println!("Process was forcefully killed. Exit status: {:?}", status.code());
    }
}
