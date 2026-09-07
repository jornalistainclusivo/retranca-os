use std::io::{self, Write};
use std::thread;
use std::time::Duration;

fn main() {
    let mut count = 0;
    loop {
        let chunk = format!(r#"{{"token": "chunk_{}", "stop": false}}"#, count);
        println!("{}", chunk);
        io::stdout().flush().unwrap();
        count += 1;
        thread::sleep(Duration::from_millis(100));
    }
}
