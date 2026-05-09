# 🗺️ Roadmap — MetLife Brasil 2026

Lista viva de melhorias e features candidatas pro hub. Ordem por prioridade
sugerida (não por ordem de execução). Atualizar conforme decidir cada sessão.

---

## 🟢 Em andamento / próximas sessões

- **Jornada da Campanha** (cronograma macro) — visão temporal de todas as ações,
  filtrável por categoria, com CRUD admin via Supabase. **→ S21**

---

## 🔥 Alto impacto

### 1. Notificações de aprovação (e-mail/Slack)
Disparar e-mail (Resend, Supabase Edge Function) ou Slack quando:
- Peça nova é submetida
- Comentário é postado
- Status muda (aprovado/reprovado)

Destrava o ciclo de aprovação na prática — não fica refém de "o cliente entrou
no sistema?".

### 2. Dashboard na home da Aprovação
Cabeçalho consolidado: "X peças pendentes · Y aprovadas · Z reprovadas · W
comentários sem resposta", com filtro "só mostrar campanhas com pendência".

### 3. Audit log
Tabela `events` no Supabase (separada da tabela do roadmap acima) +
modal "Histórico" na peça mostrando quem fez o quê quando. Hoje só guardamos
autor de comentário, não eventos como aprovar/reprovar/editar.

### 4. Brand Guide / Briefing
Página `/marca` com logo, paleta, fonts, tom de voz, "do's and don'ts".
Hoje tudo espalhado em PowerPoint. Plugar no Supabase pra editar via admin.

---

## 🪄 Quick wins (1-2h cada)

### 6. Atalhos de teclado na Aprovação
- `A` aprova
- `R` reprova
- `J/K` navega entre peças
- `C` foca no campo de comentário

### 7. Markdown leve nos comentários
**bold**, _itálico_, link clicável. Hoje é texto puro.

### 8. Comparação V1 vs V2 lado a lado
Já temos snapshot de versão. Falta um botão "comparar" que renderiza as duas
peças lado a lado.

### 9. Tags/labels nas peças
"TV", "Digital", "OOH", "9:16", "16:9". Permite filtrar dentro de uma campanha.

---

## 🏗️ Estruturais (médio prazo)

### 10. Login real (Supabase Auth)
Hoje 2 senhas compartilhadas (`metlife2026`, `molla2026`). Quando alguém sai,
todo mundo precisa trocar. Migrar pra Supabase Auth (e-mail + magic link).
Ganhos: audit log automático, perfis por pessoa, controle granular de
permissões.

### 11. Cronograma A/B, Mídia e Elemidia plugados no Supabase
Hoje os 3 são dados hardcoded em arquivos `.js`. Se MetLife pedir mudança,
Mia precisa refazer código. Editáveis pelo admin (igual Arquivos virou) =
autonomia total.

### 12. Migrations separadas
Quebrar o `schema.sql` em `001_initial.sql`, `002_pins.sql`, `003_files.sql`,
`004_events.sql` etc. Mais profissional e fácil de aplicar em ambiente novo.

### 13. Storage do Supabase pra peças críticas
Hoje peças apontam pra URL externa. Se a URL morrer, peça quebra. Considerar
upload direto no Storage do Supabase pras peças importantes.

---

## 🌟 Nice to have (não fazer agora)

- **KPIs/analytics da campanha** — pós-Copa quando tiver dados reais.
- **Modo apresentação fullscreen** — pra pitches em reunião.
- **PWA / instalar como app** — bom pra mobile.
- **Dark mode** — estética.
- **Export/print** — gerar PDF de campanha aprovada.
- **Estado offline** — service worker + cache.

---

## 🧪 DevEx / Operacional

- **CI** — rodar os testes em cada PR (GitHub Actions).
- **Backup automatizado** do Supabase (já vem com Pro mas confirmar).
- **Monitoring** — Plausible/Umami pra analytics, Sentry pra erros.
- **Auditar config.js** — `SUPABASE_KEY` consistente em todo store
  (já corrigido na S19.2 mas vale uma passada geral).

---

_Última atualização: S21 — Jornada da Campanha._
