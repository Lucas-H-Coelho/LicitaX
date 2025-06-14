```sql
    /*
      # Add Indexes to public.licitacoes

      This migration adds indexes to the `public.licitacoes` table to improve query performance for listing, filtering, and searching.

      1. New Indexes:
        - `idx_licitacoes_numero`: On `numero` for searching.
        - `idx_licitacoes_orgao_gin`: A GIN index on `orgao` for ILIKE searches.
        - `idx_licitacoes_status`: On `status` for filtering.
        - `idx_licitacoes_modalidade`: On `modalidade` for filtering.
        - `idx_licitacoes_data_abertura`: On `data_abertura` for sorting and date-based filtering.
        - `idx_licitacoes_user_id`: On `user_id` if filtering by user is common.

      2. Notes:
        - The GIN index on `orgao` requires the `pg_trgm` extension.
    */

    CREATE INDEX IF NOT EXISTS idx_licitacoes_numero ON public.licitacoes (numero);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_orgao_gin ON public.licitacoes USING gin (orgao gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_status ON public.licitacoes (status);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_modalidade ON public.licitacoes (modalidade);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_data_abertura ON public.licitacoes (data_abertura);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_user_id ON public.licitacoes (user_id);
    ```