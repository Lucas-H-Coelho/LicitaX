```sql
    /*
      # Create pg_trgm Extension

      1. New Extension
        - `pg_trgm`: This extension provides functions and operators for determining the similarity of alphanumeric text based on trigram matching. It's essential for optimizing LIKE/ILIKE queries with leading wildcards (e.g., '%text%').

      2. Notes
        - This extension needs to be created once per database.
        - It allows for the creation of GIN or GiST indexes on text columns to significantly speed up pattern matching queries.
    */
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    ```