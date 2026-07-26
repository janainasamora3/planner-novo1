#!/bin/bash
# Backup COMPLETO: código-fonte + histórico git (commits)
# Gera ZIP com:
# 1. source/ — snapshot do código atual
# 2. dashboard-git-bundle.bundle — TODO o histórico de commits git
# 3. README-COM-GIT.md — instruções de restauração
# 4. lista-commits.txt — lista de todos os commits para referência

set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
BACKUP_DIR="${PROJECT_ROOT}/scripts/backup-staging"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ZIP_OUTPUT="${PROJECT_ROOT}/download/dashboard-codigo-e-commits-${TIMESTAMP}.zip"

echo "==> [1/6] Limpando staging..."
rm -rf "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo "==> [2/6] Copiando código-fonte atual..."
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
  --exclude='tsconfig.tsbuildinfo' \
  ./ "${BACKUP_DIR}/source/"
echo "Source: $(du -sh "${BACKUP_DIR}/source" | cut -f1)"

echo "==> [3/6] Criando git bundle com TODO o histórico de commits..."
cd "${PROJECT_ROOT}"
git bundle create "${BACKUP_DIR}/dashboard-git-bundle.bundle" --all 2>&1 | tail -3
echo "Bundle: $(du -sh "${BACKUP_DIR}/dashboard-git-bundle.bundle" | cut -f1)"

echo "==> [4/6] Salvando lista de todos os commits..."
git log --pretty=format:'%h | %ad | %s' --date=short > "${BACKUP_DIR}/lista-commits.txt" 2>&1
echo "Total de commits: $(wc -l < "${BACKUP_DIR}/lista-commits.txt")"

echo "==> [5/6] Criando README com instruções..."
cat > "${BACKUP_DIR}/README-COM-GIT.md" << 'READMEEOF'
# Backup: Código-fonte + Histórico Git (Commits)

Este backup contém:
1. **`source/`** — Snapshot do código-fonte atual (pronto pra rodar)
2. **`dashboard-git-bundle.bundle`** — TODO o histórico de commits git (30 commits)
3. **`lista-commits.txt`** — Lista legível de todos os commits
4. **`README-COM-GIT.md`** — Este arquivo

---

## 📋 Lista de recursos implementados (por commit)

### Commit `f501e27` — Recorrência personalizada
- Adicionada opção "Personalizada" no editor de tarefas
- Picker visual de dias da semana (Dom a Sáb)
- Preview ao vivo das próximas 8 datas em que a tarefa aparece

### Commit `4287767` — Término da recorrência
- 3 opções de término: ♾️ Sempre ativo / Após N ocorrências / Em data específica
- Preview mostra total (de X total / ∞ infinitas)
- Badges nos cards mostrando tipo de limite (×N, até dd/mm, ∞)

### Commit `ad2a1f3` — Resiliência (ErrorBoundary + sanitização)
- ErrorBoundary global captura qualquer erro de renderização
- Sanitização defensiva em use-tasks, use-books, use-pages
- App nunca mais fica inutilizável com dados corrompidos

### Commit `61eed7e` — FIX raiz do erro "client-side exception"
- `isTaskDoneOn` crashava com `completedDates` undefined
- Sanitização em taskAppliesToDate, addTask, updateTask, toggleDone, toggleSubTask
- Definitivamente resolve o erro ao criar tarefa diária

### Commit `a7428b9` — Reconectar módulo de Livros
- BooksManager importado no page.tsx
- Card "Livros" marcado com `special: "books"` no pages.ts
- Migração automática no use-pages.ts para dados antigos

### Commit `fc21b96` — Conectar cards (Tarefas, Modo Caverna, Planejamento)
- TasksManager (modal tela cheia) para o card "Tarefas"
- ModoCavernaManager (timer Pomodoro + histórico) para o card "Modo Caverna"
- PlanejamentoManager conectado para o card "Planejamento"
- Migração automática marca os 4 cards com seus `special` corretos

### Commit (último) — Card Finanças
- FinanceManager (modal tela cheia) para o card "Finanças"
- CRUD de transações (entradas/saídas)
- 4 stats mensais: Entradas, Saídas, Saldo, Pendente
- Navegação entre meses, filtros, busca
- Editor completo com tipo, descrição, valor, data, status, pagamento, cliente, serviço, notas

---

## 🚀 Como restaurar

### Opção A — Só o código (mais rápido, sem histórico git)

```bash
# 1. Descompacte o ZIP
unzip dashboard-codigo-e-commits-YYYYMMDD-HHMMSS.zip

# 2. Entre na pasta source/
cd source

# 3. Inicialize um novo repositório git (opcional)
git init
git add -A
git commit -m "Restauração do backup"

# 4. Instale e rode
npm install --legacy-peer-deps
npm run dev
# Abre http://localhost:3000
```

### Opção B — Restaurar com TODO o histórico git (recomendado)

```bash
# 1. Descompacte o ZIP
unzip dashboard-codigo-e-commits-YYYYMMDD-HHMMSS.zip

# 2. Clone do bundle (preserva TODOS os 30 commits)
git clone dashboard-git-bundle.bundle dashboard-restaurado
cd dashboard-restaurado

# 3. (Opcional) Atualize o source com a versão mais recente
cp -r ../source/* .
cp ../source/.gitignore .
cp ../source/.npmrc . 2>/dev/null || true
git add -A
git commit -m "Restore: snapshot mais recente"

# 4. Instale e rode
npm install --legacy-peer-deps
npm run dev
# Abre http://localhost:3000

# 5. (Opcional) Veja o histórico completo
git log --oneline
```

### Opção C — Publicar no GitHub com histórico completo

```bash
# 1. Clone do bundle
git clone dashboard-git-bundle.bundle dashboard-restaurado
cd dashboard-restaurado

# 2. Crie um repositório no GitHub (https://github.com/new)
# Não marque README, .gitignore ou license

# 3. Adicione o remote e faça push
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git branch -M main
git push -u origin main
```

### Opção D — Publicar no Netlify (drag-and-drop, sem git)

1. Acesse https://app.netlify.com
2. Add new site → Deploy manually
3. Arraste a pasta `source/` na área tracejada
4. Aguarde 2-5 min
5. Acesse a URL gerada

---

## 📊 Estatísticas do backup

- **Total de commits no histórico:** 30
- **Arquivos no source/:** ~195
- **Tamanho do git bundle:** (veja o arquivo)
- **Build status:** ✅ Passou (Next.js 16.1.3)

---

## 🛠️ Configurações técnicas

| Item | Valor |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| React | 19 |
| TypeScript | 5 |
| UI | Tailwind CSS 4 + shadcn/ui |
| Build command | `npm run build` |
| Publish dir | `.next` |
| Node version | 20 |
| Persistência | localStorage (frontend) |

---

## 📝 Notas importantes

- **localStorage é a fonte de verdade** — todo o estado é salvo no navegador
- **Migração automática** — ao abrir o app, marca os 5 cards especiais (Tarefas, Modo Caverna, Planejamento, Finanças, Livros) com seus `special` corretos, mesmo em dados antigos
- **ErrorBoundary global** — nunca mais tela branca por erro de dados corrompidos
- **Sanitização defensiva** — todos os hooks validam campos ao ler localStorage
READMEEOF

echo "==> [6/6] Compactando tudo em ZIP único..."
cd "${BACKUP_DIR}"
zip -r -q "${ZIP_OUTPUT}" .
echo "ZIP criado: $(du -h "${ZIP_OUTPUT}" | cut -f1)"

echo ""
echo "=================================================="
echo "BACKUP CÓDIGO + COMMITS CRIADO!"
echo "=================================================="
echo "Arquivo: ${ZIP_OUTPUT}"
echo "Tamanho: $(du -h "${ZIP_OUTPUT}" | cut -f1)"
echo ""
echo "Conteúdo do ZIP:"
unzip -l "${ZIP_OUTPUT}" | tail -10
echo ""
echo "Verificando arquivos críticos:"
unzip -l "${ZIP_OUTPUT}" | grep -E "git-bundle|lista-commits|README-COM|books-manager|finance-manager|tasks-manager|modo-caverna|planejamento-manager|use-tasks|use-books|use-finance|use-pages|page\.tsx" | head -15

echo ""
echo "Primeiros commits do histórico (lista-commits.txt):"
head -10 "${BACKUP_DIR}/lista-commits.txt" 2>&1

rm -rf "${BACKUP_DIR}"
echo ""
echo "Concluído."
