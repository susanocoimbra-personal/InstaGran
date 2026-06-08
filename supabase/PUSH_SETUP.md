# Notificações Push (Web Push / VAPID) — Setup

A app envia uma notificação à família quando há uma foto nova. Isto precisa de
configuração no Supabase (uma vez). Os passos abaixo são todos no dashboard
Supabase + Vercel.

> As **chaves VAPID** (par público/privado) são geradas uma vez. A pública já
> está no `.env.local` / Vercel como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. A privada
> **nunca** vai para o código nem para o git — vive só nos secrets do Supabase.
> Se precisares de gerar um par novo: `npx web-push generate-vapid-keys`.

## 1. Correr a migração (cria a tabela push_subscriptions)

SQL Editor → cola e corre `supabase/migration.sql` (é idempotente; só adiciona
o que falta).

## 2. Pôr a chave pública na Vercel

Vercel → Project → Settings → Environment Variables → adiciona:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = (a chave pública — está no teu .env.local)
```

(All Environments, NÃO "Sensitive".) Depois faz Redeploy.

## 3. Guardar os secrets VAPID no Supabase

No teu computador, com a Supabase CLI ligada ao projeto:

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="<chave pública>" \
  VAPID_PRIVATE_KEY="<chave privada — dada em separado, nunca no git>" \
  VAPID_SUBJECT="mailto:o-teu-email@exemplo.com"
```

(O `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente
nas edge functions — não é preciso configurá-los.)

## 4. Fazer deploy da edge function

```bash
supabase functions deploy notify-new-photo
```

## 5. Criar o webhook que dispara a função

Dashboard → Database → **Webhooks** → Create:
- **Table:** `photos`
- **Events:** `INSERT`
- **Type:** Supabase Edge Function → `notify-new-photo`

## 6. Ligar no telemóvel

Cada pessoa: abre a app (instalada no ecrã principal) → **Perfil** → liga o
interruptor **Notificações** e aceita a permissão. Pronto.

> **iPhone:** as notificações web só funcionam com a app **adicionada ao ecrã
> principal** (iOS 16.4+). No Safari normal não aparecem — é limitação da Apple.

## Como testar

Com duas contas (ex: Diogo no telemóvel com notificações ligadas, Maria a
publicar): a Maria publica uma foto → o telemóvel do Diogo recebe a notificação.
Tocar nela abre a app no feed.
