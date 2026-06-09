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
      account_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          gm_team_id: string | null
          player_id: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          gm_team_id?: string | null
          player_id?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          gm_team_id?: string | null
          player_id?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_profiles_gm_team_fk"
            columns: ["gm_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_profiles_player_fk"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          severity: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          severity?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          severity?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      free_agency_listings: {
        Row: {
          asking_uc_balance: number | null
          created_at: string
          current_bid_team_id: string | null
          current_bid_uc: number
          expires_at: string | null
          id: string
          listed_at: string
          player_id: string
          signed_at: string | null
          signed_team_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asking_uc_balance?: number | null
          created_at?: string
          current_bid_team_id?: string | null
          current_bid_uc?: number
          expires_at?: string | null
          id?: string
          listed_at?: string
          player_id: string
          signed_at?: string | null
          signed_team_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asking_uc_balance?: number | null
          created_at?: string
          current_bid_team_id?: string | null
          current_bid_uc?: number
          expires_at?: string | null
          id?: string
          listed_at?: string
          player_id?: string
          signed_at?: string | null
          signed_team_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_agency_listings_current_bid_team_id_fkey"
            columns: ["current_bid_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_agency_listings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_agency_listings_signed_team_id_fkey"
            columns: ["signed_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string
          home_score: number | null
          home_team_id: string
          id: string
          location: string | null
          scheduled_at: string
          season: string
          status: string
          updated_at: string
          week: number | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string
          home_score?: number | null
          home_team_id: string
          id?: string
          location?: string | null
          scheduled_at: string
          season: string
          status?: string
          updated_at?: string
          week?: number | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          location?: string | null
          scheduled_at?: string
          season?: string
          status?: string
          updated_at?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      injuries: {
        Row: {
          body_part: string
          created_at: string
          description: string | null
          expected_return: string | null
          id: string
          injured_at: string
          injury_type: string
          player_id: string
          recovered_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          body_part: string
          created_at?: string
          description?: string | null
          expected_return?: string | null
          id?: string
          injured_at?: string
          injury_type: string
          player_id: string
          recovered_at?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          body_part?: string
          created_at?: string
          description?: string | null
          expected_return?: string | null
          id?: string
          injured_at?: string
          injury_type?: string
          player_id?: string
          recovered_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_hotzones: {
        Row: {
          id: string
          player_id: string
          status: string
          updated_at: string
          updated_by: string | null
          zone: string
        }
        Insert: {
          id?: string
          player_id: string
          status: string
          updated_at?: string
          updated_by?: string | null
          zone: string
        }
        Update: {
          id?: string
          player_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_hotzones_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          account_user_id: string | null
          animations: string[]
          archetype: string | null
          attributes: Json
          badges: string[]
          created_at: string
          gamertag: string
          height_inches: number
          id: string
          overall: number | null
          primary_position: string
          secondary_positions: string[]
          slug: string | null
          status: string
          tendencies: Json
          updated_at: string
          wingspan_inches: number
        }
        Insert: {
          account_user_id?: string | null
          animations?: string[]
          archetype?: string | null
          attributes?: Json
          badges?: string[]
          created_at?: string
          gamertag: string
          height_inches: number
          id?: string
          overall?: number | null
          primary_position: string
          secondary_positions?: string[]
          slug?: string | null
          status: string
          tendencies?: Json
          updated_at?: string
          wingspan_inches: number
        }
        Update: {
          account_user_id?: string | null
          animations?: string[]
          archetype?: string | null
          attributes?: Json
          badges?: string[]
          created_at?: string
          gamertag?: string
          height_inches?: number
          id?: string
          overall?: number | null
          primary_position?: string
          secondary_positions?: string[]
          slug?: string | null
          status?: string
          tendencies?: Json
          updated_at?: string
          wingspan_inches?: number
        }
        Relationships: []
      }
      roster_import_batches: {
        Row: {
          created_at: string
          id: string
          promoted_at: string | null
          source_label: string
          source_notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          promoted_at?: string | null
          source_label: string
          source_notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          promoted_at?: string | null
          source_label?: string
          source_notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      roster_import_rows: {
        Row: {
          acquired_label: string
          batch_id: string
          created_at: string
          discord_handle: string
          display_team_name: string
          duplicate_of_row_id: string | null
          height_text: string
          id: string
          matched_team_id: string | null
          player_name: string
          position: string
          promoted_player_id: string | null
          raw_team_name: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_row_number: number
          weight: number | null
        }
        Insert: {
          acquired_label: string
          batch_id: string
          created_at?: string
          discord_handle: string
          display_team_name: string
          duplicate_of_row_id?: string | null
          height_text: string
          id?: string
          matched_team_id?: string | null
          player_name: string
          position: string
          promoted_player_id?: string | null
          raw_team_name: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_row_number: number
          weight?: number | null
        }
        Update: {
          acquired_label?: string
          batch_id?: string
          created_at?: string
          discord_handle?: string
          display_team_name?: string
          duplicate_of_row_id?: string | null
          height_text?: string
          id?: string
          matched_team_id?: string | null
          player_name?: string
          position?: string
          promoted_player_id?: string | null
          raw_team_name?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_row_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "roster_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_import_rows_duplicate_of_row_id_fkey"
            columns: ["duplicate_of_row_id"]
            isOneToOne: false
            referencedRelation: "roster_import_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_import_rows_matched_team_id_fkey"
            columns: ["matched_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_import_rows_promoted_player_id_fkey"
            columns: ["promoted_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_memberships: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          player_id: string
          roster_status: string
          starts_at: string
          team_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          player_id: string
          roster_status: string
          starts_at?: string
          team_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          player_id?: string
          roster_status?: string
          starts_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_cap_config: {
        Row: {
          cap_amount: number
          created_at: string
          id: string
          luxury_tax_threshold: number | null
          season: string
          updated_at: string
        }
        Insert: {
          cap_amount: number
          created_at?: string
          id?: string
          luxury_tax_threshold?: number | null
          season: string
          updated_at?: string
        }
        Update: {
          cap_amount?: number
          created_at?: string
          id?: string
          luxury_tax_threshold?: number | null
          season?: string
          updated_at?: string
        }
        Relationships: []
      }
      sheet_import_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          id: string
          message: string
          player_row_id: string | null
          raw_payload: Json
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: string
          severity: string
        }
        Insert: {
          conflict_type: string
          created_at?: string
          id?: string
          message: string
          player_row_id?: string | null
          raw_payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id: string
          severity?: string
        }
        Update: {
          conflict_type?: string
          created_at?: string
          id?: string
          message?: string
          player_row_id?: string | null
          raw_payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_import_conflicts_player_row_id_fkey"
            columns: ["player_row_id"]
            isOneToOne: false
            referencedRelation: "sheet_import_player_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_import_conflicts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sheet_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_import_player_rows: {
        Row: {
          attributes: Json
          badges: Json
          bank: Json
          created_at: string
          discord_handle: string | null
          drafted_or_free_agent: string | null
          height_inches: number | null
          height_text: string | null
          hotzones: Json
          id: string
          matched_team_id: string | null
          player_name: string
          primary_position: string | null
          promoted_player_id: string | null
          raw_payload: Json
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          roster_status: string
          run_id: string
          season_joined: string | null
          secondary_positions: string[]
          source_id: string
          source_row_key: string
          source_row_numbers: Json
          tendencies: Json
          tendency_review_status: string
          tendency_source_label: string | null
          two_way_ubanxt_label: string | null
          validation_errors: string[]
          weight: number | null
          wingspan_value: number | null
        }
        Insert: {
          attributes?: Json
          badges?: Json
          bank?: Json
          created_at?: string
          discord_handle?: string | null
          drafted_or_free_agent?: string | null
          height_inches?: number | null
          height_text?: string | null
          hotzones?: Json
          id?: string
          matched_team_id?: string | null
          player_name: string
          primary_position?: string | null
          promoted_player_id?: string | null
          raw_payload?: Json
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_status?: string
          run_id: string
          season_joined?: string | null
          secondary_positions?: string[]
          source_id: string
          source_row_key: string
          source_row_numbers?: Json
          tendencies?: Json
          tendency_review_status?: string
          tendency_source_label?: string | null
          two_way_ubanxt_label?: string | null
          validation_errors?: string[]
          weight?: number | null
          wingspan_value?: number | null
        }
        Update: {
          attributes?: Json
          badges?: Json
          bank?: Json
          created_at?: string
          discord_handle?: string | null
          drafted_or_free_agent?: string | null
          height_inches?: number | null
          height_text?: string | null
          hotzones?: Json
          id?: string
          matched_team_id?: string | null
          player_name?: string
          primary_position?: string | null
          promoted_player_id?: string | null
          raw_payload?: Json
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          roster_status?: string
          run_id?: string
          season_joined?: string | null
          secondary_positions?: string[]
          source_id?: string
          source_row_key?: string
          source_row_numbers?: Json
          tendencies?: Json
          tendency_review_status?: string
          tendency_source_label?: string | null
          two_way_ubanxt_label?: string | null
          validation_errors?: string[]
          weight?: number | null
          wingspan_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sheet_import_player_rows_matched_team_id_fkey"
            columns: ["matched_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_import_player_rows_promoted_player_id_fkey"
            columns: ["promoted_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_import_player_rows_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sheet_import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_import_player_rows_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "team_sheet_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_import_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          imported_by: string | null
          run_status: string
          source_id: string
          started_at: string
          summary: Json
          trigger_source: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          imported_by?: string | null
          run_status?: string
          source_id: string
          started_at?: string
          summary?: Json
          trigger_source?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          imported_by?: string | null
          run_status?: string
          source_id?: string
          started_at?: string
          summary?: Json
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_import_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "team_sheet_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_import_snapshots: {
        Row: {
          created_at: string
          id: string
          range_a1: string | null
          raw_values: Json
          row_count: number
          run_id: string
          tab_key: string
          tab_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          range_a1?: string | null
          raw_values?: Json
          row_count?: number
          run_id: string
          tab_key: string
          tab_name: string
        }
        Update: {
          created_at?: string
          id?: string
          range_a1?: string | null
          raw_values?: Json
          row_count?: number
          run_id?: string
          tab_key?: string
          tab_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_import_snapshots_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sheet_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          conference: string
          conference_rank: number
          id: string
          season: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          conference: string
          conference_rank: number
          id?: string
          season: string
          status: string
          team_id: string
          updated_at?: string
        }
        Update: {
          conference?: string
          conference_rank?: number
          id?: string
          season?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_affiliates: {
        Row: {
          affiliate_location: string
          created_at: string
          id: string
          nxt_team_id: string
          uba_team_id: string | null
        }
        Insert: {
          affiliate_location: string
          created_at?: string
          id?: string
          nxt_team_id: string
          uba_team_id?: string | null
        }
        Update: {
          affiliate_location?: string
          created_at?: string
          id?: string
          nxt_team_id?: string
          uba_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_affiliates_nxt_team_id_fkey"
            columns: ["nxt_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_affiliates_uba_team_id_fkey"
            columns: ["uba_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sheet_sources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_import_run_id: string | null
          notes: string | null
          source_status: string
          spreadsheet_id: string
          spreadsheet_title: string
          tabs: Json
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_import_run_id?: string | null
          notes?: string | null
          source_status?: string
          spreadsheet_id: string
          spreadsheet_title: string
          tabs?: Json
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_import_run_id?: string | null
          notes?: string | null
          source_status?: string
          spreadsheet_id?: string
          spreadsheet_title?: string
          tabs?: Json
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sheet_sources_last_run_fk"
            columns: ["last_import_run_id"]
            isOneToOne: false
            referencedRelation: "sheet_import_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_sheet_sources_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          cap_space: number
          conference: string | null
          created_at: string
          id: string
          jersey_alternate_url: string | null
          jersey_away_url: string | null
          jersey_home_url: string | null
          league: string
          logo_url: string | null
          market: string | null
          name: string
          primary_color: string
          roster_spots: number
          salary_contracts: Json
          short_name: string
          slug: string
          updated_at: string
        }
        Insert: {
          cap_space?: number
          conference?: string | null
          created_at?: string
          id?: string
          jersey_alternate_url?: string | null
          jersey_away_url?: string | null
          jersey_home_url?: string | null
          league: string
          logo_url?: string | null
          market?: string | null
          name: string
          primary_color: string
          roster_spots?: number
          salary_contracts?: Json
          short_name: string
          slug: string
          updated_at?: string
        }
        Update: {
          cap_space?: number
          conference?: string | null
          created_at?: string
          id?: string
          jersey_alternate_url?: string | null
          jersey_away_url?: string | null
          jersey_home_url?: string | null
          league?: string
          logo_url?: string | null
          market?: string | null
          name?: string
          primary_color?: string
          roster_spots?: number
          salary_contracts?: Json
          short_name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_proposals: {
        Row: {
          admin_notes: string | null
          expires_at: string | null
          id: string
          proposed_at: string
          proposed_by: string | null
          proposer_sends_player_ids: string[]
          proposer_sends_uc_amount: number
          proposer_team_id: string
          receiver_sends_player_ids: string[]
          receiver_sends_uc_amount: number
          receiver_team_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          expires_at?: string | null
          id?: string
          proposed_at?: string
          proposed_by?: string | null
          proposer_sends_player_ids?: string[]
          proposer_sends_uc_amount?: number
          proposer_team_id: string
          receiver_sends_player_ids?: string[]
          receiver_sends_uc_amount?: number
          receiver_team_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          expires_at?: string | null
          id?: string
          proposed_at?: string
          proposed_by?: string | null
          proposer_sends_player_ids?: string[]
          proposer_sends_uc_amount?: number
          proposer_team_id?: string
          receiver_sends_player_ids?: string[]
          receiver_sends_uc_amount?: number
          receiver_team_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_proposals_proposer_team_id_fkey"
            columns: ["proposer_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_proposals_receiver_team_id_fkey"
            columns: ["receiver_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      uc_ledger_events: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          event_type: string
          id: string
          player_id: string
          reason: string
          requested_by: string | null
          source_ref: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          event_type: string
          id?: string
          player_id: string
          reason: string
          requested_by?: string | null
          source_ref?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          event_type?: string
          id?: string
          player_id?: string
          reason?: string
          requested_by?: string | null
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uc_ledger_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      player_uc_balances: {
        Row: {
          balance: number | null
          player_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uc_ledger_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_account_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_team_gm: { Args: { team_id: string }; Returns: boolean }
      promote_roster_import_row: {
        Args: {
          import_row_id: string
          target_archetype?: string
          target_height_inches: number
          target_status: string
          target_team_id: string
          target_wingspan_inches: number
        }
        Returns: string
      }
      promote_sheet_import_player_row: {
        Args: { player_row_id: string }
        Returns: string
      }
      record_audit_event: {
        Args: {
          action: string
          metadata?: Json
          severity?: string
          target_id?: string
          target_table?: string
        }
        Returns: string
      }
      request_weekly_check_in: {
        Args: { target_player_id: string }
        Returns: string
      }
      set_sheet_import_player_tendencies: {
        Args: { player_row_id: string; reviewed_tendencies: Json }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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

const Constants = {
  public: {
    Enums: {},
  },
} as const
