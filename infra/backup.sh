#!/usr/bin/env bash
#
# Backup da base de dados do Gubernajur.
#
# Porquê um script e não a linha solta do DEPLOY.md: se o pg_dump falhar a meio,
# o `| gzip > ficheiro` continua e grava um arquivo válido mas vazio. Sem uma
# verificação, isso passa por um backup bom durante semanas.
#
# Uso: infra/backup.sh [--hook-copia-externa]
#
# A cópia externa é intencionalmente um gancho: este script não sabe (e não deve
# saber) para onde vão os seus dados. Configure uma vez em /etc/gubernajur-backup-hook.sh
# e o script chama-o com o caminho do .sql.gz. Se não existir, segue sem cópia
# externa — mas então o backup só existe neste disco, e um backup num só disco
# não é backup.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINO="$RAIZ/infra/backup"
RETENCAO_DIAS="${BACKUP_RETENCAO_DIAS:-30}"
DATA="$(date +%F)"
ARQUIVO="$DESTINO/gubernajur-$DATA.sql.gz"

mkdir -p "$DESTINO"
chmod 700 "$DESTINO"

cd "$RAIZ"

# 1. Dump para ficheiro temporário — nada é escrito no destino até validar.
TMP="$(mktemp -d)/dump.sql"
trap 'rm -rf "$(dirname "$TMP")"' EXIT

echo "[$(date '+%F %T')] a extrair a base de dados…"
if ! docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml \
     exec -T db pg_dump -U gubernajur -d gubernajur --clean --if-exists --no-owner \
     > "$TMP" 2>/dev/null; then
  echo "[$(date '+%F %T')] FALHOU: pg_dump não conseguiu extrair. Nenhum backup foi escrito." >&2
  exit 1
fi

# 2. Validar antes de promover a ficheiro de backup. Um .sql de menos de 1 KB
#    significa que a extração não devolveu nada útil.
TAMANHO=$(wc -c < "$TMP")
if [ "$TAMANHO" -lt 1024 ]; then
  echo "[$(date '+%F %T')] FALHOU: dump com $TAMANHO bytes — demasiado pequeno para ser válido." >&2
  exit 1
fi

gzip -9 -c "$TMP" > "$ARQUIVO"
chmod 600 "$ARQUIVO"
rm -f "$TMP"

TAMANHO_GZ=$(du -h "$ARQUIVO" | cut -f1)
echo "[$(date '+%F %T')] OK: $ARQUIVO ($TAMANHO_GZ)"

# 3. Cópia externa, se estiver configurada.
GANCHO="/etc/gubernajur-backup-hook.sh"
if [ -x "$GANCHO" ]; then
  if "$GANCHO" "$ARQUIVO"; then
    echo "[$(date '+%F %T')] cópia externa concluída"
  else
    echo "[$(date '+%F %T')] AVISO: cópia externa falhou (o backup local está intacto)" >&2
  fi
else
  echo "[$(date '+%F %T')] nota: sem cópia externa (crie $GANCHO se quiser redundância)"
fi

# 4. O .env é o que permite reconstruir a stack. Sem ele, restaurar a base é
#    inútil. Vai para o mesmo directório, com permissões restritas.
if [ -f .env ]; then
  cp -p .env "$DESTINO/env-$DATA"
  chmod 600 "$DESTINO/env-$DATA"
  find "$DESTINO" -name "env-*" -mtime +"$RETENCAO_DIAS" -delete
fi

# 5. Limpeza dos antigos.
find "$DESTINO" -name "gubernajur-*.sql.gz" -mtime +"$RETENCAO_DIAS" -delete

RESTANTES=$(find "$DESTINO" -name "gubernajur-*.sql.gz" | wc -l)
echo "[$(date '+%F %T')] $RESTANTES backup(s) em $DESTINO (retenção: $RETENCAO_DIAS dias)"
