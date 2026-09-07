use sysinfo::System;
use serde::{Serialize, Deserialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub total_ram_gb: f64,
    pub arch: String,
    pub is_supported: bool,
}

pub fn check_hardware_capability() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let total_ram_gb = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
    let arch = env::consts::ARCH.to_string();
    
    // We expect at least 4 GB of RAM and x86_64 or aarch64
    let is_supported = total_ram_gb >= 3.5 && (arch == "x86_64" || arch == "aarch64");
    
    HardwareInfo {
        total_ram_gb,
        arch,
        is_supported,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_detection() {
        let info = check_hardware_capability();
        assert!(info.total_ram_gb > 0.0);
        assert!(!info.arch.is_empty());
    }
}
