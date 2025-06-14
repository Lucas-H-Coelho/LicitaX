```sql
/*
  # Correção da Relação Empresa na Tabela Propostas

  Este script implementa a Opção B do relatório de consistência para a tabela `propostas`:
  1. Garante que `empresa.cnpj_basico` seja UNIQUE (necessário para ser alvo de FK).
     - Se `cnpj_basico` já for PK, esta etapa não adicionará uma constraint UNIQUE redundante.
  2. Adiciona a coluna `empresa_cnpj_basico` (TEXT) à tabela `propostas`, se não existir.
     - A coluna `empresa_id` (INTEGER), mencionada no CSV e no relatório, não existe na migração `003_create_propostas_table.sql`.
       Esta migração adiciona a forma correta de vincular à empresa.
  3. Adiciona uma chave estrangeira de `propostas.empresa_cnpj_basico` para `empresa.cnpj_basico`.

  Dependências:
  - A tabela `propostas` deve existir (criada por `003_create_propostas_table.sql`).
  - A tabela `empresa` deve existir com a coluna `cnpj_basico` (TEXT).
*/

-- Garantir que empresa.cnpj_basico seja UNIQUE para ser referenciado por uma FK.
DO $$
BEGIN
  -- Verificar se já existe uma constraint UNIQUE ou PK em empresa.cnpj_basico
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'empresa' AND kcu.column_name = 'cnpj_basico'
    AND (tc.constraint_type = 'PRIMARY KEY' OR tc.constraint_type = 'UNIQUE')
  ) THEN
    ALTER TABLE public.empresa ADD CONSTRAINT empresa_cnpj_basico_unique UNIQUE (cnpj_basico);
  END IF;
END $$;

-- Adicionar a coluna 'empresa_cnpj_basico' à tabela 'propostas' se ela não existir.
-- A migração 003 não criou 'empresa_id', então estamos adicionando a ligação correta.
ALTER TABLE public.propostas ADD COLUMN IF NOT EXISTS empresa_cnpj_basico TEXT;

-- Adicionar a chave estrangeira
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='propostas' AND column_name='empresa_cnpj_basico' AND table_schema='public') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empresa' AND column_name='cnpj_basico' AND table_schema='public') THEN

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_name = 'fk_propostas_empresa_cnpj' AND constraint_schema = 'public'
    ) THEN
      ALTER TABLE public.propostas
      ADD CONSTRAINT fk_propostas_empresa_cnpj
      FOREIGN KEY (empresa_cnpj_basico) REFERENCES public.empresa(cnpj_basico);
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN public.propostas.empresa_cnpj_basico IS 'CNPJ básico da empresa que submeteu a proposta, referenciando public.empresa.';

-- As políticas de RLS para 'propostas' já foram definidas em 003_create_propostas_table.sql.
-- A nova coluna 'empresa_cnpj_basico' será coberta pelas políticas existentes
-- que se baseiam em 'user_id' para inserção/atualização/deleção pelo proprietário.
-- A política de leitura "Licitacao owner can read proposals for their licitacao" também permanece válida.
    ```