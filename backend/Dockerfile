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

# flask db upgrade runs first so a new migration reaches the database before
# gunicorn starts serving requests against it.
CMD flask db upgrade && gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
