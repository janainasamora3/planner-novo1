# Dashboard Pessoal — Deploy no Netlify

## Como publicar (drag-and-drop)

### 1. Acesse https://app.netlify.com e faça login.

### 2. Add new site → Deploy manually
No painel, clique em **"Add new site"** → **"Deploy manually"**.

### 3. Arraste a pasta `dashboard/`
Descompacte o ZIP. Vai aparecer uma pasta `dashboard/` com todos os arquivos.
Arraste a pasta **inteira** `dashboard/` para a área tracejada do Netlify.

### 4. Aguarde o build (2–5 min)
O Netlify detecta Next.js automaticamente, roda `npm install --legacy-peer-deps` + `npm run build`
e publica em `https://dashboard-xxxxxx.netlify.app`.

## Novidades desta versão

- **Cursos**: editor de texto rico em cada caderno com:
  - Fonte (família), tamanho, negrito, itálico, sublinhado, riscado
  - Cor do texto e marca-texto (highlight)
  - Títulos H1/H2/H3, listas com marcadores, listas numeradas
  - **Checkbox inline com o texto** (task list)
  - **Emojis** (5 categorias)
  - Alinhamento, citação, código, linha horizontal, links, imagens

- **Finanças Pessoal** agora tem 3 abas:
  1. **Transações** — módulo financeiro original
  2. **Cartões** — controle de faturas de cartão de crédito:
     - Cartões com nome, bandeira, dias de fechamento/vencimento, limite
     - Compras parceladas (descrição, valor total, n° parcelas, data)
     - Acompanhamento da parcela atual (X/Y) com barra de progresso
     - Cálculo automático do valor da parcela
     - Quanto falta pagar = parcelas restantes × valor da parcela
     - Botão "Pagar próxima parcela" para avançar
     - Resumo total: limite, fatura atual, total restante
  3. **Empréstimos** — controle de empréstimos (peguei / emprestei):
     - Tipo: peguei emprestado (devo) ou emprestei a alguém (vou receber)
     - Principal, juros a.m., n° de parcelas, valor da parcela, data de início
     - Contraparte (de quem pegou / para quem emprestou)
     - Registro de pagamentos parciais com data e observação
     - Barra de progresso de quitação
     - Resumo: total peguei, total emprestei, restante a pagar / receber

## Configurações técnicas

| Item | Valor |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Build command | `npm run build` |
| Publish dir | `.next` |
| Node version | 20 |
| NPM flags | `--legacy-peer-deps` |
| Plugin | `@netlify/plugin-nextjs` (auto) |

## Importante

- **Dados em localStorage**: tudo que você cadastra fica salvo no navegador.
- Use a seção **💾 Backup** (no rodapé do dashboard) para exportar/importar JSON.
- Para atualizar um site existente: no painel Netlify → Deploys → arraste a pasta novamente.

## Atualizar após mudanças

1. Substitua os arquivos em `dashboard/` pelos novos
2. Arraste novamente a pasta no Netlify
3. Aguarde o build
