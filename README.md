# Dashboard TI BR Marinas

Painel interno para TI com gestão de credenciais, NVRs, termos, crachás, monitoramento e ferramentas administrativas. Frontend em React/Vite + Supabase como backend (Auth, Postgres, Storage, Functions).

---

## Índice
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração local](#configuração-local)
- [Checklist Supabase](#checklist-supabase)
- [Principais páginas](#principais-páginas)
- [Scripts úteis](#scripts-úteis)
- [Deploy](#deploy)

---

## Tecnologias
- [React + Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui + Tailwind CSS](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (Auth, Postgres, Storage, Functions)
- Outras libs: `@supabase/supabase-js`, `lucide-react`, `sonner`, `zxcvbn`, `html2canvas`, `cropperjs`, `pdf-lib`

---

## Estrutura do projeto
```
├─ src/
│  ├─ pages/                  # Páginas principais
│  ├─ components/             # Layout, UI compartilhada
│  ├─ contexts/               # Auth, NVR, Theme, History
│  ├─ lib/                    # Serviços (Supabase, audit, NVR, senhas, etc.)
│  ├─ config/                 # Navegação, maintenance
│  └─ main.tsx, App.tsx
├─ docs/md/paginas/           # Documentação por página
├─ docs/md/supabase.md        # Checklist completo do backend
├─ docs/md/overview.md        # Visão geral
├─ tutorial/sql/              # Scripts SQL para Supabase
└─ README.md (este arquivo)
```

---

## Documentação detalhada
Toda a documentação vive na pasta `docs/`, agora versionada junto com o código. Referências principais:

| Caminho | Conteúdo |
| --- | --- |
| `docs/md/README.md` | Índice geral com navegação entre guias |
| `docs/md/paginas.md` + `docs/md/paginas/*.md` | Documentação específica de cada rota |
| `docs/md/supabase.md` | Checklist completo de tabelas, policies e funções RPC |
| `docs/md/overview.md` | Visão macro do produto e dos fluxos de autenticação |
| `docs/md/DEPLOY_VERCEL.md` | Passo a passo de deploy |
| `docs/sql/*.sql` | Scripts para criar/ajustar estruturas no Supabase |

> Sempre que atualizar telas, fluxos ou infraestrutura, inclua o ajuste correspondente nos arquivos acima para manter o histórico no GitHub.

---

## Configuração local

1. **Instale dependências**
   ```bash
   npm install
   ```

2. **Crie `.env.local`**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```
   > As chaves ficam em Supabase Dashboard > Settings > API

3. **Rodar em desenvolvimento**
   ```bash
   npm run dev
   ```

---

## Checklist Supabase
> Guia completo em [`docs/md/supabase.md`](docs/md/supabase.md). Resumo rápido:

- Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Tabelas necessárias: `passwords`, `nvrs`, `nvr_config`, `pages_maintenance`, `audit_logs`, `user_profiles`, `user_security_logs`
- Policies RLS habilitadas com acesso para usuários autenticados e admins
- Realtime ligado para `nvrs`
- Funções RPC:
  - `update_user_password_by_admin`
  - `delete_user_by_admin`
- Storage público com as imagens usadas em Crachás/Assinaturas

Scripts SQL na pasta `tutorial/sql/` ajudam a criar toda a estrutura.

---

## Principais páginas
Cada rota tem documentação em `docs/md/paginas/<pagina>.md`. Highlights:

| Página | Rota | Descrição rápida |
|--------|------|-------------------|
| Login | `/login` | Autenticação Supabase |
| Senhas | `/senhas` | Cofre com cards/tabela e export CSV |
| Controle NVR | `/controle-nvr` | CRUD de NVRs + slots (Realtime) |
| Controle de HDs | `/controle-hds` | KPIs, custo estimado, export XLSX |
| Crachás | `/crachas` | Upload/crop e download PNG |
| Termos | `/termos` | Preenchimento e geração de PDF via `pdf-lib` |
| Configurações | `/configuracoes` | Gestão de usuários, permissões, páginas em manutenção, versão |
| Audit Logs | `/audit-logs` | Consulta dos logs de auditoria |
| Security Test | `/security-test` | Suíte de pentest automatizado |

Veja `docs/md/overview.md` para fluxo completo e guardas de rota.

---

## Scripts úteis
- `npm run dev` – ambiente de desenvolvimento
- `npm run build` – cria build de produção (gera `src/lib/version.json` automaticamente)
- `npm run preview` – valida build localmente
- Pastas `tutorial/sql/` – migrações e funções RPC prontas para o Supabase

---

## Deploy
### Vercel
1. Conecte o repositório no Vercel
2. Configure as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático (`npm run build`)

Guia detalhado em [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md).

### Outras opções
Qualquer plataforma que rode apps Vite/React (Netlify, Render, etc.) também funciona, desde que configure as variáveis de ambiente e sirva o build estático.

---

## Suporte e documentação adicional
- **Índice geral**: `docs/md/README.md`
- **Paginas**: `docs/md/paginas/`
- **Supabase**: `docs/md/supabase.md`
- **Visão geral**: `docs/md/overview.md`
- **Termos, security e scripts**: `docs/md/*.md` + pasta `tutorial/`

Contribuições e melhorias são bem-vindas! Abra PRs ou issues com sugestões. 🚀
