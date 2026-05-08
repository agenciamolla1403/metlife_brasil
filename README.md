# MetLife Brasil 2026

Hub de deliverables estratégicos da campanha **MetLife Brasil 2026** — Agência Mollá.

## 🚀 Stack

- **Hosting:** [Vercel](https://vercel.com/agenciamolla1403s-projects/metlife-brasil)
- **Repo:** [github.com/agenciamolla1403/metlife_brasil](https://github.com/agenciamolla1403/metlife_brasil)
- **Tipo:** Site estático (HTML + CSS embutido)

## 📂 Estrutura

```
metlife_brasil/
├── public/
│   ├── index.html          → Hub / landing
│   ├── cronograma.html     → Cronograma Diarizado A/B
│   └── plano-midia.html    → Plano Tático de Mídia
├── vercel.json             → Rotas limpas + headers
├── package.json
├── .gitignore
└── README.md
```

## 🌐 Rotas em produção

| URL | Página |
|-----|--------|
| `/` | Hub central |
| `/cronograma` | Cronograma Diarizado A/B |
| `/plano-midia` | Plano Tático de Mídia |

## 🛠 Desenvolvimento local

```bash
npm run dev
# abre em http://localhost:3000
```

## 🚢 Deploy

Push na branch `main` → Vercel faz deploy automático.

```bash
git add .
git commit -m "feat: descrição do ajuste"
git push origin main
```

---

© Agência Mollá × MetLife Brasil — 2026
