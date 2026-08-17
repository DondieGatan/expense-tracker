export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Budget: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  ExpenseForm: { expenseId?: number } | undefined;
};
