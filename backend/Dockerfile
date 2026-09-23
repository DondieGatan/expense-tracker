FROM python:3.12-slim-bookworm

# Render's native Python runtime has no apt access, hence still building via
# Docker even though production no longer needs the ODBC driver stack that
# used to live here (SQL Server support was dropped when production moved
# to Postgres — psycopg[binary] bundles its own libpq, no system package
# needed).

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP="run.py"

# Migrations run inside create_app() itself (see app/__init__.py) rather
# than as a separate "flask db upgrade" step here — Render's free tier
# doesn't support a Pre-Deploy Command, and a separate step before this
# CMD would mean every cold start pays for a second full Python/Flask/
# DB-connect cycle before gunicorn can even start accepting requests.
CMD gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
