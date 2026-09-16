export const phase64AtomicSql = `
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- CREATE SNAPSHOTS FOR VERIFICATION
CREATE TEMP TABLE _snapshot_articles AS SELECT id, status, categoryTag, publishDate, completedAt FROM articles;
CREATE TEMP TABLE _snapshot_checklist_items AS SELECT id, articleId, label, completed, category FROM checklist_items;

-- Phase 6.4 EXPAND: Dynamic workflow, categories, checklist templates
CREATE TABLE IF NOT EXISTS workflow_stages (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL COLLATE NOCASE,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  semantic_classification TEXT CHECK(semantic_classification IS NULL OR semantic_classification IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED')),
  lifecycle_role TEXT CHECK (lifecycle_role IS NULL OR lifecycle_role = 'PUBLICATION'),
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_stages_active_name ON workflow_stages(display_name) WHERE is_active = 1;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_stages_publication ON workflow_stages(lifecycle_role) WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  origin TEXT NOT NULL CHECK(origin IN ('standard', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_active_name ON categories(name) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS checklist_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  items_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_templates_name ON checklist_templates(name);

-- Phase 6.4 EXPAND: Add nullable workflow_stage_id and category_id to articles
ALTER TABLE articles ADD COLUMN workflow_stage_id TEXT REFERENCES workflow_stages(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE articles ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- SEED WORKFLOW STAGES
INSERT INTO workflow_stages (id, display_name, order_index, semantic_classification, lifecycle_role, is_active) VALUES 
('a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', 'Ideia', 0, 'IDEA', NULL, 1),
('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', 'Pesquisa', 1, 'RESEARCH', NULL, 1),
('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f', 'Produção', 2, 'DRAFTING', NULL, 1),
('d3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a', 'Revisão', 3, 'REVIEW', NULL, 1),
('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b', 'Publicado', 4, 'PUBLISHED', 'PUBLICATION', 1);

-- SEED CATEGORIES
INSERT INTO categories (id, name, origin, is_active) VALUES 
('1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'IA', 'standard', 1),
('2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'Acessibilidade', 'standard', 1),
('3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f', 'Inclusão', 'standard', 1),
('4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a', 'SEO', 'standard', 1),
('5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b', 'Docs', 'standard', 1),
('6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'Blog', 'standard', 1),
('7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d', 'Social', 'standard', 1),
('8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e', 'Linguagem Simples', 'standard', 1);

-- MAP ARTICLES
UPDATE articles SET
  workflow_stage_id = CASE status
    WHEN 'ideia' THEN 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d'
    WHEN 'pesquisa' THEN 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
    WHEN 'escrita' THEN 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'
    WHEN 'revisao' THEN 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'
    WHEN 'publicado' THEN 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
  END,
  category_id = CASE categoryTag
    WHEN 'IA' THEN '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
    WHEN 'Acessibilidade' THEN '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'
    WHEN 'Inclusão' THEN '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f'
    WHEN 'SEO' THEN '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a'
    WHEN 'Docs' THEN '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b'
    WHEN 'Blog' THEN '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c'
    WHEN 'Social' THEN '7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d'
    WHEN 'Linguagem Simples' THEN '8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e'
  END;

-- VERIFY GUARDS BEFORE COMMIT
CREATE TEMP TABLE _migration_guards (id INTEGER PRIMARY KEY);
CREATE TEMP TRIGGER trg_verify_migration BEFORE INSERT ON _migration_guards BEGIN
  -- A. Article count unchanged
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Article count changed')
  WHERE (SELECT COUNT(*) FROM articles) != (SELECT COUNT(*) FROM _snapshot_articles);

  -- B. Every article has non-null workflow_stage_id
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_UNKNOWN_LEGACY_VALUE')
  WHERE (SELECT COUNT(*) FROM articles WHERE workflow_stage_id IS NULL) > 0;

  -- C. Every article has non-null category_id
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_UNKNOWN_LEGACY_VALUE')
  WHERE (SELECT COUNT(*) FROM articles WHERE category_id IS NULL) > 0;

  -- D. Every workflow_stage_id references an existing workflow stage
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid workflow_stage_id reference')
  WHERE (SELECT COUNT(*) FROM articles a LEFT JOIN workflow_stages w ON a.workflow_stage_id = w.id WHERE w.id IS NULL) > 0;

  -- E. Every category_id references an existing category
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid category_id reference')
  WHERE (SELECT COUNT(*) FROM articles a LEFT JOIN categories c ON a.category_id = c.id WHERE c.id IS NULL) > 0;

  -- F. Exact workflow tuples verify
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Ideia workflow missing')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d' AND display_name = 'Ideia' AND order_index = 0 AND semantic_classification = 'IDEA' AND lifecycle_role IS NULL AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Pesquisa workflow missing')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e' AND display_name = 'Pesquisa' AND order_index = 1 AND semantic_classification = 'RESEARCH' AND lifecycle_role IS NULL AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Produção workflow missing')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f' AND display_name = 'Produção' AND order_index = 2 AND semantic_classification = 'DRAFTING' AND lifecycle_role IS NULL AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Revisão workflow missing')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a' AND display_name = 'Revisão' AND order_index = 3 AND semantic_classification = 'REVIEW' AND lifecycle_role IS NULL AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Publicado workflow missing')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b' AND display_name = 'Publicado' AND order_index = 4 AND semantic_classification = 'PUBLISHED' AND lifecycle_role = 'PUBLICATION' AND is_active = 1) != 1;

  -- G. No extra workflow stages
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of workflow stages')
  WHERE (SELECT COUNT(*) FROM workflow_stages) != 5;

  -- H. Exact category tuples verify
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact IA category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d' AND name = 'IA' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Acessibilidade category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e' AND name = 'Acessibilidade' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Inclusão category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f' AND name = 'Inclusão' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact SEO category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a' AND name = 'SEO' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Docs category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b' AND name = 'Docs' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Blog category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c' AND name = 'Blog' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Social category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d' AND name = 'Social' AND origin = 'standard' AND is_active = 1) != 1;
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exact Linguagem Simples category missing')
  WHERE (SELECT COUNT(*) FROM categories WHERE id = '8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e' AND name = 'Linguagem Simples' AND origin = 'standard' AND is_active = 1) != 1;

  -- I. No extra categories
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of categories')
  WHERE (SELECT COUNT(*) FROM categories) != 8;

  -- J. Article snapshot exact-set preservation using EXCEPT
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Article data modified or mapped incorrectly')
  WHERE EXISTS (
    SELECT id, status, categoryTag, publishDate, completedAt FROM _snapshot_articles
    EXCEPT
    SELECT id, status, categoryTag, publishDate, completedAt FROM articles
  ) OR EXISTS (
    SELECT id, status, categoryTag, publishDate, completedAt FROM articles
    EXCEPT
    SELECT id, status, categoryTag, publishDate, completedAt FROM _snapshot_articles
  );

  -- K. Article exact mappings
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Article mapping incorrect')
  WHERE (SELECT COUNT(*) FROM articles WHERE
      workflow_stage_id != CASE status
        WHEN 'ideia' THEN 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d'
        WHEN 'pesquisa' THEN 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
        WHEN 'escrita' THEN 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'
        WHEN 'revisao' THEN 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'
        WHEN 'publicado' THEN 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
      END OR
      category_id != CASE categoryTag
        WHEN 'IA' THEN '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
        WHEN 'Acessibilidade' THEN '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'
        WHEN 'Inclusão' THEN '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f'
        WHEN 'SEO' THEN '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a'
        WHEN 'Docs' THEN '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b'
        WHEN 'Blog' THEN '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c'
        WHEN 'Social' THEN '7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d'
        WHEN 'Linguagem Simples' THEN '8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e'
      END) > 0;

  -- L. Checklist items exact-set preservation using EXCEPT
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Checklist items content changed')
  WHERE EXISTS (
    SELECT id, articleId, label, completed, category FROM _snapshot_checklist_items
    EXCEPT
    SELECT id, articleId, label, completed, category FROM checklist_items
  ) OR EXISTS (
    SELECT id, articleId, label, completed, category FROM checklist_items
    EXCEPT
    SELECT id, articleId, label, completed, category FROM _snapshot_checklist_items
  );
END;

INSERT INTO _migration_guards(id) VALUES(1);
DROP TRIGGER trg_verify_migration;
DROP TABLE _migration_guards;

DROP TABLE _snapshot_articles;
DROP TABLE _snapshot_checklist_items;

PRAGMA user_version = 1;
COMMIT;
`;
