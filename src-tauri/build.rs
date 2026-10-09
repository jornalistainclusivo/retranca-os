#[path = "build/sqlite_runtime_contract.rs"]
mod sqlite_runtime_contract;

fn main() {
    use std::path::Path;

    let manifest = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let root = Path::new(&manifest).parent().unwrap();
    let directory = root.join(".retranca-local/sqlite-runtime/3.51.3");
    let target = std::env::var("TARGET").unwrap();
    let host = std::env::var("HOST").unwrap();
    let error = "Pinned SQLite is not ready. From the repository root, run npm run sqlite:prepare. Cross-compilation needs separate native-engine validation.";
    assert_eq!(host, target, "{error}");
    for name in [
        "LIBSQLITE3_SYS_USE_PKG_CONFIG",
        "SQLITE3_NO_PKG_CONFIG",
        "SQLITE3_STATIC",
    ] {
        println!("cargo:rerun-if-env-changed={name}");
        assert_eq!(std::env::var(name).as_deref(), Ok("1"), "{error}");
    }
    for name in ["SQLITE3_LIB_DIR", "SQLITE3_INCLUDE_DIR"] {
        println!("cargo:rerun-if-env-changed={name}");
        let configured = std::env::var(name).unwrap_or_default();
        assert_eq!(
            std::fs::canonicalize(configured).ok(),
            Some(std::fs::canonicalize(&directory).expect(error)),
            "{error}"
        );
    }
    sqlite_runtime_contract::verify_artifact(root, &directory, &target)
        .unwrap_or_else(|reason| panic!("{error} Reason: {reason}"));
    let library = if target.contains("windows-msvc") {
        "sqlite3.lib"
    } else {
        "libsqlite3.a"
    };
    for name in ["build.json", library, "sqlite3.h"] {
        println!("cargo:rerun-if-changed={}", directory.join(name).display());
    }
    for name in sqlite_runtime_contract::RECIPE_FILES {
        println!("cargo:rerun-if-changed={}", root.join(name).display());
    }
    println!("cargo:rustc-env=RETRANCA_SQLITE_TARGET={target}");
    tauri_build::build()
}
