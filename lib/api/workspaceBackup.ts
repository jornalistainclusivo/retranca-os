export const BACKUP_TABLES = ['articles', 'categories', 'checklist_items', 'checklist_templates', 'gamification_badges', 'governance_docs', 'history_entries', 'workflow_stages'] as const;
const APPLICATIONS = ['com.jornalistainclusivo.retranca', 'com.jornalistainclusivo.retranca.pilot', 'com.jornalistainclusivo.retranca.fixtures'];
const MAX_DATABASE_BYTES = 256 * 1024 * 1024;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HASH = /^[0-9a-f]{64}$/;

export interface InternalBackupEntry { operation_id: string; modified_at_unix_ms: number }
export interface InternalBackupInventory { source_app_identifier: string; directory: string; entries: InternalBackupEntry[] }
export interface WorkspaceBackupReceipt {
  format_version: number; operation_id: string; source_app_identifier: string; app_version: string;
  created_at_unix_ms: number; sqlite_version: string; database_schema_version: number;
  database_size: number; database_sha256: string; schema_sha256: string;
  table_counts: Record<(typeof BACKUP_TABLES)[number], number>;
}
export interface VerifiedInternalBackup { directory: string; receipt: WorkspaceBackupReceipt }

export class WorkspaceBackupUnavailableError extends Error {
  constructor() { super('O backup do espaço editorial está disponível no aplicativo desktop.'); this.name = 'WorkspaceBackupUnavailableError'; }
}
export class WorkspaceBackupResponseError extends Error {
  constructor() { super('A resposta do backup não pôde ser confirmada. Atualize a lista e tente verificar novamente.'); this.name = 'WorkspaceBackupResponseError'; }
}

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
const text = (value: unknown, maximum: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= maximum;
const date = (value: unknown): value is number => integer(value, 8_640_000_000_000_000);
const id = (value: unknown): value is string => typeof value === 'string' && ID.test(value);

export function isWorkspaceBackupDesktop(): boolean {
  return typeof window !== 'undefined' && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}
async function native(command: string, args?: Record<string, unknown>): Promise<unknown> {
  if (!isWorkspaceBackupDesktop()) throw new WorkspaceBackupUnavailableError();
  const { invoke } = await import('@tauri-apps/api/core');
  return args ? invoke(command, args) : invoke(command);
}

function inventory(value: unknown): InternalBackupInventory {
  if (!record(value) || !APPLICATIONS.includes(value.source_app_identifier as string) || !text(value.directory, 4096)
    || !Array.isArray(value.entries) || value.entries.length > 128
    || value.entries.some(entry => !record(entry) || !id(entry.operation_id) || !date(entry.modified_at_unix_ms))
    || new Set(value.entries.map(entry => entry.operation_id)).size !== value.entries.length) throw new WorkspaceBackupResponseError();
  return value as unknown as InternalBackupInventory;
}

function artifact(value: unknown, expectedId?: string): VerifiedInternalBackup {
  if (!record(value) || !text(value.directory, 4096) || !record(value.receipt)) throw new WorkspaceBackupResponseError();
  const receipt = value.receipt;
  if (receipt.format_version !== 1 || receipt.database_schema_version !== 2 || !id(receipt.operation_id)
    || (expectedId !== undefined && receipt.operation_id !== expectedId)
    || !APPLICATIONS.includes(receipt.source_app_identifier as string) || !text(receipt.app_version, 64)
    || !text(receipt.sqlite_version, 32) || !date(receipt.created_at_unix_ms)
    || !integer(receipt.database_size, MAX_DATABASE_BYTES) || receipt.database_size === 0
    || typeof receipt.database_sha256 !== 'string' || !HASH.test(receipt.database_sha256)
    || typeof receipt.schema_sha256 !== 'string' || !HASH.test(receipt.schema_sha256)
    || !record(receipt.table_counts) || Object.keys(receipt.table_counts).length !== BACKUP_TABLES.length
    || BACKUP_TABLES.some(table => !integer((receipt.table_counts as Record<string, unknown>)[table]))) throw new WorkspaceBackupResponseError();
  return value as unknown as VerifiedInternalBackup;
}

export async function listWorkspaceBackups(): Promise<InternalBackupInventory> { return inventory(await native('list_workspace_backups')); }
export async function createWorkspaceBackup(): Promise<VerifiedInternalBackup> { return artifact(await native('create_workspace_backup')); }
export async function verifyWorkspaceBackup(operationId: string): Promise<VerifiedInternalBackup> {
  if (!id(operationId)) throw new WorkspaceBackupResponseError();
  return artifact(await native('verify_internal_workspace_backup', { operationId }), operationId);
}

export function workspaceBackupErrorMessage(error: unknown): string {
  if (error instanceof WorkspaceBackupUnavailableError || error instanceof WorkspaceBackupResponseError) return error.message;
  const stage = record(error) && error.code === 'ERR_WORKSPACE_BACKUP' && record(error.details) ? error.details.stage : undefined;
  if (stage === 'busy') return 'Outra operação de backup está em andamento. Aguarde e atualize a lista.';
  if (stage === 'database-not-ready') return 'O espaço editorial ainda não está pronto. Aguarde o carregamento e tente novamente.';
  if (stage === 'database-limit') return 'O banco excede o limite de 256 MiB desta etapa. Nenhuma cópia foi anunciada como concluída.';
  if (stage === 'operation-limit') return 'A operação excedeu seu orçamento de execução. Atualize a lista; arquivos incompletos foram preservados.';
  if (stage === 'inventory-limit') return 'O limite de pastas de backup desta etapa foi atingido. Nenhum arquivo foi removido automaticamente.';
  return 'Não foi possível concluir ou verificar o backup. Atualize a lista e tente novamente. Seus dados e as cópias anteriores foram preservados.';
}

export function workspaceBackupApplicationName(identifier: string): string {
  return identifier.endsWith('.pilot') ? 'Retranca OS Pilot' : identifier.endsWith('.fixtures') ? 'Retranca OS — dados sintéticos' : 'Retranca OS';
}
