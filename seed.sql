-- =====================================================================
-- FULL SETUP SCRIPT: CoffeeAndKudos
-- Creates schema (tables, constraints, indexes) and seeds data
-- Idempotent: drops existing tables before recreating
-- =====================================================================

-- 0) Extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- 1) Drop existing objects for testing purposes (MS: dont't delete!)
-- =====================================================================
DROP TABLE IF EXISTS borrows CASCADE;
DROP TABLE IF EXISTS favors  CASCADE;
DROP TABLE IF EXISTS users   CASCADE;

-- =====================================================================
-- 2) TABLES
-- =====================================================================

-- ---- users ----------------------------------------------------------
CREATE TABLE users (
  user_id        uuid        PRIMARY KEY,
  username       varchar     NOT NULL UNIQUE,
  email          varchar     NOT NULL UNIQUE,
  created_at     timestamptz NOT NULL,
  count_lent     int4        NOT NULL,
  count_borrowed int4        NOT NULL,
  favors_given   int4        NOT NULL,
  favors_taken   int4        NOT NULL
);

-- ---- borrows --------------------------------------------------------
CREATE TABLE borrows (
  borrow_id   uuid        PRIMARY KEY,
  lender_id   uuid        NOT NULL REFERENCES users(user_id),
  borrower_id uuid        NOT NULL REFERENCES users(user_id),
  item_name   varchar     NOT NULL,
  due_date    date        NULL,
  returned_at timestamptz NULL,
  created_at  timestamptz NOT NULL
);

-- ---- favors ---------------------------------------------------------
CREATE TABLE favors (
  favor_id    uuid        PRIMARY KEY,
  debtor_id   uuid        NOT NULL REFERENCES users(user_id),
  creditor_id uuid        NOT NULL REFERENCES users(user_id),
  description text        NOT NULL,
  is_settled  bool        NOT NULL,
  created_at  timestamptz NOT NULL
);

-- =====================================================================
-- 3) INDEXES (custom, in addition to PK/UNIQUE indexes)
-- =====================================================================
CREATE INDEX idx_borrows_borrower ON public.borrows USING btree (borrower_id);
CREATE INDEX idx_borrows_lender   ON public.borrows USING btree (lender_id);
CREATE INDEX idx_favors_creditor  ON public.favors  USING btree (creditor_id);
CREATE INDEX idx_favors_debtor    ON public.favors  USING btree (debtor_id);

-- =====================================================================
-- 4) SEED: USERS
-- Counters are set consistently via UPDATE at the end
-- =====================================================================
INSERT INTO users (user_id, username, email, created_at, count_lent, count_borrowed, favors_given, favors_taken) VALUES
  (gen_random_uuid(), 'Manuel Neuer',     'manuel.neuer@fcbayern.com',     NOW() - INTERVAL '90 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Thomas Müller',    'thomas.mueller@fcbayern.com',   NOW() - INTERVAL '90 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Joshua Kimmich',   'joshua.kimmich@fcbayern.com',   NOW() - INTERVAL '85 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Harry Kane',       'harry.kane@fcbayern.com',       NOW() - INTERVAL '60 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Leroy Sané',       'leroy.sane@fcbayern.com',       NOW() - INTERVAL '80 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Jamal Musiala',    'jamal.musiala@fcbayern.com',    NOW() - INTERVAL '75 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Alphonso Davies',  'alphonso.davies@fcbayern.com',  NOW() - INTERVAL '78 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Leon Goretzka',    'leon.goretzka@fcbayern.com',    NOW() - INTERVAL '85 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Serge Gnabry',     'serge.gnabry@fcbayern.com',     NOW() - INTERVAL '82 days', 0, 0, 0, 0),
  (gen_random_uuid(), 'Kingsley Coman',   'kingsley.coman@fcbayern.com',   NOW() - INTERVAL '80 days', 0, 0, 0, 0);

-- =====================================================================
-- 5) SEED: FAVORS (Soft Debts)
-- =====================================================================
INSERT INTO favors (favor_id, debtor_id, creditor_id, description, is_settled, created_at) VALUES
  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Harry Kane'),
   (SELECT user_id FROM users WHERE username = 'Serge Gnabry'),
   'Brought specialty coffee beans from London', false, NOW() - INTERVAL '1 day'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Leroy Sané'),
   (SELECT user_id FROM users WHERE username = 'Manuel Neuer'),
   'Helped me move my home gym equipment', true, NOW() - INTERVAL '10 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Kingsley Coman'),
   (SELECT user_id FROM users WHERE username = 'Joshua Kimmich'),
   'Reminded me of the early recovery session time', false, NOW() - INTERVAL '5 hours'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Leon Goretzka'),
   (SELECT user_id FROM users WHERE username = 'Alphonso Davies'),
   'Edited a short highlight reel for my social media', true, NOW() - INTERVAL '3 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Jamal Musiala'),
   (SELECT user_id FROM users WHERE username = 'Thomas Müller'),
   'Gave me a tour of the best spots in Munich', true, NOW() - INTERVAL '14 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Manuel Neuer'),
   (SELECT user_id FROM users WHERE username = 'Serge Gnabry'),
   'Shared a healthy meal prep recipe', false, NOW() - INTERVAL '2 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Joshua Kimmich'),
   (SELECT user_id FROM users WHERE username = 'Harry Kane'),
   'Helped find a bilingual tutor for the kids', false, NOW() - INTERVAL '4 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Alphonso Davies'),
   (SELECT user_id FROM users WHERE username = 'Jamal Musiala'),
   'Covered my round at the team dinner', false, NOW() - INTERVAL '6 days');

-- =====================================================================
-- 6) SEED: BORROWS (Physical Items)
-- Mix of open / returned / overdue
-- =====================================================================
INSERT INTO borrows (borrow_id, lender_id, borrower_id, item_name, due_date, returned_at, created_at) VALUES
  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Serge Gnabry'),
   (SELECT user_id FROM users WHERE username = 'Jamal Musiala'),
   'Specialized foam roller', CURRENT_DATE + INTERVAL '3 days', NULL, NOW() - INTERVAL '2 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Kingsley Coman'),
   (SELECT user_id FROM users WHERE username = 'Manuel Neuer'),
   'French fashion magazine for the flight', CURRENT_DATE + INTERVAL '1 day', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 day'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Harry Kane'),
   (SELECT user_id FROM users WHERE username = 'Leroy Sané'),
   'English-to-German pocket dictionary', CURRENT_DATE + INTERVAL '16 days', NULL, NOW() - INTERVAL '6 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Thomas Müller'),
   (SELECT user_id FROM users WHERE username = 'Leon Goretzka'),
   'Compression socks (spare pair)', CURRENT_DATE - INTERVAL '2 days', NULL, NOW() - INTERVAL '12 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Alphonso Davies'),
   (SELECT user_id FROM users WHERE username = 'Joshua Kimmich'),
   'Gaming controller for the team hotel', CURRENT_DATE, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Leon Goretzka'),
   (SELECT user_id FROM users WHERE username = 'Kingsley Coman'),
   'Cold-weather thermal undershirt', CURRENT_DATE + INTERVAL '5 days', NULL, NOW() - INTERVAL '3 days'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Manuel Neuer'),
   (SELECT user_id FROM users WHERE username = 'Thomas Müller'),
   'Backup captain armband', CURRENT_DATE + INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day'),

  (gen_random_uuid(),
   (SELECT user_id FROM users WHERE username = 'Joshua Kimmich'),
   (SELECT user_id FROM users WHERE username = 'Alphonso Davies'),
   'Noise-cancelling headphones', CURRENT_DATE - INTERVAL '5 days', NULL, NOW() - INTERVAL '20 days');

-- =====================================================================
-- 7) Set counters in users consistently
-- count_lent       = number of borrows as lender
-- count_borrowed   = number of borrows as borrower
-- favors_given     = number of favors as creditor (= favors done)
-- favors_taken     = number of favors as debtor   (= favors received)
-- =====================================================================
UPDATE users u SET
  count_lent     = (SELECT COUNT(*) FROM borrows WHERE lender_id   = u.user_id),
  count_borrowed = (SELECT COUNT(*) FROM borrows WHERE borrower_id = u.user_id),
  favors_given   = (SELECT COUNT(*) FROM favors  WHERE creditor_id = u.user_id),
  favors_taken   = (SELECT COUNT(*) FROM favors  WHERE debtor_id   = u.user_id);
