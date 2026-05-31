# InstaGran — Guia de Setup

Passos completos para pôr a webapp a funcionar de raiz.

## 1. Criar projeto Supabase

1. Vai a [supabase.com](https://supabase.com) e cria conta (grátis).
2. Cria um novo projeto (nome "InstaGran"). Guarda:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (ou sb_publishable_...)
```

## 3. Correr a migração da base de dados

1. Supabase Dashboard → **SQL Editor**.
2. Cola o conteúdo de [`supabase/migration.sql`](supabase/migration.sql) e corre.
3. Cria tabelas (`users`, `albums`, `photos`, `comments`, `reactions`), políticas RLS,
   a função `get_user_by_pin`, o bucket de storage `photos` e ativa o realtime.

## 4. Criar os utilizadores da família

1. Dashboard → **Authentication** → **Users** → **Add user**.
2. Cria um utilizador por pessoa. **A password é o PIN** (6 dígitos).
   O email é interno — a família nunca o escreve (login é só por PIN).

   | Nome | Email (interno) | PIN |
   |------|-----------------|-----|
   | Diogo | diogo@instagran.family | 123456 |
   | Maria | maria@instagran.family | 654321 |
   | Avó Fátima | avo.fatima@instagran.family | 111111 |
   | Avó Ana Maria | avo.ana@instagran.family | 222222 |
   | Avô Luís | avo.luis@instagran.family | 333333 |

3. Copia o UUID de cada utilizador (na lista de Users).
4. Edita [`supabase/seed_users.sql`](supabase/seed_users.sql) com os UUIDs reais
   (e confirma que email + pin_code batem certo com o que puseste no passo 2).
5. Corre `seed_users.sql` no SQL Editor.

## 5. Desativar registos públicos

**Authentication** → **Providers** → **Email** → desliga **"Enable Sign Up"**.
(Impede que estranhos criem conta.)

## 6. Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e entra com um PIN.

## 7. Deploy na Vercel

Ver secção "Deploy na Vercel" no [`README.md`](README.md).

## 8. Instalar no telemóvel

Ver secção "Instalar no telemóvel das avós" no [`README.md`](README.md).

---

### PINs (resumo)

| Pessoa | PIN |
|--------|-----|
| Diogo | 123456 |
| Maria | 654321 |
| Avó Fátima | 111111 |
| Avó Ana Maria | 222222 |
| Avô Luís | 333333 |

> Para mudar um PIN: altera a **password** do utilizador em Authentication **e** o `pin_code`
> na tabela `users` (têm de ser iguais).
