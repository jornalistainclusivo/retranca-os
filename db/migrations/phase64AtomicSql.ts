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

  -- F. Exactly five standard workflow stages exist
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of workflow stages')
  WHERE (SELECT COUNT(*) FROM workflow_stages) != 5;

  -- G. Those five exact IDs exist
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Missing standard workflow IDs')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id NOT IN ('a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f', 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a', 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b')) > 0;

  -- H. Stage names exactly match
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Missing standard workflow names')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE display_name NOT IN ('Ideia', 'Pesquisa', 'Produção', 'Revisão', 'Publicado')) > 0;

  -- I. Semantic classifications exactly match
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Missing standard semantic classifications')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE semantic_classification NOT IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED')) > 0;

  -- J. Exactly one ACTIVE PUBLICATION role
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Exactly one active publication stage is required')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE lifecycle_role = 'PUBLICATION' AND is_active = 1) != 1;

  -- K. Publicado is PUBLISHED + PUBLICATION
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Publicado invariants failed')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b' AND (semantic_classification != 'PUBLISHED' OR lifecycle_role != 'PUBLICATION')) > 0;

  -- L. All other standard stages have lifecycle_role IS NULL
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Non-publication roles must be null')
  WHERE (SELECT COUNT(*) FROM workflow_stages WHERE id != 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b' AND lifecycle_role IS NOT NULL) > 0;

  -- M. Exactly eight standard categories exist
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid number of categories')
  WHERE (SELECT COUNT(*) FROM categories) != 8;

  -- N. Exact eight names exist
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Missing standard category names')
  WHERE (SELECT COUNT(*) FROM categories WHERE name NOT IN ('IA', 'Acessibilidade', 'Inclusão', 'SEO', 'Docs', 'Blog', 'Social', 'Linguagem Simples')) > 0;

  -- O. All eight categories have origin = standard
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Invalid category origin')
  WHERE (SELECT COUNT(*) FROM categories WHERE origin != 'standard') > 0;

  -- P/Q/R/S/T/U. Exact status mappings and preserved values
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Article data modified or mapped incorrectly')
  WHERE (SELECT COUNT(*) FROM articles a JOIN _snapshot_articles s ON a.id = s.id WHERE
      a.status != s.status OR
      a.categoryTag != s.categoryTag OR
      a.publishDate != s.publishDate OR
      IFNULL(a.completedAt, '') != IFNULL(s.completedAt, '') OR
      a.workflow_stage_id != CASE s.status
        WHEN 'ideia' THEN 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d'
        WHEN 'pesquisa' THEN 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
        WHEN 'escrita' THEN 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'
        WHEN 'revisao' THEN 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'
        WHEN 'publicado' THEN 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
      END OR
      a.category_id != CASE s.categoryTag
        WHEN 'IA' THEN '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
        WHEN 'Acessibilidade' THEN '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'
        WHEN 'Inclusão' THEN '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f'
        WHEN 'SEO' THEN '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a'
        WHEN 'Docs' THEN '5e6f7a8b-9c0d-4e1f-2a3b-4c5d6e7f8a9b'
        WHEN 'Blog' THEN '6f7a8b9c-0d1e-4f2a-3b4c-5d6e7f8a9b0c'
        WHEN 'Social' THEN '7a8b9c0d-1e2f-4a3b-4c5d-6e7f8a9b0c1d'
        WHEN 'Linguagem Simples' THEN '8b9c0d1e-2f3a-4b4c-5d6e-7f8a9b0c1d2e'
      END) > 0;

  -- V. checklist_items row count unchanged
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Checklist items count changed')
  WHERE (SELECT COUNT(*) FROM checklist_items) != (SELECT COUNT(*) FROM _snapshot_checklist_items);

  -- W. checklist_items content unchanged
  SELECT RAISE(ROLLBACK, 'ERR_MIGRATION_FAILED: Checklist items content changed')
  WHERE (SELECT COUNT(*) FROM checklist_items c JOIN _snapshot_checklist_items s ON c.id = s.id WHERE
      c.articleId != s.articleId OR
      c.label != s.label OR
      c.completed != s.completed OR
      IFNULL(c.category, '') != IFNULL(s.category, '')) > 0;
END;

INSERT INTO _migration_guards(id) VALUES(1);
DROP TRIGGER trg_verify_migration;
DROP TABLE _migration_guards;

DROP TABLE _snapshot_articles;
DROP TABLE _snapshot_checklist_items;

PRAGMA user_version = 1;
COMMIT;
`;
