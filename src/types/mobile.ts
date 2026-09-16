export type StaffRole = "cleaner" | "technician" | "reception" | "admin";

export interface MobileRoomTask {
  id: string;
  roomNumber: string;
  floor: number | null;
  status: "cleaning" | "occupied" | "available" | "maintenance";
  roomType: string;
  lastCleanedAt: string | null;
  assignedStaff: string | null;
}

export interface MobileMaintenanceTicket {
  id: string;
  roomNumber: string;
  issueType: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  assignedTo: string | null;
  createdAt: string;
}

export interface OfflineSyncItem {
  id: string;
  type: "MARK_ROOM_CLEANED" | "RESOLVE_TICKET" | "REPORT_ISSUE";
  targetId: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface MobileStaffData {
  lodgeId: string;
  lodgeName: string;
  lodgeSubdomain: string;
  staffUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  cleaningQueue: MobileRoomTask[];
  maintenanceTickets: MobileMaintenanceTicket[];
  metrics: {
    pendingCleaningCount: number;
    urgentMaintenanceCount: number;
    totalActiveTasks: number;
  };
}

