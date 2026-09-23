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

# Migrations run via Render's preDeployCommand (see render.yaml), once per
# deploy — not here. Running "flask db upgrade" on every container boot
# meant every free-tier cold start (after an idle spin-down) paid for a
# second full Python/Flask/DB-connect cycle before gunicorn could even
# start accepting requests, which is most of why logins felt slow for
# anyone hitting a sleeping instance.
CMD gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
