using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Models;

public class RegisterViewModel
{
    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, DataType(DataType.Password), StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}
