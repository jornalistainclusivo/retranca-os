use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;

/// Retorna a chave pública Ed25519 (Trust Anchor) para validação do manifesto.
/// Em release, exige a presença da variável de ambiente PROD_PUBLIC_KEY_HEX.
/// Em debug, usa uma chave de desenvolvimento explícita caso a de produção não exista.
pub fn get_trust_anchor() -> String {
    #[cfg(not(debug_assertions))]
    {
        option_env!("PROD_PUBLIC_KEY_HEX")
            .expect("PROD_PUBLIC_KEY_HEX env var must be set during release build")
            .to_string()
    }
    #[cfg(debug_assertions)]
    {
        if let Some(key) = option_env!("PROD_PUBLIC_KEY_HEX") {
            key.to_string()
        } else {
            // AVISO: Esta chave é apenas para desenvolvimento/testes locais (Fixture)
            "e820a2e5b3c8030ed980bee4a64246361516b058f484e15170f4de4bd6f5b93f".to_string()
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Manifest {
    pub model_id: String,
    pub version: String,
    pub filename: String,
    pub size: u64,
    pub sha256: String,
    pub download_url: String,
    pub format: String,
    pub context: Option<u32>,
    pub license: Option<String>,
    pub minimum_app_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SignedManifest {
    #[serde(flatten)]
    pub manifest: Manifest,
    pub signature: String, // base64 encoded ed25519 signature
}

#[derive(Debug)]
pub enum SecurityError {
    InvalidSignature,
    KeyParseError,
    SignatureParseError,
    HashMismatch { expected: String, actual: String },
    IoError(io::Error),
    JsonError(serde_json::Error),
    InvalidFormat,
}

impl std::fmt::Display for SecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SecurityError::InvalidSignature => write!(f, "Invalid Ed25519 signature"),
            SecurityError::KeyParseError => write!(f, "Failed to parse public key"),
            SecurityError::SignatureParseError => {
                write!(f, "Failed to parse signature (must be valid base64)")
            }
            SecurityError::HashMismatch { expected, actual } => {
                write!(
                    f,
                    "SHA-256 hash mismatch. Expected: {}, Actual: {}",
                    expected, actual
                )
            }
            SecurityError::IoError(e) => write!(f, "IO Error: {}", e),
            SecurityError::JsonError(e) => write!(f, "JSON Error: {}", e),
            SecurityError::InvalidFormat => write!(f, "Invalid manifest format"),
        }
    }
}

impl From<io::Error> for SecurityError {
    fn from(err: io::Error) -> Self {
        SecurityError::IoError(err)
    }
}

impl From<serde_json::Error> for SecurityError {
    fn from(err: serde_json::Error) -> Self {
        SecurityError::JsonError(err)
    }
}

/// Verifica a assinatura de um manifesto JSON em string.
/// Espera-se que o manifesto em string contenha todos os campos, incluindo a "signature".
/// A assinatura é gerada sobre o objeto JSON *sem* o campo "signature".
/// Para simplificar a verificação, reconstruímos o JSON sem a assinatura.
pub fn verify_manifest_signature(
    manifest_str: &str,
    public_key_hex: &str,
) -> Result<Manifest, SecurityError> {
    // 1. Decodificar a chave pública
    let public_key_bytes = hex::decode(public_key_hex).map_err(|_| SecurityError::KeyParseError)?;
    let public_key = VerifyingKey::try_from(public_key_bytes.as_slice())
        .map_err(|_| SecurityError::KeyParseError)?;

    // 2. Parse do SignedManifest
    let signed_manifest: SignedManifest = serde_json::from_str(manifest_str)?;

    // 3. Decodificar a assinatura
    use base64::{engine::general_purpose, Engine as _};
    let sig_bytes = general_purpose::STANDARD
        .decode(&signed_manifest.signature)
        .map_err(|_| SecurityError::SignatureParseError)?;
    let signature =
        Signature::from_slice(&sig_bytes).map_err(|_| SecurityError::SignatureParseError)?;

    // 4. Recriar o payload canônico para verificação
    // ATENÇÃO: Em produção, o ideal é serializar garantindo a ordem das chaves,
    // ou assinar um hash do payload, ou o arquivo isolado. Aqui, usamos o próprio
    // serde_json::to_string() da estrutura `Manifest`.
    let payload = serde_json::to_string(&signed_manifest.manifest)?;

    // 5. Verificar a assinatura
    public_key
        .verify(payload.as_bytes(), &signature)
        .map_err(|_| SecurityError::InvalidSignature)?;

    Ok(signed_manifest.manifest)
}

/// Verifica o hash SHA-256 de um arquivo em disco.
pub fn verify_file_hash(path: &Path, expected_sha256: &str) -> Result<(), SecurityError> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 65536];

    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    let result = hasher.finalize();
    let actual_sha256 = hex::encode(result);

    if actual_sha256 != expected_sha256 {
        return Err(SecurityError::HashMismatch {
            expected: expected_sha256.to_string(),
            actual: actual_sha256,
        });
    }

    Ok(())
}

/// Executa a instalação atômica renomeando o arquivo temp.
pub fn atomic_install(tmp_path: &Path, final_path: &Path) -> Result<(), SecurityError> {
    std::fs::rename(tmp_path, final_path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    use rand::rngs::OsRng;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn generate_test_keys() -> (String, SigningKey) {
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        let verifying_key = signing_key.verifying_key();
        (hex::encode(verifying_key.as_bytes()), signing_key)
    }

    #[test]
    fn test_valid_manifest_signature() {
        let (pub_hex, signing_key) = generate_test_keys();

        let manifest = Manifest {
            model_id: "test-model".to_string(),
            version: "1.0.0".to_string(),
            filename: "model.gguf".to_string(),
            size: 1024,
            sha256: "dummyhash".to_string(),
            download_url: "http://example.com/model.gguf".to_string(),
            format: "GGUF".to_string(),
            context: Some(4096),
            license: None,
            minimum_app_version: None,
        };

        let payload = serde_json::to_string(&manifest).unwrap();
        let signature = signing_key.sign(payload.as_bytes());
        use base64::{engine::general_purpose, Engine as _};
        let sig_b64 = general_purpose::STANDARD.encode(signature.to_bytes());

        let signed = SignedManifest {
            manifest,
            signature: sig_b64,
        };

        let json_str = serde_json::to_string(&signed).unwrap();

        let result = verify_manifest_signature(&json_str, &pub_hex);
        assert!(result.is_ok(), "Signature should be valid");
        assert_eq!(result.unwrap().model_id, "test-model");
    }

    #[test]
    fn test_invalid_manifest_signature() {
        let (pub_hex, signing_key) = generate_test_keys();
        let (_pub2_hex, signing_key2) = generate_test_keys();

        let manifest = Manifest {
            model_id: "test-model".to_string(),
            version: "1.0.0".to_string(),
            filename: "model.gguf".to_string(),
            size: 1024,
            sha256: "dummyhash".to_string(),
            download_url: "http://example.com/model.gguf".to_string(),
            format: "GGUF".to_string(),
            context: Some(4096),
            license: None,
            minimum_app_version: None,
        };

        // Sign with key2, but verify with key1
        let payload = serde_json::to_string(&manifest).unwrap();
        let signature = signing_key2.sign(payload.as_bytes());
        use base64::{engine::general_purpose, Engine as _};
        let sig_b64 = general_purpose::STANDARD.encode(signature.to_bytes());

        let signed = SignedManifest {
            manifest,
            signature: sig_b64,
        };

        let json_str = serde_json::to_string(&signed).unwrap();

        let result = verify_manifest_signature(&json_str, &pub_hex);
        assert!(matches!(result, Err(SecurityError::InvalidSignature)));
    }

    #[test]
    fn test_modified_manifest() {
        let (pub_hex, signing_key) = generate_test_keys();

        let mut manifest = Manifest {
            model_id: "test-model".to_string(),
            version: "1.0.0".to_string(),
            filename: "model.gguf".to_string(),
            size: 1024,
            sha256: "dummyhash".to_string(),
            download_url: "http://example.com/model.gguf".to_string(),
            format: "GGUF".to_string(),
            context: Some(4096),
            license: None,
            minimum_app_version: None,
        };

        let payload = serde_json::to_string(&manifest).unwrap();
        let signature = signing_key.sign(payload.as_bytes());
        use base64::{engine::general_purpose, Engine as _};
        let sig_b64 = general_purpose::STANDARD.encode(signature.to_bytes());

        // Modify manifest AFTER signing
        manifest.size = 2048;

        let signed = SignedManifest {
            manifest,
            signature: sig_b64,
        };

        let json_str = serde_json::to_string(&signed).unwrap();

        let result = verify_manifest_signature(&json_str, &pub_hex);
        assert!(matches!(result, Err(SecurityError::InvalidSignature)));
    }

    #[test]
    fn test_verify_file_hash() {
        let mut temp_file = NamedTempFile::new().unwrap();
        let content = b"hello world";
        temp_file.write_all(content).unwrap();

        let mut hasher = Sha256::new();
        hasher.update(content);
        let expected_hash = hex::encode(hasher.finalize());

        assert!(verify_file_hash(temp_file.path(), &expected_hash).is_ok());

        // Test mismatch
        let wrong_hash = expected_hash.replace('a', "b"); // just alter it slightly
        if wrong_hash != expected_hash {
            assert!(matches!(
                verify_file_hash(temp_file.path(), &wrong_hash),
                Err(SecurityError::HashMismatch { .. })
            ));
        }
    }
}
