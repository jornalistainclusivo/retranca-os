use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;

pub const VERSION: &str = "3.51.3";
pub const SOURCE_ID: &str =
    "2026-03-13 10:38:09 737ae4a34738ffa0c3ff7f9bb18df914dd1cad163f28fd6b6e114a344fe6d618";
const SOURCE_SHA3: &str = "32d5424f97e0a7fc5ed2f6335afbb58be4e0298bd7117a34e39d345ff13d859e";
pub const RECIPE_FILES: [&str; 5] = [
    "scripts/build/prepare-sqlite-runtime.mjs",
    "tools/sqlite-runtime/Cargo.toml",
    "tools/sqlite-runtime/Cargo.lock",
    "tools/sqlite-runtime/build.rs",
    "tools/sqlite-runtime/src/main.rs",
];

fn hash_file(path: &Path) -> Result<String, &'static str> {
    let metadata = fs::symlink_metadata(path).map_err(|_| "missing build input")?;
    if !metadata.is_file() || metadata.file_type().is_symlink() {
        return Err("redirected build input");
    }
    let mut file = File::open(path).map_err(|_| "cannot read build input")?;
    let mut hash = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|_| "cannot hash build input")?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hash.finalize()))
}

pub fn verify_artifact(root: &Path, directory: &Path, target: &str) -> Result<(), &'static str> {
    let metadata = fs::symlink_metadata(directory).map_err(|_| "SQLite is not prepared")?;
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return Err("redirected SQLite build directory");
    }
    let receipt_path = directory.join("build.json");
    let receipt_metadata =
        fs::symlink_metadata(&receipt_path).map_err(|_| "missing SQLite build receipt")?;
    if !receipt_metadata.is_file() || receipt_metadata.file_type().is_symlink() {
        return Err("redirected SQLite build receipt");
    }
    let mut bytes = Vec::new();
    File::open(receipt_path)
        .map_err(|_| "missing SQLite build receipt")?
        .take(16 * 1024 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "cannot read SQLite build receipt")?;
    if bytes.len() > 16 * 1024 {
        return Err("oversized SQLite build receipt");
    }
    let receipt: Value =
        serde_json::from_slice(&bytes).map_err(|_| "invalid SQLite build receipt")?;
    let library = if target.contains("windows-msvc") {
        "sqlite3.lib"
    } else if target.contains("linux-gnu") {
        "libsqlite3.a"
    } else {
        return Err("unsupported native SQLite target");
    };
    if receipt["schema_version"].as_u64() != Some(1)
        || receipt["sqlite_version"].as_str() != Some(VERSION)
        || receipt["sqlite_source_id"].as_str() != Some(SOURCE_ID)
        || receipt["source_sha3_256"].as_str() != Some(SOURCE_SHA3)
        || receipt["target"].as_str() != Some(target)
        || receipt["library_file"].as_str() != Some(library)
    {
        return Err("SQLite build identity mismatch");
    }
    let options = receipt["compile_options"]
        .as_array()
        .ok_or("missing compile options")?;
    for option in [
        "THREADSAFE=1",
        "ENABLE_COLUMN_METADATA",
        "ENABLE_UNLOCK_NOTIFY",
        "DEFAULT_FOREIGN_KEYS",
        "ENABLE_FTS5",
    ] {
        if !options.iter().any(|value| value.as_str() == Some(option)) {
            return Err("SQLite compile options mismatch");
        }
    }
    for (name, key) in [(library, "library_sha256"), ("sqlite3.h", "header_sha256")] {
        if receipt[key].as_str() != Some(hash_file(&directory.join(name))?.as_str()) {
            return Err("SQLite build artifact changed");
        }
    }
    let inputs = receipt["input_hashes"]
        .as_object()
        .ok_or("missing recipe hashes")?;
    if inputs.len() != RECIPE_FILES.len() {
        return Err("SQLite build recipe mismatch");
    }
    for name in RECIPE_FILES {
        if inputs.get(name).and_then(Value::as_str) != Some(hash_file(&root.join(name))?.as_str()) {
            return Err("SQLite build recipe changed; prepare it again");
        }
    }
    Ok(())
}
