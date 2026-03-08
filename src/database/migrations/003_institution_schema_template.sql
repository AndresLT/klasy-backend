CREATE SCHEMA IF NOT EXISTS SCHEMA_NAME;
SET search_path TO SCHEMA_NAME, public;

CREATE TABLE IF NOT EXISTS academic_periods (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS grade_levels (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name    VARCHAR(100) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS groups (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_level_id      UUID NOT NULL REFERENCES grade_levels(id),
  name                VARCHAR(20) NOT NULL,
  period_id           UUID NOT NULL REFERENCES academic_periods(id),
  director_teacher_id UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      VARCHAR(100) NOT NULL,
  color     VARCHAR(7),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.users(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  group_id   UUID NOT NULL REFERENCES groups(id),
  period_id  UUID NOT NULL REFERENCES academic_periods(id),
  UNIQUE(teacher_id, subject_id, group_id, period_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES public.users(id),
  group_id    UUID NOT NULL REFERENCES groups(id),
  period_id   UUID NOT NULL REFERENCES academic_periods(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, group_id, period_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  type_code      VARCHAR(50) NOT NULL REFERENCES public.catalog_values(code),
  teacher_id     UUID NOT NULL REFERENCES public.users(id),
  subject_id     UUID NOT NULL REFERENCES subjects(id),
  group_id       UUID NOT NULL REFERENCES groups(id),
  period_id      UUID NOT NULL REFERENCES academic_periods(id),
  due_date       TIMESTAMPTZ NOT NULL,
  attachment_url TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id),
  score      NUMERIC(4,2) NOT NULL,
  feedback   TEXT,
  graded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id        UUID NOT NULL REFERENCES public.users(id),
  title            VARCHAR(255) NOT NULL,
  body             TEXT NOT NULL,
  target_type_code VARCHAR(50) NOT NULL REFERENCES public.catalog_values(code),
  target_id        UUID,
  attachment_url   TEXT,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id),
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcement_replies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES public.users(id),
  body            TEXT NOT NULL,
  parent_reply_id UUID REFERENCES announcement_replies(id),
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID NOT NULL REFERENCES public.users(id),
  parent_id       UUID NOT NULL REFERENCES public.users(id),
  student_id      UUID NOT NULL REFERENCES public.users(id),
  initiated_by    VARCHAR(10) NOT NULL CHECK (initiated_by IN ('teacher','parent')),
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id),
  body            TEXT NOT NULL,
  attachment_url  TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id),
  type           VARCHAR(50) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  body           TEXT NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id   UUID NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);