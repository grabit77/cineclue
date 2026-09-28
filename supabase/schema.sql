-- =============================================================
-- CineClue - Schema Supabase
-- Esegui questo file nella SQL Editor del tuo progetto Supabase
-- (Dashboard -> SQL Editor -> New query -> Run).
-- =============================================================

-- -------------------------------------------------------------
-- Tabella utenti: profilo sincronizzato (guest <-> account).
-- `id` è l'UUID di auth.users.
-- -------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  games_played integer default 0,
  games_won integer default 0,
  current_streak integer default 0,
  max_streak integer default 0,
  guess_distribution jsonb default '{}'::jsonb,
  wins_by_date jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------
-- Tabella punteggi giornalieri: una riga per (utente, giorno).
-- -------------------------------------------------------------
create table if not exists public.daily_scores (
  id bigint generated always as identity primary key,
  user_id uuid references public.users (id) on delete cascade,
  puzzle_date date not null,
  attempts integer not null check (attempts between 1 and 6),
  points integer not null check (points >= 0),
  created_at timestamptz default now(),
  unique (user_id, puzzle_date)
);

-- -------------------------------------------------------------
-- Indicizzazioni utili per la classifica.
-- -------------------------------------------------------------
create index if not exists daily_scores_user_idx on public.daily_scores (user_id);
create index if not exists daily_scores_points_idx on public.daily_scores (points desc);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.users enable row level security;
alter table public.daily_scores enable row level security;

-- users: ognuno legge/aggiorna solo la propria riga.
drop policy if exists "users: read own" on public.users;
create policy "users: read own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users: insert own" on public.users;
create policy "users: insert own"
  on public.users for insert
  with check (auth.uid() = id);

drop policy if exists "users: update own" on public.users;
create policy "users: update own"
  on public.users for update
  using (auth.uid() = id);

-- daily_scores: ognuno inserisce solo i propri punteggi.
drop policy if exists "scores: insert own" on public.daily_scores;
create policy "scores: insert own"
  on public.daily_scores for insert
  with check (auth.uid() = user_id);

-- I punteggi sono letti dalla classifica tramite service role (server),
-- quindi non servono policy di SELECT pubbliche.

-- -------------------------------------------------------------
-- Calendario admin: un'unica riga con i film assegnati a mano.
-- Su Vercel il filesystem è in sola lettura, quindi non si può
-- scrivere data/schedule.json. Nessuna policy: ci accede solo
-- il service role dal server.
-- Alla prima lettura l'app copia i film già presenti nel file locale.
-- -------------------------------------------------------------
create table if not exists public.game_schedule (
  id integer primary key check (id = 1),
  reset_at timestamptz,
  overrides jsonb not null default '{}'::jsonb
);

alter table public.game_schedule enable row level security;