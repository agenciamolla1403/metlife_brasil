# MetLife Brasil 2026 — MASTER do Projeto

> Snapshot completo do estado do projeto após o fechamento do **S51 — Anchor "Comparativo diarizado"**.
>
> Última atualização: **25/05/2026** · Sessões cobertas: **S29 a S51**

---

## 🏗️ Visão geral

Hub interno da Molla para gestão da conta MetLife Brasil 2026 (Copa do Mundo).
Centraliza cronograma macro, planos de mídia, blitz/watch parties, arquivos,
jornada da campanha, aprovação de criativos, proposta de mídia em prédios
(Elemidia) e o **report semanal de performance** da campanha rodando.

- **Site em produção:** https://metlife-brasil.vercel.app
- **GitHub:** https://github.com/agenciamolla1403/metlife_brasil
- **Stack:** Vercel (hosting estático) + GitHub (CI deploy) + Supabase (Postgres + Realtime)
- **Auth:** simples via senha — `metlife2026` (role cliente) · `molla2026` (role admin)
- **Project ref Supabase:** `nasgvdqvrpeftqibmgfk`

---

## 🗂️ Estrutura do projeto

```
metlife_brasil/
├── public/
│   ├── index.html                    — Hub "Central do Cliente"
│   ├── login.html
│   ├── cronograma.html               — Crono Ads (75 dias diarizados)
│   ├── plano-midia.html              — Plano de mídia v3 (15 seções)
│   ├── performance.html              — Report semanal Rafael + 4 gráficos Chart.js
│   ├── aprovacao.html                — SPA hash-routed (Aprovação de Criativos)
│   ├── blitz.html                    — Blitz & Watch Parties
│   ├── arquivos.html
│   ├── jornada.html                  — Jornada macro da campanha
│   ├── elemidia.html                 — Proposta Eletromidia (22 prédios)
│   ├── muito-alem-do-jogo.html       — stub "Em construção"
│   ├── ajuda.html                    — Guia visual passo-a-passo
│   ├── elemidia/
│   │   ├── elemidia.css
│   │   ├── elemidia.js
│   │   ├── elemidia-data.js          — auto-gerado de proposta.xlsx
│   │   └── proposta.xlsx             — Metropolitan Life Seguros (22 prédios)
│   ├── blitz/{blitz.css, img/}
│   ├── jornada/{jornada.css, jornada.js}
│   ├── arquivos/{arquivos.css, arquivos.js, arquivos-data.js}
│   ├── ajuda/{ajuda.css}
│   ├── prints/                       — assets das peças
│   ├── img/                          — logos (metlife.svg, molla.svg)
│   └── assets/
│       ├── auth.js                   — login/role/user persistido
│       ├── config.js                 — SUPABASE_URL + ANON_KEY
│       ├── header.js                 — header global + drawer mobile hierárquico
│       ├── header.css                — 715 linhas, mobile drawer destacado (S48)
│       ├── breadcrumb.css            — page-subbar + .anchor-nav global (S48/S49)
│       ├── footer.css
│       ├── bottom-sheet.{css,js}     — sheet pra filtros mobile
│       ├── supabase-store.js         — peças/aprovações (705 linhas)
│       ├── files-store.js            — arquivos
│       ├── events-store.js           — eventos da jornada
│       └── aprovacao.{css,js}        — SPA aprovação (~3000 linhas)
├── docs/
│   ├── MASTER.md                     — este arquivo
│   ├── ROADMAP.md
│   ├── schema.sql                    — schema completo do Postgres
│   ├── S30_reset_e_lancamento_onda1.sql
│   ├── S40_criativos_e_variacoes.sql — 149 testes da fase 4
│   └── S44_jornada_sync.sql          — 4 UPDATEs + 6 INSERTs
├── vercel.json
└── README.md
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

---

## 🧭 Navegação atual

**Header hierárquico** (definido em `assets/header.js` em `NAV_ITEMS`):

```
Jornada
M�dia ▾
  ├─ Plano                       → /plano-midia
  ├─ Crono Ads                   → /cronograma
  ├─ Performance                 → /performance
  └─ Elemidia                    → /elemidia
Operação ▾
  ├─ Blitz                       → /blitz
  └─ Muito Além do Jogo          [EM BREVE · disabled]
Aprovação                        → /aprovacao
Arquivos                         → /arquivos
```

**Breadcrumbs** (hierárquicos, vistos em cima da página):

| Página | Breadcrumb |
|--------|-----------|
| `/jornada` | Central do Cliente / **Jornada** |
| `/plano-midia` | Central do Cliente / Mídia / **Plano** |
| `/cronograma` | Central do Cliente / Mídia / **Crono Ads** |
| `/performance` | Central do Cliente / Mídia / **Performance** |
| `/elemidia` | Central do Cliente / Mídia / **Elemidia** |
| `/blitz` | Central do Cliente / Operação / **Blitz** |
| `/muito-alem-do-jogo` | Central do Cliente / Operação / **Muito Além do Jogo** |
| `/aprovacao` | dinâmico via JS — "Aprovação" |
| `/arquivos` | Central do Cliente / **Arquivos** |

---

## 🎯 Estado atual de cada página

### Hub `/` (index.html · 288 linhas)
Central do cliente com cards pras 8 páginas principais. Login obrigatório.

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

### `/performance` (performance.html · 1185 linhas)
Report semanal de Mídia & Performance. Pós S50/S51:
- **5 seções ancoradas:** Como ler · Os 6 dias em 5 leituras · ENG e TRF no detalhe · **Comparativo diarizado** · Pra onde vamos agora
- 4 gráficos Chart.js: Alcance (área), Impressões (barras), Cliques×Visitas (linhas), CPC×CPV (linhas com R$)
- Tabelas diárias ENG e TRF
- Conclusão "Quem entrega o quê" (ENG mais profundidade × TRF mais escala)
- 6 recomendações pros próximos 14 dias

### `/elemidia` (elemidia.html · 114 linhas)
Proposta Eletromidia com 22 prédios em SP. 7 seções: Resumo, Métricas no Período,
M�tricas por Produto, Edifícios, Rede, Faturamento, Especificações.
R$ 76.800 · dados em `elemidia-data.js` (auto-gerado).

### `/blitz` (blitz.html · 287 linhas)
Conceito de blitzes + watch parties + brindes + calendário. 6 seções.

### `/arquivos` (arquivos.html)
Repositório central. Categorias: Todos, Apresentações, Documentos, Imagens, Planilhas,
Key Visuals, Vídeos. Toolbar com busca + contador + admin button (padrão que virou
referência pro jornada na S48).

### `/aprovacao` (aprovacao.html + assets/aprovacao.{js,css})
SPA hash-routed. Rotas: `/#/`, `/#/peca/:id`, `/#/aprovadas`. Todos os criativos da
campanha pra aprovação MetLife (Lotes A/B, fases 1-4). 516 testes na galeria.

### `/muito-alem-do-jogo` (131 linhas)
Stub "Em construção". Disabled no menu com badge "Em breve".

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
| `--green-deep` | `#27C7BD` | Gradientes |
| `--light` | `#EEF6F8` | Background neutro |
| `--success` | `#50E596` | Estados ok (S46) |
| `--warning` | `#F5A524` | Avisos / "Em breve" badge |
| `--danger` | `#E5484D` | Erros |
| `--linkedin` | `#0A66C2` | LinkedIn-specific (S43) |

### Grid e container
- **`.container`** — `max-width: 1180px; margin: 0 auto;` (padrão de todas as páginas)
- **`.section` padding** — `80px 24px` desktop · `48px 16px` mobile
- **`.anchor-nav-inner`** — `max-width: 1180px; padding: 12px 24px` (alinha às páginas)

### Tipografia
- Fonte: Arial, sans-serif (hosting estático sem webfont externo)
- Pesos: 400, 600, 700, 800
- H1: 48-64px · H2: 26-36px · H3: 18-22px · body: 14-16px · caption: 11-13px
- `letter-spacing` em uppercase pequeno: 0.5-0.8px

### Componentes globais
- **Header** (`assets/header.css` 715 linhas) — sticky, drawer mobile hierárquico com gradiente verde-teal no item ativo
- **Breadcrumb / page-subbar** (`assets/breadcrumb.css` 152 linhas) — inclui `.anchor-nav` global
- **Anchor-nav** — outer full-width sticky com blur · inner com max-width 1180px e scroll lateral nowrap · hover lift 1px
- **Footer** (`assets/footer.css`) — "Agência Molla" único em todas as páginas

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

### Auth (simples)
Não usa Supabase Auth. Login no `/login.html` valida `password === 'metlife2026' || password === 'molla2026'`. Role guardada em `localStorage` + `sessionStorage` via `auth.js`.

---

## 📅 Calendário da campanha

| Onda | Período | Duração | Investimento |
|------|---------|---------|--------------|
| 1 · Lançamento | 18/05 – 14/06 | 28 dias | R$ 102K |
| 2 · Intensificação | 15/06 – 12/07 | 28 dias | R$ 136K |
| 3 · Otimização | 13/07 – 31/07 | 19 dias | R$ 102K |
| **Total** | **18/05 – 31/07** | **75 dias** | **R$ 340K bruto** |

10 lotes A/B · 36 criativos · 4 fases de variações

---

## 🚀 Workflow Du (push manual)

1. Mia gera ZIP em `/mnt/user-data/outputs/`
2. Du baixa pra `/Users/eduardowillian/Downloads/_____Molla_MetLifeBrasil/`
3. `unzip -o <arquivo>.zip`
4. `cp -R metlife_brasil/. /Users/eduardowillian/_Molla_MetLifeBrasil/`
5. Em `_Molla_MetLifeBrasil`: `git add` + `git commit` + `git push origin main`
6. Vercel deploy automático (~1min)
7. SQL no Supabase é **manual** pelo Dashboard (não via MCP)

---

## 🛣️ Roadmap aberto

Listados em ordem de prioridade discutida (não fechada):

1. **Muito Além do Jogo** — quando Du passar detalhes, criar página real (hoje stub)
2. **Reports semanais futuros** — quando Rafael mandar D+14, D+21, criar arquitetura
   de janelas (sugestão: `/public/performance/week-N.json` + seletor de períodos)
3. **Tags/labels** nas peças de aprovação
4. **Storage Supabase** pra arquivos (hoje aponta pra SharePoint externo)
5. **Notificações Resend** quando peça é aprovada/reprovada
6. **Brand Guide** dedicado
7. **Login Supabase Auth** (substituir password mock)
8. **Scroll-spy JS** no `.anchor-nav` (adicionar `.is-current` dinamicamente conforme seção visível) — opcional

---

## 🔐 Senhas

- **Cliente** (`metlife`): `metlife2026`
- **Admin** (`molla`): `molla2026`

---

## 📝 Cheatsheet pra Mia

- Du chama IAs de **Mia**
- Du faz **push manual**, **SQL manual** no Dashboard Supabase
- **IGNORAR** tools Canva/Supabase/Vercel MCP — sempre manual
- Sempre **re-clonar** com `git clone --depth 1` em `/tmp/repo_fresh/` antes de mexer
- Sempre rodar **diff/smoke test** antes de empacotar
- Sempre mandar **código completo + comandos PUSH explícitos**
- Sempre fechar com **MASTER** atualizado em sessões grandes
- Linguagem **clara e informal** pro cliente final MetLife (não especialista em mídia)
- Comandos zsh sem parênteses em comentários inline (zsh quebra)
- `--success` no `:root` desde S46

---

*MASTER mantido por Mia · última revisão S51 (25/05/2026)*
