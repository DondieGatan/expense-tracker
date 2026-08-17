# Expense Tracker

[![CI](https://github.com/DondieGatan/expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/DondieGatan/expense-tracker/actions/workflows/ci.yml)

A personal expense tracker: a **Flask** REST API backend (Python, SQLAlchemy,
SQL Server) with a **React Native** (Expo) mobile app frontend, with budget
tracking, dashboard charts, and CSV export on top of full CRUD.

## Features

- **Accounts** — register/login with JWT-based auth; every user only ever
  sees their own data
- **Log expenses** — description, amount, category, date, and payment
  method, with server-side validation
- **Edit / delete** any logged expense
- **Search and filter** the expense list by description, category, and date
  range, in any combination
- **Monthly budget** — set a spending limit and track it against the
  current month's spending
- **Dashboard** — total spent, this month's total, expense count, a
  category-breakdown donut chart, and a 6-month spending trend chart
- **CSV export** of the expense list, respecting whatever filters are
  currently applied

## Project layout

```
backend/    Flask REST API (SQLAlchemy models, JWT auth, blueprints per resource)
mobile/     React Native (Expo) app that consumes the API
```

## Data model

A `User` (`id`, `fullName`, `email`, `passwordHash`), an `Expense`
(`id`, `userId`, `description`, `amount`, `category`, `date`,
`paymentMethod`, `notes`), and a per-user `Budget` (`id`, `userId`,
`monthlyLimit`) — managed through Flask-Migrate/Alembic migrations against
SQL Server.

## Run the backend

Requires Python 3 and a reachable SQL Server instance (defaults to
`localhost\SQLEXPRESS` with Windows/trusted authentication — override via
`SQL_SERVER`/`SQL_DATABASE`/`SQL_DRIVER`/`SQL_USERNAME`/`SQL_PASSWORD`
environment variables).

```bash
cd backend
python -m venv venv
venv/Scripts/activate       # or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
flask db upgrade            # apply migrations
python run.py                # serves on http://localhost:5100
```

## Run the mobile app

Requires Node.js.

```bash
cd mobile
npm install
npx expo start --web         # or --android / --ios
```

The app talks to the API at `http://localhost:5100/api` by default (see
`mobile/src/api/client.ts`).

## Tests

```bash
cd backend
python -m pytest
```

The suite covers auth, CRUD, category/search/date filtering, budget
calculations, dashboard aggregation, CSV export, and cross-user data
isolation, using SQLite in-memory so no real database connection is
required to run it. CI runs the same command on every push via GitHub
Actions, alongside a TypeScript check for the mobile app.

## Stack

**Backend**: Python · Flask · SQLAlchemy · Flask-Migrate · Flask-JWT-Extended
· SQL Server (`pyodbc`) · pytest

**Mobile**: React Native · Expo · TypeScript · React Navigation ·
react-native-chart-kit
