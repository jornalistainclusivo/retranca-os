import { describe, it, expect } from "vitest";
import { phase64AtomicSql } from "../phase64AtomicSql";
import {
  STANDARD_WORKFLOW_IDS,
  STANDARD_CATEGORY_IDS,
} from "../phase64StandardIds";

describe("Phase 6.4 Standard IDs Drift", () => {
  it("should contain all standard workflow IDs", () => {
    for (const [key, value] of Object.entries(STANDARD_WORKFLOW_IDS)) {
      expect(phase64AtomicSql).toContain(`'${value}'`);
    }
  });

  it("should contain all standard category IDs", () => {
    for (const [key, value] of Object.entries(STANDARD_CATEGORY_IDS)) {
      expect(phase64AtomicSql).toContain(`'${value}'`);
    }
  });

  it("should map legacy statuses correctly", () => {
    expect(phase64AtomicSql).toContain(
      `WHEN 'ideia' THEN '${STANDARD_WORKFLOW_IDS.IDEIA}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'pesquisa' THEN '${STANDARD_WORKFLOW_IDS.PESQUISA}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'escrita' THEN '${STANDARD_WORKFLOW_IDS.PRODUCAO}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'revisao' THEN '${STANDARD_WORKFLOW_IDS.REVISAO}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'publicado' THEN '${STANDARD_WORKFLOW_IDS.PUBLICADO}'`,
    );
  });

  it("should map legacy categories correctly", () => {
    expect(phase64AtomicSql).toContain(
      `WHEN 'IA' THEN '${STANDARD_CATEGORY_IDS.IA}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Acessibilidade' THEN '${STANDARD_CATEGORY_IDS.ACESSIBILIDADE}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Inclusão' THEN '${STANDARD_CATEGORY_IDS.INCLUSAO}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'SEO' THEN '${STANDARD_CATEGORY_IDS.SEO}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Docs' THEN '${STANDARD_CATEGORY_IDS.DOCS}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Blog' THEN '${STANDARD_CATEGORY_IDS.BLOG}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Social' THEN '${STANDARD_CATEGORY_IDS.SOCIAL}'`,
    );
    expect(phase64AtomicSql).toContain(
      `WHEN 'Linguagem Simples' THEN '${STANDARD_CATEGORY_IDS.LINGUAGEM_SIMPLES}'`,
    );
  });
});
