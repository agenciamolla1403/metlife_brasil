# CLAUDE.md — MetLife Brasil 2026

Hub "Central do Cliente" da Agência Molla para a conta MetLife Brasil 2026.
Site estático, sem build, sem framework.

**Estado completo do projeto:** `docs/MASTER.md`. Leia antes de mexer em qualquer hub.

---

## Identidade

- O lead é o **Du (Eduardo Willian)**. Ele chama as IAs de **Mia**.
- Responda em **português brasileiro**.

---

## Regras absolutas

1. **Nunca usar MCP tools** (Canva, Stripe, Supabase, Vercel, GitHub) sem o Du autorizar
   explicitamente naquela sessão. Push é manual dele; SQL é manual no Dashboard Supabase.
2. **Entregar sempre o comando de push explícito** ao fim de cada entrega.
3. **Nunca sobrescrever arquivo existente** quando a tarefa pede algo novo — criar arquivo novo.
4. **Commits em PT-BR conventional, sem ponto final**: `feat(adsplay): ...`, `fix(week-10): ...`,
   `style(landing-page): ...`, `chore(blitz): ...`.
5. **Cores semânticas são intocáveis**, inclusive em migração de paleta:
   verde aprovado `#50E596` · vermelho reprovado `#E5484D` · âmbar pendente `#F59E0B`.
6. **`--success: #50E596`** sempre presente no `:root` global.
7. **Imagens nunca cortam** — `width: 100%; height: auto`, sem `object-fit: cover`.
8. **Comentários em zsh não podem ter parênteses inline** — usar `—` ou `:` (zsh quebra).
9. **Atualizar `docs/MASTER.md`** ao fechar sessão grande.
10. Linguagem **clara e informal** nos textos voltados ao cliente MetLife — quem lê não é
    especialista em mídia.

---

## Stack e infra

| | |
|---|---|
| Frontend | HTML + CSS + JS vanilla, sem build |
| Charts | Chart.js |
| Backend | Supabase — project ref `nasgvdqvrpeftqibmgfk` |
| Deploy | Vercel — `metlife-brasil.vercel.app` |
| Repo | `agenciamolla1403/metlife_brasil` |
| Workspace | `/Users/eduardowillian/Sites/metlife_brasil` |

**Config Vercel:** Framework Preset **Other**, Output Directory **`public`**,
build/install commands **vazios**. O preset Next.js quebra o deploy.

**`vercel.json`:** nunca usar `"public"`, `"name"`, `"version"` ou `"routes"` — são
obsoletos do Now.js v1 e o schema novo rejeita. Um `"public": true` esquecido já causou
**16 dias de deploys falhando em silêncio**. Rota nova = adicionar em `rewrites`.

---

## Rodar e verificar

```bash
npx serve public -l 3000
```

**Não existe `smoke_test.js` neste repo** (esse é do Whirlpool). Verificação aqui é
navegador de verdade: subir o servidor, abrir as rotas, checar console limpo e testar
a interatividade da página que mudou.

Para ver uma página protegida sem passar pela tela de login, defina o estado direto:

```js
localStorage.setItem('metlife_auth','1');
localStorage.setItem('metlife_role','molla');  // ou 'metlife'
localStorage.setItem('metlife_user','QA');
```

---

## Auth

Controle de acesso **visual**, não segurança real — senhas em texto puro no source,
qualquer um bypassa com DevTools. Uso interno apenas.

Dois perfis, persistidos em `localStorage` (`metlife_auth`, `metlife_role`, `metlife_user`),
definidos em `public/assets/auth.js`. As senhas estão lá — não duplique aqui.

---

## Arquitetura dos hubs

Quatro hubs de mídia seguem o mesmo padrão: `/performance`, `/landing-page`,
`/elemidia`, `/midia-programatica`.

Os hubs mais novos são nomeados por **disciplina**, não por fornecedor —
`/midia-programatica` nasceu como `/adsplay` e foi renomeado justamente porque
pode receber propostas de outras empresas. Cada proposta declara o seu
`fornecedor` no manifesto, e é ele que aparece na tag do card
("PROPOSTA · ADSPLAY"). Ao criar um hub novo, prefira o nome da disciplina.

```
public/{hub}.html            → índice: fetch do manifesto + grid de cards
public/{hub}/manifesto.json  → declara o conteúdo (semanas, propostas)
public/{hub}/{item}.html     → cada report/proposta é um HTML independente
public/assets/{hub}-timeline.js → renderiza a timeline a partir do manifesto
```

**Adicionar conteúdo = cadastrar no manifesto**, nunca duplicar HTML de navegação.

### Componentes globais (`public/assets/`)

| Arquivo | Papel |
|---|---|
| `header.js` + `header.css` | Header sticky global. `NAV_ITEMS` define o menu; a rota ativa é derivada automaticamente |
| `breadcrumb.css` | `.page-subbar` (breadcrumb) + `.anchor-nav` sticky + `section[id] { scroll-margin-top }` |
| `footer.css` | `.site-footer` |
| `performance-timeline.css` | Compartilhado entre `/performance` e `/landing-page` |
| `auth.js` | Guard de rota + sessão |
| `config.js` | `SUPABASE_URL` + publishable key |

**Rota nova exige 3 passos:** entrada em `NAV_ITEMS` (`header.js`), rewrite no
`vercel.json`, e breadcrumb `.page-subbar` na página.

### Multi-campanha

Um hub acomoda campanhas paralelas sem duplicar código: bloco `campanhas` no manifesto
+ campo `campanha` em cada item. O JS agrupa e aplica `.is-campanha-{slug}`; a paleta
própria vem de override de CSS vars no `<body>` da página do report.

Paletas em uso: **Copa** navy `#003B5C` + amber `#F5A623` · **Seguro Vida / Onda 3**
petróleo `#01444C`, deep `#012E33`, fundo `#E8F1F2`.

---

## Wrap de HTML de terceiros

Propostas e reports chegam como HTML pronto (Rafael Moraes, Eletromidia, Adsplay).
O wrapper acrescenta favicon, `auth.js`, `header.js`, `breadcrumb.css`, `footer.css`,
`data-{tipo}-id` no `<body>` e a `.page-subbar` — **preservando o design interno**.

**Sempre auditar colisão de CSS antes de integrar.** Já mordeu:

- `.total-row` colidiu com estilo interno (grid × `<tr>`)
- Os templates do Rafael reusam `.hero-stats` e `.stat` em seções internas além do hero —
  não remova essas definições
- HTML de terceiro costuma trazer seletores de elemento nu (`a`, `img`, `section`, `footer`)
  que vazam pro header global. **Carregue o CSS global depois do `<style>` da proposta**
  para vencer empates de especificidade
- Barra sticky própria do documento precisa virar
  `top: var(--mlh-header-h, 60px)` com `z-index` abaixo de 1000, senão fica escondida
  atrás do header global

---

## Supabase

Persistência de formulário com estado compartilhado ao vivo (padrão consolidado):

1. Tabela mínima: `field_id` PK, valor, `updated_at`, `updated_by`
2. RLS liberado via publishable key (a auth é client-side)
3. Realtime publication para sincronizar telas
4. Store `{feature}-store.js` com `list()`, `upsert()`, `saveAll()`, `subscribe()`
5. **Botão Salvar explícito**, nunca auto-save. Estado `isDirty`, e o realtime fica
   **pausado enquanto dirty** — protege trabalho local durante reunião ao vivo
6. No catch, detectar **PGRST205** (tabela não existe / não exposta ao PostgREST) e
   sugerir "rode o SQL no Supabase" — o Du roda SQL manual e às vezes esquece

**Erro 42710** no realtime = tabela já está na publicação. Mas o SQL Editor do Supabase é
transacional atômico: quando isso falha, **todo o resto do SQL é revertido junto**.

Migrations em `docs/migrations/`. Aplicadas em produção: `003_w8_form_selection.sql`.
