# Dashboard Pessoal — Deploy no Netlify

## 📦 Como publicar no Netlify (drag-and-drop)

### Passo 1 — Acesse o Netlify
1. Entre em https://app.netlify.com
2. Faça login (ou crie conta gratuita)

### Passo 2 — Vá em "Add new site → Deploy manually"
1. No painel do Netlify, clique em **"Add new site"** (canto superior)
2. Escolha **"Deploy manually"**
3. Vai aparecer uma área tracejada: **"Drag and drop your site folder here"**

### Passo 3 — Arraste a pasta `dashboard/`
1. **Descompacte este ZIP** que você baixou
2. Vai aparecer uma pasta chamada `dashboard/` com todos os arquivos dentro
3. **Arraste a pasta `dashboard/` inteira** para a área tracejada do Netlify

### Passo 4 — Aguarde o build
- O Netlify vai detectar que é Next.js automaticamente
- Vai rodar `npm install` + `npm run build`
- Demora de 2 a 5 minutos
- Quando terminar, vai mostrar uma URL tipo `https://dashboard-xxxxxx.netlify.app`

### Passo 5 — Pronto!
- Clique na URL gerada
- Seu dashboard estará no ar com todos os módulos:
  - 📚 Livros (com agenda calendário)
  - 📱 Social Media Manager
  - 🤝 CRM Clientes
  - 🗓️ Planejamento (27 cards)
  - ✅ Tarefas & Calendário
  - 🎯 Habit Tracker
  - E muito mais

## ⚠️ Importante

- **Dados em localStorage**: tudo que você cadastra no app fica salvo no navegador, não no servidor. Se limpar o cache, perde tudo.
- **Backup dentro do app**: a seção 💾 Backup no rodapé do dashboard permite exportar/importar JSON com todos os dados.
- **Build command**: `npm run build` (já configurado no netlify.toml)
- **Publish directory**: `.next` (já configurado no netlify.toml)

## Atualizar site existente

Se já tem um site no Netlify e quer atualizar:

1. No painel do Netlify, clique no seu site
2. Vá em **"Deploys"** na barra superior
3. Em **"Deploy site"** → **"Drag and drop folder"**
4. Arraste a pasta `dashboard/` novamente
5. Aguarde o novo build

## Configurações técnicas

| Item | Valor |
|---|---|
| Framework | Next.js 16 (App Router) |
| Build command | `npm run build` |
| Publish dir | `.next` |
| Node version | 20 |
| Plugin | `@netlify/plugin-nextjs` (auto) |

## Problemas comuns

**Build falha com erro de memória**: aguarde, o Netlify tem 8GB de RAM em planos free.

**Página em branco após deploy**: aguarde 1-2 min e recarregue (cache do navegador).

**Card de Livros não aparece**: faça hard reload no navegador (`Ctrl+Shift+R` no PC, ou limpe cache do navegador no celular). A versão antiga pode estar em cache.
