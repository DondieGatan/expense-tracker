# Expense Tracker

[![CI](https://github.com/DondieGatan/expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/DondieGatan/expense-tracker/actions/workflows/ci.yml)

A personal expense tracker built in C# — ASP.NET Core MVC, Entity Framework
Core, and SQL Server — with budget tracking, real charts, and CSV export on
top of full CRUD.

## Features

- **Log expenses** — description, amount, category, date, and payment
  method, with server-side validation
- **Edit / delete** any logged expense
- **Search and filter** the expense list by description, category, and date
  range, in any combination
- **Monthly budget** — set a spending limit and track it with a live
  progress bar that flags when you're close to or over budget
- **Dashboard** — total spent, this month's total, expense count, a
  category-breakdown donut chart, and a 6-month spending trend chart
  (Chart.js)
- **CSV export** of the expense list, respecting whatever filters are
  currently applied

## Data model

An `Expense` entity (`Id`, `Description`, `Amount`, `Category`, `Date`,
`PaymentMethod`, `Notes`) and a single-row `Budget` entity (`MonthlyLimit`),
managed through EF Core Code-First migrations against SQL Server.

## Run it

Requires the .NET 8 SDK and a reachable SQL Server instance (defaults to
`localhost\SQLEXPRESS` with Windows/trusted authentication — edit
`appsettings.json` → `ConnectionStrings:DefaultConnection` to point
elsewhere).

```bash
dotnet run
```

Then open `http://localhost:5100` (or whatever port `dotnet run` reports).
The database and schema are created automatically on startup via
`Database.Migrate()` in `Program.cs` — no separate `dotnet ef` step needed.

## Tests

```bash
dotnet test ExpenseTracker.Tests/ExpenseTracker.Tests.csproj
```

The test suite covers controller CRUD, category/search/date filtering,
budget calculations, and CSV export, using EF Core's in-memory provider so
no database connection is required to run it. CI runs the same command on
every push via GitHub Actions.

## Stack

C# · ASP.NET Core MVC · Entity Framework Core · SQL Server · Razor views ·
Chart.js · xUnit
