# B-School Fit

Aplicação web independente construída com React, TypeScript, Vite e Supabase.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Crie um arquivo `.env` com:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL
```

Use somente a chave pública/anon do Supabase no frontend. Nunca coloque `service_role` ou uma secret key neste repositório.

## Build

```bash
npm run typecheck
npm run build
npm run preview
```

## Deploy

O projeto está preparado para deploy direto do GitHub em plataformas compatíveis com Vite, como Vercel. Build command: `npm run build`. Output directory: `dist`.
