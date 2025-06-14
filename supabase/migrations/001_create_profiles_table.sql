```sql
/*
  # Criação da Tabela de Perfis de Usuários (v2)

  Este script cria a tabela `profiles` para armazenar informações adicionais dos usuários,
  complementando a tabela `auth.users` gerenciada pelo Supabase.
  Esta versão corrige a função handle_new_user e o tratamento de updated_at.

  1. Nova Tabela:
     - `profiles`
       - `id` (uuid, chave primária): Referencia `auth.users.id`.
       - `updated_at` (timestamptz): Data da última atualização do perfil.
       - `nome` (text): Nome completo do usuário ou razão social da empresa.
       - `tipo` (text): Tipo de perfil (ex: 'consultor', 'empresa').
       - `avatar_url` (text): URL para o avatar do usuário ou logo da empresa.
       - `bio` (text): Pequena biografia ou descrição.

  2. Chaves Estrangeiras:
     - `profiles.id` referencia `auth.users.id`. A política de deleção é CASCADE.

  3. Segurança:
     - Habilita Row Level Security (RLS) na tabela `profiles`.
     - Política "Users can read own profile".
     - Política "Users can update own profile".
     - Política "Users can insert own profile".

  4. Trigger:
     - `handle_new_user`: Cria automaticamente uma entrada em `profiles`
       quando um novo usuário é registrado em `auth.users`, e define `updated_at`.
     - `trigger_update_profiles_updated_at`: Atualiza `updated_at` em cada update.
*/

-- 1. Criação da tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz,
  nome text,
  tipo text, -- e.g., 'consultor', 'empresa', 'representante'
  avatar_url text,
  bio text,

  CONSTRAINT nome_length CHECK (char_length(nome) <= 255),
  CONSTRAINT tipo_length CHECK (char_length(tipo) <= 50),
  CONSTRAINT avatar_url_length CHECK (char_length(avatar_url) <= 1024)
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Trigger para criar perfil automaticamente para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar 'updated_at' na tabela profiles
-- A função update_updated_at_column() é definida em 002_create_licitacoes_table.sql
-- Se esta migração (001) for executada antes da 002, esta parte pode falhar.
-- Idealmente, a função seria definida em uma migração 000_utility_functions.sql
-- Por agora, vamos assumir que a função existe ou será criada por 002.
-- Se 002_create_licitacoes_table.sql já definiu public.update_updated_at_column:
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER trigger_update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- Adicionar comentários para clareza
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending auth.users. (v2)';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id.';
COMMENT ON COLUMN public.profiles.nome IS 'Full name of the user or company name.';
COMMENT ON COLUMN public.profiles.tipo IS 'Type of user profile, e.g., consultant, company.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of the last profile update.';
```