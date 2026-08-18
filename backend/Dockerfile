FROM python:3.12-slim

# msodbcsql18 requires curl/gnupg to add Microsoft's apt repo, and unixodbc
# for pyodbc's driver manager. This is why Render's native Python runtime
# won't work here — it has no apt access — but a Dockerfile does.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg unixodbc \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV SQL_DRIVER="ODBC Driver 18 for SQL Server"

CMD gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
