```sql
/*
  # Criação da Tabela de Propostas

  Este script cria a tabela `propostas` para armazenar as propostas submetidas pelos usuários/empresas para as licitações.

  1. Nova Tabela:
     - `propostas`
       - `id` (serial, chave primária): Identificador único da proposta.
       - `licitacao_id` (integer, not null): Referencia `licitacoes.id`.
       - `user_id` (uuid, not null): Referencia `auth.users.id` (o usuário que submeteu a proposta).
       - `valor` (text, not null): Valor da proposta. Pode ser numeric, mas text é mais flexível.
       - `status` (text, not null, default 'enviada'): Status da proposta (ex: 'enviada', 'em análise', 'aceita', 'rejeitada').
       - `data_envio` (timestamptz, default now()): Data de envio da proposta.
       - `observacoes` (text): Observações ou comentários adicionais sobre a proposta.
       - `vencedora` (boolean, default false): Indica se esta proposta foi a vencedora.
       - `created_at` (timestamptz, default now()): Data de criação do registro.
       - `updated_at` (timestamptz, default now()): Data da última atualização do registro.

  2. Chaves Estrangeiras:
     - `propostas.licitacao_id` referencia `licitacoes.id`.
     - `propostas.user_id` referencia `auth.users.id`.

  3. Índices:
     - Índice em `licitacao_id` para consultas por licitação.
     - Índice em `user_id` para consultas por usuário.
     - Índice em `status` para filtragem.

  4. Segurança:
     - Habilita Row Level Security (RLS) na tabela `propostas`.
     - Política "Users can read their own proposals": Permite que usuários autenticados leiam suas próprias propostas.
     - Política "Users can insert their own proposals": Permite que usuários autenticados criem propostas.
     - Política "Users can update their own proposals": Permite que usuários autenticados atualizem suas próprias propostas.
     - Política "Users can delete their own proposals": Permite que usuários autenticados deletem suas próprias propostas.
     - Política "Admins/Managers of licitacao can read proposals for their licitacao": (Opcional, mais complexa) Permite que o criador/gerente da licitação veja todas as propostas para ela.
*/

-- 1. Criação da tabela propostas
CREATE TABLE IF NOT EXISTS public.propostas (
  id serial PRIMARY KEY,
  licitacao_id integer NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Usuário que submeteu
  valor text NOT NULL, -- Usar NUMERIC(15,2) se precisar de cálculos precisos no DB
  status text NOT NULL DEFAULT 'enviada',
  data_envio timestamptz DEFAULT now() NOT NULL,
  observacoes text,
  vencedora boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_propostas_licitacao_id ON public.propostas(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_propostas_user_id ON public.propostas(user_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON public.propostas(status);

-- Trigger para atualizar 'updated_at'
DROP TRIGGER IF EXISTS trigger_update_propostas_updated_at ON public.propostas;
CREATE TRIGGER trigger_update_propostas_updated_at
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); -- Reutiliza a função criada anteriormente

-- 3. Habilitar Row Level Security
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para propostas
CREATE POLICY "Users can read their own proposals"
  ON public.propostas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proposals"
  ON public.propostas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
  ON public.propostas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals"
  ON public.propostas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para o dono da licitação ver as propostas (exemplo)
CREATE POLICY "Licitacao owner can read proposals for their licitacao"
  ON public.propostas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.licitacoes l
      WHERE l.id = licitacao_id AND l.user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.propostas IS 'Stores proposals submitted by users for tenders.';
COMMENT ON COLUMN public.propostas.user_id IS 'User (company/consultant) who submitted the proposal.';
```