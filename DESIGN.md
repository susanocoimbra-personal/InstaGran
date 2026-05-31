---
name: Vovo
description: O diário privado de fotografias da família — sistema "Editorial"
colors:
  paper: "#FFFFFF"
  paper-dim: "#F6F4F1"
  ink: "#191614"
  ink-soft: "#4A443F"
  ink-muted: "#8A827B"
  ink-faint: "#B8B0A8"
  line: "#E7E2DB"
  clay: "#9C4A2F"
  danger: "#A23B2D"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "40px"
    fontWeight: 400
    letterSpacing: "-0.02em"
  caption:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "20px"
    fontWeight: 400
    fontStyle: "italic"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.18em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
spacing:
  page: "24px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: Vovo

## 1. Overview

**Creative North Star: "O Livro de Fotografia da Família"**

Vovo é um diário privado impresso: paredes brancas de galeria, tinta quase-preta,
muito espaço para respirar. As fotografias da neta são a única cor; a interface
é tipográfica e recua para as deixar respirar. Cada foto é tratada como uma
impressão numa exposição — com número de prancha, autor e data como etiqueta.

O sistema rejeita por completo o "look por defeito de AI": **nada de fundo
creme/terracotta**, nada de cards de gradiente, nada de sombras coloridas. A
calorosidade vem da serif Fraunces e do ritmo editorial, não da cor.

**Key Characteristics:**
- Branco de galeria + tinta quente quase-preta; um único acento clay, raríssimo
- Serif de display (Fraunces) para títulos, legendas e wordmark; Inter para labels
- Etiquetas de exposição em maiúsculas espaçadas (letter-spacing 0.18em)
- Fotografias como impressões com sombra de contacto (shadow-print)
- Sem cards, sem gradientes, sem cantos muito arredondados — regras finas e ar

## 2. Colors

Quase monocromático: branco, rampa de tinta quente, uma linha. O clay é o único
acento e aparece só em estados de foco/ação raros.

### Primary
- **Tinta** (#191614): texto principal, wordmark, botões e chips ativos. Nunca preto puro.

### Neutral
- **Papel** (#FFFFFF): fundo de toda a app.
- **Papel-dim** (#F6F4F1): placeholders de imagem, insets subtis.
- **Tinta-soft** (#4A443F): corpo de texto.
- **Tinta-muted** (#8A827B): metadados, labels (AA em branco a ≥14px).
- **Tinta-faint** (#B8B0A8): hairlines-como-texto, desativado.
- **Linha** (#E7E2DB): regras e divisórias — fazem a maior parte do trabalho de layout.

### Accent
- **Clay** (#9C4A2F): único acento quente. Só em foco/ação rara. A raridade é o ponto.

### Named Rules
**A Regra da Foto-Única-Cor.** Nenhuma cor de UI compete com a fotografia. A
interface é tinta sobre papel; a cor entra só pela imagem da neta.

**A Regra da Linha.** Hierarquia e separação fazem-se com regras finas (#E7E2DB)
e espaço, não com caixas, sombras ou fundos.

## 3. Typography

**Display / Serif:** Fraunces (com Georgia de fallback) — serif de display quente,
optical-sizing, em pesos 400–600 e itálico.
**UI / Sans:** Inter (system-ui de fallback) — labels, metadados, botões.

**Character:** O contraste é o eixo serif↔sans. A serif carrega a alma (títulos,
legendas itálicas, wordmark); a sans carrega a função em maiúsculas espaçadas.

### Hierarchy
- **Wordmark / Display** (Fraunces 400, 40–64px, tracking -0.02em): masthead "Vovo".
- **Title** (Fraunces 400, 22–34px): nomes de álbum, nome no perfil, títulos de ecrã.
- **Caption** (Fraunces italic, 19–22px): legendas de foto e comentários-âncora, entre aspas.
- **Body** (Inter 400, 16px): texto de comentários, corpo.
- **Label** (Inter 500, 11px, tracking 0.18em, MAIÚSCULAS): etiquetas, datas, ações, nav.

### Named Rules
**A Regra da Etiqueta.** Metadados (autor, data, contagem, ações) são sempre a
classe `.label`: Inter, maiúsculas, 0.18em. É a voz "de galeria" do produto.

## 4. Elevation

Quase plano. A única elevação é a **sombra de impressão** das fotografias
(`shadow-print`): uma sombra de contacto apertada + uma sombra projetada suave,
como uma fotografia pousada numa página. Modais usam `shadow-lift`. Tudo o resto
é plano, separado por regras e espaço.

### Named Rules
**A Regra do Plano.** Só as fotografias (e modais) têm sombra. Botões, chips,
cabeçalhos e listas são planos.

## 5. Components

### Buttons
- **Primário (tinta):** pílula `bg-ink text-paper`, label em maiúsculas. Ações primárias e CTA da nav.
- **Texto:** label em `text-ink`/`text-ink-muted`, sem fundo. A maioria das ações (Guardar, Editar, Apagar, Criar).

### Chips (seletor de álbum)
- Pílula com borda `line`; ativo vira `bg-ink text-paper`. Label em maiúsculas.

### Photographs (componente-assinatura)
- Sem cantos arredondados (ou mínimos); `bg-paper-dim` enquanto carrega; `shadow-print`.
- No feed: largura total da coluna, com etiqueta de prancha por cima e legenda itálica por baixo.
- Em grelha de álbum: contact-sheet de 2 colunas, rácio 4:5.

### Inputs
- Sem caixa: `border-b border-line`, fundo transparente, texto serif itálico. Foco → borda tinta.

### Navigation
- Barra inferior tipográfica: labels em maiúsculas espaçadas; item ativo em tinta, inativos em muted; "Adicionar" como pílula de tinta. Cada alvo ≥44px.

## 6. Do's and Don'ts

### Do:
- **Do** deixar a fotografia ser a única cor; UI é tinta sobre papel branco.
- **Do** usar a serif Fraunces para alma (títulos/legendas) e Inter-caps para função.
- **Do** separar com regras finas (#E7E2DB) e espaço, não com caixas.
- **Do** tratar cada foto como uma impressão de exposição (etiqueta + sombra de impressão).
- **Do** manter alvos de toque ≥44px e texto ≥16px (público mais velho).

### Don't:
- **Don't** reintroduzir o fundo **creme/terracotta** nem gradientes quentes (o look-default de AI).
- **Don't** usar cards com sombra colorida, cantos muito arredondados, ou blocos de cor.
- **Don't** usar preto puro (#000) — a tinta é #191614.
- **Don't** pôr cor de UI a competir com a fotografia.
- **Don't** usar a sans para títulos nem a serif para labels — o contraste é o ponto.
