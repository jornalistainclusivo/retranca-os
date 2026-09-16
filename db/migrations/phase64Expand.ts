export const phase64ExpandSQL = `
  -- Phase 6.4 EXPAND: Dynamic workflow, categories, checklist templates
  CREATE TABLE IF NOT EXISTS workflow_stages (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL COLLATE NOCASE,
    order_index INTEGER NOT NULL CHECK (order_index >= 0),
    semantic_classification TEXT CHECK(semantic_classification IS NULL OR semantic_classification IN ('IDEA', 'RESEARCH', 'DRAFTING', 'REVIEW', 'PUBLISHED')),
    lifecycle_role TEXT CHECK (lifecycle_role IS NULL OR lifecycle_role = 'PUBLICATION'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
`;
