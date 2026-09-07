export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
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
