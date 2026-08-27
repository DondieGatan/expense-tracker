EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Entertainment",
    "Health",
    "Education",
    "Shopping",
    "General",
]

PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer"]

# ISO 4217 codes only — the mobile app formats amounts via
# Intl.NumberFormat(locale, { style: 'currency', currency: code }), which
# derives the symbol/placement/decimals from the code itself, so no symbol
# or formatting metadata needs to be duplicated here.
CURRENCIES = [
    {"code": "USD", "name": "US Dollar"},
    {"code": "EUR", "name": "Euro"},
    {"code": "GBP", "name": "British Pound"},
    {"code": "AED", "name": "UAE Dirham"},
    {"code": "SAR", "name": "Saudi Riyal"},
    {"code": "PHP", "name": "Philippine Peso"},
    {"code": "INR", "name": "Indian Rupee"},
    {"code": "JPY", "name": "Japanese Yen"},
    {"code": "CNY", "name": "Chinese Yuan"},
    {"code": "CAD", "name": "Canadian Dollar"},
    {"code": "AUD", "name": "Australian Dollar"},
    {"code": "SGD", "name": "Singapore Dollar"},
]
CURRENCY_CODES = {c["code"] for c in CURRENCIES}
