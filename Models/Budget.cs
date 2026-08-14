using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTracker.Models;

public class Budget
{
    public int Id { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    [Range(0, 1000000)]
    public decimal MonthlyLimit { get; set; }
}
