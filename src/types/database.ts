export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "reception";
export type RoomStatus = "available" | "booked" | "maintenance";
export type BookingStatus = "active" | "checked_out" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "settled";

export interface Database {
  public: {
    Tables: {
      lodges: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          owner_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          owner_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          owner_user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lodges_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_lodge_id_fkey";
            columns: ["lodge_id"];
            isOneToOne: false;
            referencedRelation: "lodges";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          lodge_id: string;
          room_number: string;
          floor: number | null;
          status: RoomStatus;
          storage_folder: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          room_number: string;
          floor?: number | null;
          status?: RoomStatus;
          storage_folder?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          room_number?: string;
          floor?: number | null;
          status?: RoomStatus;
          storage_folder?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_lodge_id_fkey";
            columns: ["lodge_id"];
            isOneToOne: false;
            referencedRelation: "lodges";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          lodge_id: string;
          room_id: string;
          guest_name: string;
          guest_phone: string;
          guest_address: string;
          check_in: string;
          check_out: string | null;
          status: BookingStatus;
          created_by: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          room_id: string;
          guest_name: string;
          guest_phone: string;
          guest_address: string;
          check_in: string;
          check_out?: string | null;
          status?: BookingStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          room_id?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_address?: string;
          check_in?: string;
          check_out?: string | null;
          status?: BookingStatus;
          created_by?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_lodge_id_fkey";
            columns: ["lodge_id"];
            isOneToOne: false;
            referencedRelation: "lodges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      billing: {
        Row: {
          id: string;
          lodge_id: string;
          booking_id: string;
          total_amount: number;
          advance_amount: number;
          balance_due: number;
          payment_status: PaymentStatus;
          settled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          booking_id: string;
          total_amount: number;
          advance_amount: number;
          balance_due: number;
          payment_status?: PaymentStatus;
          settled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          booking_id?: string;
          total_amount?: number;
          advance_amount?: number;
          balance_due?: number;
          payment_status?: PaymentStatus;
          settled_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_lodge_id_fkey";
            columns: ["lodge_id"];
            isOneToOne: false;
            referencedRelation: "lodges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      room_photos: {
        Row: {
          id: string;
          lodge_id: string;
          room_id: string;
          storage_path: string;
          is_primary: boolean;
        };
        Insert: {
          id?: string;
          lodge_id: string;
          room_id: string;
          storage_path: string;
          is_primary?: boolean;
        };
        Update: {
          id?: string;
          lodge_id?: string;
          room_id?: string;
          storage_path?: string;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "room_photos_lodge_id_fkey";
            columns: ["lodge_id"];
            isOneToOne: false;
            referencedRelation: "lodges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_photos_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
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
        };
        Returns: {
          lodge_id: string;
          lodge_name: string;
          user_id: string;
          role: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      room_status: RoomStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
    };
  };
}

export type Lodge = Database["public"]["Tables"]["lodges"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Billing = Database["public"]["Tables"]["billing"]["Row"];
export type RoomPhoto = Database["public"]["Tables"]["room_photos"]["Row"];
