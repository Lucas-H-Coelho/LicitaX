```sql
    /*
      # Add Indexes to public.estabelecimento

      This migration adds several indexes to the `public.estabelecimento` table to improve query performance for filtering, searching, and sorting operations, particularly for the 'Empresas' section.

      1. New Indexes:
        - `idx_estabelecimento_cnpj_basico`: On `cnpj_basico` for faster joins with `empresa` and direct CNPJ lookups.
        - `idx_estabelecimento_nome_fantasia_gin`: A GIN index on `nome_fantasia` using `gin_trgm_ops` for efficient ILIKE searches.
        - `idx_estabelecimento_cnae_fiscal_principal`: On `cnae_fiscal_principal` for filtering and joins.
        - `idx_estabelecimento_uf`: On `uf` for filtering.
        - `idx_estabelecimento_municipio`: On `municipio` for filtering and joins.
        - `idx_estabelecimento_situacao_cadastral`: On `situacao_cadastral` for filtering.
        - `idx_estabelecimento_data_inicio_atividade`: On `data_inicio_atividade` for range filters and sorting.
        - `idx_estabelecimento_uf_municipio_situacao`: A composite index for common filter combinations.

      2. Notes:
        - The GIN index on `nome_fantasia` requires the `pg_trgm` extension.
        - Consider the cardinality of columns when creating indexes. Highly selective columns benefit most.
    */

    -- Index for joining and direct CNPJ lookup
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_cnpj_basico ON public.estabelecimento (cnpj_basico);

    -- GIN Index for ILIKE searches on nome_fantasia (requires pg_trgm extension)
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_nome_fantasia_gin ON public.estabelecimento USING gin (nome_fantasia gin_trgm_ops);

    -- Indexes for filtering
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_cnae_fiscal_principal ON public.estabelecimento (cnae_fiscal_principal);
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_uf ON public.estabelecimento (uf);
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_municipio ON public.estabelecimento (municipio);
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_situacao_cadastral ON public.estabelecimento (situacao_cadastral);

    -- Index for date range filtering and sorting
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_data_inicio_atividade ON public.estabelecimento (data_inicio_atividade);
    
    -- Example of a composite index for common filter combinations
    CREATE INDEX IF NOT EXISTS idx_estabelecimento_uf_municipio_situacao ON public.estabelecimento (uf, municipio, situacao_cadastral);
    ```