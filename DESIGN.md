---
name: Vovo
description: Álbum de família privado — fotos da neta partilhadas com amor
colors:
  primary: "#C4816B"
  primary-light: "#D9A899"
  primary-dark: "#A66853"
  sage: "#8FA68E"
  background: "#FAF7F4"
  surface: "#FFFFFF"
  surface-alt: "#F3EDE7"
  ink: "#3B3235"
  ink-secondary: "#7A6E72"
  ink-light: "#B5AAAE"
  line: "#EDE6E0"
  danger: "#D4605A"
  success: "#6BA588"
  accent: "#D4A95A"
  accent-light: "#EDD4A0"
typography:
  body:
    fontFamily: "Segoe UI, system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  brand:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    letterSpacing: "-0.02em"
rounded:
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "14px 48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
---

# Design System: Vovo

## 1. Overview

**Creative North Star: "O Álbum de Família numa Tarde de Sol"**

Vovo é um espaço íntimo, não uma rede social. O sistema visual existe para que cinco pessoas que se amam vejam uma bebé a crescer, e cada decisão favorece a proximidade emocional sobre o engagement. A linguagem é o conforto de folhear um álbum de fotografias ao fim da tarde: luz quente, papel macio, cantos arredondados, espaço para respirar. A fotografia da neta é sempre a heroína; a interface recua para a deixar brilhar.

O sistema rejeita dois extremos. Não é uma **app empresarial fria** (sem cinzentos corporativos, sem densidade de SaaS, sem tom neutro) nem **infantil demais** (apesar de ser sobre uma bebé: sem cores primárias berrantes, sem confetti, sem balões). O carinho aqui é adulto e refinado, transmitido pela cor com intenção e pelo espaçamento generoso, não por enfeites colados por cima.

A paleta terracotta + sage é uma identidade de marca **comprometida**: preserva-se mesmo sabendo que o fundo creme é um padrão comum, porque aqui serve o tom e está estabelecido. O calor vem da cor e da tipografia, reforçado pela legibilidade confortável que o público mais velho precisa.

**Key Characteristics:**
- Terracotta rosado quente como voz principal, sálvia como complemento natural
- Fotografia em primeiro plano, UI em segundo
- Cantos generosamente arredondados (12–24px), nunca duros
- Espaçamento amplo, alvos de toque grandes, texto confortável
- Sombras suaves e difusas, nunca duras

## 2. Colors

Uma paleta quente de terracotta e sálvia sobre off-whites de linho, com âmbar dourado para momentos de destaque.

### Primary
- **Terracotta Rosado** (#C4816B): a voz principal. Ações primárias (botão Entrar, Partilhar), seleção atual (chips de álbum, ponto da tab ativa), indicadores de estado e reações ativas. Variantes claro (#D9A899) e escuro (#A66853) formam os gradientes quentes dos botões e heros.

### Secondary
- **Sálvia Suave** (#8FA68E): complemento natural e calmante. Usado com parcimónia; presente sobretudo como acento de equilíbrio à terracotta.

### Tertiary
- **Âmbar Dourado** (#D4A95A) e **Âmbar Claro** (#EDD4A0): destaques, gradientes de hero (perfil, álbum "Todas as fotos"), momentos de delight.

### Neutral
- **Linho** (#FAF7F4): fundo de toda a app. Quente, calmo, papel.
- **Branco** (#FFFFFF): superfície de cartões, barras, modais.
- **Linho Profundo** (#F3EDE7): superfície alternativa (placeholders de imagem, chips inativos, círculos de ícone).
- **Carvão Quente** (#3B3235): texto principal (ink), nunca preto puro.
- **Carvão Médio** (#7A6E72): texto secundário (datas, legendas, subtítulos).
- **Cinza Quente Claro** (#B5AAAE): texto terciário, placeholders, dicas.
- **Linha** (#EDE6E0): bordas e divisórias.

### Named Rules
**A Regra da Foto Heroína.** Nenhuma cor de marca compete com a fotografia. Cromas saturados aparecem em controlos (botões, chips, reações), nunca como blocos grandes ao lado de uma foto.

**A Regra do Carvão Quente.** Preto puro (#000) é proibido para texto. Todo o texto assenta na rampa de carvão quente (#3B3235 → #7A6E72 → #B5AAAE), que combina com a luz quente do fundo.

## 3. Typography

**Body Font:** Segoe UI / system-ui (stack de sistema: SF Pro no iOS, Roboto no Android)
**Brand wordmark:** mesma família, peso 800

**Character:** Uma única família de sistema, escolhida por familiaridade e legibilidade imediata em qualquer telemóvel. A personalidade vem do peso e da escala, não de uma fonte display. Familiar para olhos mais velhos, rápida a carregar, sem FOUT.

### Hierarchy
- **Brand** (800, 28–48px, line-height 1): a wordmark "Vovo" em terracotta. Login (grande) e cabeçalho do feed.
- **Headline** (700–800, 20–24px): títulos de ecrã e de modal ("Novo Álbum", "Partilha um momento").
- **Title** (600–700, 18px): nomes de utilizador, títulos de secção, cabeçalhos de cartão.
- **Body** (400, 16px, line-height 1.5): legendas, comentários, texto corrido. Confortável, nunca abaixo de 16px.
- **Label** (600, 10–14px): rótulos da tab bar, contagens, metadados (datas, "há 2h").

### Named Rules
**A Regra dos 16px.** Texto de corpo nunca desce abaixo de 16px. O público inclui avós; legível sem esforço é um requisito, não uma preferência.

## 4. Elevation

Sistema de profundidade por **sombras suaves e difusas** sobre o fundo de linho, nunca duras nem escuras. A elevação distingue a superfície branca dos cartões do fundo quente, e levanta a tab bar flutuante e os modais. A profundidade é ambiente (aconchego), não estrutural (hierarquia agressiva).

### Shadow Vocabulary
- **soft** (`box-shadow: 0 1px 3px rgba(59,50,53,0.06)`): cartões em repouso, chips, círculos de ícone.
- **card** (`box-shadow: 0 4px 12px rgba(59,50,53,0.08)`): cartões de foto no feed, botões de ação, cartões de álbum.
- **lift** (`box-shadow: 0 8px 24px rgba(59,50,53,0.12)`): tab bar flutuante, FAB, modais, botão de login.

### Named Rules
**A Regra da Sombra Quente.** Todas as sombras usam o carvão quente (#3B3235) a baixa opacidade, nunca preto. Uma sombra cinza-fria sobre fundo quente parece suja.

## 5. Components

### Buttons
- **Shape:** totalmente arredondado (pill, radius 999px) para ações; FAB circular.
- **Primary:** gradiente terracotta (claro → escuro) ou terracotta sólido, texto branco, padding generoso (14px × 48px), sombra `lift`. Estados: ativo encolhe para 0.98.
- **Secondary / ghost:** superfície branca ou linho-alt, texto ink, sem gradiente.

### Chips (seletor de álbum, reações)
- **Style:** pill (radius full), superfície branca com borda de linha, sombra `soft`.
- **State:** selecionado vira terracotta sólido com texto branco; inativo fica superfície + texto ink.

### Cards / Containers
- **Corner Style:** 16px (cartões), 24px (heros, modais).
- **Background:** branco sobre fundo de linho.
- **Shadow Strategy:** `card` em repouso; ver Elevation.
- **Border:** nenhuma em cartões de foto; linha subtil (#EDE6E0) em cartões de info.
- **Internal Padding:** 16px base.

### Inputs / Fields
- **Style:** superfície branca ou linho, borda de linha, radius 16–24px (full para o input de comentário).
- **Focus:** borda muda para terracotta.
- **Placeholder:** cinza quente claro (#B5AAAE) — verificar contraste em fundos tingidos.

### Navigation
- **Floating tab bar:** barra branca translúcida (95%) com blur, flutuante (margem 16px, afastada do fundo), radius 24px, sombra `lift`. 3–4 separadores conforme o papel (Novo só para pais).
- **States:** separador ativo = emoji à escala plena + rótulo terracotta + ponto terracotta por baixo; inativo = emoji a 90% e 50% de opacidade, rótulo cinza, sem ponto.
- **Header:** sticky, fundo de linho translúcido com blur, respeita safe-area no topo.

### Signature Component — Cartão de Foto do Feed
O coração da app. Cabeçalho com avatar (círculo de cor pastel determinística por nome + emoji), nome e tempo relativo ("há 2h"). Imagem com cantos arredondados e rácio limitado entre 1:1 e 3:4. Legenda. Rodapé com badges de reação (emoji + contagem) e contagem de comentários. Toda a área é tocável e abre o detalhe.

## 6. Do's and Don'ts

### Do:
- **Do** deixar a fotografia ser a heroína; a UI recua para a foto da neta brilhar.
- **Do** usar a rampa de carvão quente para todo o texto e sombras (#3B3235 a baixa opacidade).
- **Do** manter texto de corpo ≥16px e alvos de toque ≥44×44px (público mais velho).
- **Do** usar terracotta para ação, seleção e estado — nunca como decoração de bloco.
- **Do** respeitar `prefers-reduced-motion` em todas as animações (crossfade ou instantâneo).
- **Do** cantos generosamente arredondados (12–24px) e espaçamento amplo.

### Don't:
- **Don't** parecer uma **app empresarial fria**: sem cinzentos corporativos, sem densidade de SaaS, sem dashboards.
- **Don't** parecer **infantil demais**: sem cores primárias berrantes, sem confetti, sem Comic Sans, sem balões — o carinho é adulto e refinado.
- **Don't** parecer uma **rede social genérica**: sem métricas de vaidade, sem feed algorítmico, sem frieza de plataforma.
- **Don't** usar preto puro (#000) em texto ou sombras.
- **Don't** pôr texto cinza sobre fundos coloridos (terracotta/âmbar); usar branco ou um tom escuro da própria cor.
- **Don't** deixar cromas de marca competir com a fotografia.
- **Don't** usar fontes display em rótulos, botões ou dados.
