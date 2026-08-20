#!/bin/bash
# Mantém o dev server vivo — reinicia se cair
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting dev server..." >> dev.log
  npx next dev --turbopack --port 3000 >> dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> dev.log
  sleep 2
done
