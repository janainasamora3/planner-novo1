#!/bin/bash
# Backup LEAN do projeto Dashboard
# Inclui: código-fonte atual (com card de livros completo) + README
# Saída: ZIP enxuto em /home/z/my-project/download/

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
BACKUP_DIR="${PROJECT_ROOT}/scripts/backup-staging"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_OUTPUT="${PROJECT_ROOT}/download/dashboard-backup-${TIMESTAMP}.zip"

echo "==> [1/5] Limpando staging..."
rm -rf "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo "==> [2/5] Copiando código-fonte..."
mkdir -p "${BACKUP_DIR}/source"
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
  ./ "${BACKUP_DIR}/source/"
echo "Source copiado: $(du -sh "${BACKUP_DIR}/source" | cut -f1)"

echo "==> [3/5] Criando README..."
cat > "${BACKUP_DIR}/README.md" << 'READMEEOF'
# Backup — Dashboard Pessoal + Social Media Manager

## Conteúdo deste ZIP

| Arquivo | Descrição |
|---|---|
| `README.md` | Este arquivo. |
| `source/` | Código-fonte completo (sem node_modules, sem .git). Inclui card de **Livros** (acervo + agenda calendário + upload de capa). |

## Card de Livros incluso ✅

- `source/src/components/dashboard/books-manager.tsx` — UI completa (acervo + agenda calendário + upload de capa + sortear)
- `source/src/hooks/use-books.ts` — Hook com persistência em localStorage
- `source/src/lib/books.ts` — Tipos, status, formatos, helpers (streak, tag stats), defaults
- `source/src/app/page.tsx` — Já importa BooksManager e abre quando clica no card "Livros"
- `source/src/lib/pages.ts` — Card "Livros" marcado com `special: "books"`
- `source/src/hooks/use-pages.ts` — Migração automática: marca card "Livros" existente com `special: "books"`

## Stack técnica

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Linguagem:** TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui
- **Persistência:** localStorage (frontend)
- **Deploy:** Netlify

## Como restaurar

```bash
# 1. Criar pasta de destino
mkdir /caminho/destino/dashboard
cd /caminho/destino/dashboard

# 2. Descompactar
unzip ../dashboard-backup-YYYYMMDD-HHMMSS.zip
mv source/* .
mv source/.* . 2>/dev/null || true
rm -rf source

# 3. Instalar dependências
npm install --legacy-peer-deps

# 4. Rodar
npm run dev
# App em http://localhost:3000
```

## Funcionalidades do módulo de Livros

### 📚 Acervo (tab 1)
- Grid de capas (upload de imagem do dispositivo ou URL)
- 5 status: Quero Ler, Lendo, Lido, Pausado, Abandonei
- Avaliação por estrelas (0-5)
- Formato: Físico, E-book, Audiobook
- Tags/gêneros com estatísticas
- 🎲 Sortear próximo livro (com animação de roleta)
- 🔥 Streak de leitura diária
- Filtro por status + busca por título/autor

### 📅 Agenda (tab 2)
- Calendário mensal com capas dos livros lidos por dia
- Navegação entre meses (anterior / próximo / hoje)
- Detalhe do dia selecionado com capas maiores
- Mini resumo "hoje: X págs"
- Capas maiores nas células (80×56px)
- Livros em leitura + input para registrar páginas do dia
- Botão "✓ Terminei!" quando atinge o total de páginas

## Backup dentro do app

A seção 💾 Backup & Restauração no rodapé do dashboard permite exportar TODO o estado localStorage como JSON (incluindo `dashboard.books.v1`) e importar de volta.
READMEEOF

echo "==> [4/5] Compactando..."
cd "${BACKUP_DIR}"
zip -r -q "${ZIP_OUTPUT}" .
echo "ZIP: $(du -h "${ZIP_OUTPUT}" | cut -f1)"

echo "==> [5/5] Verificando arquivos de livros no ZIP..."
unzip -l "${ZIP_OUTPUT}" | grep -E "books" | head -10

echo ""
echo "=================================================="
echo "BACKUP CRIADO!"
echo "=================================================="
echo "Arquivo: ${ZIP_OUTPUT}"
echo "Tamanho: $(du -h "${ZIP_OUTPUT}" | cut -f1)"
rm -rf "${BACKUP_DIR}"
echo "Concluído."
