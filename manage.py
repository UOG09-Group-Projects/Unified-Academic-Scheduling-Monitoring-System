#!/usr/bin/env python3
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
BACKEND_MANAGE = BACKEND_DIR / "manage.py"

if not BACKEND_MANAGE.exists():
    raise SystemExit("Backend manage.py not found at " + str(BACKEND_MANAGE))


def resolve_python_executable():
    candidates = [
        BACKEND_DIR / "env" / "Scripts" / "python.exe",
        BACKEND_DIR / "env" / "bin" / "python",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return sys.executable


if __name__ == "__main__":
    os.chdir(BACKEND_DIR)
    python_executable = resolve_python_executable()
    command = [python_executable, str(BACKEND_MANAGE), *sys.argv[1:]]
    raise SystemExit(subprocess.call(command))
