```sql
/*
  # Criação das Tabelas de Empresas e Setores de Atuação

  Este script cria as tabelas `setores_atuacao` e `empresas` para gerenciar informações de empresas e seus setores.

  1. Novas Tabelas:
     - `setores_atuacao`
       - `id` (uuid, primary key, default gen_random_uuid()): Identificador único do setor.
       - `nome` (text, not null, unique): Nome do setor de atuação.
       - `created_at` (timestamptz, default now()): Data de criação do registro.
       - `updated_at` (timestamptz, default now()): Data da última atualização.
     - `empresas`
       - `id` (uuid, primary key, default gen_random_uuid()): Identificador único da empresa.
       - `nome_fantasia` (text): Nome fantasia da empresa.
       - `razao_social` (text, not null): Razão social da empresa.
       - `cnpj` (text, not null, unique): CNPJ da empresa (ou identificador fiscal equivalente).
       - `area_de_atuacao_principal` (text): Principal área de atuação descrita textualmente.
       - `tags_descritivas` (text[]): Array de tags ou palavras-chave.
       - `setor_atuacao_id` (uuid, references setores_atuacao(id)): FK para o setor de atuação principal.
       - `estado` (text): Estado de localização da empresa.
       - `cidade` (text): Cidade de localização da empresa.
       - `porte_empresa` (text): Porte da empresa (ex: "Pequena", "Média", "Grande").
       - `data_fundacao` (date): Data de fundação da empresa.
       - `status_empresa` (text, default 'Ativa'): Status da empresa (ex: "Ativa", "Inativa").
       - `user_id` (uuid, references auth.users(id) on delete set null): Usuário que cadastrou a empresa.
       - `created_at` (timestamptz, default now()): Data de cadastro do registro.
       - `updated_at` (timestamptz, default now()): Data da última atualização.

  2. Índices:
     - `setores_atuacao`: em `nome`.
     - `empresas`: em `cnpj`, `nome_fantasia`, `razao_social`, `setor_atuacao_id`, `estado`, `cidade`, `porte_empresa`, `status_empresa`, `user_id`.
     - `empresas`: GIN índice em `tags_descritivas` para busca eficiente em arrays.

  3. Segurança (RLS):
     - Habilita RLS para ambas as tabelas.
     - `setores_atuacao`:
       - Autenticados podem ler.
       - (Opcional: admin/role específica para criar/atualizar/deletar setores - não incluído por simplicidade, assumindo que são dados mais estáticos).
     - `empresas`:
       - Autenticados podem ler todas as empresas.
       - Usuários podem inserir empresas associadas a si mesmos.
       - Usuários podem atualizar/deletar suas próprias empresas.

  4. Triggers:
     - Trigger para atualizar `updated_at` em ambas as tabelas.
*/

-- Função para atualizar 'updated_at' (reutilizável)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela setores_atuacao
CREATE TABLE IF NOT EXISTS public.setores_atuacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.setores_atuacao IS 'Stores company sectors of operation.';
COMMENT ON COLUMN public.setores_atuacao.nome IS 'Name of the sector (e.g., Technology, Health).';

CREATE INDEX IF NOT EXISTS idx_setores_atuacao_nome ON public.setores_atuacao(nome);

DROP TRIGGER IF EXISTS trigger_update_setores_atuacao_updated_at ON public.setores_atuacao;
CREATE TRIGGER trigger_update_setores_atuacao_updated_at
  BEFORE UPDATE ON public.setores_atuacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia text,
  razao_social text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  area_de_atuacao_principal text,
  tags_descritivas text[],
  setor_atuacao_id uuid REFERENCES public.setores_atuacao(id) ON DELETE SET NULL,
  estado text,
  cidade text,
  porte_empresa text, -- e.g., 'Pequena', 'Média', 'Grande'
  data_fundacao date,
  status_empresa text DEFAULT 'Ativa' NOT NULL, -- e.g., 'Ativa', 'Inativa'
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.empresas IS 'Stores information about companies.';
COMMENT ON COLUMN public.empresas.cnpj IS 'Unique company registration number (e.g., CNPJ for Brazil).';
COMMENT ON COLUMN public.empresas.tags_descritivas IS 'Array of descriptive tags for searchability.';
COMMENT ON COLUMN public.empresas.porte_empresa IS 'Size of the company (e.g., Small, Medium, Large).';
COMMENT ON COLUMN public.empresas.status_empresa IS 'Current operational status of the company (e.g., Active, Inactive).';
COMMENT ON COLUMN public.empresas.user_id IS 'User who registered this company.';

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_nome_fantasia ON public.empresas(nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_empresas_razao_social ON public.empresas(razao_social);
CREATE INDEX IF NOT EXISTS idx_empresas_setor_atuacao_id ON public.empresas(setor_atuacao_id);
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON public.empresas(estado);
CREATE INDEX IF NOT EXISTS idx_empresas_cidade ON public.empresas(cidade);
CREATE INDEX IF NOT EXISTS idx_empresas_porte_empresa ON public.empresas(porte_empresa);
CREATE INDEX IF NOT EXISTS idx_empresas_status_empresa ON public.empresas(status_empresa);
CREATE INDEX IF NOT EXISTS idx_empresas_user_id ON public.empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_empresas_tags_descritivas_gin ON public.empresas USING GIN (tags_descritivas); -- For array search

DROP TRIGGER IF EXISTS trigger_update_empresas_updated_at ON public.empresas;
CREATE TRIGGER trigger_update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para setores_atuacao
ALTER TABLE public.setores_atuacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all setores_atuacao"
  ON public.setores_atuacao FOR SELECT
  TO authenticated
  USING (true);

-- RLS para empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all empresas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own empresas"
  ON public.empresas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own empresas"
  ON public.empresas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own empresas"
  ON public.empresas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed alguns setores de atuação para teste
INSERT INTO public.setores_atuacao (nome) VALUES
('Tecnologia da Informação'),
('Saúde e Bem-estar'),
('Construção Civil'),
('Educação'),
('Varejo'),
('Serviços Financeiros'),
('Consultoria')
ON CONFLICT (nome) DO NOTHING;

```