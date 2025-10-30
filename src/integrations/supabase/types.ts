export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      drivers: {
        Row: {
          aadhar_image_url: string | null
          aadhar_number: string | null
          bank_account: string | null
          bank_ifsc: string | null
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          geofence_radius: number | null
          id: string
          is_online: boolean | null
          license_expiry: string
          license_image_url: string | null
          license_number: string
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_rides: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhar_image_url?: string | null
          aadhar_number?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          geofence_radius?: number | null
          id?: string
          is_online?: boolean | null
          license_expiry: string
          license_image_url?: string | null
          license_number: string
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhar_image_url?: string | null
          aadhar_number?: string | null
          bank_account?: string | null
          bank_ifsc?: string | null
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          geofence_radius?: number | null
          id?: string
          is_online?: boolean | null
          license_expiry?: string
          license_image_url?: string | null
          license_number?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          base_fare: number
          commission_percentage: number
          created_at: string
          id: string
          is_active: boolean | null
          minimum_fare: number
          per_km_rate: number
          per_minute_rate: number
          surge_multiplier_night: number | null
          surge_multiplier_peak: number | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          base_fare: number
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_fare: number
          per_km_rate: number
          per_minute_rate: number
          surge_multiplier_night?: number | null
          surge_multiplier_peak?: number | null
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          base_fare?: number
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_fare?: number
          per_km_rate?: number
          per_minute_rate?: number
          surge_multiplier_night?: number | null
          surge_multiplier_peak?: number | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          feedback_categories: string[] | null
          id: string
          rated_by: string
          rated_user: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_categories?: string[] | null
          id?: string
          rated_by: string
          rated_user: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_categories?: string[] | null
          id?: string
          rated_by?: string
          rated_user?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: true
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_locations: {
        Row: {
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          ride_id: string
        }
        Insert: {
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          ride_id: string
        }
        Update: {
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          accepted_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          driver_id: string | null
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_distance: number | null
          estimated_duration: number | null
          estimated_fare: number | null
          final_fare: number | null
          id: string
          is_shared: boolean | null
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          requested_at: string
          special_instructions: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"]
          surge_multiplier: number | null
          updated_at: string
          vehicle_id: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_distance?: number | null
          estimated_duration?: number | null
          estimated_fare?: number | null
          final_fare?: number | null
          id?: string
          is_shared?: boolean | null
          passenger_id: string
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          requested_at?: string
          special_instructions?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          surge_multiplier?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          dropoff_address?: string
          dropoff_latitude?: number
          dropoff_longitude?: number
          estimated_distance?: number | null
          estimated_duration?: number | null
          estimated_fare?: number | null
          final_fare?: number | null
          id?: string
          is_shared?: boolean | null
          passenger_id?: string
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          requested_at?: string
          special_instructions?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"]
          surge_multiplier?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          commission_amount: number | null
          created_at: string
          driver_earnings: number | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          ride_id: string
          tip_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          commission_amount?: number | null
          created_at?: string
          driver_earnings?: number | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          ride_id: string
          tip_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          created_at?: string
          driver_earnings?: number | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          ride_id?: string
          tip_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number
          color: string | null
          created_at: string
          driver_id: string
          id: string
          insurance_expiry: string
          is_active: boolean | null
          is_shared_enabled: boolean | null
          model: string
          registration_number: string
          updated_at: string
          vehicle_image_url: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year: number | null
        }
        Insert: {
          capacity?: number
          color?: string | null
          created_at?: string
          driver_id: string
          id?: string
          insurance_expiry: string
          is_active?: boolean | null
          is_shared_enabled?: boolean | null
          model: string
          registration_number: string
          updated_at?: string
          vehicle_image_url?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year?: number | null
        }
        Update: {
          capacity?: number
          color?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          insurance_expiry?: string
          is_active?: boolean | null
          is_shared_enabled?: boolean | null
          model?: string
          registration_number?: string
          updated_at?: string
          vehicle_image_url?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_ride_location: {
        Args: { lat: number; lng: number; ride_id_param: string }
        Returns: undefined
      }
      update_driver_location: {
        Args: { driver_id_param: string; lat: number; lng: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "passenger" | "driver" | "admin"
      driver_status: "pending" | "approved" | "rejected" | "suspended"
      payment_method: "cash" | "upi" | "wallet"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      ride_status:
        | "requested"
        | "matched"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      vehicle_type: "bike" | "auto" | "car"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["passenger", "driver", "admin"],
      driver_status: ["pending", "approved", "rejected", "suspended"],
      payment_method: ["cash", "upi", "wallet"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      ride_status: [
        "requested",
        "matched",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      vehicle_type: ["bike", "auto", "car"],
    },
  },
} as const
