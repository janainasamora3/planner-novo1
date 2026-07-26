#!/bin/bash
# Backup COMPLETO do projeto Dashboard - todos os recursos
# Inclui: código-fonte + README detalhado com lista de todas as funcionalidades
# Saída: ZIP em /home/z/my-project/download/

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
BACKUP_DIR="${PROJECT_ROOT}/scripts/backup-staging"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_OUTPUT="${PROJECT_ROOT}/download/dashboard-completo-${TIMESTAMP}.zip"

echo "==> [1/4] Limpando staging..."
rm -rf "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/dashboard"

echo "==> [2/4] Copiando código-fonte completo..."
cd "${PROJECT_ROOT}"
rsync -a \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.git.sandbox-backup' \
  --exclude='scripts/backup-staging' \
  --exclude='upload' \
  --exclude='download' \
  --exclude='db' \
  --exclude='skills' \
  --exclude='extracted' \
  --exclude='dev.log' \
  --exclude='.DS_Store' \
  --exclude='tsconfig.tsbuildinfo' \
  ./ "${BACKUP_DIR}/dashboard/"

echo "Source copiado: $(du -sh "${BACKUP_DIR}/dashboard" | cut -f1)"

echo "==> [3/4] Criando README detalhado..."
cat > "${BACKUP_DIR}/dashboard/README-COMPLETO.md" << 'READMEEOF'
# Dashboard Pessoal — Backup COMPLETO

**Data:** gerada automaticamente
**Projeto:** Dashboard pessoal + Social Media Manager + Rastreador de Livros + Finanças + Tarefas
**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
**Persistência:** localStorage (frontend)

---

## 📚 Lista COMPLETA de funcionalidades

### 🏠 Dashboard principal
- 2 seções: Negócios + Vida Pessoal
- CRUD de páginas (cards) com upload de imagem comprimida
- Drag-and-drop de cards entre seções
- Modo escuro/claro com toggle
- Controle de tamanho de fonte (FontScaleControl)
- ErrorBoundary global — nunca mais tela branca

### ✅ Card "Tarefas" (Vida Pessoal)
Abre **TasksManager** (modal tela cheia):
- Calendário mensal com indicadores de tarefas (pendente/concluída)
- Lista lateral de tarefas do dia selecionado
- Botão "+ Nova tarefa" abre editor completo:
  - Título, emoji, cor
  - Data inicial + horário
  - **Recorrência: 5 tipos**
    - Sem repetição
    - Diária
    - Semanal
    - Mensal
    - **Personalizada** (escolher dias da semana: Seg, Qua, Sex...)
  - **Término da recorrência (3 opções):**
    - ♾️ Sempre ativo (repete para sempre)
    - **Após N ocorrências** (5x, 10x, 20x, 30x, 50x ou número custom)
    - **Em uma data específica** (escolher data final)
  - **Preview das próximas 8 ocorrências** — revise antes de salvar
  - Subtarefas com checkbox
  - Categoria (5 padrão + criar/editar/excluir custom)
  - Notas
- Arrastar tarefa para mudar de data
- Clicar checkbox marca como concluída
- Recorrência diária/mensal mostra em todos os dias corretos
- Sanitização defensiva — nunca quebra com dados corrompidos

### 🧠 Card "Modo Caverna" (Vida Pessoal)
Abre **ModoCavernaManager** (modal tela cheia):
- Timer Pomodoro com 4 presets:
  - ⚡ Curto (15 min)
  - 🎯 Foco (25 min)
  - 🧠 Profundo (50 min)
  - 🏔️ Longo (90 min)
- Campo de meta da sessão (ex: "Finalizar relatório")
- Círculo de progresso animado (SVG, vai preenchendo)
- Timer mm:ss grande no centro
- Controles: ▶️ Retomar / ⏸️ Pausar / ✕ Cancelar
- Bloco de notas durante a sessão (salva ao concluir)
- Som ao terminar (bipe de 880Hz)
- **Histórico completo** com 4 stats:
  - Sessões hoje
  - Foco hoje (min)
  - Total sessões
  - Total foco (h:min)
- Lista das últimas 50 sessões com data/hora, duração, meta, notas, status
- Excluir sessão individual

### 🗓️ Card "Planejamento" (Vida Pessoal)
Abre **PlanejamentoManager** (modal tela cheia):
- 27 cards editáveis:
  - Briefing (18 seções internas com rich-text)
  - Tom de voz (6 seções)
  - Monetização
  - Público-alvo
  - Calendário de conteúdo
  - Pilares de conteúdo
  - Estratégia
  - Métricas
  - Concorrentes
  - Parcerias
  - Investimento
  - E mais 16 cards...
- Cada card tem capa editável e conteúdo próprio
- Adicionar/editar/excluir cards

### 💸 Card "Finanças" (Vida Pessoal) — NOVO
Abre **FinanceManager** (modal tela cheia):
- **4 Stats mensais:**
  - 📈 Entradas (verde) — soma de entradas do mês
  - 📉 Saídas (vermelho) — soma de saídas do mês
  - 💰 Saldo (verde/vermelho conforme sinal) — entradas - saídas
  - ⏳ Pendente (amarelo) — soma de pendente + atrasado
- **Navegação entre meses** (‹ mês anterior / próximo › + botão Hoje)
- **Filtros:**
  - Tipo: Todos / Entrada / Saída (coloridos)
  - Status: Todos / Pago / Pendente / Atrasado (coloridos)
  - Busca por descrição/cliente/serviço
- **Lista de transações** (ordenada por data decrescente):
  - Ícone ↗ (verde, entrada) ou ↙ (vermelho, saída)
  - Descrição + badge de status + badge de método de pagamento
  - Data + cliente + serviço
  - Valor formatado em R$ com sinal +/−
  - Clique pra editar
- **Editor completo:**
  - Tipo: Entrada / Saída (botões grandes coloridos)
  - Descrição + Valor (R$)
  - Data + Status (Pago / Pendente / Atrasado)
  - Pagamento (select: Pix / Cartão / Boleto / Dinheiro / Transferência / Outro)
  - Cliente + Serviço + Notas
  - Botões Excluir / Cancelar / Salvar
- 8 transações de demonstração incluídas

### 📖 Card "Livros" (Vida Pessoal) — Rastreador de Leitura
Abre **BooksManager** (modal tela cheia):
- **2 abas:** 📚 Acervo + 📅 Agenda

**Aba Acervo:**
- Grid de capas (upload de imagem do dispositivo ou URL)
- 5 status: Quero Ler, Lendo, Lido, Pausado, Abandonei
- Avaliação por estrelas (0-5)
- Formato: Físico, E-book, Audiobook
- Tags/gêneros com estatísticas
- 🎲 Sortear próximo livro (animação de roleta 2s)
- 🔥 Streak de leitura diária (atual + recorde)
- Filtro por status + busca por título/autor
- 7 stat cards no topo

**Aba Agenda (calendário mensal):**
- Grade mensal de 6 semanas × 7 dias
- Capas dos livros lidos aparecem dentro de cada dia do calendário
- Navegação: ‹ mês anterior / próximo › + botão Hoje
- Clique num dia → mostra detalhes com capas maiores abaixo
- Mini resumo "hoje: X págs lidas"
- Stats do mês (dias com leitura, total de págs, livros únicos)
- Capas maiores nas células (80×56px)
- Botão "+ Registrar" páginas lidas hoje
- Botão "✓ Terminei!" quando atinge total de páginas

### 💼 Cards de Negócios
- 📱 **Social Media** — abre SocialManager com 8 menus:
  1. 🎯 Prospectação (funil kanban + lista de contatos)
  2. 👥 CRM equipe (membros com cargo, email, WhatsApp, aniversário)
  3. 🤝 CRM clientes (7 tabs: Perfil, Etapas, Planejamento, Calendário, IG, IN, YT)
  4. 💰 Financeiro (lista de transações legacy)
  5. 👋 Offboarding
  6. 🔗 Links
  7. 🚀 Futuro
  8. 📋 Banco de Headlines (com drag-and-drop, favoritos, filtros)
- 🎧 E Music DJs / 👑 Império Company / JA / EV Records / EMD Cast / CEO Store / Negócios Reais — abrem EnterpriseManager (custom tabs por empresa)
- 🤝 Plano Empresarial 2026 — abre BusinessPlanManager

### 🛡️ Resiliência (defesa contra erros)
- **ErrorBoundary global** — captura qualquer erro de renderização, mostra tela amigável com botões:
  - 🔄 Recarregar página
  - 🧹 Limpar só tarefas + recarregar (mantém livros, planejamento, etc.)
  - 🗑️ Limpar TUDO e recarregar
  - Ver detalhes técnicos do erro
- **Sanitização defensiva** em TODOS os hooks:
  - use-tasks: valida id, título, subtasks, completedDates, recurrence, weekdays, endMode, endCount, endDate
  - use-books: valida id, título, status, format, tags, readingLog, rating (0-5)
  - use-pages: valida id, título, section (negocios/pessoal), special
  - use-finance: valida tipo, descrição, valor, data, status
- Se algum dado estiver corrompido, o app descarta silenciosamente aquele item e continua funcionando

### 💾 Backup & Restauração (no rodapé do dashboard)
- Exportar JSON com TODOS os dados (incluindo livros, habit tracker, planejamento v5, finance categorias/goals, planningList)
- Importar JSON (sobrescreve tudo)
- Resetar tudo (botão de confirmação dupla)
- Manual de backup (acordeão com instruções)

### 🎯 Outros recursos
- 🗓️ Calendário de Tarefas no final da página inicial (acesso rápido sem precisar abrir o card)
- 🎨 Categorias de tarefas customizáveis (criar/editar/excluir com cor + emoji)
- 📋 Planejamento também acessível via URL `/planejamento` (página dedicada)
- 🌓 Modo escuro/claro com toggle persistente
- 🔤 Controle de tamanho de fonte (acessibilidade)
- 📱 PWA — instalável como app no celular/desktop (manifest.webmanifest)

---

## 📂 Estrutura de pastas principais

```
dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout raiz (com ErrorBoundary)
│   │   ├── page.tsx            # Página inicial (roteia cards especiais)
│   │   ├── globals.css
│   │   ├── api/route.ts
│   │   └── planejamento/       # Páginas dedicadas do Planejamento
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── books-manager.tsx           # Card Livros
│   │   │   ├── tasks-manager.tsx           # Card Tarefas (wrapper)
│   │   │   ├── calendar-tasks.tsx          # Calendário + lista
│   │   │   ├── task-editor-dialog.tsx      # Editor de tarefa
│   │   │   ├── modo-caverna-manager.tsx    # Card Modo Caverna
│   │   │   ├── planejamento-manager.tsx    # Card Planejamento
│   │   │   ├── finance-manager.tsx         # Card Finanças
│   │   │   ├── enterprise-manager.tsx      # Cards de Empresa
│   │   │   ├── business-plan-manager.tsx
│   │   │   ├── backup-section.tsx          # Backup/Restore
│   │   │   ├── top-bar.tsx
│   │   │   ├── page-card.tsx
│   │   │   ├── page-section.tsx
│   │   │   ├── add-page-dialog.tsx
│   │   │   ├── page-detail-dialog.tsx
│   │   │   ├── card-context-menu.tsx
│   │   │   ├── planejamento-item-detail.tsx
│   │   │   ├── planejamento-item-editor.tsx
│   │   │   └── task-table-view.tsx, task-kanban-view.tsx
│   │   ├── social-media/       # SocialManager + 8 views
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── error-boundary.tsx  # Rede de segurança global
│   │   ├── font-scale-control.tsx
│   │   └── theme-toggle.tsx, theme-provider.tsx
│   ├── hooks/                  # Hooks com sanitização defensiva
│   │   ├── use-books.ts
│   │   ├── use-tasks.ts
│   │   ├── use-pages.ts
│   │   ├── use-finance.ts
│   │   ├── use-planejamento.ts
│   │   └── (mais 18 hooks)
│   └── lib/                    # Tipos e constantes
│       ├── books.ts
│       ├── tasks.ts
│       ├── pages.ts
│       ├── finance.ts
│       ├── planejamento.ts
│       └── (mais 14 libs)
├── public/                     # Assets estáticos (icon, logo, manifest)
├── prisma/schema.prisma        # Schema Prisma (opcional, não usado em runtime)
├── scripts/
│   ├── create-netlify-backup.sh
│   └── create-backup-lean.sh
├── package.json                # Dependências
├── next.config.ts              # Config Next.js (sem output=standalone)
├── netlify.toml                # Config Netlify
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json             # Config shadcn/ui
└── README-COMPLETO.md          # Este arquivo
```

---

## 🚀 Como rodar localmente

```bash
# 1. Descompacte este ZIP
# 2. Entre na pasta dashboard/
cd dashboard

# 3. Instale dependências
npm install --legacy-peer-deps

# 4. Rode em desenvolvimento
npm run dev
# Abre http://localhost:3000

# OU rode em produção (mais estável)
npm run build
npm start
# Abre http://localhost:3000
```

## 🌐 Como publicar no Netlify

### Opção A — Drag and drop
1. Acesse https://app.netlify.com
2. Add new site → Deploy manually
3. Arraste a pasta `dashboard/` na área tracejada
4. Aguarde 2-5 min
5. Acesse a URL gerada

### Opção B — Via GitHub
1. Crie repositório no GitHub
2. Suba a pasta `dashboard/`
3. No Netlify: Add new site → Import from GitHub → selecione o repo
4. Configurações:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Deploy site

## ⚙️ Configurações técnicas

| Item | Valor |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| React | 19 |
| TypeScript | 5 |
| UI | Tailwind CSS 4 + shadcn/ui (New York) |
| Build command | `npm run build` |
| Publish dir | `.next` |
| Node version | 20 |
| Plugin Netlify | `@netlify/plugin-nextjs` (auto) |
| Persistência | localStorage (frontend) |

## 📝 Notas importantes

- **localStorage é a fonte de verdade** — todo o estado (cards, tarefas, livros, transações) é salvo no navegador
- **Backup dentro do app** — seção 💾 no rodapé do dashboard exporta/importa JSON com TODOS os dados
- **Migração automática** — ao abrir o app pela primeira vez após atualizar, marca automaticamente os 5 cards especiais (Tarefas, Modo Caverna, Planejamento, Finanças, Livros) com seus `special` corretos, mesmo em dados antigos
- **Sem output=standalone** — removido do next.config.ts pra funcionar com plugin Netlify
- **Sem eslint no config** — opção removida (não suportada no Next 16)

## 🎯 Próximos passos sugeridos

- Card Exercícios/Fitness → lista de treinos
- Card Cursos → lista de cursos com progresso
- Card Senhas → cofre criptografado
- Card Saúde → acompanhamento médico
- Habit Tracker dedicado (separado do calendar)

READMEEOF

echo "==> [4/4] Compactando tudo em ZIP único..."
cd "${BACKUP_DIR}"
zip -r -q "${ZIP_OUTPUT}" .
echo "ZIP criado: $(du -h "${ZIP_OUTPUT}" | cut -f1)"

echo ""
echo "=================================================="
echo "BACKUP COMPLETO CRIADO!"
echo "=================================================="
echo "Arquivo: ${ZIP_OUTPUT}"
echo "Tamanho: $(du -h "${ZIP_OUTPUT}" | cut -f1)"
echo ""
echo "Total de arquivos no ZIP:"
unzip -l "${ZIP_OUTPUT}" | tail -1
echo ""
echo "Verificando arquivos críticos no ZIP:"
unzip -l "${ZIP_OUTPUT}" | grep -E "books-manager|tasks-manager|modo-caverna|planejamento-manager|finance-manager|calendar-tasks|task-editor-dialog|use-books|use-tasks|use-pages|use-finance|books\.ts|tasks\.ts|finance\.ts|pages\.ts|page\.tsx|layout\.tsx|error-boundary|backup-section|netlify\.toml|package\.json|next\.config" | head -25

echo ""
echo "Limpando staging..."
rm -rf "${BACKUP_DIR}"
echo "Concluído."
