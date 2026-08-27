from datetime import datetime, timezone, date as date_cls

from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    # ISO 4217 code (see app/constants.py:CURRENCIES) — every amount this
    # user enters/sees is assumed to already be in this currency; there's no
    # conversion between currencies, just a per-user display/entry unit.
    currency = db.Column(db.String(3), nullable=False, default="AED", server_default="AED")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "fullName": self.full_name, "email": self.email, "currency": self.currency}


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    description = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(50), nullable=False, default="General")
    date = db.Column(db.Date, nullable=False, default=date_cls.today)
    payment_method = db.Column(db.String(30), nullable=False, default="Cash")
    notes = db.Column(db.String(300), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "amount": float(self.amount),
            "category": self.category,
            "date": self.date.isoformat(),
            "paymentMethod": self.payment_method,
            "notes": self.notes,
        }


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    monthly_limit = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {"id": self.id, "monthlyLimit": float(self.monthly_limit)}
