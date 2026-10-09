use std::ffi::CStr;

fn main() {
    // This build tool never opens a database or initializes Tauri.
    let (version, source_id, options) = unsafe {
        let version = CStr::from_ptr(libsqlite3_sys::sqlite3_libversion())
            .to_str()
            .expect("Invalid SQLite version")
            .to_owned();
        let source_id = CStr::from_ptr(libsqlite3_sys::sqlite3_sourceid())
            .to_str()
            .expect("Invalid SQLite source ID")
            .to_owned();
        let mut options = Vec::new();
        let mut index = 0;
        loop {
            let option = libsqlite3_sys::sqlite3_compileoption_get(index);
            if option.is_null() {
                break;
            }
            options.push(CStr::from_ptr(option).to_str().unwrap().to_owned());
            index += 1;
        }
        (version, source_id, options)
    };
    println!(
        "{}",
        serde_json::json!({
            "sqlite_version": version,
            "sqlite_source_id": source_id,
            "compile_options": options,
            "target": env!("RETRANCA_SQLITE_TARGET"),
            "library_directory": env!("RETRANCA_SQLITE_LIBRARY_DIR"),
            "source_directory": env!("RETRANCA_SQLITE_SOURCE_DIR"),
        })
    );
}
