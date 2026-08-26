# MetLife Brasil 2026 — MASTER do Projeto

> Snapshot completo do estado do projeto após o fechamento do **S103 — hub `/midia-programatica` + wrap da proposta Adsplay · Campanha NFL**.
>
> Última atualização: **26/08/2026** · Sessões cobertas: **S29 a S103**
>
> ⚠️ **Aviso de continuidade:** este MASTER ficou parado em S56 (25/05/2026) por ~47 sessões.
> O bloco S57+ do histórico foi **reconstruído a partir do `git log`**, que é fonte de verdade
> de *o que* foi entregue e *quando*, mas não preserva a numeração de sessão. Os números de
> sessão só aparecem onde a skill `central-do-cliente-molla` ou o handoff da S103 os confirmam.
> Onde não há certeza, a linha traz só a data.

---

## 🏗️ Visão geral

Hub interno da Molla para gestão da conta MetLife Brasil 2026 (Copa do Mundo).
Centraliza cronograma macro, planos de mídia, blitz/watch parties, arquivos,
jornada da campanha, aprovação de criativos, proposta de mídia em prédios
(Elemidia), o **report semanal de performance** da campanha rodando, e o
**programa de marca "Muito Além do Jogo"** (Seu Jogo Muda o Mundo +
MetLife Global Station).

- **Site em produção:** https://metlife-brasil.vercel.app
- **GitHub:** https://github.com/agenciamolla1403/metlife_brasil
- **Stack:** Vercel (hosting estático) + GitHub (CI deploy) + Supabase (Postgres + Realtime)
- **Auth:** simples via senha — `metlife2026` (role cliente) · `molla@2026@` (role admin)
- **Project ref Supabase:** `nasgvdqvrpeftqibmgfk`

---

## 🗂️ Estrutura do projeto

```
metlife_brasil/
├── public/                              — Output Directory da Vercel
│   ├── index.html                       — Hub "Central do Cliente"
│   ├── login.html
│   ├── ajuda.html + ajuda/ajuda.css
│   ├── jornada.html + jornada/{jornada.css, jornada.js}
│   ├── plano-midia.html
│   ├── cronograma.html
│   ├── aprovacao.html                   — SPA hash-routed
│   ├── arquivos.html + arquivos/{arquivos.css, arquivos.js, arquivos-data.js}
│   ├── blitz.html + blitz/{blitz.css, img/ (12 fotos)}
│   ├── muito-alem-do-jogo.html
│   │
│   ├── performance.html                 — HUB Rafael Moraes (mídia paga)
│   ├── performance/
│   │   ├── manifesto.json               — campanhas + 11 semanas
│   │   ├── week-1.html … week-11.html
│   │   └── resumo-70-dias.html          — resumo executivo (card destacado no hub)
│   │
│   ├── landing-page.html                — HUB dti Analytics
│   ├── landing-page/
│   │   ├── manifesto.json               — bloco `campanhas` + campo `campanha`
│   │   ├── week-1.html … week-9.html    — Copa
│   │   └── week-9-seguro-vida.html      — Seguro Vida Individual
│   │
│   ├── elemidia.html                    — HUB Eletromidia
│   ├── elemidia/
│   │   ├── manifesto.json               — propostas[] + checkings[] + futuras[]
│   │   ├── ft-1.html, ft-2.html         — propostas
│   │   ├── ft-1-data.js, ft-2-data.js   — auto-gerados do xlsx
│   │   ├── cht-1.html, cht-2.html       — checkings de execução
│   │   ├── proposta-ft-1.xlsx, proposta-ft-2.xlsx
│   │   └── elemidia.css, elemidia.js
│   │
│   ├── midia-programatica.html          — HUB Mídia Programática (S103)
│   ├── midia-programatica/
│   │   ├── manifesto.json               — propostas[] + futuras[], com `fornecedor`
│   │   ├── nfl.html                     — proposta Adsplay · Campanha NFL (design roxo próprio)
│   │   └── plano-nfl.xlsx               — plano de mídia pra download
│   │
│   ├── assets/                          — componentes globais
│   │   ├── auth.js, config.js, supabase-store.js
│   │   ├── header.js, header.css        — NAV_ITEMS + header sticky global
│   │   ├── breadcrumb.css               — .page-subbar + .anchor-nav sticky
│   │   ├── footer.css
│   │   ├── performance-timeline.css     — compartilhado performance + analytics
│   │   ├── performance-timeline.js, analytics-timeline.js, elemidia-timeline.js
│   │   ├── aprovacao.js, aprovacao.css
│   │   ├── bottom-sheet.js, bottom-sheet.css
│   │   ├── events-store.js, files-store.js, w8-form-store.js
│   ├── img/                             — 15 assets de marca e campanha
│   └── prints/                          — 6 assets das peças
│
├── docs/
│   ├── MASTER.md                        — este arquivo
│   ├── ROADMAP.md
│   ├── schema.sql
│   ├── S30/S40/S44_*.sql
│   └── migrations/003_w8_form_selection.sql
├── vercel.json
├── package.json
├── CLAUDE.md                            — regras operacionais pro Claude Code
├── .gitignore
└── README.md

41 HTMLs no total.
```

---

## 📜 Histórico de sessões

| Sessão | Entrega |
|--------|---------|
| **S29** | Audit log timeline + markdown leve nas notas |
| **S30** | Reset onda 1 + lançamento da campanha no Supabase |
| **S31–S33** | Breadcrumb global, `/ajuda` interativa, fix footer |
| **S34–S38** | Mobile overhaul (drawer fora do header pra contornar bug iOS Safari) |
| **S39** | Elemidia Metropolitan Life (22 prédios, R$ 76.800) |
| **S40** | Criativos + Variações (4 fases, 149 testes novos) |
| **S41** | Plano-midia v2 (11 seções, R$ 340K, 75 dias) |
| **S42** | Fix hero plano-midia (remove min-height 100vh) |
| **S43** | Cronograma v2 + Plano-midia v3 (15 seções) + LinkedIn |
| **S44** | SQL sync da Jornada (4 UPDATEs + 6 INSERTs) |
| **S45** | Galeria de aprovadas `/#/aprovadas` (516 testes ✅) |
| **S46** | Fix card aprovado verde + `--success` no `:root` + ícones flexbox |
| **S47** | **Menu hierárquico** (Mídia ▾ + Operação ▾) + `/performance` + `/muito-alem` stub |
| **S48** | UX polish: `.anchor-nav` global + smooth scroll + drawer mobile destacado + jornada toolbar refatorado |
| **S49** | Anchor-nav respeita grid 1180px (outer full-width sticky + inner contido) |
| **S50** | 4 gráficos Chart.js do Rafael no `/performance` + rodapé padronizado |
| **S51** | Anchor `Comparativo diarizado` na nav do `/performance` (`<section id="comparativo">`) |
| **S52** | **Página completa "Muito Além do Jogo"** (1017 linhas) substitui o stub — Seu Jogo Muda o Mundo + Global Station + Investimento |
| **S53** | Refinos visuais `/muito-alem`: H1 "MUITO ALÉM DO JOGO" + 5 imagens (KV/chuteira/bar/social/theparlor) + footer grande padrão + fix card "Durante o evento" + imagens 100% sem corte + KV full-width |
| **S54** | Galeria masonry do The Parlor (vídeo theparlor.mp4 + 4 jpegs) + imagem do card Local reduzida |
| **S55** | **Auth persistente entre abas** — `sessionStorage` → `localStorage` com fallback + sync entre abas via `storage` event |
| **S56** | Card "Muito Além do Jogo" na home atualizado (deixa de ser "em construção", reflete conteúdo real) |

### S57 em diante — reconstruído do `git log`

| Data | Entrega | Sessão |
|---|---|---|
| 25/05 | Senha admin passa a ser `molla@2026@` · split 60/40 do Muito Além do Jogo | — |
| 03/06 | **Hub `/performance` multi-report** — índice com timeline + week-1/week-2 como HTMLs independentes | — |
| 08/06 | week-3 (Meta + YouTube + LinkedIn) · **hub `/landing-page`** com week-1/week-2 (Chart.js) · card Analytics no hub | S71 |
| 09/06 | Elemidia FT 2 (7 cidades, 374 telas, R$ 63K) · **converte `/elemidia` em hub multi-proposta** · Checking FT 1 (+18,5%) | S68–S70 |
| 10/06 | Analytics week-3 · fix `.total-row` (colisão de classe grid × tr) | — |
| 26/06 | Performance week-4/week-5 · abas Meta/YouTube/LinkedIn em 3 colunas · **fix crítico `vercel.json`** (remove `"public"` obsoleto — destravou 16 dias de deploy falhando em silêncio) | S73–S76 |
| 21/07 | Performance week-6 a week-9 · Analytics week-6 a week-9 · Checking FT 2 (+34,3%) · **persistência Supabase** nos checkboxes da week-8 (botão Salvar explícito + erro descritivo pra PGRST205) | S77–S83 |
| 22/07 | **Multi-campanha no `/landing-page`** — Seguro Vida Individual · paleta verde neon → **verde petróleo `#01444C`** (aprovada) · timeline vira grid 2 colunas com carrossel por campanha · nowrap nos labels | S84–S89 |
| 29/07 | **Resumo executivo dos 70 dias** + card destacado no hub · **favicon nos 37 HTMLs** | S93 |
| 25/08 | Performance week-10/week-11 (fechamento) · **multi-campanha no `/performance`** com Onda 3 "Reta final" (paleta petróleo W8–W11) · fix 75 → 70 dias | S100 |
| 26/08 | fix bottom-sheet (painel fechado capturava cliques) · **hub `/midia-programatica` + wrap da proposta Adsplay · Campanha NFL** (V2, com valores brutos) · CLAUDE.md · MASTER de S56 pra S103 | S103 |

> Lacuna conhecida: **S57–S67** não têm registro nem no MASTER nem na skill. As entregas
> desse intervalo estão no `git log` entre 25/05 e 09/06, sem numeração recuperável.

---

## 🧭 Navegação atual

**Header hierárquico** (definido em `assets/header.js` em `NAV_ITEMS`):

```
Jornada
Mídia ▾
  ├─ Plano                       → /plano-midia
  ├─ Crono Ads                   → /cronograma
  ├─ Performance                 → /performance
  ├─ Analytics                   → /landing-page
  ├─ Elemidia                    → /elemidia
  └─ Mídia Programática          → /midia-programatica   (S103)
Operação ▾
  ├─ Blitz                       → /blitz
  └─ Muito Além do Jogo          → /muito-alem-do-jogo  (S52, ativa desde S52)
Aprovação                        → /aprovacao
Arquivos                         → /arquivos
```

**Breadcrumbs**:

| Página | Breadcrumb |
|--------|-----------|
| `/jornada` | Central do Cliente / **Jornada** |
| `/plano-midia` | Central do Cliente / Mídia / **Plano** |
| `/cronograma` | Central do Cliente / Mídia / **Crono Ads** |
| `/performance` | Central do Cliente / Mídia / **Performance** |
| `/landing-page` | Central do Cliente / Mídia / **Analytics** |
| `/elemidia` | Central do Cliente / Mídia / **Elemidia** |
| `/midia-programatica` | Central do Cliente / Mídia / **Mídia Programática** |
| `/midia-programatica/nfl` | Central do Cliente / Mídia / Mídia Programática / Adsplay / **Campanha NFL** |
| `/blitz` | Central do Cliente / Operação / **Blitz** |
| `/muito-alem-do-jogo` | Central do Cliente / Operação / **Muito Além do Jogo** |
| `/aprovacao` | dinâmico via JS — "Aprovação" |
| `/arquivos` | Central do Cliente / **Arquivos** |

---

## 🎯 Estado atual de cada página

### Hub `/` (index.html · 288 linhas)
Central do cliente com 8 cards (cada um leva pra uma página principal). Login obrigatório.
Card "Muito Além do Jogo" atualizado em S56 com o conteúdo real ("Seu Jogo Muda o Mundo").

### `/jornada` (jornada.html · 67 linhas)
Timeline macro da campanha (26 eventos). Toolbar padrão (refatorado em S48 igual arquivos):
**[Select mês ▾] [26 eventos] [+ Adicionar evento]** + chips de categoria embaixo.
Eventos vêm do Supabase (`events-store.js`).

### `/plano-midia` (plano-midia.html · 1473 linhas)
Plano v3 com 15 seções de ancoragem. Inclui:
Diagnóstico, Oportunidade, Pilares, Sistema, Públicos, Personas, Ondas, Benchmark,
Investimento, Mix de canais, LinkedIn, Sobre Google Ads, Cenários, Plano tático, Impacto.

### `/cronograma` (cronograma.html · 1681 linhas)
Crono Ads 75 dias, 3 ondas (Lançamento, Intensificação, Otimização), LinkedIn,
A/B testing diarizado, 10 lotes A/B, 36 criativos.

### `/performance` — hub Rafael Moraes · **multi-campanha**
Deixou de ser um report único (estado S56) e virou hub multi-report em 03/06.
- **11 semanas publicadas** (week-1 … week-11), declaradas em `performance/manifesto.json`
- **2 campanhas:** `copa` (W1–W7, paleta padrão navy/azul) e `onda-3` "Onda 3 · Reta final"
  (W8–W11, paleta verde petróleo `#01444C`)
- Card destacado `.executive-highlight` → `/performance/resumo-70-dias`
- Componente `assets/performance-timeline.{js,css}`
- W8 tem persistência Supabase na `#definicoes` (`w8-form-store.js` + botão Salvar explícito)

### `/muito-alem-do-jogo` (muito-alem-do-jogo.html · 1176 linhas) 🆕
**Programa "Muito Além do Jogo · Seu Jogo Muda o Mundo"**. Sessões com âncora:
- `#visao` — Hero + 2 projetos globais (Pinta tu Cancha + Footwork for Futures) + KV banner full-width + statement card
- `#seu-jogo` (Ação 1 · 70%) — 3 etapas, mecânica de 7 passos, plano comunicação Pré/Durante/Pós, residual (vídeo + documentário), benefits, legado
- `#global-station` (Ação 2 · 30%) — 3 pilares de memória, The Parlor + galeria masonry (vídeo + 4 fotos), 3 públicos, embaixada MetLife, concept-strip
- `#investimento` — split visual 70/30

5 imagens + 1 vídeo de apoio em `/img/`. Footer grande padronizado.

### `/landing-page` — hub dti Analytics · **multi-campanha**
Índice de reports de analytics da LP, lido de `landing-page/manifesto.json`.
- **Copa:** 9 semanas (W1–W9). W4 e W6 são *minimal* (a dti não emitiu report próprio)
- **Seguro Vida Individual:** `week-9-seguro-vida` (paleta verde petróleo)
- Timeline em grid de 2 linhas, uma por campanha, cada uma com carrossel independente
- Componente `assets/analytics-timeline.js` + `assets/performance-timeline.css`

### `/elemidia` — hub Eletromidia (mídia em edifícios)
Virou hub multi-proposta em 09/06 (antes era uma página única de 114 linhas).
- **Propostas:** FT 1 (SP, 222 monitores, R$ 76.800) · FT 2 (7 cidades, 374 monitores, R$ 63.000)
- **Checkings:** cht-1 (+18,5% bônus) · cht-2 (+34,3% bônus)
- Links cruzados nos dois sentidos entre cada FT e seu checking
- Manifesto com 3 arrays: `propostas[]`, `checkings[]`, `futuras[]`

### `/midia-programatica` — hub Mídia Programática 🆕 S103
Clone da arquitetura do `/elemidia`, com um array só (`propostas[]`).

**Nomeado por disciplina, não por fornecedor.** Nasceu como `/adsplay` e foi renomeado
ainda na S103: a Molla pode receber propostas de programática de outras empresas, e um
hub por fornecedor viraria uma lista de hubs de uma proposta cada. Cada item declara
`fornecedor` no manifesto, e é ele que aparece na tag do card ("PROPOSTA · ADSPLAY").
`vercel.json` mantém redirect 301 de `/adsplay` e `/adsplay/*` — as URLs antigas
chegaram a ir pra produção.

- **1 proposta:** Adsplay · Campanha NFL — 04/09/2026 a 02/01/2027 (4 meses)
- 4 cenários de investimento (líquido / bruto, margem de 25%):
  FULL R$ 1,6M / 2,0M · PLAY R$ 1,0M / 1,25M · START R$ 700K / 875K · BASIC R$ 120K / 150K
- Formatos: Display, Vídeo, YouTube, CTV/OTT, Rich Media, Native, Push
- Marco: 27/09 · NFL no Maracanã (Ravens x Cowboys)
- `midia-programatica/nfl.html` preserva **100% do design roxo próprio da Adsplay**
  (`#831E9B` / `#5B1377` / `#9C3FB5` / `#E7B5FA`) — o wrapper só acrescenta
  favicon, auth, header global, breadcrumb e botão de download do xlsx
- Rodapé de contatos do vendedor Adsplay foi trocado pelo **rodapé padrão da Central**
  (o `id="contato"` foi mantido pra não quebrar a âncora da topbar da proposta)
- Wrapper automatizado em `docs/scripts/wrap_adsplay.py` — roda sobre o HTML bruto
  da Adsplay e aborta se qualquer alvo não casar exatamente uma vez
- **Sem timeline JS** — só faz sentido a partir da 2ª proposta

### `/blitz` (blitz.html · 287 linhas)
Conceito de blitzes + watch parties + brindes + calendário. 6 seções.

### `/arquivos` (arquivos.html)
Repositório central. Categorias: Todos, Apresentações, Documentos, Imagens, Planilhas,
Key Visuals, Vídeos. Toolbar com busca + contador + admin button (padrão que virou
referência pro jornada na S48).

### `/aprovacao` (aprovacao.html + assets/aprovacao.{js,css})
SPA hash-routed. Rotas: `/#/`, `/#/peca/:id`, `/#/aprovadas`. Todos os criativos da
campanha pra aprovação MetLife (Lotes A/B, fases 1-4). 516 testes na galeria.

### `/ajuda` (ajuda.html · 504 linhas)
Guia visual passo-a-passo de como usar o hub.

---

## 🎨 Design system

### Paleta (`:root`)
| Token | Hex | Uso |
|-------|-----|-----|
| `--navy` | `#003B5C` | Cor primária MetLife |
| `--blue` | `#2DB5DF` | Azul accent (TRF, hover anchor) |
| `--teal` | `#27C7BD` | Verde-azulado (cards diferenciados) |
| `--green` | `#50E596` | Verde positivo (sucesso, accent KPI) |
| `--light` | `#EEF6F8` | Background neutro |
| `--success` | `#50E596` | Estados ok (S46) |
| `--warning` | `#F5A524` | Avisos / "Em breve" badge |
| `--danger` | `#E5484D` | Erros |
| `--linkedin` | `#0A66C2` | LinkedIn-specific (S43) |

### Grid e container
- **`.container`** — `max-width: 1180px; margin: 0 auto;` (padrão de todas as páginas)
- **`.section` padding** — `80px 24px` desktop · `56px 16px` mobile
- **`.anchor-nav-inner`** — `max-width: 1180px; padding: 12px 24px` (alinha às páginas)

### Tipografia
- Fonte: Arial, sans-serif (hosting estático sem webfont externo)
- Pesos: 400, 600, 700, 800
- H1: 48-84px (clamp) · H2: 26-52px · H3: 18-24px · body: 14-17px · caption: 11-13px
- `letter-spacing` em uppercase pequeno: 0.5-0.8px

### Componentes globais
- **Header** (`assets/header.css`) — sticky, drawer mobile hierárquico com gradiente verde-teal no item ativo
- **Breadcrumb / page-subbar** (`assets/breadcrumb.css`) — inclui `.anchor-nav` global
- **Anchor-nav** — outer full-width sticky com blur · inner com max-width 1180px e scroll lateral nowrap · hover lift 1px
- **Footer grande padrão** (h2 + p + brand-row com border-top) — usado em performance, elemidia, muito-alem

### Smooth scroll global
```css
html { scroll-behavior: smooth; }
section[id] { scroll-margin-top: calc(var(--mlh-header-h, 60px) + 64px); }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

---

## 🧱 Convenções de código

### Nomenclatura de classes
- **Prefixo por página** quando o CSS é local: `jr-` (jornada), `aq-` (arquivos), `bz-` (blitz), `elem-` (elemidia), `mlh-` (header global)
- **Global** quando reutilizável: `.anchor-nav`, `.container`, `.section-intro`, `.eyebrow`, `.pill`
- **Estado**: `.is-active`, `.is-expanded`, `.is-current`, `.is-disabled`, `.has-filter`

### Imagens (regra Du · S53)
- **Nunca cortar** — sempre `width: 100%; height: auto` (sem `object-fit: cover` em imagens de conteúdo)
- Galleries devem usar **CSS column masonry** (`column-count` + `break-inside: avoid`) pra preservar proporções
- Imagens com `loading="lazy"` + `alt` descritivo

### Mobile-first considerations
- Sticky NUNCA fica sticky em mobile (bug iOS Safari) — usa `position: static` em `@media (max-width: 760px)`
- Drawer mobile vive **fora** do header (criado em `body.appendChild` por JS) — evita bug de `backdrop-filter` criando stacking context
- Bottom sheets vivem no body também
- Chips e nav-pills mobile sempre com scroll lateral nowrap (não flex-wrap)

### Padrão de toolbar (S48 — padrão arquivos.html)
```html
<div class="X-toolbar">
  <div class="X-toolbar-inner">
    <div class="X-search-row">
      <!-- elementos principais (input/select/count/admin) -->
    </div>
    <div class="X-filters">
      <!-- chips de filtro -->
    </div>
  </div>
</div>
```

### Padrão de anchor-nav (S49 — grid 1180px)
```html
<nav class="anchor-nav">
  <div class="anchor-nav-inner">
    <a href="#secao">Label</a>
  </div>
</nav>
```

### Padrão de footer grande (S50/S53)
```html
<footer class="site-footer">
  <h2>Declaração de fechamento.</h2>
  <p>Subtítulo contextual descritivo da página.</p>
  <div class="brand-footer-row">
    <img src="/img/logo_molla.svg" alt="Molla" class="brand-logo-footer" />
    <p class="brand-footer-text">Agência Molla</p>
  </div>
</footer>
```

---

## 🔐 Auth (S55)

`assets/auth.js` usa `localStorage` desde S55 (antes era `sessionStorage` → perdia sessão a cada aba nova).

**Helpers internos:** `get()` lê localStorage primeiro com fallback de sessionStorage (transição suave) · `set()` escreve em localStorage e limpa sessionStorage stale · `del()` apaga em ambos. Tudo com try/catch pra resiliência (modo privado, quota cheia).

**Comportamento:**
- Sessão persiste entre abas ✓
- Sessão persiste após fechar/reabrir navegador ✓
- Logout em uma aba → outras abas detectam via `storage` event e redirecionam pra `/login`

**Chaves:** `metlife_auth`, `metlife_role`, `metlife_user`.

⚠️ **Segurança:** controle de acesso *visual* apenas. Senhas em texto puro no JS, qualquer um com DevTools dribla. Pra produção real, ainda no roadmap o item de **Supabase Auth**.

---

## 🔌 Backend & dados (Supabase)

### Tabelas principais (ver `docs/schema.sql` completo)
- `pecas` — criativos pra aprovação (id, titulo, status, lote, fase, etc.)
- `aprovacoes` — histórico de votos (peca_id, user_id, status, comentario, created_at)
- `events` — eventos da jornada (id, titulo, descricao, data_inicio, data_fim, categoria)
- `arquivos` — repositório de arquivos (id, nome, tipo, url_sharepoint, etc.)

### Realtime
- Aprovações: novo voto aparece em todos os admins conectados
- Eventos: novo evento publica em todos
- Listening via `supabase.channel(...).on('postgres_changes', ...)`

### Auth
Não usa Supabase Auth. Login no `/login.html` valida senha em `auth.js`. Role guardada em `localStorage` (S55).

---

## 📅 Calendário da campanha

| Onda | Período | Duração | Investimento |
|------|---------|---------|--------------|
| 1 · Lançamento | 18/05 – 14/06 | 28 dias | R$ 102K |
| 2 · Intensificação | 15/06 – 12/07 | 28 dias | R$ 136K |
| 3 · Otimização | 13/07 – 31/07 | 19 dias | R$ 102K |
| **Total** | **18/05 – 31/07** | **75 dias** | **R$ 340K bruto** |

10 lotes A/B · 36 criativos · 4 fases de variações

### Programa Muito Além do Jogo (paralelo à campanha de mídia)
| Ação | % investimento | Conteúdo |
|------|---------|---------|
| **Seu Jogo Muda o Mundo** | 70% | Pinta tu Cancha (revitalização da quadra) · Art Citizen (3 chuteiras exclusivas) · Evento final na quadra com campeonato de embaixadinhas · Documentário |
| **MetLife Global Station** | 30% | The Parlor (Pinheiros) · transmissão dos jogos · convidados + imprensa + creators · Hashtag #FootworkForFutures |

---

## 🚀 Workflow Du (push manual)

**Desde a S103 o projeto roda no Claude Code, direto no repo git.** O fluxo de ZIP
abaixo era necessário quando a Mia trabalhava no Chat, sem acesso ao repositório.

**Fluxo atual (Claude Code):**
1. Workspace único: `/Users/eduardowillian/Sites/metlife_brasil` (é um clone git de verdade)
2. Mia edita os arquivos direto e commita em `main` (PT-BR conventional, sem ponto final)
3. Du roda o push: `git push origin main`
4. Vercel deploy automático (~1min)
5. SQL no Supabase continua **manual** pelo Dashboard (não via MCP)

> O re-clone `--depth 1` em `/tmp/repo_fresh/` **não se aplica mais** — ele existia pra
> garantir que a Mia partisse de produção e não de um workspace stale. Trabalhando dentro
> do próprio repo, `git pull` cobre isso. Du confirmou a mudança na S103.

**Fluxo antigo (Chat · histórico):**
ZIP em `/mnt/user-data/outputs/` → download → `unzip -o` → `cp -R` pro workspace → commit + push.

---

## 🛣️ Roadmap aberto

Listados em ordem de prioridade discutida (não fechada):

1. **Reports semanais futuros** — Analytics Copa S10/S11 e Analytics Seguro Vida S2
   (Performance fechou em W11). Base do report completo é sempre a semana anterior
   mais recente do mesmo produto
2. **Tags/labels** nas peças de aprovação
3. **Storage Supabase** pra arquivos (hoje aponta pra SharePoint externo)
4. **Notificações Resend** quando peça é aprovada/reprovada
5. **Brand Guide** dedicado
6. **Login Supabase Auth** (substituir password mock — fecha o gap de segurança real)
7. **Scroll-spy JS** no `.anchor-nav` (adicionar `.is-current` dinamicamente conforme seção visível) — opcional
8. **Atualizações no programa Muito Além do Jogo** conforme materiais chegarem (data do evento final, comprovações de impacto, etc.)
9. **Timeline do `/midia-programatica`** — criar quando entrar a 2ª proposta
10. **Iframe de rich media da proposta NFL** — `adsmax-files.adsplay.com.br` não foi
    testado em produção; depende do servidor da Adsplay permitir embed

---

## 🔐 Senhas

- **Cliente** (`metlife`): `metlife2026`
- **Admin** (`molla`): `molla@2026@`

---

## 📝 Cheatsheet pra Mia

- Du chama IAs de **Mia**
- Du faz **push manual**, **SQL manual** no Dashboard Supabase
- **IGNORAR** tools Canva/Supabase/Vercel MCP — sempre manual
- Trabalhar direto em `/Users/eduardowillian/Sites/metlife_brasil` (não existe mais
  o re-clone `--depth 1` — ver seção Workflow)
- **Não existe `smoke_test.js` neste repo** (é do Whirlpool). Verificação aqui é
  browser de verdade: subir `npx serve public -l 3000` e testar as rotas
- Sempre mandar **código completo + comandos PUSH explícitos**
- Sempre fechar com **MASTER** atualizado em sessões grandes
- Linguagem **clara e informal** pro cliente final MetLife (não especialista em mídia)
- Comandos zsh sem parênteses em comentários inline (zsh quebra)
- `--success` no `:root` desde S46
- **Imagens nunca cortar** (regra Du · S53) — `width: 100%; height: auto`, sem `object-fit: cover`

---

*MASTER mantido por Mia · última revisão S103 (26/08/2026)*
