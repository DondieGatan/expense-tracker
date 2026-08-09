# Expense Tracker

A personal expense tracker built as a full CRUD demonstration in C# —
ASP.NET Core MVC, Entity Framework Core, and SQL Server.

## Features

- **Log expenses** — description, amount, category, date, and payment
  method, with server-side validation
- **Edit / delete** any logged expense
- **Filter** the expense list by category
- **Dashboard** — total spent, this month's total, expense count, the 5
  most recent expenses, and a spend-by-category breakdown with
  proportional bars

## Data model

A single `Expense` entity (`Id`, `Description`, `Amount`, `Category`,
`Date`, `PaymentMethod`, `Notes`), managed through EF Core Code-First
migrations against SQL Server.

## Run it

Requires the .NET 8 SDK and a reachable SQL Server instance (defaults to
`localhost\SQLEXPRESS` with Windows/trusted authentication — edit
`appsettings.json` → `ConnectionStrings:DefaultConnection` to point
elsewhere).

```bash
dotnet ef database update   # creates the database from migrations
dotnet run
```

Then open `http://localhost:5100` (or whatever port `dotnet run` reports).
The database and schema are also created automatically on startup via
`Database.Migrate()` in `Program.cs`, so the `dotnet ef` step is optional.

## Stack

C# · ASP.NET Core MVC · Entity Framework Core · SQL Server · Razor views
