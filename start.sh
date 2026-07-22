#!/usr/bin/env bash
set -euo pipefail

# Git Bash does not always include its Unix tools before Miniforge is initialized.
export PATH="/usr/bin:/bin:$PATH"
source "/c/Users/SSAFY/miniforge3/etc/profile.d/conda.sh"
conda activate firstin-wireframe

PORT="${PORT:-4173}"
echo "FIRSTIN UI: http://127.0.0.1:${PORT}"
python -m http.server "$PORT" --bind 127.0.0.1
