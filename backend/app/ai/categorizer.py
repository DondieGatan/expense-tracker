"""Rule-based expense categoriser: reads a description like "Careem to the airport" or "Netflix" and picks one of
the app's categories. It is instant and free, so the add-expense form can call it as the user types. Gemini is only
asked (see routes.py) when these rules find nothing."""
import re

from app.constants import EXPENSE_CATEGORIES

# Whole-word / whole-phrase keywords per category. Many are UAE-flavoured because the app's default currency is AED.
KEYWORDS = {
    "Food": [
        "coffee", "latte", "cappuccino", "espresso", "tea", "matcha", "lunch", "dinner", "breakfast", "brunch",
        "snack", "snacks", "meal", "restaurant", "cafe", "bakery", "pizza", "burger", "shawarma", "sandwich",
        "groceries", "grocery", "supermarket", "carrefour", "lulu", "spinneys", "waitrose", "talabat", "deliveroo",
        "zomato", "mcdonalds", "kfc", "starbucks", "juice", "dessert", "ice cream", "food", "takeaway", "water",
        "milk", "bread", "fruits", "vegetables", "chicken", "rice",
    ],
    "Transport": [
        "taxi", "uber", "careem", "bolt", "fuel", "petrol", "gas", "diesel", "adnoc", "enoc", "eppco", "parking",
        "salik", "toll", "metro", "bus", "tram", "nol", "train", "flight", "airline", "ticket", "car wash",
        "carwash", "mechanic", "tyre", "tire", "oil change", "ride", "commute",
    ],
    "Housing": [
        "rent", "mortgage", "landlord", "maintenance", "furniture", "ikea", "plumber", "cleaning", "maid",
        "ejari", "deposit", "apartment", "home",
    ],
    "Utilities": [
        "electricity", "water bill", "dewa", "sewa", "fewa", "internet", "wifi", "broadband", "etisalat", "du",
        "e&", "phone bill", "mobile bill", "recharge", "gas bill", "utility", "utilities", "bill", "sim",
    ],
    "Entertainment": [
        "netflix", "spotify", "cinema", "movie", "movies", "vox", "disney", "shahid", "youtube", "anghami",
        "game", "games", "playstation", "steam", "xbox", "concert", "show", "theatre", "theater", "bowling",
        "club", "party", "bar", "subscription", "hobby", "streaming",
    ],
    "Health": [
        "pharmacy", "doctor", "clinic", "hospital", "dentist", "dental", "medicine", "medication", "vitamins",
        "gym", "fitness", "insurance", "checkup", "check-up", "physio", "therapy", "optician", "glasses",
        "lab test", "aster", "life pharmacy",
    ],
    "Education": [
        "tuition", "course", "class", "school", "university", "college", "books", "book", "udemy", "coursera",
        "exam", "fees", "stationery", "workshop", "training", "certification", "certificate", "lesson",
    ],
    "Shopping": [
        "shopping", "clothes", "shirt", "shoes", "dress", "amazon", "noon", "temu", "shein", "ikea", "mall",
        "zara", "h&m", "nike", "electronics", "phone case", "gift", "gifts", "perfume", "bag", "watch",
        "accessories", "online order",
    ],
}

# A few words appear in several lists on purpose (ikea is furniture for the house but also a shop); when two
# categories tie, the one listed earlier here wins, which keeps the answer stable.
PRIORITY = ["Food", "Transport", "Utilities", "Housing", "Health", "Education", "Entertainment", "Shopping"]


def _normalise(text):
    return re.sub(r"[^a-z0-9&\- ]+", " ", (text or "").lower()).strip()


def _build_patterns():
    patterns = {}
    for category, words in KEYWORDS.items():
        compiled = []
        for word in sorted(set(words), key=len, reverse=True):
            compiled.append((word, re.compile(r"(?<![a-z0-9])" + re.escape(word) + r"(?![a-z0-9])")))
        patterns[category] = compiled
    return patterns


_PATTERNS = _build_patterns()


def categorise(description):
    """Returns (category, confidence) or (None, 0.0) when nothing in the description is recognised.
    Confidence is 0.9 for a clear single-category match and lower when several categories matched."""
    text = _normalise(description)
    if len(text) < 2:
        return None, 0.0

    scores = {}
    for category, compiled in _PATTERNS.items():
        for word, pattern in compiled:
            if pattern.search(text):
                # a longer phrase ("water bill") is stronger evidence than a short word
                scores[category] = scores.get(category, 0) + (2 if " " in word else 1)
    if not scores:
        return None, 0.0

    best_score = max(scores.values())
    leaders = [c for c, s in scores.items() if s == best_score]
    best = min(leaders, key=lambda c: PRIORITY.index(c) if c in PRIORITY else 99)
    confidence = 0.9 if len(scores) == 1 else (0.75 if len(leaders) == 1 else 0.6)
    return best, confidence


def valid_category(value):
    """A category name from outside (a model, the client) mapped to one the app really has, or None."""
    value = (value or "").strip()
    for category in EXPENSE_CATEGORIES:
        if category.lower() == value.lower():
            return category
    return None
