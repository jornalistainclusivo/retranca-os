/** Metadata-only diagnostics; Rust rechecks readiness before each generation. */
export type LocalAiReadinessState =
  | 'NO_SELECTION'
  | 'INVALID_MODEL'
  | 'SERVER_UNREACHABLE'
  | 'UNSUPPORTED_RUNTIME'
  | 'MODEL_MISSING'
  | 'REMOTE_MODEL'
  | 'UNSUPPORTED_CAPABILITY'
  | 'VERIFICATION_FAILED'
  | 'READY';

export interface LocalAiReadinessReport {
  state: LocalAiReadinessState;
  runtime_version: string | null;
  model: string | null;
  resolved_model: string | null;
  digest: string | null;
  capabilities: string[];
  execution: 'UNKNOWN' | 'LOCAL_REQUEST_ENFORCED';
  message: string;
}
