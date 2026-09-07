use sysinfo::System;

fn main() {
    println!("Run `cargo test` to execute Spike D.");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_ram_detection() {
        let mut sys = System::new_all();
        sys.refresh_all();
        let total_ram_bytes = sys.total_memory();
        let total_ram_gb = total_ram_bytes as f64 / 1024.0 / 1024.0 / 1024.0;
        println!("Total RAM: {:.2} GB", total_ram_gb);
        
        assert!(total_ram_gb > 0.0, "RAM detection failed");
    }

    #[test]
    fn test_architecture_flag() {
        let arch = env::consts::ARCH;
        println!("System Architecture: {}", arch);
        assert!(arch == "x86_64" || arch == "aarch64", "Unsupported architecture detected for local AI");

        #[cfg(target_arch = "x86_64")]
        {
            let has_avx2 = is_x86_feature_detected!("avx2");
            println!("AVX2 Supported: {}", has_avx2);
            // We do not assert AVX2 must be true, just that we can detect it.
        }
    }
}
