export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          details: Json;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          is_primary: boolean;
          name: string;
          phone: string | null;
          priority: number;
          relationship: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_primary?: boolean;
          name: string;
          phone?: string | null;
          priority?: number;
          relationship?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_primary?: boolean;
          name?: string;
          phone?: string | null;
          priority?: number;
          relationship?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_resources: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          is_demo: boolean;
          is_verified: boolean;
          last_verified_at: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          operating_hours: string | null;
          phone: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          is_verified?: boolean;
          last_verified_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          operating_hours?: string | null;
          phone?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          is_verified?: boolean;
          last_verified_at?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          operating_hours?: string | null;
          phone?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incident_assignments: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          id: string;
          incident_id: string;
          responder_id: string;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          incident_id: string;
          responder_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          incident_id?: string;
          responder_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incident_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_assignments_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_assignments_responder_id_fkey";
            columns: ["responder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      incident_locations: {
        Row: {
          accuracy: number | null;
          created_at: string;
          id: string;
          incident_id: string;
          latitude: number | null;
          location_text: string | null;
          longitude: number | null;
          user_id: string;
        };
        Insert: {
          accuracy?: number | null;
          created_at?: string;
          id?: string;
          incident_id: string;
          latitude?: number | null;
          location_text?: string | null;
          longitude?: number | null;
          user_id?: string;
        };
        Update: {
          accuracy?: number | null;
          created_at?: string;
          id?: string;
          incident_id?: string;
          latitude?: number | null;
          location_text?: string | null;
          longitude?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incident_locations_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      incident_notes: {
        Row: {
          author_id: string;
          created_at: string;
          id: string;
          incident_id: string;
          note: string;
        };
        Insert: {
          author_id?: string;
          created_at?: string;
          id?: string;
          incident_id: string;
          note: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          id?: string;
          incident_id?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incident_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_notes_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      incident_timeline: {
        Row: {
          actor_id: string | null;
          created_at: string;
          details: string | null;
          event: string;
          id: string;
          incident_id: string;
          status: Database["public"]["Enums"]["incident_status"] | null;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          details?: string | null;
          event: string;
          id?: string;
          incident_id: string;
          status?: Database["public"]["Enums"]["incident_status"] | null;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          details?: string | null;
          event?: string;
          id?: string;
          incident_id?: string;
          status?: Database["public"]["Enums"]["incident_status"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "incident_timeline_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          accuracy: number | null;
          assigned_responder_id: string | null;
          category: string;
          contact_info: string | null;
          created_at: string;
          description: string | null;
          evidence_path: string | null;
          id: string;
          kind: Database["public"]["Enums"]["incident_kind"];
          latitude: number | null;
          location_sharing: boolean;
          location_text: string | null;
          location_updated_at: string | null;
          longitude: number | null;
          occurred_at: string;
          ref: string;
          reporter_id: string;
          resolution: string | null;
          resolved_at: string | null;
          severity: Database["public"]["Enums"]["incident_severity"];
          status: Database["public"]["Enums"]["incident_status"];
          updated_at: string;
        };
        Insert: {
          accuracy?: number | null;
          assigned_responder_id?: string | null;
          category: string;
          contact_info?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_path?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["incident_kind"];
          latitude?: number | null;
          location_sharing?: boolean;
          location_text?: string | null;
          location_updated_at?: string | null;
          longitude?: number | null;
          occurred_at?: string;
          ref?: string;
          reporter_id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          updated_at?: string;
        };
        Update: {
          accuracy?: number | null;
          assigned_responder_id?: string | null;
          category?: string;
          contact_info?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_path?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["incident_kind"];
          latitude?: number | null;
          location_sharing?: boolean;
          location_text?: string | null;
          location_updated_at?: string | null;
          longitude?: number | null;
          occurred_at?: string;
          ref?: string;
          reporter_id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          severity?: Database["public"]["Enums"]["incident_severity"];
          status?: Database["public"]["Enums"]["incident_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_responder_id_fkey";
            columns: ["assigned_responder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          incident_id: string | null;
          is_read: boolean;
          message: string;
          priority: Database["public"]["Enums"]["incident_severity"];
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          incident_id?: string | null;
          is_read?: boolean;
          message: string;
          priority?: Database["public"]["Enums"]["incident_severity"];
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          incident_id?: string | null;
          is_read?: boolean;
          message?: string;
          priority?: Database["public"]["Enums"]["incident_severity"];
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      safety_alerts: {
        Row: {
          area: string | null;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          message: string;
          severity: Database["public"]["Enums"]["incident_severity"];
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          area?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          message: string;
          severity?: Database["public"]["Enums"]["incident_severity"];
          starts_at?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          area?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          message?: string;
          severity?: Database["public"]["Enums"]["incident_severity"];
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      safety_information: {
        Row: {
          category: string;
          content: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_demo: boolean;
          is_published: boolean;
          is_verified: boolean;
          review_date: string | null;
          source: string | null;
          title: string;
          updated_at: string;
          verified_at: string | null;
        };
        Insert: {
          category: string;
          content: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_demo?: boolean;
          is_published?: boolean;
          is_verified?: boolean;
          review_date?: string | null;
          source?: string | null;
          title: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_demo?: boolean;
          is_published?: boolean;
          is_verified?: boolean;
          review_date?: string | null;
          source?: string | null;
          title?: string;
          updated_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      tourist_profiles: {
        Row: {
          home_country: string | null;
          languages: string | null;
          medical_notes: string | null;
          nationality: string | null;
          travel_notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          home_country?: string | null;
          languages?: string | null;
          medical_notes?: string | null;
          nationality?: string | null;
          travel_notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          home_country?: string | null;
          languages?: string | null;
          medical_notes?: string | null;
          nationality?: string | null;
          travel_notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tourist_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      assign_incident: {
        Args: { _incident_id: string; _responder_id: string };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      kind_label: {
        Args: { k: Database["public"]["Enums"]["incident_kind"] };
        Returns: string;
      };
      log_audit: {
        Args: {
          _action: string;
          _details?: Json;
          _entity: string;
          _entity_id: string;
        };
        Returns: undefined;
      };
      notify_staff: {
        Args: {
          _incident: string;
          _msg: string;
          _prio: Database["public"]["Enums"]["incident_severity"];
          _title: string;
          _type: string;
        };
        Returns: undefined;
      };
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
      switch_my_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
        };
        Returns: undefined;
      };
      trigger_sos: {
        Args: {
          _accuracy: number | null;
          _description: string | null;
          _lat: number | null;
          _lng: number | null;
          _location_text: string | null;
        };
        Returns: Json;
      };
      update_incident_status: {
        Args: {
          _incident_id: string;
          _note?: string;
          _status: Database["public"]["Enums"]["incident_status"];
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "tourist" | "responder" | "admin";
      incident_kind: "sos" | "incident" | "assistance";
      incident_severity: "low" | "medium" | "high" | "critical";
      incident_status:
        | "submitted"
        | "received"
        | "assigned"
        | "accepted"
        | "en_route"
        | "assistance_provided"
        | "resolved"
        | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["tourist", "responder", "admin"],
      incident_kind: ["sos", "incident", "assistance"],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: [
        "submitted",
        "received",
        "assigned",
        "accepted",
        "en_route",
        "assistance_provided",
        "resolved",
        "cancelled",
      ],
    },
  },
} as const;
