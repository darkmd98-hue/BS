export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "reception";
export type RoomStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance";
export type ReservationStatus = "upcoming" | "checked_in" | "checked_out" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid";

export interface Database {
  public: {
    Tables: {
      lodges: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          owner_user_id: string;
          subdomain: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          owner_user_id: string;
          subdomain?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          owner_user_id?: string;
          subdomain?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          lodge_id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          lodge_id: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          lodge_id: string;
          room_number: string;
          floor: number | null;
          room_type: string;
          bed_type: string;
          capacity: number;
          rent: number;
          extra_person_charge: number;
          extra_bed_charge: number;
          status: string;
          amenities: string[];
          cleaning_staff: string | null;
          maintenance_issue: string | null;
          maintenance_priority: string | null;
          storage_folder: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          room_number: string;
          floor?: number | null;
          room_type: string;
          bed_type: string;
          capacity: number;
          rent: number;
          extra_person_charge?: number;
          extra_bed_charge?: number;
          status?: string;
          amenities?: string[];
          cleaning_staff?: string | null;
          maintenance_issue?: string | null;
          maintenance_priority?: string | null;
          storage_folder?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          room_number?: string;
          floor?: number | null;
          room_type?: string;
          bed_type?: string;
          capacity?: number;
          rent?: number;
          extra_person_charge?: number;
          extra_bed_charge?: number;
          status?: string;
          amenities?: string[];
          cleaning_staff?: string | null;
          maintenance_issue?: string | null;
          maintenance_priority?: string | null;
          storage_folder?: string | null;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          lodge_id: string;
          name: string;
          mobile: string;
          email: string | null;
          address: string | null;
          id_type: string | null;
          id_number: string | null;
          visits: number;
          total_spent: number;
          outstanding: number;
          last_stay: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          name: string;
          mobile: string;
          email?: string | null;
          address?: string | null;
          id_type?: string | null;
          id_number?: string | null;
          visits?: number;
          total_spent?: number;
          outstanding?: number;
          last_stay?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          name?: string;
          mobile?: string;
          email?: string | null;
          address?: string | null;
          id_type?: string | null;
          id_number?: string | null;
          visits?: number;
          total_spent?: number;
          outstanding?: number;
          last_stay?: string | null;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          lodge_id: string;
          customer_id: string;
          room_id: string;
          check_in: string;
          check_out: string;
          guests: number;
          advance: number;
          status: string;
          special_request: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          customer_id: string;
          room_id: string;
          check_in: string;
          check_out: string;
          guests?: number;
          advance?: number;
          status?: string;
          special_request?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          customer_id?: string;
          room_id?: string;
          check_in?: string;
          check_out?: string;
          guests?: number;
          advance?: number;
          status?: string;
          special_request?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bills: {
        Row: {
          id: string;
          lodge_id: string;
          reservation_id: string;
          net_amount: number;
          received: number;
          balance: number;
          payment_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          reservation_id: string;
          net_amount?: number;
          received?: number;
          payment_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          reservation_id?: string;
          net_amount?: number;
          received?: number;
          payment_status?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          lodge_id: string;
          bill_id: string;
          amount: number;
          method: string;
          paid_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          bill_id: string;
          amount: number;
          method: string;
          paid_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          bill_id?: string;
          amount?: number;
          method?: string;
          paid_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_lodge_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_auth_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      create_new_lodge_tenant: {
        Args: {
          p_user_id: string;
          p_owner_name: string;
          p_lodge_name: string;
          p_address?: string | null;
          p_subdomain?: string | null;
        };
        Returns: {
          lodge_id: string;
          lodge_name: string;
          subdomain?: string;
          user_id: string;
          role: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      room_status: RoomStatus;
      reservation_status: ReservationStatus;
      payment_status: PaymentStatus;
    };
  };
}

export type Lodge = Database["public"]["Tables"]["lodges"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
