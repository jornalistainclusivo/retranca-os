import { describe, it, expect, vi } from "vitest";
import { runPhase64Migration, getSafeBackupPath } from "../phase64Migrate";

describe("Phase 6.4 Migration Helpers", () => {
  describe("getSafeBackupPath", () => {
    it("should generate backup path on Windows", () => {
      const path = getSafeBackupPath("C:\\Users\\x\\data\\retranca.db", 12345);
      expect(path).toBe(
        "C:\\Users\\x\\data\\retranca-phase64-backup-12345-retranca.db",
      );
    });

    it("should generate backup path on Unix", () => {
      const path = getSafeBackupPath("/Users/x/data/retranca.db", 12345);
      expect(path).toBe(
        "/Users/x/data/retranca-phase64-backup-12345-retranca.db",
      );
    });

    it("should handle repeated parent components securely", () => {
      const path = getSafeBackupPath(
        "/tmp/retranca.db/data/retranca.db",
        12345,
      );
      expect(path).toBe(
        "/tmp/retranca.db/data/retranca-phase64-backup-12345-retranca.db",
      );
    });

    it("should handle spaces in directories", () => {
      const path = getSafeBackupPath("/my path/data /retranca.db", 12345);
      expect(path).toBe(
        "/my path/data /retranca-phase64-backup-12345-retranca.db",
      );
    });

    it("should handle unicode", () => {
      const path = getSafeBackupPath("/caminho/com/ó/retranca.db", 12345);
      expect(path).toBe(
        "/caminho/com/ó/retranca-phase64-backup-12345-retranca.db",
      );
    });

    it("should handle filename with apostrophe", () => {
      const path = getSafeBackupPath("/data/bob's.db", 12345);
      expect(path).toBe("/data/retranca-phase64-backup-12345-bob's.db");
    });

    it("should handle filename with no path separator", () => {
      const path = getSafeBackupPath("retranca.db", 12345);
      expect(path).toBe("retranca-phase64-backup-12345-retranca.db");
    });
  });
});

describe("Phase 6.4 Migration Orchestration", () => {
  const createMockDb = (options: any = {}) => {
    const executed: string[] = [];
    const select = vi.fn().mockImplementation(async (query: string) => {
      if (query.includes("PRAGMA user_version")) {
        return [{ user_version: options.userVersion ?? 0 }];
      }
      if (query.includes("sqlite_master WHERE type='table'")) {
        return (
          options.tables || [{ name: "articles" }, { name: "checklist_items" }]
        );
      }
      if (query.includes("PRAGMA table_info(articles)")) {
        return options.columns || [{ name: "id" }];
      }
      if (query.includes("sqlite_master WHERE type='index'")) {
        return options.indexes || [];
      }
      if (query.includes("SELECT DISTINCT status")) {
        return options.statuses || [{ status: "ideia" }];
      }
      if (query.includes("SELECT DISTINCT categoryTag")) {
        return options.categories || [{ categoryTag: "IA" }];
      }
      if (query.includes("PRAGMA database_list")) {
        return [{ name: "main", file: "/data/db.sqlite" }];
      }
      return [];
    });
    const execute = vi.fn().mockImplementation(async (query: string) => {
      executed.push(query);
    });

    return { db: { select, execute } as any, executed };
  };

  it("A. workflow_stages partial state blocks before backup", async () => {
    const { db, executed } = createMockDb({
      tables: [
        { name: "articles" },
        { name: "checklist_items" },
        { name: "workflow_stages" },
      ],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("B. categories partial state blocks before backup", async () => {
    const { db, executed } = createMockDb({
      tables: [
        { name: "articles" },
        { name: "checklist_items" },
        { name: "categories" },
      ],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("C. checklist_templates partial state blocks before backup", async () => {
    const { db, executed } = createMockDb({
      tables: [
        { name: "articles" },
        { name: "checklist_items" },
        { name: "checklist_templates" },
      ],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("D. workflow_stage_id-only partial state blocks before backup", async () => {
    const { db, executed } = createMockDb({
      columns: [{ name: "id" }, { name: "workflow_stage_id" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("E. category_id-only partial state blocks before backup", async () => {
    const { db, executed } = createMockDb({
      columns: [{ name: "id" }, { name: "category_id" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("F. unexpected Phase 6.4 index blocks before backup", async () => {
    const { db, executed } = createMockDb({
      indexes: [{ name: "idx_categories_active_name" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("G. multiple partial markers block before backup", async () => {
    const { db, executed } = createMockDb({
      tables: [
        { name: "articles" },
        { name: "checklist_items" },
        { name: "categories" },
      ],
      columns: [{ name: "id" }, { name: "workflow_stage_id" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Phase 6.4 is already partially expanded",
    );
    expect(executed).toEqual([]);
  });

  it("H. unknown status blocks before backup", async () => {
    const { db, executed } = createMockDb({
      statuses: [{ status: "invalid_status" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "ERR_MIGRATION_UNKNOWN_LEGACY_VALUE",
    );
    expect(executed).toEqual([]);
  });

  it("I. unknown categoryTag blocks before backup", async () => {
    const { db, executed } = createMockDb({
      categories: [{ categoryTag: "invalid_cat" }],
    });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "ERR_MIGRATION_UNKNOWN_LEGACY_VALUE",
    );
    expect(executed).toEqual([]);
  });

  it("J. user_version = 1 no-ops and creates no backup", async () => {
    const { db, executed } = createMockDb({ userVersion: 1 });
    await runPhase64Migration(db);
    expect(executed).toEqual([]);
  });

  it("K. unexpected user_version fails closed", async () => {
    const { db, executed } = createMockDb({ userVersion: 2 });
    await expect(runPhase64Migration(db)).rejects.toThrow(
      "Unsupported user_version 2",
    );
    expect(executed).toEqual([]);
  });

  it("L. valid legacy state reaches backup before atomic migration", async () => {
    const { db, executed } = createMockDb();
    await runPhase64Migration(db);
    expect(executed.length).toBe(2);
    expect(executed[0]).toContain("VACUUM INTO");
    expect(executed[1]).toContain("BEGIN TRANSACTION");
  });
});
