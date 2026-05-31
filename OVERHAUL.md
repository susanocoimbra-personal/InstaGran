# Vovo — Overhaul (auditoria multi-agente + QA funcional)

Sessão autónoma de 2026-05-31. Auditoria de 6 dimensões (35 agentes, verificação adversarial):
**28 achados confirmados**, 69 minor, 1 falso-positivo. Combinado com QA funcional no browser.

Princípio: app **privada de família (5 pessoas)**, não SaaS público. Corrigir o que serve o produto;
descartar over-engineering. Mudanças de DB mantêm a assinatura RPC intacta para não quebrar a app real.

## Estado QA funcional (verificado no browser, PIN real)
✅ Login (sessão persiste) · feed · reações (pop + persistência) · comentários (end-to-end) ·
criar/apagar álbum · grelha de álbum · navegação back · logout. Zero erros de consola.

## LOTE 1 — Segurança (migration.sql; assinatura RPC mantida)
- [x] Rate-limiting no `get_user_by_pin`: tabela `login_attempts` + bloqueio após N falhas/janela + `pg_sleep` leve. Mata brute-force (1M PINs) sem incomodar a família. Devolve 0 rows quando bloqueado (cliente já trata como "PIN inválido").
- [x] Trigger `user_id = auth.uid()` em comments/reactions (anti-forja, defesa em profundidade).
- [~] PIN plaintext: documentado (auth.users já tem hash bcrypt; pin_code é redundante). Remoção = fase futura (muda fluxo de login).
- [~] Multi-tenant / audit log / HSTS / signed URLs / session timeout: over-engineering p/ 5 pessoas → documentado, não implementado.

> ⚠️ Requer **re-correr `supabase/migration.sql`** no dashboard Supabase para ativar. App real continua a funcionar entretanto (assinatura inalterada).

## LOTE 2 — Bugs de código
- [x] Realtime leaks: capturar subscription + unsubscribe em useAlbums, usePhotoDetail, usePhotos (alinhar os 3).
- [x] Upload: revalidar sessão dentro do loop async (evita fotos órfãs se sessão expira).
- [x] addComment/toggleReaction retornam `{error}`; caller mostra erro e preserva input.
- [x] useAuth: useCallback em signIn/signOut.
- [x] Tratamento de erro nos fetch (usePhotos, useAlbums, usePhotoDetail, profile).
- [x] Login: ref-guard contra double-submit.
- [x] ProfilePage: active-guard no fetch.
- [x] AlbumPhotos: realtime + active-guard.
- [x] deleteAlbum: await no handler.

## LOTE 3 — Acessibilidade (todos verificados, WCAG AA p/ idosos)
- [x] Placeholders text-ink-light → text-ink-secondary (3 ficheiros).
- [x] Touch targets ≥44px: back (36→44), apagar álbum (28→44), remover foto (28→44), download/apagar foto (40→44), enviar comentário (42→44), tab bar (min-h-44), reações (py→44).
- [x] Viewport: remover userScalable:false / maximumScale:1 (permitir zoom).
- [x] Focus ring visível nos inputs.
- [x] Apagar álbum: span[role=button] → <button>.
- [x] Alt text descritivo nos previews de upload.

## LOTE 4 — UX (edge cases)
- [x] PhotoImage onError: fallback visível ("Não foi possível carregar a foto").
- [x] Upload: feedback de sucesso antes de navegar.
- [x] Caption break-words (evita overflow horizontal).
- [x] Apagar foto: estado disabled + spinner (anti double-submit).
- [x] Upload: erro específico (qual foto) + preservar estado p/ retry.
- [x] Modal criar álbum: estado disabled mais visível.
- [x] Contador de caracteres em legenda/comentário.
- [x] Feedback ao exceder 20 fotos.

## LOTE 5 — Performance & features (decisões de produto)
- [x] Otimização de imagem: thumbnails via transformação Supabase (testar suporte no plano; degradar se indisponível). Feed/grid usam tamanhos reduzidos, detalhe usa full.
- [x] Feed: limite pragmático (não carregar centenas de uma vez).
- [x] Apagar comentário próprio (RLS já permite; sem UI até agora).
- [x] Editar perfil (nome/emoji) — RLS já permite; fecha gap óbvio.
- [~] Vídeo, push, swipe entre fotos, agrupamento por data, cover photo, offline: documentado como futuro.
