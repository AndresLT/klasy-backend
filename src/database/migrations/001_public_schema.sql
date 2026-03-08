CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.catalog_types (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       VARCHAR(50) UNIQUE NOT NULL,
  label      VARCHAR(100) NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.catalog_values (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_code  VARCHAR(50) NOT NULL REFERENCES public.catalog_types(code),
  code       VARCHAR(50) UNIQUE NOT NULL,
  label      VARCHAR(100) NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type_code, code)
);
CREATE INDEX idx_catalog_values_type ON public.catalog_values(type_code);

CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE,
  full_name       VARCHAR(255) NOT NULL,
  avatar_url      TEXT,
  push_token      TEXT,
  document_number VARCHAR(50),
  birth_date      DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.institutions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  logo_url        TEXT,
  primary_color   VARCHAR(7),
  secondary_color VARCHAR(7),
  schema_name     VARCHAR(63) UNIQUE NOT NULL,
  plan            VARCHAR(20) NOT NULL DEFAULT 'free',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  role_code      VARCHAR(50) NOT NULL REFERENCES public.catalog_values(code),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);
CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_memberships_inst ON public.memberships(institution_id);

CREATE TABLE IF NOT EXISTS public.student_guardians (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guardian_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_code VARCHAR(50) NOT NULL REFERENCES public.catalog_values(code),
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, guardian_id)
);