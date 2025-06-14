```sql
    /*
      # Add Indexes to Lookup Tables (cnae, munic)

      This migration adds indexes to lookup tables `public.cnae` and `public.munic`.

      1. New Indexes:
        - `idx_cnae_codigo`: On `cnae.codigo` (assuming it's the join key).
        - `idx_munic_codigo`: On `munic.codigo` (assuming it's the join key).

      2. Notes:
        - If `codigo` in these tables are primary keys, they are likely already indexed. These are added for explicitness.
        - The DDL indicates `cnae.codigo` is TEXT. If it's numeric, the index type might not need specification but is generally fine.
    */

    -- Index for cnae table
    -- Assuming 'codigo' is the primary join key. If it's already a PK, it's indexed.
    -- The DDL shows cnae.codigo as TEXT.
    CREATE INDEX IF NOT EXISTS idx_cnae_codigo ON public.cnae (codigo);

    -- Index for munic table
    -- Assuming 'codigo' is the primary join key. If it's already a PK, it's indexed.
    CREATE INDEX IF NOT EXISTS idx_munic_codigo ON public.munic (codigo);
    ```