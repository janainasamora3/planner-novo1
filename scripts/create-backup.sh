#!/bin/bash
# Backup completo do projeto Dashboard Vida Pessoal + Social Media
# Inclui: código-fonte + histórico git completo + banco SQLite + configs + README
# Saída: um único arquivo ZIP em /home/z/my-project/download/

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
BACKUP_DIR="${PROJECT_ROOT}/scripts/backup-staging"
ZIP_OUTPUT="${PROJECT_ROOT}/download/dashboard-backup-$(date +%Y%m%d-%H%M%S).zip"
BUNDLE_SRC="/home/z/my-project/upload/dashboard-git-bundle-20260719-200355.bundle"
BUNDLE_CLONE="/tmp/bundle-clone"

echo "==> [1/7] Limpando staging anterior..."
rm -rf "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo "==> [2/7] Garantindo que .git tem histórico completo..."
# .git já foi restaurado na primeira execução do script.
# Apenas verifica se está íntegro.
if [ ! -d "${PROJECT_ROOT}/.git" ]; then
  echo "ERRO: .git não encontrado. Restaure manualmente do bundle original."
  exit 1
fi
cd "${PROJECT_ROOT}"
git remote remove origin 2>/dev/null || true
echo "HEAD atual: $(git rev-parse --short HEAD)"

echo "==> [3/7] Criando novo bundle git com histórico completo..."
NEW_BUNDLE="${BACKUP_DIR}/dashboard-git-bundle.bundle"
git bundle create "${NEW_BUNDLE}" --all 2>&1 | tail -3
echo "Bundle criado: $(du -h "${NEW_BUNDLE}" | cut -f1)"

echo "==> [4/7] Criando tar.gz do código-fonte..."
SOURCE_TAR="${BACKUP_DIR}/dashboard-source.tar.gz"
tar -czf "${SOURCE_TAR}" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.git.sandbox-backup' \
  --exclude='scripts/backup-staging' \
  --exclude='scripts/*.png' \
  --exclude='scripts/keep-alive.sh' \
  --exclude='upload' \
  --exclude='download' \
  --exclude='skills' \
  --exclude='dev.log' \
  --exclude='db/*.db-journal' \
  -C "${PROJECT_ROOT}" \
  src public prisma scripts .env .gitignore package.json bun.lock tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs components.json eslint.config.mjs Caddyfile 2>&1 | tail -3 || true
echo "Source tar: $(du -h "${SOURCE_TAR}" | cut -f1)"

echo "==> [5/7] Copiando banco de dados SQLite..."
mkdir -p "${BACKUP_DIR}/db"
if [ -f "${PROJECT_ROOT}/db/custom.db" ]; then
  cp "${PROJECT_ROOT}/db/custom.db" "${BACKUP_DIR}/db/custom.db"
  echo "DB: $(du -h "${BACKUP_DIR}/db/custom.db" | cut -f1)"
else
  echo "AVISO: db/custom.db não encontrado — backup vai sem DB"
fi

echo "==> [6/7] Criando README de restauração..."
cat > "${BACKUP_DIR}/README.md" << 'READMEEOF'
# Backup completo — Dashboard Vida Pessoal + Social Media Manager

**Data de geração:** gerada automaticamente pelo script `create-backup.sh`
**Projeto:** Dashboard pessoal + Social Media Manager (Next.js 16 + React 19 + TypeScript)
**Commit HEAD:** consulte `git log` após restaurar pelo bundle

---

## Conteúdo deste ZIP

| Arquivo | Descrição |
|---|---|
| `README.md` | Este arquivo. Instruções de restauração. |
| `dashboard-source.tar.gz` | Código-fonte completo (sem node_modules, sem .next, sem .git). |
| `dashboard-git-bundle.bundle` | Bundle git com TODO o histórico de commits. Pode ser restaurado como repositório git completo. |
| `db/custom.db` | Banco SQLite (Prisma) com schema criado. Opcional — o app cria automaticamente se não existir. |

## ⚠️ Importante — Backups incrementais

Cada vez que você roda `create-backup.sh`, um novo ZIP é gerado com timestamp no nome.
**Cada ZIP é completo e autossuficiente** — você NÃO precisa do ZIP anterior para restaurar.
Pode deletar ZIPs antigos e ficar só com o mais recente.

## Stack técnica
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Linguagem:** TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui (New York style) + Lucide icons
- **Editor rich-text:** Tiptap 3
- **Persistência:** localStorage (frontend) + Prisma/SQLite (backend, opcional)
- **DnD:** nativo HTML5 + @dnd-kit
- **Auth:** NextAuth.js v4 (disponível, não usado ativamente)
- **State:** Zustand + TanStack Query
- **Package manager:** Bun (recomendado) ou npm/yarn

## Como restaurar

### Opção A — Restaurar código + histórico git completo (recomendado)

```bash
# 1. Clonar do bundle (preserva TODO o histórico de commits)
git clone dashboard-git-bundle.bundle /caminho/destino/dashboard
cd /caminho/destino/dashboard

# 2. (Opcional) Sobrescrever source com a versão mais recente do tar
#    se houver diferenças entre bundle e tar:
tar -xzf ../dashboard-source.tar.gz -C /caminho/destino/dashboard

# 3. Restaurar banco SQLite (opcional — o app cria automaticamente)
mkdir -p db
cp ../db/custom.db db/ 2>/dev/null || true

# 4. Instalar dependências
bun install   # ou: npm install / yarn install

# 5. Gerar Prisma Client + criar banco se não existir
bun run db:generate
bun run db:push

# 6. Rodar em modo desenvolvimento
bun run dev
# App disponível em http://localhost:3000
```

### Opção B — Restaurar apenas o código (sem histórico git)

```bash
mkdir /caminho/destino/dashboard
tar -xzf dashboard-source.tar.gz -C /caminho/destino/dashboard
cd /caminho/destino/dashboard
bun install
bun run db:generate && bun run db:push
bun run dev
```

### Opção C — Restaurar em projeto já existente

```bash
cd /caminho/do/projeto/existente

# Backup do estado atual
git stash  # ou: git commit -am "backup antes de restaurar"

# Extrair por cima
tar -xzf dashboard-source.tar.gz -C .

# Reinstalar dependências (caso tenham mudado)
bun install

# Commitar restauração
git add -A
git commit -m "restore from backup"
```

## Funcionalidades do projeto

### Dashboard principal
- 2 seções: **Negócios** + **Vida Pessoal**
- CRUD de páginas com upload de imagem (comprimida via canvas)
- Drag-and-drop de cards entre seções (HTML5 nativo)
- Calendário de tarefas mensal com recorrência e categorias
- Seção de Backup (exportar/importar/resetar dados via JSON)

### Social Media Manager (8 menus)
1. 🎯 **Prospectação** — Funil kanban + lista de contatos + bloco de anotações
2. 👥 **CRM equipe** — tabela de membros com cargo, função, email, WhatsApp, aniversário, contrato, valor
3. 🤝 **CRM clientes** — 7 tabs no detalhe (Perfil, Etapas, Planejamento, Calendário, IG, IN, YT)
4. 💰 **Financeiro** — lista de clientes (legacy)
5. 👋 **Offboarding** — lista de clientes (legacy)
6. 🔗 **Links** — lista de clientes (legacy)
7. 🚀 **Futuro** — lista de clientes (legacy)
8. 📋 **Banco de Headline** — biblioteca de headlines com drag-and-drop, favoritos, filtros

### CRM Clientes (detalhe)
- **Perfil** — campos editáveis inline + DateInput com máscara dd/mm/aaaa
- **Etapas** — 10 stages padrão + adicionar/remover/renomear/reordenar + anexos
- **Planejamento** — 27 cards (Briefing, Tom de voz, Monetização, etc.)
  - **Briefing** — 18 seções internas com rich-text editor
  - **Tom de voz** — 6 seções internas (Vocabulário, Agressividade, Sarcasmo, Formalidade, Humor, Emojis)
- **Calendário** — visão mensal com posts agendados
- **Instagram/LinkedIn/YouTube** — CRUD de posts
- Customização de cores de status (🎨 dialog)

### Editor rich-text (Tiptap)
- Toolbar completa: negrito, itálico, sublinhado, riscado, H1-H3, listas, citação, código, alinhamento, cor do texto, fonte, link, imagem (upload com compressão)
- Anexos por seção (PDFs, documentos, imagens — máx 5MB)

### Banco de Headline
- 10 headlines padrão + 8 categorias
- Drag-and-drop para reordenar
- Favoritos (estrela) + copiar para área de transferência
- Busca + filtros por categoria

## Variáveis de ambiente

O arquivo `.env` contém:
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Ao restaurar em outro local, ajuste o caminho do `DATABASE_URL` para refletir o novo diretório do projeto.

## Notas importantes

- **localStorage é a fonte de verdade do frontend** — todo o estado do dashboard (cards, tarefas, clientes, posts, headlines) é salvo no localStorage do navegador. O Prisma/SQLite está configurado mas só é usado se você implementar rotas API que o utilizem.
- **Backup/Restore dentro do app** — a seção 💾 Backup & Restauração no rodapé do dashboard permite exportar todo o estado localStorage como JSON e importar de volta. Use isto para migrar dados entre máquinas/dispositivos.
- **Modo escuro/claro** — botão de toggle no canto superior direito do TopBar. Ambos os modos foram validados para contraste WCAG-AA.
- **PWA** — manifest.webmanifest em `public/` permite instalar como app no celular/desktop.
READMEEOF

echo "==> [7/7] Compactando tudo em ZIP único..."
cd "${BACKUP_DIR}"
zip -r -q "${ZIP_OUTPUT}" . 
echo ""
echo "=================================================="
echo "BACKUP CRIADO COM SUCESSO!"
echo "=================================================="
echo "Arquivo: ${ZIP_OUTPUT}"
echo "Tamanho: $(du -h "${ZIP_OUTPUT}" | cut -f1)"
echo ""
echo "Conteúdo do ZIP:"
unzip -l "${ZIP_OUTPUT}" | tail -10
echo ""
echo "Limpeza staging..."
rm -rf "${BACKUP_DIR}"
echo "Concluído."
