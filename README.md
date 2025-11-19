# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3942c7ce-0bfa-41ac-9663-8c2084cd0be9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3942c7ce-0bfa-41ac-9663-8c2084cd0be9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Authentication)

## 🔧 Configuração Local

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar:**
- Supabase Dashboard > Settings > API

### Instalação

```sh
npm install
npm run dev
```

## How can I deploy this project?

### Deploy no Vercel (Recomendado)

Este projeto está configurado para deploy no Vercel. Veja o guia completo em [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

**Passos rápidos:**
1. Conecte seu repositório Git ao Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça o deploy!

### Outras opções

- **Lovable**: Abra [Lovable](https://lovable.dev/projects/3942c7ce-0bfa-41ac-9663-8c2084cd0be9) e clique em Share -> Publish
- **Netlify**: Similar ao Vercel, configure as variáveis de ambiente
- **Outros**: Qualquer plataforma que suporte projetos Vite/React

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
