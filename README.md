# Vovo 👶

Webapp privada de partilha de fotos de família — para as avós verem a pequenina a crescer.
Construída em **Next.js + Supabase**, instalável no telemóvel como app (PWA), alojada na **Vercel**.

- **Login por PIN** de 6 dígitos (sem emails para a família decorar)
- **Feed** de fotos com reações ❤️ e comentários (tempo real)
- **Álbuns** para organizar memórias
- **Upload** de fotos (só os pais), câmara ou galeria, várias de uma vez
- **Instalável** no iPhone e Android ("Adicionar ao ecrã principal")

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Hosting | Vercel |

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # e preenche com as credenciais Supabase
npm run dev                  # http://localhost:3000
```

Variáveis de ambiente (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Base de dados (Supabase)

1. Cria um projeto em [supabase.com](https://supabase.com).
2. SQL Editor → cola e corre [`supabase/migration.sql`](supabase/migration.sql) (tabelas, RLS, função de PIN, bucket de storage, realtime).
3. Authentication → Users → cria um utilizador por pessoa (o PIN é a password).
4. Edita [`supabase/seed_users.sql`](supabase/seed_users.sql) com os UUIDs reais e corre-o.
5. Authentication → Providers → Email → desliga "Enable Sign Up".

Detalhes passo a passo em [`SETUP.md`](SETUP.md).

## Deploy na Vercel

1. Faz push deste repositório para o GitHub.
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importa o repo.
3. Framework: **Next.js** (detetado automaticamente).
4. **Environment Variables** → adiciona:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**. Ficas com um URL tipo `https://vovo.vercel.app`.

A partir daí, cada `git push` para a branch principal faz deploy automático.

## Instalar no telemóvel das avós

Envia-lhes o link da Vercel e diz para fazerem:

- **iPhone (Safari):** abrir o link → botão **Partilhar** (□↑) → **Adicionar ao ecrã principal**.
- **Android (Chrome):** abrir o link → menu **⋮** → **Adicionar ao ecrã principal** / **Instalar app**.

Fica um ícone igual a uma app nativa, abre em ecrã inteiro, e atualiza sozinho quando fizeres deploy.

## Notas

- **Notificações push** ainda não estão ligadas (planeadas para 2ª fase com Web Push/VAPID).
  No iOS, só funcionam depois da app estar "adicionada ao ecrã principal".
- A coluna `expo_push_token` na BD é um resíduo da versão Expo; fica para reutilizar como token de Web Push.
