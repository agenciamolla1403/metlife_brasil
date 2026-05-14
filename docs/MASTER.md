# MetLife Brasil 2026 — MASTER do Projeto

> Snapshot completo do estado do projeto após o fechamento do **S40 — Criativos + Variações** (4 fases).

---

## 🏗️ Visão geral

Hub interno da Molla pra gestão da conta MetLife Brasil 2026 (Copa do Mundo).
Centraliza cronograma, planos de mídia, blitz/watch parties, arquivos,
jornada da campanha, **aprovação de criativos** e proposta de mídia em prédios.

- **Site em produção:** https://metlife-brasil.vercel.app
- **GitHub:** https://github.com/agenciamolla1403/metlife_brasil
- **Stack:** Vercel (hosting estático) + GitHub (CI deploy) + Supabase (Postgres + Realtime)
- **Auth:** simples via senha (`metlife2026` cliente, `molla2026` admin)

---

## 🗂️ Estrutura

```
metlife_brasil/
├── public/
│   ├── index.html             — Hub "Central do Cliente"
│   ├── login.html
│   ├── cronograma.html
│   ├── plano-midia.html
│   ├── aprovacao.html         — SPA hash-routed (Aprovação de Criativos)
│   ├── blitz.html             — Blitz & Watch Parties
│   ├── arquivos.html
│   ├── jornada.html           — Jornada da Campanha (cronograma macro)
│   ├── elemidia.html          — Proposta Eletromidia (prédios)
│   ├── ajuda.html             — Guia visual passo-a-passo
│   ├── elemidia/
│   │   ├── elemidia.{css,js}
│   │   ├── elemidia-data.js   — auto-gerado de proposta.xlsx
│   │   └── proposta.xlsx      — Metropolitan Life Seguros (22 prédios)
│   ├── blitz/
│   ├── arquivos/
│   ├── jornada/
│   ├── ajuda/
│   ├── prints/                — assets de imagem das peças
│   ├── img/                   — logos (metlife.svg, molla.svg)
│   └── assets/
│       ├── auth.js            — login/role/user persistido em session+localStorage
│       ├── config.js          — SUPABASE_URL + ANON_KEY
│       ├── header.js          — header global + drawer mobile (fora do header pra evitar bug iOS Safari)
│       ├── header.css
│       ├── footer.css
│       ├── breadcrumb.css
│       ├── bottom-sheet.{css,js}  — bottom sheet relocate pro <body> em mobile
│       ├── supabase-store.js  — camada de dados (Concepts/Variants/Pieces/Comments/Versions/Files/Events)
│       ├── files-store.js
│       ├── events-store.js
│       ├── aprovacao.js       — SPA: Home → Campanha → ConceptView (galeria + foco + accordion)
│       └── aprovacao.css
├── docs/
│   ├── schema.sql                          — schema canônico (idempotente)
│   ├── S30_reset_e_lancamento_onda1.sql
│   ├── S40_criativos_e_variacoes.sql       — migration S40 (rodar 1 vez)
│   ├── ROADMAP.md
│   └── MASTER.md              — este arquivo
├── vercel.json                — rewrites (/ajuda etc.)
└── README.md
```

---

## 🗃️ Modelo de dados (Supabase)

```
campaigns
  └── piece_concepts (NOVA em S40)      — "Criativo" (peça-conceito)
        │     • title, description, position
        └── pieces                       — "Variação" (uma das opções A/B)
              │     • concept_id NOT NULL, variant_label, variant_order
              │     • copy, caption, link_url, version, status
              ├── piece_versions         — V1, V2, V3 (snapshots)
              ├── comments (piece_id)    — comentários da variação (com pin opcional)
              │     • kind: comment | action | action-rejected | action-update | action-created
              │     • pin_x, pin_y, pin_version
              └── comments (concept_id)  — comentário geral do criativo
                    • XOR constraint: (piece_id IS NULL) <> (concept_id IS NULL)

files                              — biblioteca de arquivos (Sharepoint links)
events                             — jornada da campanha (cronograma macro)
```

Toda mutation grava cache local invalidado de forma cirúrgica (campaign, concepts, variants, comments, versions, conceptComments).

RLS habilitado em todas as tabelas + policy `"anon all"` aberta — controle é feito no app por senha.

---

## 🛣️ Rotas (hash-routed em /aprovacao)

- `#/` → home (lista campanhas com KPIs)
- `#/c/<campaignId>` → listagem de criativos da campanha
- `#/c/<campaignId>/k/<conceptId>` → detalhe do criativo (primeira variação)
- `#/c/<campaignId>/k/<conceptId>/v/<variantId>` → detalhe com variação selecionada

---

## 🔑 Comandos / atalhos de teclado (ConceptView)

| Atalho | Ação |
|---|---|
| `←` `→` | Navega entre variações |
| `A` | Aprova a variação atual |
| `R` | Reprova a variação atual |
| `C` | Foca no campo de comentário da variação |
| `Esc` | Sai do modo de pin |

Atalhos `A/R/←/→` são ignorados se o cursor está num input (pra digitar normalmente); `C` move foco PRA input.

---

## 🧪 Testes

`/home/claude/test-aprovacao.js` — jsdom runner com **484 testes** organizados em 24 suítes. Cobertura inclui:

- Login, header, role-based access
- Comentários, pins, markdown leve
- Aprovação, versionamento, compare V1xV2
- Dashboard, KPIs, filtros
- Elemidia (proposta Metropolitan Life)
- Mobile overhaul (drawer, bottom sheet, scroll horizontal)
- **S40 completo** (Concepts/Variants backend, UI listagem, ConceptView, polish + atalhos)

Pra rodar: `cd /Users/eduardowillian/_Molla_MetLifeBrasil && node test-aprovacao.js`.

---

## 📜 Histórico de sessões importantes

| Sessão | Entrega principal |
|---|---|
| S08-S09 | Versionamento + pins ancorados |
| S19 | Arquivos & downloads (Sharepoint) |
| S21-S22 | Jornada da Campanha + seed 13 eventos |
| S25-S26 | Vídeo embed (YouTube/Vimeo/SharePoint/Drive) |
| S27 | Dashboard home + compare V1xV2 |
| S29 | Audit log timeline + markdown leve nos comentários |
| S30 | Reset onda 1 + lançamento |
| S31 | Breadcrumb consistente |
| S32-S33 | Página /ajuda + fix footer |
| S34-S38 | Mobile overhaul (drawer FORA do header, bottom sheets, scroll horizontal, z-index fixes) |
| S39 | Elemidia atualizada com proposta Metropolitan Life (22 prédios, R$ 76.800) |
| **S40** | **Criativos + Variações — 4 fases** |

---

## ⚙️ S40 — Criativos + Variações

| Fase | Entrega | Testes |
|---|---|---|
| **1. Backend** | Migration SQL idempotente, tabela `piece_concepts`, colunas `concept_id`/`variant_label`/`variant_order` em `pieces`, `concept_id` em `comments` com XOR constraint. 12 métodos novos no Store. `addPiece` compatível com API antiga (cria concept silenciosamente). | +30 |
| **2. UI Listagem** | Modal "+ Novo Criativo" e "+ Adicionar Variação". Card-criativo com galeria de thumbs + status agregado pra criativos com 2+ variações. Filtros agregam por criativo. KPIs contam variações. | +43 |
| **3. ConceptView** | Tela dedicada: galeria horizontal scrollável + foco da variação selecionada + painel direito (aprovação, comentários da variação, pins) + accordion "Comentário geral do criativo". Navegação ← →. | +39 |
| **4. Polish** | Atalhos A/R/C. Tabs mobile (Aprovação \| Comentários). Hint visual `<kbd>` desktop. Transições 220ms (fade-in foco, pop thumb) com `prefers-reduced-motion`. `aria-selected`. | +37 |

Total: **149 testes novos**, zero regressão.

---

## 📝 Convenções

- **PUSH manual** — Du puxa de `/tmp/repo/metlife_brasil/`, copia pra `/Users/eduardowillian/_Molla_MetLifeBrasil/`, testa local, depois `git push origin main`.
- **SQL manual** — Supabase está numa org fora do MCP. Du roda DDL no Dashboard SQL Editor.
- **Migrations idempotentes** — todo DDL é `IF NOT EXISTS` + `DO $$` checks. Roda 2x sem quebrar.
- **Cache invalidation** — mutations no Store invalidam só os Maps relevantes; nunca limpa tudo (perf).
- **`onclick` inline = não** — usa `addEventListener` em wireUp por elemento.
- **Audit log** — toda mudança gera comment `kind=action-*` na variação afetada (já bate com timeline).

---

## 🚀 Próximos passos sugeridos

Em ordem de impacto / esforço:

1. **Notificações de aprovação** (e-mail/Slack via Resend + Edge Function) — destrava o ciclo
2. **Tags/labels nas peças** — quick win pra organizar por canal/onda
3. **Brand Guide / Briefing** (página `/marca`) — centraliza diretrizes hoje em PowerPoint
4. **Login Supabase Auth** — substitui senha única pelo flow oficial
5. **Storage Supabase pra peças** — hoje as imagens são base64 inline (compressed). Mover pra Storage reduziria payload do banco

Ver `docs/ROADMAP.md` pra a lista viva.
