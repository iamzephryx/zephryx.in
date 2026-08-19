#!/usr/bin/env bash
# Pulls the two faces banner.html needs. Run from this directory.
set -euo pipefail
cd "$(dirname "$0")"
curl -fsSL -o Anton.ttf \
  "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf"
curl -fsSL -o JetBrainsMono-Regular.ttf \
  "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8-qxjPQ.ttf"
curl -fsSL -o JetBrainsMono-Bold.ttf \
  "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf"
echo "fonts ready"
