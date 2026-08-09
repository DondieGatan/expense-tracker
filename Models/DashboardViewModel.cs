namespace ExpenseTracker.Models;

public class DashboardViewModel
{
    public decimal TotalSpent { get; set; }
    public decimal ThisMonthTotal { get; set; }
    public int ExpenseCount { get; set; }
    public List<CategoryTotal> ByCategory { get; set; } = new();
    public List<Expense> RecentExpenses { get; set; } = new();
}

public class CategoryTotal
{
    public string Category { get; set; } = string.Empty;
    public decimal Total { get; set; }
}
