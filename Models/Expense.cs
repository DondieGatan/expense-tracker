using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTracker.Models;

public class Expense
{
    public int Id { get; set; }

    [Required, StringLength(150)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    [Range(0.01, 1000000)]
    public decimal Amount { get; set; }

    [Required, StringLength(50)]
    public string Category { get; set; } = "General";

    [Required]
    [DataType(DataType.Date)]
    public DateTime Date { get; set; } = DateTime.Today;

    [Required, StringLength(30)]
    public string PaymentMethod { get; set; } = "Cash";

    [StringLength(300)]
    public string? Notes { get; set; }
}

public static class ExpenseCategories
{
    public static readonly string[] All =
    {
        "Food", "Transport", "Housing", "Utilities", "Entertainment",
        "Health", "Education", "Shopping", "General",
    };
}

public static class PaymentMethods
{
    public static readonly string[] All = { "Cash", "Card", "Bank Transfer" };
}
