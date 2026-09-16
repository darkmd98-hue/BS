export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionCategory {
  id: string;
  label: string;
  icon: string;
  permissions: PermissionItem[];
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
  userCount: number;
}

export interface StaffRoleAssignment {
  userId: string;
  fullName: string;
  email: string;
  assignedRoleName: string;
  roleId: string;
}

export interface AuditLogEntry {
  id: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface RBACData {
  lodgeId: string;
  lodgeName: string;
  roles: RoleDefinition[];
  permissionCategories: PermissionCategory[];
  staffAssignments: StaffRoleAssignment[];
  recentAuditLogs: AuditLogEntry[];
}

export const SYSTEM_PERMISSIONS: PermissionCategory[] = [
  {
    id: "rooms",
    label: "Rooms & Inventory",
    icon: "🏨",
    permissions: [
      { key: "rooms:read", label: "View Rooms", description: "Browse room inventory and occupancy status" },
      { key: "rooms:write", label: "Create & Edit Rooms", description: "Add new rooms, modify rates and amenities" },
      { key: "rooms:delete", label: "Delete Rooms", description: "Remove rooms permanently from inventory" },
      { key: "rooms:status", label: "Change Room State", description: "Manually toggle room between operational states" },
    ],
  },
  {
    id: "reservations",
    label: "Reservations & Guests",
    icon: "📋",
    permissions: [
      { key: "reservations:read", label: "View Bookings", description: "Access reservation calendar, guest lists and folios" },
      { key: "reservations:create", label: "Create Bookings", description: "Book guest stays, assign rooms, take deposits" },
      { key: "reservations:cancel", label: "Cancel Bookings", description: "Void reservations and process guest refunds" },
    ],
  },
  {
    id: "billing",
    label: "Billing & Cashiering",
    icon: "₹",
    permissions: [
      { key: "billing:read", label: "View Invoices", description: "View guest bills, folios and payment transactions" },
      { key: "billing:collect", label: "Collect Payments", description: "Record cash, card, UPI and bank transfer payments" },
      { key: "billing:discount", label: "Apply Discounts", description: "Grant promotional rate deductions or concessions" },
      { key: "billing:void", label: "Void Charges", description: "Strike out invalid bill line items or erroneous fees" },
    ],
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    icon: "🧹",
    permissions: [
      { key: "housekeeping:read", label: "View Cleaning Board", description: "Inspect dirty and turnover room queue" },
      { key: "housekeeping:assign", label: "Assign Housekeepers", description: "Delegate cleaning staff to specific rooms" },
      { key: "housekeeping:complete", label: "Mark Cleaned", description: "Sign off on cleaned rooms to restore availability" },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance & Repairs",
    icon: "🔧",
    permissions: [
      { key: "maintenance:read", label: "View Repair Tickets", description: "Access maintenance board and reported issues" },
      { key: "maintenance:create", label: "Report Issues", description: "Log malfunctioning AC, plumbing, or fixture defects" },
      { key: "maintenance:resolve", label: "Resolve Tickets", description: "Close tickets with resolution notes and parts used" },
    ],
  },
  {
    id: "bi",
    label: "Financial Analytics & P&L",
    icon: "📈",
    permissions: [
      { key: "reports:view", label: "View Reports", description: "View occupancy trends and monthly revenue summaries" },
      { key: "reports:export", label: "Export Financials", description: "Download CSV ledgers and print official P&L statements" },
      { key: "bi:view", label: "Executive BI", description: "Access RevPAR, ADR yields, and net profit margins" },
      { key: "expenses:manage", label: "Manage Expenses", description: "Log and delete operating expenses from lodge ledger" },
    ],
  },
  {
    id: "channels",
    label: "OTA & Channel Distribution",
    icon: "🌐",
    permissions: [
      { key: "channels:view", label: "View OTAs", description: "Inspect Airbnb, Booking.com, and Agoda sync status" },
      { key: "channels:sync", label: "Trigger Sync", description: "Force two-way calendar and rate synchronization" },
      { key: "channels:manage", label: "Manage API Keys", description: "Connect new channel accounts and modify credentials" },
    ],
  },
  {
    id: "admin",
    label: "Security & Governance",
    icon: "🛡️",
    permissions: [
      { key: "staff:invite", label: "Invite Staff", description: "Send onboarding credentials to new lodge employees" },
      { key: "staff:manage_roles", label: "Modify Permissions", description: "Create roles and assign permission matrices" },
      { key: "settings:manage", label: "Lodge Settings", description: "Alter check-in hours, GST, branding and policies" },
      { key: "audit:view", label: "Audit Log Access", description: "Inspect system security and administrative event trail" },
    ],
  },
];
