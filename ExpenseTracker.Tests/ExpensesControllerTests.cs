using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using ExpenseTracker.Controllers;
using ExpenseTracker.Data;
using ExpenseTracker.Models;

namespace ExpenseTracker.Tests;

public class ExpensesControllerTests
{
    private const string TestUserId = "test-user-id";

    private static ExpensesController CreateController(ApplicationDbContext db, string userId = TestUserId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "TestAuth")),
        };
        return new ExpensesController(db)
        {
            TempData = new TempDataDictionary(httpContext, new NoOpTempDataProvider()),
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    private static Expense MakeExpense(string description = "Groceries", decimal amount = 100m,
        string category = "Food", DateTime? date = null, string paymentMethod = "Cash", string userId = TestUserId)
        => new()
        {
            Description = description,
            Amount = amount,
            Category = category,
            Date = date ?? DateTime.Today,
            PaymentMethod = paymentMethod,
            UserId = userId,
        };

    [Fact]
    public async Task Index_WithNoFilters_ReturnsAllExpenses()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(MakeExpense("Groceries"), MakeExpense("Internet", category: "Utilities"));
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Index(null, null, null, null);

        var view = Assert.IsType<ViewResult>(result);
        var model = Assert.IsAssignableFrom<IEnumerable<Expense>>(view.Model);
        Assert.Equal(2, model.Count());
    }

    [Fact]
    public async Task Index_FiltersByCategory()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(MakeExpense("Groceries", category: "Food"), MakeExpense("Internet", category: "Utilities"));
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Index("Utilities", null, null, null);

        var view = Assert.IsType<ViewResult>(result);
        var model = Assert.IsAssignableFrom<IEnumerable<Expense>>(view.Model);
        Assert.Single(model);
        Assert.Equal("Internet", model.Single().Description);
    }

    [Fact]
    public async Task Index_FiltersBySearchText()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(MakeExpense("Weekly groceries"), MakeExpense("Internet bill", category: "Utilities"));
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Index(null, "grocer", null, null);

        var view = Assert.IsType<ViewResult>(result);
        var model = Assert.IsAssignableFrom<IEnumerable<Expense>>(view.Model);
        Assert.Single(model);
    }

    [Fact]
    public async Task Index_FiltersByDateRange()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(
            MakeExpense("Old", date: new DateTime(2026, 1, 1)),
            MakeExpense("Recent", date: new DateTime(2026, 8, 1)));
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Index(null, null, new DateTime(2026, 6, 1), null);

        var view = Assert.IsType<ViewResult>(result);
        var model = Assert.IsAssignableFrom<IEnumerable<Expense>>(view.Model);
        Assert.Single(model);
        Assert.Equal("Recent", model.Single().Description);
    }

    [Fact]
    public async Task Create_WithValidModel_AddsExpenseAndRedirects()
    {
        using var db = TestDbFactory.Create();
        var controller = CreateController(db);
        var expense = MakeExpense("New expense");

        var result = await controller.Create(expense);

        Assert.IsType<RedirectToActionResult>(result);
        Assert.Single(db.Expenses);
    }

    [Fact]
    public async Task Create_WithInvalidModel_ReturnsViewWithoutSaving()
    {
        using var db = TestDbFactory.Create();
        var controller = CreateController(db);
        var expense = MakeExpense("");
        controller.ModelState.AddModelError("Description", "Required");

        var result = await controller.Create(expense);

        Assert.IsType<ViewResult>(result);
        Assert.Empty(db.Expenses);
    }

    [Fact]
    public async Task Edit_UpdatesExistingExpense()
    {
        using var db = TestDbFactory.Create();
        var expense = MakeExpense("Original");
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        expense.Description = "Updated";
        var result = await controller.Edit(expense.Id, expense);

        Assert.IsType<RedirectToActionResult>(result);
        Assert.Equal("Updated", db.Expenses.Single().Description);
    }

    [Fact]
    public async Task Edit_WithMismatchedId_ReturnsNotFound()
    {
        using var db = TestDbFactory.Create();
        var controller = CreateController(db);
        var expense = MakeExpense();
        expense.Id = 5;

        var result = await controller.Edit(1, expense);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteConfirmed_RemovesExpense()
    {
        using var db = TestDbFactory.Create();
        var expense = MakeExpense();
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        await controller.DeleteConfirmed(expense.Id);

        Assert.Empty(db.Expenses);
    }

    [Fact]
    public async Task Dashboard_ComputesTotalsAndBudget()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(
            MakeExpense("A", amount: 100m, date: DateTime.Today),
            MakeExpense("B", amount: 50m, date: DateTime.Today.AddMonths(-2)));
        db.Budgets.Add(new Budget { MonthlyLimit = 200m, UserId = TestUserId });
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Dashboard();

        var view = Assert.IsType<ViewResult>(result);
        var vm = Assert.IsType<DashboardViewModel>(view.Model);
        Assert.Equal(150m, vm.TotalSpent);
        Assert.Equal(100m, vm.ThisMonthTotal);
        Assert.Equal(200m, vm.BudgetLimit);
        Assert.Equal(100m, vm.BudgetRemaining);
        Assert.Equal(50, vm.BudgetPercentUsed);
    }

    [Fact]
    public async Task Budget_Post_CreatesBudgetWhenNoneExists()
    {
        using var db = TestDbFactory.Create();
        var controller = CreateController(db);

        var result = await controller.Budget(new Budget { MonthlyLimit = 500m });

        Assert.IsType<RedirectToActionResult>(result);
        Assert.Equal(500m, db.Budgets.Single().MonthlyLimit);
    }

    [Fact]
    public async Task Budget_Post_UpdatesExistingBudget()
    {
        using var db = TestDbFactory.Create();
        db.Budgets.Add(new Budget { MonthlyLimit = 100m, UserId = TestUserId });
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        await controller.Budget(new Budget { MonthlyLimit = 750m });

        Assert.Single(db.Budgets);
        Assert.Equal(750m, db.Budgets.Single().MonthlyLimit);
    }

    [Fact]
    public async Task Index_OnlyReturnsCurrentUsersExpenses()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(
            MakeExpense("Mine", userId: TestUserId),
            MakeExpense("Someone else's", userId: "other-user-id"));
        await db.SaveChangesAsync();
        var controller = CreateController(db, TestUserId);

        var result = await controller.Index(null, null, null, null);

        var view = Assert.IsType<ViewResult>(result);
        var model = Assert.IsAssignableFrom<IEnumerable<Expense>>(view.Model);
        Assert.Single(model);
        Assert.Equal("Mine", model.Single().Description);
    }

    [Fact]
    public async Task DeleteConfirmed_DoesNotRemoveAnotherUsersExpense()
    {
        using var db = TestDbFactory.Create();
        var expense = MakeExpense(userId: "other-user-id");
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        var controller = CreateController(db, TestUserId);

        await controller.DeleteConfirmed(expense.Id);

        Assert.Single(db.Expenses);
    }

    [Fact]
    public async Task Export_ReturnsCsvOfFilteredExpenses()
    {
        using var db = TestDbFactory.Create();
        db.Expenses.AddRange(MakeExpense("Groceries", 42.50m, "Food"), MakeExpense("Internet", 30m, "Utilities"));
        await db.SaveChangesAsync();
        var controller = CreateController(db);

        var result = await controller.Export("Food", null, null, null);

        var file = Assert.IsType<FileContentResult>(result);
        var csv = System.Text.Encoding.UTF8.GetString(file.FileContents);
        Assert.Contains("Groceries", csv);
        Assert.DoesNotContain("Internet", csv);
    }
}
