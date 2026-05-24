-- Tabela única com todos os dados do app por usuário
CREATE TABLE IF NOT EXISTS app_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL UNIQUE,
  fornos      jsonb DEFAULT '{}',   -- { cedan: {semanas,pontos,...}, continuo: {...} }
  settings    jsonb DEFAULT '{}',
  -- colunas legadas (mantidas para compatibilidade na leitura)
  semanas     jsonb DEFAULT '[]',
  pontos      jsonb DEFAULT '[]',
  employees   jsonb DEFAULT '[]',
  forno       jsonb DEFAULT '{}',
  carregamentos jsonb DEFAULT '[]',
  updated_at  timestamptz DEFAULT now()
);

-- Row Level Security: cada usuário só acessa os próprios dados
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON app_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Acesso de Visualizadores ─────────────────────────────────────────────────
-- Admin convida viewers pelo email; viewer lê dados do owner sem poder editar

CREATE TABLE IF NOT EXISTS viewer_access (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_email text NOT NULL,
  forno_key    text,                          -- chave do forno ao qual este acesso se refere
  label        text,                          -- nome exibido no seletor de forno (ex: "Forno Contínuo")
  role         text NOT NULL DEFAULT 'viewer', -- 'viewer' | 'editor'
  scopes       text[] DEFAULT ARRAY['dash','semana','carga','ponto','equipe','forno','camara'],
  created_at   timestamptz DEFAULT now(),
  UNIQUE (owner_id, viewer_email, forno_key)  -- um acesso por viewer por forno por owner
);

ALTER TABLE viewer_access ENABLE ROW LEVEL SECURITY;

-- Admin gerencia seus próprios convites
CREATE POLICY "owner_manages_viewers" ON viewer_access
  FOR ALL USING (auth.uid() = owner_id);

-- Viewer pode ler o próprio convite (para descobrir o owner_id)
CREATE POLICY "viewer_reads_own_invite" ON viewer_access
  FOR SELECT USING (auth.jwt() ->> 'email' = viewer_email);

-- Viewers e editors podem ler os dados do owner (SELECT)
CREATE POLICY "viewer_read_owner_data" ON app_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM viewer_access
      WHERE owner_id = app_data.user_id
        AND viewer_email = auth.jwt() ->> 'email'
    )
  );

-- Editors podem gravar nos dados do owner (INSERT e UPDATE, nunca DELETE)
CREATE POLICY "editor_write_owner_data" ON app_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viewer_access
      WHERE owner_id = app_data.user_id
        AND viewer_email = auth.jwt() ->> 'email'
        AND role = 'editor'
    )
  );

CREATE POLICY "editor_update_owner_data" ON app_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM viewer_access
      WHERE owner_id = app_data.user_id
        AND viewer_email = auth.jwt() ->> 'email'
        AND role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viewer_access
      WHERE owner_id = app_data.user_id
        AND viewer_email = auth.jwt() ->> 'email'
        AND role = 'editor'
    )
  );
