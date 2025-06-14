```sql
/*
  # Correção do Esquema da Tabela CNAE

  Este script corrige a tabela `cnae` e suas referências:
  1. Altera o tipo da coluna `cnae.codigo` de TEXT para INTEGER.
  2. Converte os valores existentes de `cnae.codigo` para INTEGER.
     - Remove caracteres não numéricos antes de converter.
  3. Define `cnae.codigo` (INTEGER) como a chave primária da tabela `cnae`.
  4. Adiciona/Atualiza a chave estrangeira em `estabelecimento.cnae_fiscal_principal` para referenciar `cnae.codigo`.

  Dependências:
  - A tabela `cnae` deve existir.
  - A tabela `estabelecimento` deve existir com a coluna `cnae_fiscal_principal`.
*/

-- Adicionar uma coluna temporária para a conversão segura
ALTER TABLE public.cnae ADD COLUMN IF NOT EXISTS codigo_int INTEGER;

-- Tentar converter os valores de 'codigo' (text) para 'codigo_int' (integer)
-- Remove caracteres não numéricos e converte para INTEGER. NULL se vazio ou não conversível.
DO $$
BEGIN
  UPDATE public.cnae
  SET codigo_int = CAST(NULLIF(regexp_replace(codigo, '[^0-9]', '', 'g'), '') AS INTEGER)
  WHERE codigo_int IS NULL; -- Apenas se ainda não convertido
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Alguns valores de cnae.codigo não puderam ser convertidos para INTEGER: %', SQLERRM;
END $$;

-- Remover a chave estrangeira existente em 'estabelecimento' se ela apontar para a coluna 'codigo' antiga (text)
-- (O nome da FK pode variar, ajuste 'fk_estabelecimento_cnae_old' se necessário)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'estabelecimento' AND column_name = 'cnae_fiscal_principal'
    AND constraint_name = 'fk_estabelecimento_cnae' -- Nome da FK, pode variar
  ) THEN
    -- Verificar se a FK aponta para cnae.codigo e se cnae.codigo é TEXT
    IF EXISTS (
        SELECT 1
        FROM information_schema.referential_constraints rc
        JOIN information_schema.key_column_usage kcu_pk ON rc.unique_constraint_name = kcu_pk.constraint_name AND rc.unique_constraint_schema = kcu_pk.constraint_schema
        JOIN information_schema.columns col_pk ON kcu_pk.table_schema = col_pk.table_schema AND kcu_pk.table_name = col_pk.table_name AND kcu_pk.column_name = col_pk.column_name
        WHERE rc.constraint_name = 'fk_estabelecimento_cnae'
          AND rc.constraint_schema = 'public'
          AND kcu_pk.table_name = 'cnae'
          AND kcu_pk.column_name = 'codigo'
          AND col_pk.data_type = 'text'
    ) THEN
        ALTER TABLE public.estabelecimento DROP CONSTRAINT IF EXISTS fk_estabelecimento_cnae;
    END IF;
  END IF;
END $$;


-- Remover a chave primária antiga se 'codigo' (text) era PK
DO $$
DECLARE
  pk_name TEXT;
BEGIN
  SELECT constraint_name INTO pk_name
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'cnae' AND constraint_type = 'PRIMARY KEY';

  IF pk_name IS NOT NULL THEN
    -- Verificar se a PK é na coluna 'codigo' e se é do tipo TEXT
    IF EXISTS (
        SELECT 1
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.columns c ON kcu.table_schema = c.table_schema AND kcu.table_name = c.table_name AND kcu.column_name = c.column_name
        WHERE kcu.constraint_name = pk_name
          AND kcu.table_schema = 'public'
          AND kcu.table_name = 'cnae'
          AND kcu.column_name = 'codigo'
          AND c.data_type = 'text'
    ) THEN
        EXECUTE 'ALTER TABLE public.cnae DROP CONSTRAINT IF EXISTS ' || quote_ident(pk_name);
    END IF;
  END IF;
END $$;

-- Remover a coluna 'codigo' original (text)
ALTER TABLE public.cnae DROP COLUMN IF EXISTS codigo;

-- Renomear a nova coluna 'codigo_int' para 'codigo'
ALTER TABLE public.cnae RENAME COLUMN codigo_int TO codigo;

-- Definir a nova coluna 'codigo' (integer) como chave primária
-- (Apenas se não houver outra PK e 'codigo' for adequado para ser PK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'cnae' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.cnae ADD PRIMARY KEY (codigo);
  ELSE
    -- Se já existe uma PK diferente, garantir que 'codigo' seja UNIQUE e NOT NULL
    ALTER TABLE public.cnae ALTER COLUMN codigo SET NOT NULL;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'cnae' AND column_name = 'codigo' AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE public.cnae ADD CONSTRAINT cnae_codigo_unique UNIQUE (codigo);
    END IF;
  END IF;
END $$;

-- Adicionar a chave estrangeira em 'estabelecimento' referenciando o novo 'cnae.codigo' (integer)
-- Assegurar que cnae_fiscal_principal em estabelecimento seja INTEGER
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estabelecimento' AND column_name='cnae_fiscal_principal' AND table_schema='public') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cnae' AND column_name='codigo' AND table_schema='public') THEN

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.referential_constraints
        WHERE constraint_name = 'fk_estabelecimento_cnae' AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE public.estabelecimento
        ADD CONSTRAINT fk_estabelecimento_cnae
        FOREIGN KEY (cnae_fiscal_principal) REFERENCES public.cnae(codigo);
    END IF;
  END IF;
END $$;

-- Habilitar RLS para cnae se ainda não estiver (opcional, mas bom para consistência)
ALTER TABLE public.cnae ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de CNAEs por usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cnae' AND policyname = 'Authenticated users can read cnae'
  ) THEN
    CREATE POLICY "Authenticated users can read cnae"
      ON public.cnae FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

COMMENT ON COLUMN public.cnae.codigo IS 'Código CNAE (Classificação Nacional de Atividades Econômicas), agora como INTEGER.';
    ```