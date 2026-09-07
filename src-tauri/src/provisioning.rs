use ed25519_dalek::{Verifier, VerifyingKey, Signature};
use sha2::{Sha256, Digest};
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelManifest {
    pub model_version: String,
    pub sha256: String,
    pub signature: String,
}

pub fn verify_and_install_model(
    tmp_path: &Path,
    final_path: &Path,
    manifest: &ModelManifest,
    public_key_hex: &str,
) -> Result<(), String> {
    // 1. Calculate SHA-256 of the downloaded .tmp file
    let mut file = File::open(tmp_path).map_err(|e| format!("Failed to open temp file: {}", e))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];
    loop {
        let count = file.read(&mut buffer).map_err(|e| format!("Failed to read file: {}", e))?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    let hash_result = hasher.finalize();
    let hash_hex = hex::encode(hash_result);

    if hash_hex != manifest.sha256 {
        return Err("Model hash mismatch".to_string());
    }

    // 2. Verify Ed25519 signature
    let public_key_bytes = hex::decode(public_key_hex).map_err(|e| format!("Invalid public key hex: {}", e))?;
    let verifying_key = VerifyingKey::try_from(public_key_bytes.as_slice())
        .map_err(|e| format!("Invalid public key format: {}", e))?;

    let sig_bytes = hex::decode(&manifest.signature).map_err(|e| format!("Invalid signature hex: {}", e))?;
    let signature = Signature::from_slice(&sig_bytes).map_err(|e| format!("Invalid signature format: {}", e))?;

    let payload = format!("{}_{}", manifest.model_version, manifest.sha256);
    verifying_key.verify(payload.as_bytes(), &signature)
        .map_err(|_| "Signature verification failed".to_string())?;

    // 3. Atomic rename
    fs::rename(tmp_path, final_path).map_err(|e| format!("Failed to move file to final location: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    use rand::rngs::OsRng;
    use std::io::Write;

    #[test]
    fn test_verify_and_install_valid() {
        let mut csprng = OsRng;
        let signing_key: SigningKey = SigningKey::generate(&mut csprng);
        let verifying_key: VerifyingKey = (&signing_key).into();
        let pub_key_hex = hex::encode(verifying_key.as_bytes());

        let tmp_path = Path::new("test_model_v2.tmp");
        let final_path = Path::new("test_model_v2.gguf");

        let mut file = File::create(tmp_path).unwrap();
        let data = b"dummy model data";
        file.write_all(data).unwrap();
        drop(file);

        let mut hasher = Sha256::new();
        hasher.update(data);
        let hash_hex = hex::encode(hasher.finalize());

        let payload = format!("v1_{}", hash_hex);
        let signature = signing_key.sign(payload.as_bytes());
        let sig_hex = hex::encode(signature.to_bytes());

        let manifest = ModelManifest {
            model_version: "v1".to_string(),
            sha256: hash_hex,
            signature: sig_hex,
        };

        let result = verify_and_install_model(tmp_path, final_path, &manifest, &pub_key_hex);
        assert!(result.is_ok());
        assert!(final_path.exists());

        fs::remove_file(final_path).unwrap();
    }
}
