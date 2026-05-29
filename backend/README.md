# FitTrack Backend (Flask)

## Requisitos

- Python **3.11–3.14** (recomendado **3.12**)
- SQLAlchemy **≥ 2.0.49** (requerido para Python 3.14)

## Configuración local

```bash
cd backend
python -m venv .venv

# Git Bash
source .venv/Scripts/activate

# PowerShell
# .\.venv\Scripts\Activate.ps1

python -m pip install -r requirements.txt
cp .env.example .env
```

## Validación

```bash
python -m pytest
python -m alembic upgrade head
python run.py
```

Health check: `GET http://localhost:5000/api/health`

## Notas

- Usa `python -m pip` / `python -m pytest` si `pip` o `pytest` no están en PATH.
- Con Python 3.14, no uses SQLAlchemy 2.0.23; el proyecto fija 2.0.50+.
