```sql
/*
  # Criação da Tabela de Documentos

  Este script cria a tabela `documentos` para armazenar informações sobre arquivos
  relacionados a licitações ou propostas.

  1. Nova Tabela:
     - `documentos`
       - `id` (serial, chave primária): Identificador único do documento.
       - `nome` (text, not null): Nome do arquivo/documento.
       - `tipo` (text, not null): Tipo ou categoria do documento (ex: 'edital', 'anexo', 'proposta_tecnica').
       - `url` (text, not null): URL para acessar o documento (pode ser um link para Supabase Storage).
       - `tamanho` (integer): Tamanho do arquivo em bytes.
       - `licitacao_id` (integer): Referencia `licitacoes.id` se o documento for da licitação.
       - `proposta_id` (integer): Referencia `propostas.id` se o documento for da proposta.
       - `uploaded_by` (uuid): ID do usuário (de `auth.users`) que fez o upload do documento.
       - `created_at` (timestamptz, default now()): Data de criação do registro.

  2. Chaves Estrangeiras:
     - `documentos.licitacao_id` referencia `licitacoes.id`.
     - `documentos.proposta_id` referencia `propostas.id`.
     - `documentos.uploaded_by` referencia `auth.users.id`.

  3. Índices:
     - Índice em `licitacao_id`.
     - Índice em `proposta_id`.
     - Índice em `uploaded_by`.

  4. Segurança:
     - Habilita Row Level Security (RLS) na tabela `documentos`.
     - Política "Authenticated users can read relevant documents": Permite leitura de documentos que o usuário tem permissão para ver.
     - Política "Users can insert documents they upload and own parent": Permite upload se o usuário for o uploader e tiver permissão sobre a licitação/proposta.
     - Política "Users can update documents they uploaded": Permite atualização.
     - Política "Users can delete documents they uploaded": Permite deleção.
*/

-- 1. Criação da tabela documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL, -- e.g., 'edital', 'anexo_tecnico', 'documento_proposta'
  url text NOT NULL, -- URL para o arquivo (e.g., Supabase Storage)
  tamanho integer, -- Tamanho em bytes
  licitacao_id integer REFERENCES public.licitacoes(id) ON DELETE CASCADE,
  proposta_id integer REFERENCES public.propostas(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_documentos_licitacao_id ON public.documentos(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_proposta_id ON public.documentos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_uploaded_by ON public.documentos(uploaded_by);

-- 3. Habilitar Row Level Security
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para documentos
CREATE POLICY "Authenticated users can read relevant documents"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (
    (uploaded_by = auth.uid()) OR -- User uploaded the document
    (licitacao_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.licitacoes WHERE id = documentos.licitacao_id)) OR -- Document of a public licitacao (licitacoes RLS allows authenticated read)
    (proposta_id IS NOT NULL AND EXISTS ( -- Document of a proposal the user can access
      SELECT 1 FROM public.propostas p
      WHERE p.id = documentos.proposta_id AND (
        p.user_id = auth.uid() OR -- User owns the proposal
        EXISTS (SELECT 1 FROM public.licitacoes l WHERE l.id = p.licitacao_id AND l.user_id = auth.uid()) -- User owns the licitacao of the proposal
      )
    ))
  );

CREATE POLICY "Users can insert documents they upload and own parent"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    ( -- Check if licitacao_id is NULL OR user owns the licitacao
      licitacao_id IS NULL OR
      EXISTS (SELECT 1 FROM public.licitacoes l WHERE l.id = documentos.licitacao_id AND l.user_id = auth.uid())
    ) AND
    ( -- Check if proposta_id is NULL OR user owns the proposal
      proposta_id IS NULL OR
      EXISTS (SELECT 1 FROM public.propostas p WHERE p.id = documentos.proposta_id AND p.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update documents they uploaded"
  ON public.documentos FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete documents they uploaded"
  ON public.documentos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Comentários
COMMENT ON TABLE public.documentos IS 'Stores documents related to tenders or proposals.';
COMMENT ON COLUMN public.documentos.url IS 'URL to the stored document, e.g., in Supabase Storage.';
COMMENT ON COLUMN public.documentos.uploaded_by IS 'User who uploaded the document.';
```