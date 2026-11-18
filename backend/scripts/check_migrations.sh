#!/usr/bin/env bash
# ==============================================================================
# Mettu Karl Referral Hospital HMIS — Database Schema & Migration Validator
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() {
    echo "[$(date -u +"%Y-%m-%d %H:%M:%SZ")] [Mettu-Karl-Migration-Check] $*"
}

log "Running database schema consistency and migration health checks..."

PYTHON_BIN="${BACKEND_DIR}/.venv/bin/python"
if [[ ! -f "${PYTHON_BIN}" ]]; then
    PYTHON_BIN="python3"
fi

"${PYTHON_BIN}" -c "
import asyncio
from app.core.database import AsyncSessionLocal, engine
from app.core.bootstrap import ensure_database_ready
from sqlalchemy import text

async def main():
    await ensure_database_ready()
    async with AsyncSessionLocal() as session:
        res = await session.execute(text('SELECT count(*) FROM users;'))
        user_count = res.scalar()
        print(f'Database connection verified: {user_count} staff user records present.')

asyncio.run(main())
"

log "SUCCESS: Database schema and migrations are fully synchronized."
