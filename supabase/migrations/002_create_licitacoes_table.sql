```sql
/*
  # Criação da Tabela de Licitações

  Este script cria a tabela `licitacoes` para armazenar informações sobre os processos licitatórios.

  1. Nova Tabela:
     - `licitacoes`
       - `id` (serial, chave primária): Identificador único da licitação.
       - `numero` (text, not null): Número ou código da licitação.
       - `orgao` (text, not null): Órgão responsável pela licitação.
       - `objeto` (text, not null): Descrição do objeto da licitação.
       - `modalidade` (text, not null): Modalidade da licitação (ex: Pregão, Concorrência).
       - `status` (text, not null, default 'aberta'): Status atual da licitação (ex: 'aberta', 'encerrada', 'em análise').
       - `valor_estimado` (text): Valor estimado da contratação.
       - `data_abertura` (timestamp, not null): Data e hora de abertura da licitação.
       - `data_fechamento` (timestamp): Data e hora de fechamento para propostas.
       - `descricao` (text): Descrição mais detalhada ou informações adicionais.
       - `user_id` (uuid): ID do usuário (de `auth.users`) que cadastrou ou está gerenciando esta licitação.
       - `created_at` (timestamptz, default now()): Data de criação do registro.
       - `updated_at` (timestamptz, default now()): Data da última atualização do registro.

  2. Chaves Estrangeiras:
     - `licitacoes.user_id` referencia `auth.users.id`.

  3. Índices:
     - Índice em `numero` para buscas rápidas.
     - Índice em `status` para filtragem.
     - Índice em `modalidade` para filtragem.
     - Índice em `user_id` para consultas por usuário.

  4. Segurança:
     - Habilita Row Level Security (RLS) na tabela `licitacoes`.
     - Política "Authenticated users can read all licitacoes": Permite que usuários autenticados leiam todas as licitações.
     - Política "Users can insert their own licitacoes": Permite que usuários autenticados criem licitações associadas a si.
     - Política "Users can update their own licitacoes": Permite que usuários autenticados atualizem suas próprias licitações.
     - Política "Users can delete their own licitacoes": Permite que usuários autenticados deletem suas próprias licitações.
*/

-- 1. Criação da tabela licitacoes
CREATE TABLE IF NOT EXISTS public.licitacoes (
  id serial PRIMARY KEY,
  numero text NOT NULL,
  orgao text NOT NULL,
  objeto text NOT NULL,
  modalidade text NOT NULL,
  status text NOT NULL DEFAULT 'aberta',
  valor_estimado text, -- Pode ser numeric, mas text é mais flexível para formatos variados
  data_abertura timestamptz NOT NULL,
  data_fechamento timestamptz,
  descricao text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Quem cadastrou/gerencia
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_licitacoes_numero ON public.licitacoes(numero);
CREATE INDEX IF NOT EXISTS idx_licitacoes_status ON public.licitacoes(status);
CREATE INDEX IF NOT EXISTS idx_licitacoes_modalidade ON public.licitacoes(modalidade);
CREATE INDEX IF NOT EXISTS idx_licitacoes_user_id ON public.licitacoes(user_id);

-- Trigger para atualizar 'updated_at'
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_licitacoes_updated_at ON public.licitacoes;
CREATE TRIGGER trigger_update_licitacoes_updated_at
  BEFORE UPDATE ON public.licitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Habilitar Row Level Security
ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para licitacoes
CREATE POLICY "Authenticated users can read all licitacoes"
  ON public.licitacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own licitacoes"
  ON public.licitacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own licitacoes"
  ON public.licitacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own licitacoes"
  ON public.licitacoes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE public.licitacoes IS 'Stores information about public tenders and bidding processes.';
COMMENT ON COLUMN public.licitacoes.user_id IS 'User who created or is managing this tender.';
```