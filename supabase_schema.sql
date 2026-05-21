-- Tabela única com todos os dados do app por usuário
CREATE TABLE IF NOT EXISTS app_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL UNIQUE,
  semanas     jsonb DEFAULT '[]',
  pontos      jsonb DEFAULT '[]',
  employees   jsonb DEFAULT '[]',
  settings    jsonb DEFAULT '{}',
  forno       jsonb DEFAULT '{}',
  updated_at  timestamptz DEFAULT now()
);

-- Row Level Security: cada usuário só acessa os próprios dados
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON app_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
