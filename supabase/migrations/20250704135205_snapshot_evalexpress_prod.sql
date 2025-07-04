create table "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "teacher_id" uuid not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "is_demo" boolean default false
);


alter table "public"."classes" enable row level security;

create table "public"."conditional_formatting" (
    "id" uuid not null default gen_random_uuid(),
    "min_score" numeric,
    "max_score" numeric,
    "color" text,
    "teacher_id" uuid not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "evaluation_title" text,
    "evaluation_title_id" uuid,
    "is_demo" boolean default false
);


alter table "public"."conditional_formatting" enable row level security;

create table "public"."criteria" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "min_value" numeric not null,
    "max_value" numeric not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "teacher_id" uuid,
    "is_demo" boolean default false
);


alter table "public"."criteria" enable row level security;

create table "public"."criterion_tag_links" (
    "id" uuid not null default uuid_generate_v4(),
    "criterion_id" uuid,
    "tag_id" uuid,
    "user_id" uuid default auth.uid(),
    "created_at" timestamp with time zone default now(),
    "is_demo" boolean default false
);


alter table "public"."criterion_tag_links" enable row level security;

create table "public"."criterion_tags" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "user_id" uuid default auth.uid(),
    "created_at" timestamp with time zone default now(),
    "is_demo" boolean default false
);


alter table "public"."criterion_tags" enable row level security;

create table "public"."demo_entities" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "entity_type" text not null,
    "entity_id" uuid not null default gen_random_uuid(),
    "created_at" timestamp without time zone default now()
);


create table "public"."demo_log" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "user_email" text not null,
    "action" text not null,
    "timestamp" timestamp with time zone default now(),
    "created_at" timestamp without time zone default now(),
    "details" text
);


alter table "public"."demo_log" enable row level security;

create table "public"."evaluation_attachments" (
    "id" uuid not null default gen_random_uuid(),
    "evaluation_title_id" uuid,
    "teacher_id" uuid not null,
    "class_id" uuid not null,
    "file_path" text not null,
    "created_at" timestamp with time zone default now(),
    "is_demo" boolean default false
);


alter table "public"."evaluation_attachments" enable row level security;

create table "public"."evaluation_criteria_log" (
    "id" uuid not null default uuid_generate_v4(),
    "teacher_id" uuid,
    "evaluation_title_id" uuid,
    "criterion_id" uuid,
    "action" text,
    "timestamp" timestamp with time zone default now()
);


create table "public"."evaluation_title_criteria" (
    "id" uuid not null default gen_random_uuid(),
    "evaluation_title_id" uuid,
    "criterion_id" uuid,
    "teacher_id" uuid,
    "created_at" timestamp with time zone default now(),
    "is_demo" boolean default false
);


create table "public"."evaluation_titles" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "teacher_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "class_id" uuid,
    "is_demo" boolean default false
);


alter table "public"."evaluation_titles" enable row level security;

create table "public"."evaluations" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "date" timestamp without time zone,
    "teacher_id" uuid not null,
    "student_id" uuid not null,
    "comments" text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "class_id" uuid not null,
    "criterion_id" uuid not null,
    "value" numeric,
    "evaluation_title_id" uuid,
    "is_demo" boolean default false
);


alter table "public"."evaluations" enable row level security;

create table "public"."payments" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "method" text not null,
    "plan_name" text default 'pro'::text,
    "status" text not null default 'waiting'::text,
    "created_at" timestamp with time zone default timezone('America/Sao_Paulo'::text, now()),
    "updated_at" timestamp with time zone default timezone('America/Sao_Paulo'::text, now()),
    "email" text,
    "stripe_payment_intent_id" text,
    "stripe_checkout_session_id" text,
    "stripe_invoice_id" text,
    "amount" numeric,
    "currency" text,
    "subscription_id" text,
    "plan_expiration_date" timestamp with time zone
);


alter table "public"."payments" enable row level security;

create table "public"."students" (
    "id" uuid not null default gen_random_uuid(),
    "first_name" text not null,
    "last_name" text not null,
    "class_id" uuid not null,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "is_demo" boolean default false,
    "teacher_id" uuid
);


alter table "public"."students" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "role" text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "current_plan" text not null default 'free'::text,
    "pro_trial_start_date" timestamp with time zone default now(),
    "pro_trial_enabled" boolean default true,
    "pro_subscription_active" boolean not null default false,
    "subscription_start_date" timestamp with time zone,
    "subscription_expires_at" timestamp with time zone,
    "stripe_customer_id" text,
    "stripe_subscription_id" text
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX conditional_formatting_pkey ON public.conditional_formatting USING btree (id);

CREATE UNIQUE INDEX criteria_pkey ON public.criteria USING btree (id);

CREATE UNIQUE INDEX criterion_tag_links_pkey ON public.criterion_tag_links USING btree (id);

CREATE UNIQUE INDEX criterion_tags_pkey ON public.criterion_tags USING btree (id);

CREATE UNIQUE INDEX demo_entities_pkey ON public.demo_entities USING btree (id);

CREATE UNIQUE INDEX demo_log_pkey ON public.demo_log USING btree (id);

CREATE UNIQUE INDEX evaluation_attachments_pkey ON public.evaluation_attachments USING btree (id);

CREATE UNIQUE INDEX evaluation_criteria_log_pkey ON public.evaluation_criteria_log USING btree (id);

CREATE UNIQUE INDEX evaluation_title_criteria_evaluation_title_id_criterion_id_key ON public.evaluation_title_criteria USING btree (evaluation_title_id, criterion_id);

CREATE UNIQUE INDEX evaluation_title_criteria_pkey ON public.evaluation_title_criteria USING btree (id);

CREATE UNIQUE INDEX evaluation_titles_pkey ON public.evaluation_titles USING btree (id);

CREATE UNIQUE INDEX evaluations_pkey ON public.evaluations USING btree (id);

CREATE INDEX idx_attachments_teacher_id ON public.evaluation_attachments USING btree (teacher_id);

CREATE INDEX idx_conditional_formatting_evaluation_title_id ON public.conditional_formatting USING btree (evaluation_title_id);

CREATE INDEX idx_criterion_tag_links_user_id ON public.criterion_tag_links USING btree (user_id);

CREATE INDEX idx_criterion_tags_user_id ON public.criterion_tags USING btree (user_id);

CREATE INDEX idx_payments_user_status ON public.payments USING btree (user_id, status);

CREATE INDEX idx_students_teacher_id ON public.students USING btree (teacher_id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);

CREATE UNIQUE INDEX unique_criterion_tag ON public.criterion_tag_links USING btree (criterion_id, tag_id);

CREATE UNIQUE INDEX unique_criterion_tag_pair ON public.criterion_tag_links USING btree (criterion_id, tag_id);

CREATE UNIQUE INDEX unique_log_entry ON public.evaluation_criteria_log USING btree (teacher_id, evaluation_title_id, criterion_id, action, "timestamp");

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."conditional_formatting" add constraint "conditional_formatting_pkey" PRIMARY KEY using index "conditional_formatting_pkey";

alter table "public"."criteria" add constraint "criteria_pkey" PRIMARY KEY using index "criteria_pkey";

alter table "public"."criterion_tag_links" add constraint "criterion_tag_links_pkey" PRIMARY KEY using index "criterion_tag_links_pkey";

alter table "public"."criterion_tags" add constraint "criterion_tags_pkey" PRIMARY KEY using index "criterion_tags_pkey";

alter table "public"."demo_entities" add constraint "demo_entities_pkey" PRIMARY KEY using index "demo_entities_pkey";

alter table "public"."demo_log" add constraint "demo_log_pkey" PRIMARY KEY using index "demo_log_pkey";

alter table "public"."evaluation_attachments" add constraint "evaluation_attachments_pkey" PRIMARY KEY using index "evaluation_attachments_pkey";

alter table "public"."evaluation_criteria_log" add constraint "evaluation_criteria_log_pkey" PRIMARY KEY using index "evaluation_criteria_log_pkey";

alter table "public"."evaluation_title_criteria" add constraint "evaluation_title_criteria_pkey" PRIMARY KEY using index "evaluation_title_criteria_pkey";

alter table "public"."evaluation_titles" add constraint "evaluation_titles_pkey" PRIMARY KEY using index "evaluation_titles_pkey";

alter table "public"."evaluations" add constraint "evaluations_pkey" PRIMARY KEY using index "evaluations_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."students" add constraint "students_pkey" PRIMARY KEY using index "students_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."classes" add constraint "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) not valid;

alter table "public"."classes" validate constraint "classes_teacher_id_fkey";

alter table "public"."conditional_formatting" add constraint "conditional_formatting_evaluation_title_id_fkey" FOREIGN KEY (evaluation_title_id) REFERENCES evaluation_titles(id) ON DELETE SET NULL not valid;

alter table "public"."conditional_formatting" validate constraint "conditional_formatting_evaluation_title_id_fkey";

alter table "public"."conditional_formatting" add constraint "conditional_formatting_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) not valid;

alter table "public"."conditional_formatting" validate constraint "conditional_formatting_teacher_id_fkey";

alter table "public"."conditional_formatting" add constraint "min_max_check" CHECK (((max_score IS NULL) OR (min_score <= max_score))) not valid;

alter table "public"."conditional_formatting" validate constraint "min_max_check";

alter table "public"."criteria" add constraint "fk_criteria_teacher_id" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."criteria" validate constraint "fk_criteria_teacher_id";

alter table "public"."criteria" add constraint "min_max_check" CHECK ((min_value <= max_value)) not valid;

alter table "public"."criteria" validate constraint "min_max_check";

alter table "public"."criterion_tag_links" add constraint "criterion_tag_links_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE not valid;

alter table "public"."criterion_tag_links" validate constraint "criterion_tag_links_criterion_id_fkey";

alter table "public"."criterion_tag_links" add constraint "criterion_tag_links_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES criterion_tags(id) ON DELETE CASCADE not valid;

alter table "public"."criterion_tag_links" validate constraint "criterion_tag_links_tag_id_fkey";

alter table "public"."criterion_tag_links" add constraint "unique_criterion_tag" UNIQUE using index "unique_criterion_tag";

alter table "public"."criterion_tag_links" add constraint "unique_criterion_tag_pair" UNIQUE using index "unique_criterion_tag_pair";

alter table "public"."evaluation_attachments" add constraint "evaluation_attachments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL not valid;

alter table "public"."evaluation_attachments" validate constraint "evaluation_attachments_class_id_fkey";

alter table "public"."evaluation_attachments" add constraint "evaluation_attachments_evaluation_title_id_fkey" FOREIGN KEY (evaluation_title_id) REFERENCES evaluation_titles(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_attachments" validate constraint "evaluation_attachments_evaluation_title_id_fkey";

alter table "public"."evaluation_attachments" add constraint "evaluation_attachments_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_attachments" validate constraint "evaluation_attachments_teacher_id_fkey";

alter table "public"."evaluation_criteria_log" add constraint "evaluation_criteria_log_action_check" CHECK ((action = ANY (ARRAY['insert'::text, 'delete'::text]))) not valid;

alter table "public"."evaluation_criteria_log" validate constraint "evaluation_criteria_log_action_check";

alter table "public"."evaluation_criteria_log" add constraint "evaluation_criteria_log_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_criteria_log" validate constraint "evaluation_criteria_log_criterion_id_fkey";

alter table "public"."evaluation_criteria_log" add constraint "evaluation_criteria_log_evaluation_title_id_fkey" FOREIGN KEY (evaluation_title_id) REFERENCES evaluation_titles(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_criteria_log" validate constraint "evaluation_criteria_log_evaluation_title_id_fkey";

alter table "public"."evaluation_criteria_log" add constraint "evaluation_criteria_log_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_criteria_log" validate constraint "evaluation_criteria_log_teacher_id_fkey";

alter table "public"."evaluation_criteria_log" add constraint "unique_log_entry" UNIQUE using index "unique_log_entry";

alter table "public"."evaluation_title_criteria" add constraint "evaluation_title_criteria_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES criteria(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_title_criteria" validate constraint "evaluation_title_criteria_criterion_id_fkey";

alter table "public"."evaluation_title_criteria" add constraint "evaluation_title_criteria_evaluation_title_id_criterion_id_key" UNIQUE using index "evaluation_title_criteria_evaluation_title_id_criterion_id_key";

alter table "public"."evaluation_title_criteria" add constraint "evaluation_title_criteria_evaluation_title_id_fkey" FOREIGN KEY (evaluation_title_id) REFERENCES evaluation_titles(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_title_criteria" validate constraint "evaluation_title_criteria_evaluation_title_id_fkey";

alter table "public"."evaluation_title_criteria" add constraint "evaluation_title_criteria_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) not valid;

alter table "public"."evaluation_title_criteria" validate constraint "evaluation_title_criteria_teacher_id_fkey";

alter table "public"."evaluation_titles" add constraint "evaluation_titles_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."evaluation_titles" validate constraint "evaluation_titles_class_id_fkey";

alter table "public"."evaluation_titles" add constraint "evaluation_titles_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."evaluation_titles" validate constraint "evaluation_titles_teacher_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_class_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_criterion_id_fkey" FOREIGN KEY (criterion_id) REFERENCES criteria(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_criterion_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_evaluation_title_id_fkey" FOREIGN KEY (evaluation_title_id) REFERENCES evaluation_titles(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_evaluation_title_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_student_id_fkey";

alter table "public"."evaluations" add constraint "evaluations_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) not valid;

alter table "public"."evaluations" validate constraint "evaluations_teacher_id_fkey";

alter table "public"."payments" add constraint "fk_user" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "fk_user";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."students" add constraint "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) not valid;

alter table "public"."students" validate constraint "students_class_id_fkey";

alter table "public"."users" add constraint "chk_subscription_plan" CHECK ((current_plan = ANY (ARRAY['free'::text, 'pro'::text]))) not valid;

alter table "public"."users" validate constraint "chk_subscription_plan";

alter table "public"."users" add constraint "users_role_check" CHECK ((role = ANY (ARRAY['teacher'::text, 'admin'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_subscription_plan_check" CHECK ((current_plan = ANY (ARRAY['free'::text, 'pro'::text]))) not valid;

alter table "public"."users" validate constraint "users_subscription_plan_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_demo_data(user_email text, user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Appel de ta logique existante, par exemple :
  PERFORM generate_demo_data(user_id, user_email);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_demo_data(p_user_id uuid, p_user_email text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 🔸 Étape 1 : Supprimer les entités et logs techniques
  DELETE FROM public.demo_entities
  WHERE user_id = p_user_id;

  DELETE FROM public.demo_log
  WHERE user_id = p_user_id AND action = 'DEMO_GERADA';

  -- 🔸 Étape 2 : Supprimer les entités liées au professeur avec is_demo = TRUE

  DELETE FROM public.conditional_formatting
  WHERE teacher_id = p_user_id AND is_demo = TRUE;

  DELETE FROM public.evaluation_title_criteria
  WHERE teacher_id = p_user_id AND is_demo = TRUE;

  DELETE FROM public.criterion_tag_links
  WHERE user_id = p_user_id AND is_demo = TRUE;

  DELETE FROM public.criterion_tags
  WHERE user_id = p_user_id AND is_demo = TRUE;

  DELETE FROM public.evaluations
  WHERE evaluation_title_id IN (
    SELECT id FROM public.evaluation_titles
    WHERE teacher_id = p_user_id AND is_demo = TRUE
  );

  DELETE FROM public.evaluation_titles
  WHERE teacher_id = p_user_id AND is_demo = TRUE;
  

  DELETE FROM public.criteria
  WHERE teacher_id = p_user_id AND is_demo = TRUE;

  -- 🔸 Étape 3 : Supprimer les élèves uniquement des classes démo du professeur
  DELETE FROM public.students
  WHERE teacher_id = p_user_id and is_demo = TRUE;

  -- 🔸 Étape 4 : Supprimer les classes si elles sont démo et sans élèves restants
  DELETE FROM public.classes
  WHERE teacher_id = p_user_id
    AND is_demo = TRUE
    AND id NOT IN (
      SELECT DISTINCT class_id FROM public.students where is_demo = false
    );
 
END;
$function$
;

create or replace view "public"."evaluations_with_score" as  SELECT e.id,
    e.title,
    e.date,
    e.teacher_id,
    e.student_id,
    e.comments,
    e.created_at,
    e.updated_at,
    e.class_id,
    e.criterion_id,
    e.value,
    c.max_value AS max_possible_score,
        CASE
            WHEN (c.max_value > (0)::numeric) THEN (((c.min_value)::double precision / (c.max_value)::double precision) * (100)::double precision)
            ELSE (0)::double precision
        END AS score_percentage,
    cf.color AS formatting_color
   FROM ((evaluations e
     LEFT JOIN criteria c ON ((e.criterion_id = c.id)))
     LEFT JOIN conditional_formatting cf ON (((e.teacher_id = cf.teacher_id) AND (((((c.min_value)::double precision / (c.max_value)::double precision) * (100)::double precision) >= (cf.min_score)::double precision) AND ((((c.min_value)::double precision / (c.max_value)::double precision) * (100)::double precision) <= (cf.max_score)::double precision)))));


CREATE OR REPLACE FUNCTION public.generate_demo_data(p_user_id uuid, p_user_email text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  turma_id1 UUID := uuid_generate_v4();
  turma_id2 UUID := uuid_generate_v4();
  aluno_id1 UUID := uuid_generate_v4();
  aluno_id2 UUID := uuid_generate_v4();
  aluno_id3 UUID := uuid_generate_v4();
  aluno_id4 UUID := uuid_generate_v4();
  criterio_id1 UUID := uuid_generate_v4();
  criterio_id2 UUID := uuid_generate_v4();
  criterio_id3 UUID := uuid_generate_v4();
  criterio_id4 UUID := uuid_generate_v4();
  criterio_id5 UUID := uuid_generate_v4();
  criterio_id6 UUID := uuid_generate_v4();
  criterio_id7 UUID := uuid_generate_v4();
  titulo_id1 UUID := uuid_generate_v4();
  titulo_id2 UUID := uuid_generate_v4();
  avaliacao_id1 UUID := uuid_generate_v4();
  avaliacao_id2 UUID := uuid_generate_v4();
  avaliacao_id3 UUID := uuid_generate_v4();
  avaliacao_id4 UUID := uuid_generate_v4();
  avaliacao_id5 UUID := uuid_generate_v4();
  avaliacao_id6 UUID := uuid_generate_v4();
  avaliacao_id7 UUID := uuid_generate_v4();
  avaliacao_id8 UUID := uuid_generate_v4();
  avaliacao_id9 UUID := uuid_generate_v4();
  avaliacao_id10 UUID := uuid_generate_v4();
  avaliacao_id11 UUID := uuid_generate_v4();
  avaliacao_id12 UUID := uuid_generate_v4();
  tag_id1 UUID := uuid_generate_v4();
  tag_id2 UUID := uuid_generate_v4();
  tag_id3 UUID := uuid_generate_v4();
  link_tag1 UUID := uuid_generate_v4();
  link_tag2 UUID := uuid_generate_v4();
  id_formatacao1 UUID := uuid_generate_v4();
  id_formatacao2 UUID := uuid_generate_v4();
  id_formatacao3 UUID := uuid_generate_v4();
  id_formatacao4 UUID := uuid_generate_v4();
  id_formatacao5 UUID := uuid_generate_v4();
  id_criterio_titulo1 UUID := uuid_generate_v4();
  id_criterio_titulo2 UUID := uuid_generate_v4();
  id_criterio_titulo3 UUID := uuid_generate_v4();
  id_criterio_titulo4 UUID := uuid_generate_v4();
  id_criterio_titulo5 UUID := uuid_generate_v4();
  id_criterio_titulo6 UUID := uuid_generate_v4();
  id_criterio_titulo7 UUID := uuid_generate_v4();

BEGIN
  -- Turma
  INSERT INTO public.classes(id, name, teacher_id, is_demo)
  VALUES 
  (turma_id1, 'Sexto', p_user_id, TRUE),
  (turma_id2, 'Setimo', p_user_id, TRUE);

-- Inserir alunos fictícios (corrigido, sans colonne teacher_id)

INSERT INTO public.students (
  id, first_name, last_name, class_id, created_at, updated_at, teacher_id, is_demo)
VALUES
  (aluno_id1, 'João', 'Silva', turma_id1, now(), now(), p_user_id,TRUE),
  (aluno_id2, 'Maria', 'Oliveira', turma_id2, now(), now(),p_user_id, TRUE),
  (aluno_id3, 'Aline', 'Souza', turma_id2, now(), now(), p_user_id,TRUE),
  (aluno_id4, 'Bruno', 'Lima', turma_id1, now(), now(),p_user_id, TRUE);


  -- Critérios
  INSERT INTO public.criteria(id, name, min_value, max_value, teacher_id, created_at, updated_at, is_demo)
  VALUES
    (criterio_id1, 'Participação', 0, 3, p_user_id, NOW(),NOW(), TRUE),
    (criterio_id2, 'Comportamento', 0, 5, p_user_id, NOW(), NOW(), TRUE),
    (criterio_id3, 'Escrita', 0, 10, p_user_id,NOW(), NOW(), TRUE),
    (criterio_id4, 'Gramática', 0, 5, p_user_id,NOW(), NOW(), TRUE),
    (criterio_id5, 'Oral', 0, 10, p_user_id,NOW(), NOW(), TRUE),
    (criterio_id6, 'Vocabulário', 0, 5, p_user_id, NOW(), NOW(),TRUE),
    (criterio_id7, 'Pronúncia', 0, 5, p_user_id,NOW(), NOW(), TRUE);

  -- Título de Avaliação
  INSERT INTO public.evaluation_titles(id, title, teacher_id, class_id, created_at, updated_at,is_demo)
  VALUES 
  (titulo_id1, 'Prova Bimestral', p_user_id, turma_id1, now(), now(),true),
  (titulo_id2, 'Portuguêse', p_user_id, turma_id2,now(), now(), true);

  -- Avaliações

-- Inserção corrigida dans evaluations avec class_id ajouté
INSERT INTO public.evaluations(id, student_id, criterion_id, value, teacher_id, evaluation_title_id, class_id, created_at, updated_at, date, is_demo)
VALUES 
  (avaliacao_id1, aluno_id1, criterio_id1, 2, p_user_id, titulo_id1, turma_id1, now(), now(),now(), TRUE),
  (avaliacao_id2, aluno_id1, criterio_id2, 4, p_user_id, titulo_id1, turma_id1, now(), now(),now(), TRUE),
  (avaliacao_id3, aluno_id2, criterio_id3, 8, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id4, aluno_id2, criterio_id4, 3, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id5, aluno_id2, criterio_id5, 7, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id6, aluno_id2, criterio_id6, 2, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id7, aluno_id2, criterio_id7, 2, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id8, aluno_id3, criterio_id3, 5, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id9, aluno_id3, criterio_id4, 1, p_user_id, titulo_id2, turma_id2, now(), now(), now(),TRUE),
  (avaliacao_id10, aluno_id3, criterio_id5, 3, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id11, aluno_id3, criterio_id6, 1, p_user_id, titulo_id2, turma_id2, now(), now(),now(), TRUE),
  (avaliacao_id12, aluno_id3, criterio_id7, 1, p_user_id, titulo_id2, turma_id2, now(), now(), now(),TRUE);

  -- Tags
  INSERT INTO public.criterion_tags(id, name, user_id, created_at, is_demo)
  VALUES
    (tag_id1, 'Participação', p_user_id, now(),TRUE),
    (tag_id3, 'Língua Portuguesa', p_user_id, now(),TRUE),
    (tag_id2, 'Comportamento', p_user_id, now(),TRUE);

  -- Liens Tags <-> Critères
  INSERT INTO public.criterion_tag_links(id, criterion_id, tag_id, user_id, created_at, is_demo)
  VALUES
    (link_tag1, criterio_id1, tag_id1, p_user_id, now(), TRUE),
    (link_tag2, criterio_id2, tag_id2, p_user_id, now(), TRUE);

  -- Association Critère <-> Titre d’évaluation
  INSERT INTO public.evaluation_title_criteria(id, evaluation_title_id, criterion_id, teacher_id,created_at, is_demo)
  VALUES 
  (id_criterio_titulo1, titulo_id1, criterio_id1, p_user_id,now(),  TRUE),
  (id_criterio_titulo2, titulo_id1, criterio_id2, p_user_id,now(),  TRUE),
  (id_criterio_titulo3, titulo_id2, criterio_id3, p_user_id,now(),  TRUE),
  (id_criterio_titulo4, titulo_id2, criterio_id4, p_user_id,now(),  TRUE),
  (id_criterio_titulo5, titulo_id2, criterio_id5, p_user_id, now(), TRUE),
  (id_criterio_titulo6, titulo_id2, criterio_id6, p_user_id, now(), TRUE),
  (id_criterio_titulo7, titulo_id2, criterio_id7, p_user_id, now(), TRUE);


  -- Formatage conditionnel
INSERT INTO public.conditional_formatting(
  id, evaluation_title_id, color, min_score, max_score, teacher_id, created_at, updated_at, is_demo)  
VALUES 
  (id_formatacao1, titulo_id1, 'red', 0.0, 2.0, p_user_id,now(), now(), TRUE),
  (id_formatacao2, titulo_id1, 'green', 2.0, 9999, p_user_id,now(), now(), TRUE),
  (id_formatacao3, titulo_id2, 'black', 0.0, 0.0, p_user_id,now(), now(), TRUE),
  (id_formatacao4, titulo_id2, 'red', 0.0, 14.9, p_user_id, now(), now(),TRUE),
  (id_formatacao5, titulo_id2, 'green', 15.0, 99999, p_user_id, now(), now(),TRUE);

  -- Log de démonstration
  INSERT INTO public.demo_log(user_id, user_email, timestamp, created_at, action)
  VALUES (p_user_id, p_user_email, now(), now(),'DEMO_GERADA');

  -- Entités de démonstration
INSERT INTO public.demo_entities(user_id, entity_type, created_at, entity_id)
VALUES
 (p_user_id, 'classes',now(),  turma_id1),
 (p_user_id, 'classes',now(), turma_id2),
    (p_user_id, 'students',now(),aluno_id1),
    (p_user_id, 'students', now(), aluno_id2),
    (p_user_id, 'students', now(), aluno_id3),
    (p_user_id, 'students', now(), aluno_id4),
    (p_user_id, 'criteria', now(), criterio_id1),
    (p_user_id, 'criteria', now(), criterio_id2),
    (p_user_id, 'criteria', now(), criterio_id3),
    (p_user_id, 'criteria', now(), criterio_id4),
    (p_user_id, 'criteria', now(), criterio_id5),
    (p_user_id, 'criteria', now(), criterio_id6),
    (p_user_id, 'evaluation_titles',  now(),titulo_id1),
    (p_user_id, 'evaluation_titles',  now(),titulo_id2),
    (p_user_id, 'evaluations', now(), avaliacao_id1),
    (p_user_id, 'evaluations', now(), avaliacao_id2),
    (p_user_id, 'evaluations', now(), avaliacao_id3),
    (p_user_id, 'evaluations', now(), avaliacao_id4),
    (p_user_id, 'evaluation', now(), avaliacao_id5),
    (p_user_id, 'evaluations',now(),  avaliacao_id6),
    (p_user_id, 'evaluation', now(), avaliacao_id7),
    (p_user_id, 'evaluations',now(),  avaliacao_id8),
    (p_user_id, 'evaluations',now(),  avaliacao_id9),
    (p_user_id, 'evaluations',now(), avaliacao_id10),
    (p_user_id, 'evaluations',now(),  avaliacao_id11),
    (p_user_id, 'evaluations',now(),  avaliacao_id12),
    (p_user_id, 'criterion_tags',now(), tag_id1),
    (p_user_id, 'criterion_tags', now(),tag_id2),
    (p_user_id, 'criterion_tag_links',now(),link_tag1),
    (p_user_id, 'criterion_tag_links', now(), link_tag2),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo1),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo2),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo3),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo4),
    (p_user_id, 'evaluation_title_criteria',now(),  id_criterio_titulo5),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo6),
    (p_user_id, 'evaluation_title_criteria', now(), id_criterio_titulo7),
    (p_user_id, 'conditional_formatting', now(), id_formatacao1),
    (p_user_id, 'conditional_formatting',now(), id_formatacao2),
    (p_user_id, 'conditional_formatting', now(), id_formatacao3),
    (p_user_id, 'conditional_formatting', now(), id_formatacao4),
    (p_user_id, 'conditional_formatting', now(), id_formatacao5);

END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_evaluations_by_filter_ui(p_teacher_id uuid, p_class_id uuid, p_student_id uuid)
 RETURNS TABLE(evaluation_id uuid, evaluation_title text, student_id uuid, student_name text, class_id uuid, class_name text, criterion_id uuid, value numeric, date timestamp without time zone, comments text)
 LANGUAGE sql
AS $function$
  select
    e.id as evaluation_id,
    e.title as evaluation_title,
    s.id as student_id,
    s.first_name || ' ' || s.last_name as student_name,
    c.id as class_id,
    c.name as class_name,
    e.criterion_id,
    e.value,
    e.date,
    e.comments
  from evaluations e
  join students s on e.student_id = s.id
  join classes c on s.class_id = c.id
  where
    e.teacher_id = auth.uid()
    and (p_teacher_id is null or e.teacher_id = p_teacher_id)
    and (p_class_id is null or s.class_id = p_class_id)
    and (p_student_id is null or e.student_id = p_student_id)
$function$
;

CREATE OR REPLACE FUNCTION public.get_filtered_evaluations(p_teacher_id uuid, p_class_ids uuid[], p_student_ids uuid[], p_criterion_ids uuid[], p_start_date timestamp without time zone, p_end_date timestamp without time zone)
 RETURNS TABLE(student_name text, family_name text, criterion_name text, value numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.first_name AS student_name,
        s.last_name AS family_name,
        c.name AS criterion_name,
        e.value
    FROM 
        evaluations e
        LEFT JOIN students s ON e.student_id = s.id
        LEFT JOIN criteria c ON e.criterion_id = c.id
    WHERE 
        e.teacher_id = p_teacher_id
        AND (p_class_ids IS NULL OR e.class_id = ANY(p_class_ids)) -- Filtre sur classes
        AND (p_student_ids IS NULL OR e.student_id = ANY(p_student_ids)) -- Filtre sur élèves
        AND (p_criterion_ids IS NULL OR e.criterion_id = ANY(p_criterion_ids)) -- Filtre sur critères
        AND e.date BETWEEN p_start_date AND p_end_date -- Filtre sur dates
    ORDER BY 
        s.first_name, s.last_name, c.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_titulos_existentes(p_class_id uuid, p_student_id uuid)
 RETURNS TABLE(title text)
 LANGUAGE sql
AS $function$
  select distinct e.title
  from evaluations e
  join students s on e.student_id = s.id
  where
    e.teacher_id = auth.uid()
    and (p_class_id is null or s.class_id = p_class_id)
    and (p_student_id is null or e.student_id = p_student_id)
$function$
;

CREATE OR REPLACE FUNCTION public.has_demo_data(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM demo_log
    WHERE user_id = p_user_id
      AND action = 'DEMO_GERADA'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.has_demo_data_to_delete(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  SELECT public.has_demo_data(p_user_id);
$function$
;

CREATE OR REPLACE FUNCTION public.iniciar_demo_data(p_user_email text, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_teacher_uuid UUID := p_user_id;

  -- UUID Classes
  class_id_demo6 UUID := uuid_generate_v5(current_teacher_uuid, 'class_demo_6');
  class_id_demo7 UUID := uuid_generate_v5(current_teacher_uuid, 'class_demo_7');
  class_id_demo8 UUID := uuid_generate_v5(current_teacher_uuid, 'class_demo_8');

  -- UUID Students
  student_id_gabriel_costa UUID := uuid_generate_v5(current_teacher_uuid, 'gabriel_costa');
  student_id_juliana_pereira UUID := uuid_generate_v5(current_teacher_uuid, 'juliana_pereira');
  student_id_matheus_ribeiro UUID := uuid_generate_v5(current_teacher_uuid, 'matheus_ribeiro');
  student_id_joao_silva UUID := uuid_generate_v5(current_teacher_uuid, 'joao_silva');
  student_id_maria_santos UUID := uuid_generate_v5(current_teacher_uuid, 'maria_santos');
  student_id_lucas_lima UUID := uuid_generate_v5(current_teacher_uuid, 'lucas_lima');

  -- UUID Criteria
  criterion_id_avaliacao UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_avaliacao');
  criterion_id_participacao UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_participacao');
  criterion_id_visto UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_visto');
  criterion_id_prova_ext UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_prova_ext');
  criterion_id_projeto UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_projeto');
  criterion_id_gramatica UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_gramatica');
  criterion_id_vocabulario UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_vocabulario');
  criterion_id_escrita UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_escrita');
  criterion_id_oral UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_oral');
  criterion_id_pronuncia UUID := uuid_generate_v5(current_teacher_uuid, 'criterio_pronuncia');
BEGIN
  -- 🛠 Debug facultatif déplacé ici :
  PERFORM pg_sleep(0); -- placeholder
  INSERT INTO demo_log(user_id, user_email, action)
  VALUES (p_user_id, p_user_email, 'DEBUG_Generate_INPUT');
  -- Suppression préalable (ordre inverse des dépendances)
  DELETE FROM evaluations WHERE teacher_id = current_teacher_uuid;
  DELETE FROM students WHERE class_id IN (
    SELECT id FROM classes WHERE teacher_id = current_teacher_uuid
  );
  DELETE FROM classes WHERE teacher_id = current_teacher_uuid;
  DELETE FROM criteria WHERE teacher_id = current_teacher_uuid;
  DELETE FROM conditional_formatting WHERE teacher_id = current_teacher_uuid;

  -- Insertions
  INSERT INTO classes(id, name, teacher_id) VALUES
    (class_id_demo6, 'Demo 6º', current_teacher_uuid),
    (class_id_demo7, 'Demo 7º', current_teacher_uuid),
    (class_id_demo8, 'Demo 8º', current_teacher_uuid);

  INSERT INTO students(id, first_name, last_name, class_id) VALUES
    (student_id_gabriel_costa, 'Gabriel', 'Costa', class_id_demo6),
    (student_id_juliana_pereira, 'Juliana', 'Pereira', class_id_demo6),
    (student_id_matheus_ribeiro, 'Matheus', 'Ribeiro', class_id_demo6),
    (student_id_joao_silva, 'João', 'Silva', class_id_demo7),
    (student_id_maria_santos, 'Maria', 'Santos', class_id_demo7),
    (student_id_lucas_lima, 'Lucas', 'Lima', class_id_demo7);

  INSERT INTO criteria(id, name, teacher_id, min_value, max_value) VALUES
    (criterion_id_avaliacao, 'Avaliação', current_teacher_uuid, 0, 10),
    (criterion_id_participacao, 'Participação', current_teacher_uuid, 0, 3),
    (criterion_id_visto, 'Visto', current_teacher_uuid, 0, 5),
    (criterion_id_prova_ext, 'Prova Ext.', current_teacher_uuid, 0, 2),
    (criterion_id_projeto, 'Projeto', current_teacher_uuid, 0, 5),
    (criterion_id_gramatica, 'Gramática', current_teacher_uuid, 0, 5),
    (criterion_id_vocabulario, 'Vocabulário', current_teacher_uuid, 0, 10),
    (criterion_id_escrita, 'Escrita', current_teacher_uuid, 0, 5),
    (criterion_id_oral, 'Oral', current_teacher_uuid, 0, 10),
    (criterion_id_pronuncia, 'Pronúncia', current_teacher_uuid, 0, 3);

  INSERT INTO conditional_formatting(id, min_score, max_score, color, teacher_id, evaluation_title) VALUES
    (uuid_generate_v5(current_teacher_uuid, 'cf_portugues_black'), 0, 0, 'black', current_teacher_uuid, 'Português'),
    (uuid_generate_v5(current_teacher_uuid, 'cf_portugues_red'), 0.1, 14.9, 'red', current_teacher_uuid, 'Português'),
    (uuid_generate_v5(current_teacher_uuid, 'cf_portugues_green'), 15, 99999, 'green', current_teacher_uuid, 'Português'),
    (uuid_generate_v5(current_teacher_uuid, 'cf_2trim_black'), 0, 0, 'black', current_teacher_uuid, '2º Trimestre'),
    (uuid_generate_v5(current_teacher_uuid, 'cf_2trim_red'), 0.1, 14.9, 'red', current_teacher_uuid, '2º Trimestre'),
    (uuid_generate_v5(current_teacher_uuid, 'cf_2trim_green'), 15, 99999, 'green', current_teacher_uuid, '2º Trimestre');
-- Insertion evaluations - 30 lignes (15 + 15)
  -- Pour 3 élèves (6º ano)
  INSERT INTO evaluations(id, title, date, teacher_id, student_id, comments, criterion_id, value, class_id) VALUES
  -- Gabriel Costa
  (uuid_generate_v5(current_teacher_uuid, 'eval_gabriel_avaliacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_gabriel_costa, NULL, criterion_id_avaliacao, 4, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_gabriel_participacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_gabriel_costa, NULL, criterion_id_participacao, 1, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_gabriel_visto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_gabriel_costa, NULL, criterion_id_visto, 1, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_gabriel_provaext'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_gabriel_costa, NULL, criterion_id_prova_ext, 1, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_gabriel_projeto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_gabriel_costa, NULL, criterion_id_projeto, 3, class_id_demo6),

  -- Juliana Pereira
  (uuid_generate_v5(current_teacher_uuid, 'eval_juliana_avaliacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_juliana_pereira, NULL, criterion_id_avaliacao, 0, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_juliana_participacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_juliana_pereira, NULL, criterion_id_participacao, 2, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_juliana_visto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_juliana_pereira, NULL, criterion_id_visto, 1, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_juliana_provaext'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_juliana_pereira, NULL, criterion_id_prova_ext, 1, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_juliana_projeto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_juliana_pereira, NULL, criterion_id_projeto, 1, class_id_demo6),

  -- Matheus Ribeiro
  (uuid_generate_v5(current_teacher_uuid, 'eval_matheus_avaliacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_matheus_ribeiro, NULL, criterion_id_avaliacao, 9, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_matheus_participacao'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_matheus_ribeiro, NULL, criterion_id_participacao, 2, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_matheus_visto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_matheus_ribeiro, NULL, criterion_id_visto, 4, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_matheus_provaext'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_matheus_ribeiro, NULL, criterion_id_prova_ext, 0, class_id_demo6),
  (uuid_generate_v5(current_teacher_uuid, 'eval_matheus_projeto'), '2º Trimestre', '2025-06-04', current_teacher_uuid, student_id_matheus_ribeiro, NULL, criterion_id_projeto, 1, class_id_demo6);


-- INSERTIONS pour l'évaluation "Português"
    -- João Silva
    INSERT INTO evaluations (id, title, date, teacher_id, student_id, comments, criterion_id, value, class_id) VALUES
    (uuid_generate_v5(current_teacher_uuid, 'eval_joao_portugues_gramatica'), 'Português', '2025-06-04', current_teacher_uuid, student_id_joao_silva, NULL, criterion_id_gramatica, 2, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_joao_portugues_vocabulario'), 'Português', '2025-06-04', current_teacher_uuid, student_id_joao_silva, NULL, criterion_id_vocabulario, 8, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_joao_portugues_escrita'), 'Português', '2025-06-04', current_teacher_uuid, student_id_joao_silva, NULL, criterion_id_escrita, 1, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_joao_portugues_oral'), 'Português', '2025-06-04', current_teacher_uuid, student_id_joao_silva, NULL, criterion_id_oral, 2, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_joao_portugues_pronuncia'), 'Português', '2025-06-04', current_teacher_uuid, student_id_joao_silva, NULL, criterion_id_pronuncia, 1, class_id_demo7);

    -- Maria Santos
    INSERT INTO evaluations (id, title, date, teacher_id, student_id, comments, criterion_id, value, class_id) VALUES
    (uuid_generate_v5(current_teacher_uuid, 'eval_maria_portugues_gramatica'), 'Português', '2025-06-04', current_teacher_uuid, student_id_maria_santos, NULL, criterion_id_gramatica, 3, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_maria_portugues_vocabulario'), 'Português', '2025-06-04', current_teacher_uuid, student_id_maria_santos, NULL, criterion_id_vocabulario, 2, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_maria_portugues_escrita'), 'Português', '2025-06-04', current_teacher_uuid, student_id_maria_santos, NULL, criterion_id_escrita, 3, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_maria_portugues_oral'), 'Português', '2025-06-04', current_teacher_uuid, student_id_maria_santos, NULL, criterion_id_oral, 2, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_maria_portugues_pronuncia'), 'Português', '2025-06-04', current_teacher_uuid, student_id_maria_santos, NULL, criterion_id_pronuncia, 2, class_id_demo7);

    -- Lucas Lima
    INSERT INTO evaluations (id, title, date, teacher_id, student_id, comments, criterion_id, value, class_id) VALUES
    (uuid_generate_v5(current_teacher_uuid, 'eval_lucas_portugues_gramatica'), 'Português', '2025-06-04', current_teacher_uuid, student_id_lucas_lima, NULL, criterion_id_gramatica, 5, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_lucas_portugues_vocabulario'), 'Português', '2025-06-04', current_teacher_uuid, student_id_lucas_lima, NULL, criterion_id_vocabulario, 7, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_lucas_portugues_escrita'), 'Português', '2025-06-04', current_teacher_uuid, student_id_lucas_lima, NULL, criterion_id_escrita, 4, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_lucas_portugues_oral'), 'Português', '2025-06-04', current_teacher_uuid, student_id_lucas_lima, NULL, criterion_id_oral, 4, class_id_demo7),
    (uuid_generate_v5(current_teacher_uuid, 'eval_lucas_portugues_pronuncia'), 'Português', '2025-06-04', current_teacher_uuid, student_id_lucas_lima, NULL, criterion_id_pronuncia, 3, class_id_demo7);

  -- Log d’activité
  INSERT INTO demo_log(id, user_id, user_email, action)
  VALUES (gen_random_uuid(), p_user_id, p_user_email, 'CREATE_DEMO_FROM_UI');

END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_default_pro_trial_start()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.pro_trial_start_date IS NULL THEN
    NEW.pro_trial_start_date := now();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sign_url(bucket_name text, file_path text, expires_in_seconds integer DEFAULT 3600)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  signed_url text;
begin
  select storage.create_signed_url(bucket_name, file_path, expires_in_seconds)
  into signed_url;
  return signed_url;
end;
$function$
;

create or replace view "public"."student_total_with_formatting" as  WITH student_totals AS (
         SELECT e.student_id,
            e.teacher_id,
            COALESCE(et.title, e.title) AS evaluation_title,
            e.evaluation_title_id,
            sum(e.value) AS total
           FROM (evaluations e
             LEFT JOIN evaluation_titles et ON ((e.evaluation_title_id = et.id)))
          GROUP BY e.student_id, e.teacher_id, COALESCE(et.title, e.title), e.evaluation_title_id
        )
 SELECT s.id AS student_id,
    s.first_name,
    s.last_name,
    s.class_id,
    c.name AS class_name,
    st.total,
    cf.color AS total_color,
    st.teacher_id,
    st.evaluation_title
   FROM (((student_totals st
     JOIN students s ON ((st.student_id = s.id)))
     JOIN classes c ON ((s.class_id = c.id)))
     LEFT JOIN conditional_formatting cf ON (((st.teacher_id = cf.teacher_id) AND (((cf.evaluation_title_id IS NOT NULL) AND (cf.evaluation_title_id = st.evaluation_title_id)) OR ((cf.evaluation_title_id IS NULL) AND ((cf.evaluation_title IS NULL) OR (cf.evaluation_title = st.evaluation_title)))) AND ((st.total >= cf.min_score) AND (st.total <= COALESCE(cf.max_score, st.total))))));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_evaluation_value()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    min_val numeric;
    max_val numeric;
BEGIN
    SELECT min_value, max_value
    INTO min_val, max_val
    FROM criteria
    WHERE id = NEW.criterion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Critère introuvable pour criterion_id: %', NEW.criterion_id;
    END IF;

    IF NEW.value < min_val OR NEW.value > max_val THEN
        RAISE EXCEPTION 'Valeur % hors des bornes [% - %] pour le critère %', NEW.value, min_val, max_val, NEW.criterion_id;
    END IF;

    RETURN NEW;
END;
$function$
;

grant delete on table "public"."classes" to "anon";

grant insert on table "public"."classes" to "anon";

grant references on table "public"."classes" to "anon";

grant select on table "public"."classes" to "anon";

grant trigger on table "public"."classes" to "anon";

grant truncate on table "public"."classes" to "anon";

grant update on table "public"."classes" to "anon";

grant delete on table "public"."classes" to "authenticated";

grant insert on table "public"."classes" to "authenticated";

grant references on table "public"."classes" to "authenticated";

grant select on table "public"."classes" to "authenticated";

grant trigger on table "public"."classes" to "authenticated";

grant truncate on table "public"."classes" to "authenticated";

grant update on table "public"."classes" to "authenticated";

grant delete on table "public"."classes" to "service_role";

grant insert on table "public"."classes" to "service_role";

grant references on table "public"."classes" to "service_role";

grant select on table "public"."classes" to "service_role";

grant trigger on table "public"."classes" to "service_role";

grant truncate on table "public"."classes" to "service_role";

grant update on table "public"."classes" to "service_role";

grant delete on table "public"."conditional_formatting" to "anon";

grant insert on table "public"."conditional_formatting" to "anon";

grant references on table "public"."conditional_formatting" to "anon";

grant select on table "public"."conditional_formatting" to "anon";

grant trigger on table "public"."conditional_formatting" to "anon";

grant truncate on table "public"."conditional_formatting" to "anon";

grant update on table "public"."conditional_formatting" to "anon";

grant delete on table "public"."conditional_formatting" to "authenticated";

grant insert on table "public"."conditional_formatting" to "authenticated";

grant references on table "public"."conditional_formatting" to "authenticated";

grant select on table "public"."conditional_formatting" to "authenticated";

grant trigger on table "public"."conditional_formatting" to "authenticated";

grant truncate on table "public"."conditional_formatting" to "authenticated";

grant update on table "public"."conditional_formatting" to "authenticated";

grant delete on table "public"."conditional_formatting" to "service_role";

grant insert on table "public"."conditional_formatting" to "service_role";

grant references on table "public"."conditional_formatting" to "service_role";

grant select on table "public"."conditional_formatting" to "service_role";

grant trigger on table "public"."conditional_formatting" to "service_role";

grant truncate on table "public"."conditional_formatting" to "service_role";

grant update on table "public"."conditional_formatting" to "service_role";

grant delete on table "public"."criteria" to "anon";

grant insert on table "public"."criteria" to "anon";

grant references on table "public"."criteria" to "anon";

grant select on table "public"."criteria" to "anon";

grant trigger on table "public"."criteria" to "anon";

grant truncate on table "public"."criteria" to "anon";

grant update on table "public"."criteria" to "anon";

grant delete on table "public"."criteria" to "authenticated";

grant insert on table "public"."criteria" to "authenticated";

grant references on table "public"."criteria" to "authenticated";

grant select on table "public"."criteria" to "authenticated";

grant trigger on table "public"."criteria" to "authenticated";

grant truncate on table "public"."criteria" to "authenticated";

grant update on table "public"."criteria" to "authenticated";

grant delete on table "public"."criteria" to "service_role";

grant insert on table "public"."criteria" to "service_role";

grant references on table "public"."criteria" to "service_role";

grant select on table "public"."criteria" to "service_role";

grant trigger on table "public"."criteria" to "service_role";

grant truncate on table "public"."criteria" to "service_role";

grant update on table "public"."criteria" to "service_role";

grant delete on table "public"."criterion_tag_links" to "anon";

grant insert on table "public"."criterion_tag_links" to "anon";

grant references on table "public"."criterion_tag_links" to "anon";

grant select on table "public"."criterion_tag_links" to "anon";

grant trigger on table "public"."criterion_tag_links" to "anon";

grant truncate on table "public"."criterion_tag_links" to "anon";

grant update on table "public"."criterion_tag_links" to "anon";

grant delete on table "public"."criterion_tag_links" to "authenticated";

grant insert on table "public"."criterion_tag_links" to "authenticated";

grant references on table "public"."criterion_tag_links" to "authenticated";

grant select on table "public"."criterion_tag_links" to "authenticated";

grant trigger on table "public"."criterion_tag_links" to "authenticated";

grant truncate on table "public"."criterion_tag_links" to "authenticated";

grant update on table "public"."criterion_tag_links" to "authenticated";

grant delete on table "public"."criterion_tag_links" to "service_role";

grant insert on table "public"."criterion_tag_links" to "service_role";

grant references on table "public"."criterion_tag_links" to "service_role";

grant select on table "public"."criterion_tag_links" to "service_role";

grant trigger on table "public"."criterion_tag_links" to "service_role";

grant truncate on table "public"."criterion_tag_links" to "service_role";

grant update on table "public"."criterion_tag_links" to "service_role";

grant delete on table "public"."criterion_tags" to "anon";

grant insert on table "public"."criterion_tags" to "anon";

grant references on table "public"."criterion_tags" to "anon";

grant select on table "public"."criterion_tags" to "anon";

grant trigger on table "public"."criterion_tags" to "anon";

grant truncate on table "public"."criterion_tags" to "anon";

grant update on table "public"."criterion_tags" to "anon";

grant delete on table "public"."criterion_tags" to "authenticated";

grant insert on table "public"."criterion_tags" to "authenticated";

grant references on table "public"."criterion_tags" to "authenticated";

grant select on table "public"."criterion_tags" to "authenticated";

grant trigger on table "public"."criterion_tags" to "authenticated";

grant truncate on table "public"."criterion_tags" to "authenticated";

grant update on table "public"."criterion_tags" to "authenticated";

grant delete on table "public"."criterion_tags" to "service_role";

grant insert on table "public"."criterion_tags" to "service_role";

grant references on table "public"."criterion_tags" to "service_role";

grant select on table "public"."criterion_tags" to "service_role";

grant trigger on table "public"."criterion_tags" to "service_role";

grant truncate on table "public"."criterion_tags" to "service_role";

grant update on table "public"."criterion_tags" to "service_role";

grant delete on table "public"."demo_entities" to "anon";

grant insert on table "public"."demo_entities" to "anon";

grant references on table "public"."demo_entities" to "anon";

grant select on table "public"."demo_entities" to "anon";

grant trigger on table "public"."demo_entities" to "anon";

grant truncate on table "public"."demo_entities" to "anon";

grant update on table "public"."demo_entities" to "anon";

grant delete on table "public"."demo_entities" to "authenticated";

grant insert on table "public"."demo_entities" to "authenticated";

grant references on table "public"."demo_entities" to "authenticated";

grant select on table "public"."demo_entities" to "authenticated";

grant trigger on table "public"."demo_entities" to "authenticated";

grant truncate on table "public"."demo_entities" to "authenticated";

grant update on table "public"."demo_entities" to "authenticated";

grant delete on table "public"."demo_entities" to "service_role";

grant insert on table "public"."demo_entities" to "service_role";

grant references on table "public"."demo_entities" to "service_role";

grant select on table "public"."demo_entities" to "service_role";

grant trigger on table "public"."demo_entities" to "service_role";

grant truncate on table "public"."demo_entities" to "service_role";

grant update on table "public"."demo_entities" to "service_role";

grant delete on table "public"."demo_log" to "anon";

grant insert on table "public"."demo_log" to "anon";

grant references on table "public"."demo_log" to "anon";

grant select on table "public"."demo_log" to "anon";

grant trigger on table "public"."demo_log" to "anon";

grant truncate on table "public"."demo_log" to "anon";

grant update on table "public"."demo_log" to "anon";

grant delete on table "public"."demo_log" to "authenticated";

grant insert on table "public"."demo_log" to "authenticated";

grant references on table "public"."demo_log" to "authenticated";

grant select on table "public"."demo_log" to "authenticated";

grant trigger on table "public"."demo_log" to "authenticated";

grant truncate on table "public"."demo_log" to "authenticated";

grant update on table "public"."demo_log" to "authenticated";

grant delete on table "public"."demo_log" to "service_role";

grant insert on table "public"."demo_log" to "service_role";

grant references on table "public"."demo_log" to "service_role";

grant select on table "public"."demo_log" to "service_role";

grant trigger on table "public"."demo_log" to "service_role";

grant truncate on table "public"."demo_log" to "service_role";

grant update on table "public"."demo_log" to "service_role";

grant delete on table "public"."evaluation_attachments" to "anon";

grant insert on table "public"."evaluation_attachments" to "anon";

grant references on table "public"."evaluation_attachments" to "anon";

grant select on table "public"."evaluation_attachments" to "anon";

grant trigger on table "public"."evaluation_attachments" to "anon";

grant truncate on table "public"."evaluation_attachments" to "anon";

grant update on table "public"."evaluation_attachments" to "anon";

grant delete on table "public"."evaluation_attachments" to "authenticated";

grant insert on table "public"."evaluation_attachments" to "authenticated";

grant references on table "public"."evaluation_attachments" to "authenticated";

grant select on table "public"."evaluation_attachments" to "authenticated";

grant trigger on table "public"."evaluation_attachments" to "authenticated";

grant truncate on table "public"."evaluation_attachments" to "authenticated";

grant update on table "public"."evaluation_attachments" to "authenticated";

grant delete on table "public"."evaluation_attachments" to "service_role";

grant insert on table "public"."evaluation_attachments" to "service_role";

grant references on table "public"."evaluation_attachments" to "service_role";

grant select on table "public"."evaluation_attachments" to "service_role";

grant trigger on table "public"."evaluation_attachments" to "service_role";

grant truncate on table "public"."evaluation_attachments" to "service_role";

grant update on table "public"."evaluation_attachments" to "service_role";

grant delete on table "public"."evaluation_criteria_log" to "anon";

grant insert on table "public"."evaluation_criteria_log" to "anon";

grant references on table "public"."evaluation_criteria_log" to "anon";

grant select on table "public"."evaluation_criteria_log" to "anon";

grant trigger on table "public"."evaluation_criteria_log" to "anon";

grant truncate on table "public"."evaluation_criteria_log" to "anon";

grant update on table "public"."evaluation_criteria_log" to "anon";

grant delete on table "public"."evaluation_criteria_log" to "authenticated";

grant insert on table "public"."evaluation_criteria_log" to "authenticated";

grant references on table "public"."evaluation_criteria_log" to "authenticated";

grant select on table "public"."evaluation_criteria_log" to "authenticated";

grant trigger on table "public"."evaluation_criteria_log" to "authenticated";

grant truncate on table "public"."evaluation_criteria_log" to "authenticated";

grant update on table "public"."evaluation_criteria_log" to "authenticated";

grant delete on table "public"."evaluation_criteria_log" to "service_role";

grant insert on table "public"."evaluation_criteria_log" to "service_role";

grant references on table "public"."evaluation_criteria_log" to "service_role";

grant select on table "public"."evaluation_criteria_log" to "service_role";

grant trigger on table "public"."evaluation_criteria_log" to "service_role";

grant truncate on table "public"."evaluation_criteria_log" to "service_role";

grant update on table "public"."evaluation_criteria_log" to "service_role";

grant delete on table "public"."evaluation_title_criteria" to "anon";

grant insert on table "public"."evaluation_title_criteria" to "anon";

grant references on table "public"."evaluation_title_criteria" to "anon";

grant select on table "public"."evaluation_title_criteria" to "anon";

grant trigger on table "public"."evaluation_title_criteria" to "anon";

grant truncate on table "public"."evaluation_title_criteria" to "anon";

grant update on table "public"."evaluation_title_criteria" to "anon";

grant delete on table "public"."evaluation_title_criteria" to "authenticated";

grant insert on table "public"."evaluation_title_criteria" to "authenticated";

grant references on table "public"."evaluation_title_criteria" to "authenticated";

grant select on table "public"."evaluation_title_criteria" to "authenticated";

grant trigger on table "public"."evaluation_title_criteria" to "authenticated";

grant truncate on table "public"."evaluation_title_criteria" to "authenticated";

grant update on table "public"."evaluation_title_criteria" to "authenticated";

grant delete on table "public"."evaluation_title_criteria" to "service_role";

grant insert on table "public"."evaluation_title_criteria" to "service_role";

grant references on table "public"."evaluation_title_criteria" to "service_role";

grant select on table "public"."evaluation_title_criteria" to "service_role";

grant trigger on table "public"."evaluation_title_criteria" to "service_role";

grant truncate on table "public"."evaluation_title_criteria" to "service_role";

grant update on table "public"."evaluation_title_criteria" to "service_role";

grant delete on table "public"."evaluation_titles" to "anon";

grant insert on table "public"."evaluation_titles" to "anon";

grant references on table "public"."evaluation_titles" to "anon";

grant select on table "public"."evaluation_titles" to "anon";

grant trigger on table "public"."evaluation_titles" to "anon";

grant truncate on table "public"."evaluation_titles" to "anon";

grant update on table "public"."evaluation_titles" to "anon";

grant delete on table "public"."evaluation_titles" to "authenticated";

grant insert on table "public"."evaluation_titles" to "authenticated";

grant references on table "public"."evaluation_titles" to "authenticated";

grant select on table "public"."evaluation_titles" to "authenticated";

grant trigger on table "public"."evaluation_titles" to "authenticated";

grant truncate on table "public"."evaluation_titles" to "authenticated";

grant update on table "public"."evaluation_titles" to "authenticated";

grant delete on table "public"."evaluation_titles" to "service_role";

grant insert on table "public"."evaluation_titles" to "service_role";

grant references on table "public"."evaluation_titles" to "service_role";

grant select on table "public"."evaluation_titles" to "service_role";

grant trigger on table "public"."evaluation_titles" to "service_role";

grant truncate on table "public"."evaluation_titles" to "service_role";

grant update on table "public"."evaluation_titles" to "service_role";

grant delete on table "public"."evaluations" to "anon";

grant insert on table "public"."evaluations" to "anon";

grant references on table "public"."evaluations" to "anon";

grant select on table "public"."evaluations" to "anon";

grant trigger on table "public"."evaluations" to "anon";

grant truncate on table "public"."evaluations" to "anon";

grant update on table "public"."evaluations" to "anon";

grant delete on table "public"."evaluations" to "authenticated";

grant insert on table "public"."evaluations" to "authenticated";

grant references on table "public"."evaluations" to "authenticated";

grant select on table "public"."evaluations" to "authenticated";

grant trigger on table "public"."evaluations" to "authenticated";

grant truncate on table "public"."evaluations" to "authenticated";

grant update on table "public"."evaluations" to "authenticated";

grant delete on table "public"."evaluations" to "service_role";

grant insert on table "public"."evaluations" to "service_role";

grant references on table "public"."evaluations" to "service_role";

grant select on table "public"."evaluations" to "service_role";

grant trigger on table "public"."evaluations" to "service_role";

grant truncate on table "public"."evaluations" to "service_role";

grant update on table "public"."evaluations" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."students" to "anon";

grant insert on table "public"."students" to "anon";

grant references on table "public"."students" to "anon";

grant select on table "public"."students" to "anon";

grant trigger on table "public"."students" to "anon";

grant truncate on table "public"."students" to "anon";

grant update on table "public"."students" to "anon";

grant delete on table "public"."students" to "authenticated";

grant insert on table "public"."students" to "authenticated";

grant references on table "public"."students" to "authenticated";

grant select on table "public"."students" to "authenticated";

grant trigger on table "public"."students" to "authenticated";

grant truncate on table "public"."students" to "authenticated";

grant update on table "public"."students" to "authenticated";

grant delete on table "public"."students" to "service_role";

grant insert on table "public"."students" to "service_role";

grant references on table "public"."students" to "service_role";

grant select on table "public"."students" to "service_role";

grant trigger on table "public"."students" to "service_role";

grant truncate on table "public"."students" to "service_role";

grant update on table "public"."students" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Admins can access all classes"
on "public"."classes"
as permissive
for all
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Block anon access on classes"
on "public"."classes"
as permissive
for all
to anon
using (false);


create policy "Teacher can delete own classes"
on "public"."classes"
as permissive
for delete
to authenticated
using ((teacher_id = auth.uid()));


create policy "Teacher can insert own classes"
on "public"."classes"
as permissive
for insert
to authenticated
with check ((teacher_id = auth.uid()));


create policy "Teacher can read own classes"
on "public"."classes"
as permissive
for select
to authenticated
using ((teacher_id = auth.uid()));


create policy "Teacher can update own classes"
on "public"."classes"
as permissive
for update
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Teachers access their own classes"
on "public"."classes"
as permissive
for all
to authenticated
using ((teacher_id = ( SELECT users.id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'teacher'::text)))));


create policy "Teachers can manage their own classes"
on "public"."classes"
as permissive
for all
to authenticated
using ((auth.uid() = teacher_id))
with check ((auth.uid() = teacher_id));


create policy "Admins can access all formatting"
on "public"."conditional_formatting"
as permissive
for all
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Block anon access on conditional_formatting"
on "public"."conditional_formatting"
as permissive
for all
to anon
using (false);


create policy "Teacher can delete own formatting"
on "public"."conditional_formatting"
as permissive
for delete
to authenticated
using ((teacher_id = auth.uid()));


create policy "Teacher can insert own formatting"
on "public"."conditional_formatting"
as permissive
for insert
to authenticated
with check ((teacher_id = auth.uid()));


create policy "Teacher can update own formatting"
on "public"."conditional_formatting"
as permissive
for update
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Teacher can view own formatting"
on "public"."conditional_formatting"
as permissive
for select
to authenticated
using ((teacher_id = auth.uid()));


create policy "Teachers access their own formatting"
on "public"."conditional_formatting"
as permissive
for all
to authenticated
using ((teacher_id = ( SELECT users.id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'teacher'::text)))));


create policy "Teachers can manage their own formatting rules"
on "public"."conditional_formatting"
as permissive
for all
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Admins can access all criteria"
on "public"."criteria"
as permissive
for all
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Block anon access on criteria"
on "public"."criteria"
as permissive
for all
to anon
using (false);


create policy "Teachers can manage their own criteria"
on "public"."criteria"
as permissive
for all
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "delete_own_tag_links"
on "public"."criterion_tag_links"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM criteria c
  WHERE ((c.id = criterion_tag_links.criterion_id) AND (c.teacher_id = auth.uid())))));


create policy "link_tags_only_to_own_criteria"
on "public"."criterion_tag_links"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM criteria c
  WHERE ((c.id = criterion_tag_links.criterion_id) AND (c.teacher_id = auth.uid())))));


create policy "read_tags_links_if_owner"
on "public"."criterion_tag_links"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM criteria c
  WHERE ((c.id = criterion_tag_links.criterion_id) AND (c.teacher_id = auth.uid())))));


create policy "update_own_tag_links"
on "public"."criterion_tag_links"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM criteria c
  WHERE ((c.id = criterion_tag_links.criterion_id) AND (c.teacher_id = auth.uid())))));


create policy "delete_own_tags_only"
on "public"."criterion_tags"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "insert_own_tags"
on "public"."criterion_tags"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "read_own_or_public_tags"
on "public"."criterion_tags"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (user_id IS NULL)));


create policy "update_own_tags_only"
on "public"."criterion_tags"
as permissive
for update
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can manage their own demo log"
on "public"."demo_log"
as permissive
for all
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Allow teachers to insert own attachments"
on "public"."evaluation_attachments"
as permissive
for insert
to authenticated
with check ((auth.uid() = teacher_id));


create policy "Prof peut créer ses pièces jointes"
on "public"."evaluation_attachments"
as permissive
for insert
to public
with check ((teacher_id = auth.uid()));


create policy "Prof peut modifier ses pièces jointes"
on "public"."evaluation_attachments"
as permissive
for update
to public
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Prof peut supprimer ses pièces jointes"
on "public"."evaluation_attachments"
as permissive
for delete
to public
using ((teacher_id = auth.uid()));


create policy "Prof peut voir ses pièces jointes"
on "public"."evaluation_attachments"
as permissive
for select
to public
using ((teacher_id = auth.uid()));


create policy "Professores podem inserir seus anexos"
on "public"."evaluation_attachments"
as permissive
for insert
to authenticated
with check ((teacher_id = auth.uid()));


create policy "Professores podem ver seus anexos"
on "public"."evaluation_attachments"
as permissive
for select
to authenticated
using ((teacher_id = auth.uid()));


create policy "Teachers can delete their own attachments"
on "public"."evaluation_attachments"
as permissive
for delete
to authenticated
using ((auth.uid() = teacher_id));


create policy "Teachers can read their own attachments"
on "public"."evaluation_attachments"
as permissive
for select
to authenticated
using ((auth.uid() = teacher_id));


create policy "Teachers can update their own attachments"
on "public"."evaluation_attachments"
as permissive
for update
to authenticated
using ((auth.uid() = teacher_id))
with check ((auth.uid() = teacher_id));


create policy "Allow teacher log access"
on "public"."evaluation_criteria_log"
as permissive
for select
to public
using ((teacher_id = auth.uid()));


create policy "Professeur peut créer ses titres"
on "public"."evaluation_titles"
as permissive
for insert
to public
with check ((teacher_id = auth.uid()));


create policy "Professeur peut modifier ses titres"
on "public"."evaluation_titles"
as permissive
for update
to public
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Professeur peut supprimer ses titres"
on "public"."evaluation_titles"
as permissive
for delete
to public
using ((teacher_id = auth.uid()));


create policy "Professeur peut voir ses titres"
on "public"."evaluation_titles"
as permissive
for select
to public
using ((teacher_id = auth.uid()));


create policy "Admins can access all evaluations"
on "public"."evaluations"
as permissive
for all
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Block anon access on evaluations"
on "public"."evaluations"
as permissive
for all
to anon
using (false);


create policy "Teachers access their evaluations"
on "public"."evaluations"
as permissive
for all
to authenticated
using ((teacher_id = ( SELECT users.id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'teacher'::text)))));


create policy "Teachers can manage evaluations for their students"
on "public"."evaluations"
as permissive
for all
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Can insert own payment"
on "public"."payments"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Can view own payments"
on "public"."payments"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Function updates only"
on "public"."payments"
as permissive
for update
to public
using ((auth.role() = 'service_role'::text));


create policy "Insert payments from webhook"
on "public"."payments"
as permissive
for insert
to service_role
with check (true);


create policy "Admins can access all students"
on "public"."students"
as permissive
for all
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Block anon access on students"
on "public"."students"
as permissive
for all
to anon
using (false);


create policy "Teachers can manage students in their classes"
on "public"."students"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM classes
  WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM classes
  WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))));


create policy "Teachers can manage their own students"
on "public"."students"
as permissive
for all
to authenticated
using ((teacher_id = auth.uid()))
with check ((teacher_id = auth.uid()));


create policy "Admins can access all users"
on "public"."users"
as permissive
for all
to authenticated
using ((role = 'admin'::text));


create policy "Allow signup for anon"
on "public"."users"
as permissive
for insert
to anon
with check (true);


create policy "Allow webhook update sub date"
on "public"."users"
as permissive
for update
to service_role
using (true)
with check (true);


create policy "Authenticated can edit own profile"
on "public"."users"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "Authenticated can view own profile"
on "public"."users"
as permissive
for select
to authenticated
using ((id = auth.uid()));


create policy "Block anon access on users"
on "public"."users"
as permissive
for all
to anon
using (false);


create policy "allow_select_own_user"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "allow_update_own_subscription"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((current_plan = ANY (ARRAY['free'::text, 'pro'::text])));


create policy "select_own_user"
on "public"."users"
as permissive
for select
to authenticated
using ((id = auth.uid()));


create policy "update_own_user"
on "public"."users"
as permissive
for update
to authenticated
using ((id = auth.uid()));


CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.evaluation_titles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_validate_evaluation_value BEFORE INSERT OR UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION validate_evaluation_value();

CREATE TRIGGER trg_set_pro_trial_start BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION set_default_pro_trial_start();


