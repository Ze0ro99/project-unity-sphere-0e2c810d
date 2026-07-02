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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blockchain_transactions_raw: {
        Row: {
          amount_micro: number
          amount_pi: number | null
          asset_type: Database["public"]["Enums"]["pi_asset_class"]
          differential_telemetry_vector: Json | null
          receiver: string
          sender: string
          timestamp: string
          tx_hash: string
          tx_id: string
        }
        Insert: {
          amount_micro: number
          amount_pi?: number | null
          asset_type: Database["public"]["Enums"]["pi_asset_class"]
          differential_telemetry_vector?: Json | null
          receiver: string
          sender: string
          timestamp?: string
          tx_hash: string
          tx_id?: string
        }
        Update: {
          amount_micro?: number
          amount_pi?: number | null
          asset_type?: Database["public"]["Enums"]["pi_asset_class"]
          differential_telemetry_vector?: Json | null
          receiver?: string
          sender?: string
          timestamp?: string
          tx_hash?: string
          tx_id?: string
        }
        Relationships: []
      }
      market_candlesticks: {
        Row: {
          bucket_timestamp: string
          candle_id: string
          close_price_usd: number
          high_price_usd: number
          low_price_usd: number
          open_price_usd: number
          timeframe: Database["public"]["Enums"]["chart_timeframe"]
          volume_pi: number
        }
        Insert: {
          bucket_timestamp: string
          candle_id?: string
          close_price_usd: number
          high_price_usd: number
          low_price_usd: number
          open_price_usd: number
          timeframe: Database["public"]["Enums"]["chart_timeframe"]
          volume_pi?: number
        }
        Update: {
          bucket_timestamp?: string
          candle_id?: string
          close_price_usd?: number
          high_price_usd?: number
          low_price_usd?: number
          open_price_usd?: number
          timeframe?: Database["public"]["Enums"]["chart_timeframe"]
          volume_pi?: number
        }
        Relationships: []
      }
      pirc_snapshots: {
        Row: {
          bytes: number
          commit_sha: string | null
          content: Json | null
          created_at: string
          fetched_at: string
          id: string
          path: string
          raw_text: string | null
        }
        Insert: {
          bytes?: number
          commit_sha?: string | null
          content?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          path: string
          raw_text?: string | null
        }
        Update: {
          bytes?: number
          commit_sha?: string | null
          content?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          path?: string
          raw_text?: string | null
        }
        Relationships: []
      }
      pirc_webhook_events: {
        Row: {
          delivery: string | null
          event: string
          head_sha: string | null
          id: string
          payload: Json | null
          pusher: string | null
          received_at: string
          ref: string | null
        }
        Insert: {
          delivery?: string | null
          event: string
          head_sha?: string | null
          id?: string
          payload?: Json | null
          pusher?: string | null
          received_at?: string
          ref?: string | null
        }
        Update: {
          delivery?: string | null
          event?: string
          head_sha?: string | null
          id?: string
          payload?: Json | null
          pusher?: string | null
          received_at?: string
          ref?: string | null
        }
        Relationships: []
      }
      raw_contract_factory: {
        Row: {
          contract_name: string
          deployed_at: string | null
          error_log: Json | null
          factory_id: string
          is_active: boolean | null
          kyber_encryption_seal: string
          wasm_byte_hash: string
        }
        Insert: {
          contract_name: string
          deployed_at?: string | null
          error_log?: Json | null
          factory_id?: string
          is_active?: boolean | null
          kyber_encryption_seal: string
          wasm_byte_hash: string
        }
        Update: {
          contract_name?: string
          deployed_at?: string | null
          error_log?: Json | null
          factory_id?: string
          is_active?: boolean | null
          kyber_encryption_seal?: string
          wasm_byte_hash?: string
        }
        Relationships: []
      }
      raw_ledger: {
        Row: {
          asset_type: Database["public"]["Enums"]["pi_asset_class"]
          balance_micro: number
          balance_pi: number | null
          last_block_height: number
          ledger_id: string
          quantum_pubkey_dilithium: string | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["pi_asset_class"]
          balance_micro?: number
          balance_pi?: number | null
          last_block_height?: number
          ledger_id?: string
          quantum_pubkey_dilithium?: string | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["pi_asset_class"]
          balance_micro?: number
          balance_pi?: number | null
          last_block_height?: number
          ledger_id?: string
          quantum_pubkey_dilithium?: string | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          duration_hours: number
          id: string
          min_price_pi: number
          name: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description: string
          duration_hours: number
          id: string
          min_price_pi: number
          name: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          duration_hours?: number
          id?: string
          min_price_pi?: number
          name?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          activated_at: string | null
          amount_pi: number
          app_url: string | null
          created_at: string
          deposit_memo: string
          expires_at: string | null
          id: string
          network: string
          pi_username: string | null
          receiver_address: string
          service_id: string
          status: string
          txid: string | null
          user_uid: string
        }
        Insert: {
          activated_at?: string | null
          amount_pi: number
          app_url?: string | null
          created_at?: string
          deposit_memo: string
          expires_at?: string | null
          id?: string
          network?: string
          pi_username?: string | null
          receiver_address: string
          service_id: string
          status?: string
          txid?: string | null
          user_uid: string
        }
        Update: {
          activated_at?: string | null
          amount_pi?: number
          app_url?: string | null
          created_at?: string
          deposit_memo?: string
          expires_at?: string | null
          id?: string
          network?: string
          pi_username?: string | null
          receiver_address?: string
          service_id?: string
          status?: string
          txid?: string | null
          user_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      service_payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "service_payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_timeframe_bucket: {
        Args: { tf: Database["public"]["Enums"]["chart_timeframe"]; ts: string }
        Returns: string
      }
    }
    Enums: {
      chart_timeframe: "10m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d"
      pi_asset_class: "MINED_COIN" | "CEX_BRIDGE"
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
      chart_timeframe: ["10m", "15m", "30m", "1h", "2h", "4h", "1d"],
      pi_asset_class: ["MINED_COIN", "CEX_BRIDGE"],
    },
  },
} as const
