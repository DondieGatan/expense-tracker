namespace ExpenseTracker.Models;

public class DashboardViewModel
{
    public decimal TotalSpent { get; set; }
    public decimal ThisMonthTotal { get; set; }
    public int ExpenseCount { get; set; }
    public List<CategoryTotal> ByCategory { get; set; } = new();
    public List<Expense> RecentExpenses { get; set; } = new();
    public List<MonthTotal> MonthlyTrend { get; set; } = new();
    public decimal? BudgetLimit { get; set; }
    public decimal BudgetRemaining => (BudgetLimit ?? 0) - ThisMonthTotal;
    public int BudgetPercentUsed => BudgetLimit is > 0
        ? (int)Math.Round(ThisMonthTotal / BudgetLimit.Value * 100)
        : 0;
}

public class MonthTotal
{
    public string Label { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class CategoryTotal
{
    public string Category { get; set; } = string.Empty;
    public decimal Total { get; set; }
}
