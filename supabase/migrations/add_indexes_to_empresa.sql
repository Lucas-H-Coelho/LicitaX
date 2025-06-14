```sql
    /*
      # Add Indexes to public.empresa

      This migration adds indexes to the `public.empresa` table.

      1. New Indexes:
        - `idx_empresa_razao_social_gin`: A GIN index on `razao_social` using `gin_trgm_ops` for efficient ILIKE searches.
        - `idx_empresa_porte_empresa`: On `porte_empresa` for filtering.
        - Note: `cnpj_basico` is assumed to be the primary key and already indexed.

      2. Notes:
        - The GIN index on `razao_social` requires the `pg_trgm` extension.
    */

    -- GIN Index for ILIKE searches on razao_social (requires pg_trgm extension)
    CREATE INDEX IF NOT EXISTS idx_empresa_razao_social_gin ON public.empresa USING gin (razao_social gin_trgm_ops);

    -- Index for filtering by porte_empresa
    CREATE INDEX IF NOT EXISTS idx_empresa_porte_empresa ON public.empresa (porte_empresa);
    ```