use serde::{Deserialize, Serialize};
use sysinfo::{Disks, System};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareCapabilities {
    pub architecture: String,
    pub cpu_features: Vec<String>,
    pub total_ram_bytes: u64,
    pub available_disk_bytes: u64,
    pub local_ai_supported: bool,
    pub warnings: Vec<String>,
}

pub fn check_hardware(app_data_dir: &std::path::Path) -> HardwareCapabilities {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let mut warnings = Vec::new();
    let mut cpu_features = Vec::new();

    let architecture = std::env::consts::ARCH.to_string();

    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        if is_x86_feature_detected!("avx2") {
            cpu_features.push("avx2".to_string());
        } else {
            warnings.push("AVX2 instructions not supported. Inference will be extremely slow or incompatible.".to_string());
        }
    }
    
    #[cfg(target_arch = "aarch64")]
    {
        // NEON is standard on aarch64
        cpu_features.push("neon".to_string());
    }

    let total_ram_bytes = sys.total_memory();
    // Requisito: > 8GB recomendado. 8GB = 8 * 1024 * 1024 * 1024 = 8589934592
    if total_ram_bytes < 8_000_000_000 {
        warnings.push("Total RAM is less than 8GB. OOM crashes may occur during model loading.".to_string());
    }

    // Check disk space on the drive where app_data_dir resides
    let mut available_disk_bytes = 0;
    let disks = Disks::new_with_refreshed_list();
    
    // Find the disk containing app_data_dir
    let mut found_disk = false;
    for disk in disks.iter() {
        if app_data_dir.starts_with(disk.mount_point()) {
            available_disk_bytes = disk.available_space();
            found_disk = true;
            break;
        }
    }
    
    // If not found by prefix (e.g., due to symlinks or mount resolution), just grab the first disk or 0
    if !found_disk {
        if let Some(disk) = disks.iter().next() {
            available_disk_bytes = disk.available_space();
        }
    }

    let local_ai_supported = if cfg!(any(target_arch = "x86", target_arch = "x86_64")) {
        cpu_features.contains(&"avx2".to_string())
    } else {
        true // Assume aarch64/NEON is fine
    };

    HardwareCapabilities {
        architecture,
        cpu_features,
        total_ram_bytes,
        available_disk_bytes,
        local_ai_supported,
        warnings,
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_capabilities_serialization() {
        let caps = HardwareCapabilities {
            architecture: "x86_64".to_string(),
            cpu_features: vec!["avx2".to_string()],
            total_ram_bytes: 32_000_000_000,
            available_disk_bytes: 100_000_000_000,
            local_ai_supported: true,
            warnings: vec![],
        };
        let serialized = serde_json::to_string(&caps).unwrap();
        assert!(serialized.contains("\"architecture\":\"x86_64\""));
        assert!(serialized.contains("\"total_ram_bytes\":32000000000"));
        assert!(serialized.contains("\"local_ai_supported\":true"));
        assert!(!serialized.contains("\"total_ram_gb\""));
        assert!(!serialized.contains("\"is_supported\""));
    }
}
