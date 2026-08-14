using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Data;
using ExpenseTracker.Models;

namespace ExpenseTracker.Controllers;

public class ExpensesController : Controller
{
    private readonly ApplicationDbContext _context;

    public ExpensesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: /Expenses
    public async Task<IActionResult> Index(string? category, string? q, DateTime? from, DateTime? to)
    {
        var query = ApplyFilters(_context.Expenses.AsQueryable(), category, q, from, to);

        ViewBag.Categories = ExpenseCategories.All;
        ViewBag.SelectedCategory = category;
        ViewBag.Search = q;
        ViewBag.From = from?.ToString("yyyy-MM-dd");
        ViewBag.To = to?.ToString("yyyy-MM-dd");

        var expenses = await query.OrderByDescending(e => e.Date).ThenByDescending(e => e.Id).ToListAsync();
        return View(expenses);
    }

    private static IQueryable<Expense> ApplyFilters(IQueryable<Expense> query, string? category, string? q, DateTime? from, DateTime? to)
    {
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(e => e.Description.Contains(q));
        if (from.HasValue)
            query = query.Where(e => e.Date >= from.Value);
        if (to.HasValue)
            query = query.Where(e => e.Date <= to.Value);
        return query;
    }

    // GET: /Expenses/Export
    public async Task<IActionResult> Export(string? category, string? q, DateTime? from, DateTime? to)
    {
        var expenses = await ApplyFilters(_context.Expenses.AsQueryable(), category, q, from, to)
            .OrderByDescending(e => e.Date).ThenByDescending(e => e.Id)
            .ToListAsync();

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Description,Amount,Category,Date,PaymentMethod,Notes");
        foreach (var e in expenses)
        {
            sb.AppendLine(string.Join(",",
                CsvField(e.Description),
                e.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture),
                CsvField(e.Category),
                e.Date.ToString("yyyy-MM-dd"),
                CsvField(e.PaymentMethod),
                CsvField(e.Notes ?? "")));
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"expenses-{DateTime.Today:yyyy-MM-dd}.csv");
    }

    private static string CsvField(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        return value;
    }

    // GET: /Expenses/Create
    public IActionResult Create()
    {
        ViewBag.Categories = ExpenseCategories.All;
        ViewBag.PaymentMethods = PaymentMethods.All;
        return View(new Expense { Date = DateTime.Today });
    }

    // POST: /Expenses/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("Description,Amount,Category,Date,PaymentMethod,Notes")] Expense expense)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.Categories = ExpenseCategories.All;
            ViewBag.PaymentMethods = PaymentMethods.All;
            return View(expense);
        }

        _context.Add(expense);
        await _context.SaveChangesAsync();
        TempData["Message"] = "Expense added.";
        return RedirectToAction(nameof(Index));
    }

    // GET: /Expenses/Edit/5
    public async Task<IActionResult> Edit(int? id)
    {
        if (id is null) return NotFound();
        var expense = await _context.Expenses.FindAsync(id);
        if (expense is null) return NotFound();

        ViewBag.Categories = ExpenseCategories.All;
        ViewBag.PaymentMethods = PaymentMethods.All;
        return View(expense);
    }

    // POST: /Expenses/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Description,Amount,Category,Date,PaymentMethod,Notes")] Expense expense)
    {
        if (id != expense.Id) return NotFound();

        if (!ModelState.IsValid)
        {
            ViewBag.Categories = ExpenseCategories.All;
            ViewBag.PaymentMethods = PaymentMethods.All;
            return View(expense);
        }

        _context.Update(expense);
        await _context.SaveChangesAsync();
        TempData["Message"] = "Expense updated.";
        return RedirectToAction(nameof(Index));
    }

    // GET: /Expenses/Delete/5
    public async Task<IActionResult> Delete(int? id)
    {
        if (id is null) return NotFound();
        var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id);
        if (expense is null) return NotFound();
        return View(expense);
    }

    // POST: /Expenses/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense is not null)
        {
            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();
            TempData["Message"] = "Expense deleted.";
        }
        return RedirectToAction(nameof(Index));
    }

    // GET: /Expenses/Dashboard
    public async Task<IActionResult> Dashboard()
    {
        var all = await _context.Expenses.ToListAsync();
        var startOfMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var budget = await _context.Budgets.FirstOrDefaultAsync();

        var trendStart = startOfMonth.AddMonths(-5);
        var monthlyTrend = Enumerable.Range(0, 6)
            .Select(i => trendStart.AddMonths(i))
            .Select(month => new MonthTotal
            {
                Label = month.ToString("MMM"),
                Total = all.Where(e => e.Date.Year == month.Year && e.Date.Month == month.Month).Sum(e => e.Amount),
            })
            .ToList();

        var vm = new DashboardViewModel
        {
            TotalSpent = all.Sum(e => e.Amount),
            ThisMonthTotal = all.Where(e => e.Date >= startOfMonth).Sum(e => e.Amount),
            ExpenseCount = all.Count,
            ByCategory = all
                .GroupBy(e => e.Category)
                .Select(g => new CategoryTotal { Category = g.Key, Total = g.Sum(e => e.Amount) })
                .OrderByDescending(c => c.Total)
                .ToList(),
            RecentExpenses = all.OrderByDescending(e => e.Date).ThenByDescending(e => e.Id).Take(5).ToList(),
            MonthlyTrend = monthlyTrend,
            BudgetLimit = budget?.MonthlyLimit,
        };

        return View(vm);
    }

    // GET: /Expenses/Budget
    public async Task<IActionResult> Budget()
    {
        var budget = await _context.Budgets.FirstOrDefaultAsync();
        return View(budget ?? new Budget());
    }

    // POST: /Expenses/Budget
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Budget([Bind("Id,MonthlyLimit")] Budget budget)
    {
        if (!ModelState.IsValid)
        {
            return View(budget);
        }

        var existing = await _context.Budgets.FirstOrDefaultAsync();
        if (existing is null)
        {
            _context.Budgets.Add(new Budget { MonthlyLimit = budget.MonthlyLimit });
        }
        else
        {
            existing.MonthlyLimit = budget.MonthlyLimit;
        }

        await _context.SaveChangesAsync();
        TempData["Message"] = "Budget updated.";
        return RedirectToAction(nameof(Dashboard));
    }
}
