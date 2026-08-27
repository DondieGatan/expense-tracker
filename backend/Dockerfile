FROM python:3.12-slim-bookworm

# msodbcsql18 requires unixodbc for pyodbc's driver manager. This is why
# Render's native Python runtime won't work here — it has no apt access —
# but a Dockerfile does. Pinned to bookworm (Debian 12): Microsoft only
# publishes this repo for specific Debian releases, and newer slim images
# have moved to trixie, which also dropped apt-key (so we use Microsoft's
# packages-microsoft-prod.deb installer instead of apt-key).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unixodbc \
    && curl -sSL -O https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV SQL_DRIVER="ODBC Driver 18 for SQL Server"
ENV FLASK_APP="run.py"

# flask db upgrade runs first so a new migration reaches the database before
# gunicorn starts serving requests against it.
CMD flask db upgrade && gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
