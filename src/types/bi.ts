export type ExpenseCategory =
  | "utilities"
  | "maintenance"
  | "supplies"
  | "payroll"
  | "food_beverage"
  | "marketing"
  | "taxes_licenses"
  | "other";

export interface LodgeExpense {
  id: string;
  lodge_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  notes?: string | null;
  created_at?: string;
}

export interface CategoryExpenseShare {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyFinancialTrend {
  month: string;
  revenue: number;
  expenses: number;
  noi: number;
  margin: number;
  revpar: number;
  adr: number;
}

export interface PLStatement {
  operatingRevenue: {
    roomRevenue: number;
    extraCharges: number;
    totalRevenue: number;
  };
  operatingExpenses: {
    categories: {
      category: ExpenseCategory;
      label: string;
      amount: number;
      pctOfRevenue: number;
    }[];
    totalExpenses: number;
  };
  netOperatingIncome: number;
  netMarginPercentage: number;
}

export interface BIMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netOperatingIncome: number;
  operatingMarginPct: number;
  revpar: number;
  adr: number;
  occupancyRatePct: number;
  totalRooms: number;
  occupiedRooms: number;
}

export interface BIAggregateData {
  lodgeId: string;
  lodgeName: string;
  metrics: BIMetrics;
  plStatement: PLStatement;
  categoryShares: CategoryExpenseShare[];
  monthlyTrends: MonthlyFinancialTrend[];
  recentExpenses: LodgeExpense[];
}

export const CATEGORY_METADATA: Record<
  ExpenseCategory,
  { label: string; color: string; icon: string }
> = {
  utilities: { label: "Utilities & Energy", color: "#f59e0b", icon: "⚡" },
  maintenance: { label: "Maintenance & Repairs", color: "#ef4444", icon: "🔧" },
  supplies: { label: "Linens & Guest Supplies", color: "#0ea5e9", icon: "🧼" },
  payroll: { label: "Staff Payroll & Wages", color: "#8b5cf6", icon: "👥" },
  food_beverage: { label: "F&B / Breakfast Kitchen", color: "#10b981", icon: "🍳" },
  marketing: { label: "OTA Fees & Marketing", color: "#3b82f6", icon: "📢" },
  taxes_licenses: { label: "Taxes, GST & Licenses", color: "#64748b", icon: "📑" },
  other: { label: "Miscellaneous Operating", color: "#94a3b8", icon: "📦" },
};

