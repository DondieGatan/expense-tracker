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
    public async Task<IActionResult> Index(string? category)
    {
        var query = _context.Expenses.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);

        ViewBag.Categories = ExpenseCategories.All;
        ViewBag.SelectedCategory = category;

        var expenses = await query.OrderByDescending(e => e.Date).ThenByDescending(e => e.Id).ToListAsync();
        return View(expenses);
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
        };

        return View(vm);
    }
}
