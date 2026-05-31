-- ============================================
-- SEED FAMILY USERS
-- ============================================
-- Run this AFTER creating the auth users in the Dashboard.
--
-- STEP 1: Supabase Dashboard > Authentication > Users > "Add user".
--   Create one auth user per family member. The PIN is the password.
--   Use any unique email (the family never types it — login is by PIN only):
--
--     Email: diogo@instagran.family       Password (PIN): 123456
--     Email: maria@instagran.family       Password (PIN): 654321
--     Email: avo.fatima@instagran.family  Password (PIN): 111111
--     Email: avo.ana@instagran.family     Password (PIN): 222222
--     Email: avo.luis@instagran.family    Password (PIN): 333333
--
--   NOTE: the login screen expects a 6-digit PIN. Use 6-digit passwords.
--
-- STEP 2: Copy each user's UUID from the dashboard and paste below,
--         making sure email + pin_code match what you set in STEP 1.

insert into public.users (id, name, email, role, avatar_emoji, pin_code) values
  ('REPLACE-UUID-DIOGO',  'Diogo',         'diogo@instagran.family',      'parent',      '👨', '123456'),
  ('REPLACE-UUID-MARIA',  'Maria',         'maria@instagran.family',      'parent',      '👩', '654321'),
  ('REPLACE-UUID-FATIMA', 'Avó Fátima',    'avo.fatima@instagran.family', 'grandmother', '👵', '111111'),
  ('REPLACE-UUID-ANA',    'Avó Ana Maria', 'avo.ana@instagran.family',    'grandmother', '👵', '222222'),
  ('REPLACE-UUID-LUIS',   'Avô Luís',      'avo.luis@instagran.family',   'grandfather', '👴', '333333');

-- STEP 3 (optional but recommended): disable public sign-ups so nobody can
-- create an account. Dashboard > Authentication > Providers > Email > turn OFF
-- "Enable Sign Up".
