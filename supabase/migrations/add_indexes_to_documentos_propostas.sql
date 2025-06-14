```sql
    /*
      # Add Indexes to public.documentos and public.propostas

      This migration adds indexes to foreign key columns often used in WHERE clauses.

      1. New Indexes:
        - `idx_documentos_licitacao_id`: On `documentos.licitacao_id`.
        - `idx_documentos_proposta_id`: On `documentos.proposta_id`.
        - `idx_propostas_licitacao_id`: On `propostas.licitacao_id`.
        - `idx_propostas_empresa_id`: On `propostas.empresa_id`.

      2. Notes:
        - Foreign key constraints often create indexes automatically, but it's good practice to ensure they exist for frequently queried FKs.
    */

    CREATE INDEX IF NOT EXISTS idx_documentos_licitacao_id ON public.documentos (licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_documentos_proposta_id ON public.documentos (proposta_id);
    CREATE INDEX IF NOT EXISTS idx_propostas_licitacao_id ON public.propostas (licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_propostas_empresa_id ON public.propostas (empresa_id);
    ```