CREATE TABLE workspace (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    owner_id    UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspace(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    topology     JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    compose_yaml TEXT,
    status       VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         VARCHAR(100) NOT NULL UNIQUE,
    name         VARCHAR(255) NOT NULL,
    category     VARCHAR(50) NOT NULL,
    description  TEXT,
    topology     JSONB NOT NULL,
    compose_yaml TEXT NOT NULL,
    is_builtin   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deploy_run (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    status        VARCHAR(50) NOT NULL,
    compose_hash  VARCHAR(64),
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE compose_snapshot (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    yaml_content TEXT NOT NULL,
    version      INT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_workspace ON project(workspace_id);
CREATE INDEX idx_template_category ON template(category);
CREATE INDEX idx_deploy_run_project ON deploy_run(project_id);
CREATE INDEX idx_compose_snapshot_project ON compose_snapshot(project_id);

INSERT INTO workspace (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Default', 'default');
