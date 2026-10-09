fn main() {
    for (source, destination) in [
        ("DEP_SQLITE3_LIB_DIR", "RETRANCA_SQLITE_LIBRARY_DIR"),
        ("DEP_SQLITE3_INCLUDE", "RETRANCA_SQLITE_SOURCE_DIR"),
        ("TARGET", "RETRANCA_SQLITE_TARGET"),
    ] {
        let value = std::env::var(source).expect("Missing bundled SQLite build metadata");
        println!("cargo:rustc-env={destination}={value}");
    }
}
