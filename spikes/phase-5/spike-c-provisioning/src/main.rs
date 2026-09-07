use ed25519_dalek::{Signer, SigningKey, VerifyingKey, Signature, Verifier};
use rand::rngs::OsRng;
use sha2::{Sha256, Digest};
use std::fs::File;
use std::io::Write;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Manifest {
    model_version: String,
    sha256: String,
    signature: String,
}

fn main() {
    println!("Run `cargo test` to execute Spike C.");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_dummy_keys() -> (SigningKey, VerifyingKey) {
        let mut csprng = OsRng;
        let signing_key: SigningKey = SigningKey::generate(&mut csprng);
        let verifying_key: VerifyingKey = (&signing_key).into();
        (signing_key, verifying_key)
    }

    #[test]
    fn test_manifest_valid_signature() {
        let (signing_key, verifying_key) = setup_dummy_keys();
        let payload = "model_v1_sha256_dummy";
        let signature = signing_key.sign(payload.as_bytes());

        let sig_hex = hex::encode(signature.to_bytes());
        let manifest = Manifest {
            model_version: "v1".to_string(),
            sha256: "dummy_sha".to_string(),
            signature: sig_hex.clone(),
        };

        let decoded_sig_bytes = hex::decode(&manifest.signature).unwrap();
        let decoded_sig = Signature::from_slice(&decoded_sig_bytes).unwrap();

        assert!(verifying_key.verify(payload.as_bytes(), &decoded_sig).is_ok());
    }

    #[test]
    fn test_manifest_invalid_signature() {
        let (signing_key, _verifying_key) = setup_dummy_keys();
        let (_, wrong_verifying_key) = setup_dummy_keys();
        
        let payload = "model_v1_sha256_dummy";
        let signature = signing_key.sign(payload.as_bytes());

        let decoded_sig = Signature::from_slice(&signature.to_bytes()).unwrap();

        let result = wrong_verifying_key.verify(payload.as_bytes(), &decoded_sig);
        assert!(result.is_err(), "Invalid signature should be rejected by wrong public key");
    }

    #[test]
    fn test_atomic_rename_and_hash() {
        let tmp_path = "test_model.tmp";
        let final_path = "test_model.gguf";

        // Create dummy tmp file
        let mut file = File::create(tmp_path).unwrap();
        let data = b"dummy gguf content";
        file.write_all(data).unwrap();

        // Calculate hash
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        let hash_hex = hex::encode(result);

        // Simulate hash matching
        let expected_hash = "ee96eae96f199ef26a63288365ba09254267424420a561b16b5a66cc11ebc02b";
        assert_eq!(hash_hex, expected_hash);

        // Atomic rename
        fs::rename(tmp_path, final_path).expect("Rename failed");

        assert!(!std::path::Path::new(tmp_path).exists());
        assert!(std::path::Path::new(final_path).exists());

        // Cleanup
        fs::remove_file(final_path).unwrap();
    }
}
