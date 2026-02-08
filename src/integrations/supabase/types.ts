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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch: string
          created_at: string
          id: string
          is_active: boolean
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch?: string
          created_at?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      class_days: {
        Row: {
          class_month_id: string
          created_at: string
          date: string
          id: string
          is_extra: boolean
          title: string
        }
        Insert: {
          class_month_id: string
          created_at?: string
          date: string
          id?: string
          is_extra?: boolean
          title: string
        }
        Update: {
          class_month_id?: string
          created_at?: string
          date?: string
          id?: string
          is_extra?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_days_class_month_id_fkey"
            columns: ["class_month_id"]
            isOneToOne: false
            referencedRelation: "class_months"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_months: {
        Row: {
          class_id: string
          id: string
          monthly_fee_override: number | null
          year_month: string
        }
        Insert: {
          class_id: string
          id?: string
          monthly_fee_override?: number | null
          year_month: string
        }
        Update: {
          class_id?: string
          id?: string
          monthly_fee_override?: number | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_months_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_papers: {
        Row: {
          answer_pdf_url: string | null
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          paper_type: string
          pdf_url: string
          publish_status: string
          published_at: string | null
          review_video_url: string | null
          title: string
        }
        Insert: {
          answer_pdf_url?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          paper_type: string
          pdf_url: string
          publish_status?: string
          published_at?: string | null
          review_video_url?: string | null
          title: string
        }
        Update: {
          answer_pdf_url?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          paper_type?: string
          pdf_url?: string
          publish_status?: string
          published_at?: string | null
          review_video_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_papers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          admin_otp_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          grade_max: number
          grade_min: number
          id: string
          image_url: string | null
          is_private: boolean
          max_students: number | null
          monthly_fee_amount: number
          private_code: string | null
          title: string
        }
        Insert: {
          admin_otp_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_max: number
          grade_min: number
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_students?: number | null
          monthly_fee_amount?: number
          private_code?: string | null
          title: string
        }
        Update: {
          admin_otp_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_max?: number
          grade_min?: number
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_students?: number | null
          monthly_fee_amount?: number
          private_code?: string | null
          title?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          payment_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          payment_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          payment_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          class_day_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes_text: string | null
          pdf_url: string | null
          title: string
          youtube_url: string | null
        }
        Insert: {
          class_day_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes_text?: string | null
          pdf_url?: string | null
          title: string
          youtube_url?: string | null
        }
        Update: {
          class_day_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes_text?: string | null
          pdf_url?: string | null
          title?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_day_id_fkey"
            columns: ["class_day_id"]
            isOneToOne: false
            referencedRelation: "class_days"
            referencedColumns: ["id"]
          },
        ]
      }
      moderator_class_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          class_id: string
          id: string
          moderator_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          class_id: string
          id?: string
          moderator_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          class_id?: string
          id?: string
          moderator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderator_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          target_ref: string | null
          target_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          target_ref?: string | null
          target_type: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          target_ref?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          purpose: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          purpose: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          purpose?: string
        }
        Relationships: []
      }
      papers: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number
          grade: number | null
          id: string
          is_free: boolean
          medium: string | null
          paper_type: string
          pdf_url: string
          school_or_zone: string | null
          subject: string | null
          term: number | null
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          grade?: number | null
          id?: string
          is_free?: boolean
          medium?: string | null
          paper_type: string
          pdf_url: string
          school_or_zone?: string | null
          subject?: string | null
          term?: number | null
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number
          grade?: number | null
          id?: string
          is_free?: boolean
          medium?: string | null
          paper_type?: string
          pdf_url?: string
          school_or_zone?: string | null
          subject?: string | null
          term?: number | null
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          payment_type: string
          ref_id: string
          slip_url: string | null
          status: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          payment_type: string
          ref_id: string
          slip_url?: string | null
          status?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          payment_type?: string
          ref_id?: string
          slip_url?: string | null
          status?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          birthday: string | null
          created_at: string
          first_name: string
          grade: number | null
          id: string
          last_name: string
          phone: string
          school_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          created_at?: string
          first_name: string
          grade?: number | null
          id: string
          last_name: string
          phone: string
          school_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          birthday?: string | null
          created_at?: string
          first_name?: string
          grade?: number | null
          id?: string
          last_name?: string
          phone?: string
          school_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rank_answers_mcq: {
        Row: {
          attempt_id: string
          id: string
          question_id: string
          selected_option_no: number | null
        }
        Insert: {
          attempt_id: string
          id?: string
          question_id: string
          selected_option_no?: number | null
        }
        Update: {
          attempt_id?: string
          id?: string
          question_id?: string
          selected_option_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_answers_mcq_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "rank_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_answers_mcq_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "rank_mcq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_answers_uploads: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          pdf_url: string
          upload_type: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          pdf_url: string
          upload_type: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          pdf_url?: string
          upload_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_answers_uploads_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "rank_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_attempts: {
        Row: {
          auto_closed: boolean
          ends_at: string
          id: string
          rank_paper_id: string
          started_at: string
          submitted_at: string | null
          tab_switch_count: number
          user_id: string
          window_close_count: number
        }
        Insert: {
          auto_closed?: boolean
          ends_at: string
          id?: string
          rank_paper_id: string
          started_at?: string
          submitted_at?: string | null
          tab_switch_count?: number
          user_id: string
          window_close_count?: number
        }
        Update: {
          auto_closed?: boolean
          ends_at?: string
          id?: string
          rank_paper_id?: string
          started_at?: string
          submitted_at?: string | null
          tab_switch_count?: number
          user_id?: string
          window_close_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "rank_attempts_rank_paper_id_fkey"
            columns: ["rank_paper_id"]
            isOneToOne: false
            referencedRelation: "rank_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_marks: {
        Row: {
          attempt_id: string
          essay_score: number | null
          id: string
          mcq_score: number | null
          published_at: string | null
          reviewed_by: string | null
          short_essay_score: number | null
          total_score: number | null
        }
        Insert: {
          attempt_id: string
          essay_score?: number | null
          id?: string
          mcq_score?: number | null
          published_at?: string | null
          reviewed_by?: string | null
          short_essay_score?: number | null
          total_score?: number | null
        }
        Update: {
          attempt_id?: string
          essay_score?: number | null
          id?: string
          mcq_score?: number | null
          published_at?: string | null
          reviewed_by?: string | null
          short_essay_score?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_marks_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "rank_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_mcq_options: {
        Row: {
          id: string
          is_correct: boolean
          option_image_url: string | null
          option_no: number
          option_text: string | null
          question_id: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_image_url?: string | null
          option_no: number
          option_text?: string | null
          question_id: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_image_url?: string | null
          option_no?: number
          option_text?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_mcq_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "rank_mcq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_mcq_questions: {
        Row: {
          id: string
          q_no: number
          question_image_url: string | null
          question_text: string | null
          rank_paper_id: string
        }
        Insert: {
          id?: string
          q_no: number
          question_image_url?: string | null
          question_text?: string | null
          rank_paper_id: string
        }
        Update: {
          id?: string
          q_no?: number
          question_image_url?: string | null
          question_text?: string | null
          rank_paper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_mcq_questions_rank_paper_id_fkey"
            columns: ["rank_paper_id"]
            isOneToOne: false
            referencedRelation: "rank_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_papers: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          essay_pdf_url: string | null
          fee_amount: number | null
          grade: number
          has_essay: boolean
          has_mcq: boolean
          has_short_essay: boolean
          id: string
          lock_at: string | null
          publish_status: string
          review_video_url: string | null
          short_essay_pdf_url: string | null
          time_limit_minutes: number
          title: string
          unlock_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          essay_pdf_url?: string | null
          fee_amount?: number | null
          grade: number
          has_essay?: boolean
          has_mcq?: boolean
          has_short_essay?: boolean
          id?: string
          lock_at?: string | null
          publish_status?: string
          review_video_url?: string | null
          short_essay_pdf_url?: string | null
          time_limit_minutes?: number
          title: string
          unlock_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          essay_pdf_url?: string | null
          fee_amount?: number | null
          grade?: number
          has_essay?: boolean
          has_mcq?: boolean
          has_short_essay?: boolean
          id?: string
          lock_at?: string | null
          publish_status?: string
          review_video_url?: string | null
          short_essay_pdf_url?: string | null
          time_limit_minutes?: number
          title?: string
          unlock_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_papers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          price_both: number | null
          price_printed: number | null
          price_soft: number | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price_both?: number | null
          price_printed?: number | null
          price_soft?: number | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price_both?: number | null
          price_printed?: number | null
          price_soft?: number | null
          title?: string
          type?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_mod: { Args: { _user_id: string }; Returns: boolean }
      reorder_rank_mcq_questions: {
        Args: { new_order: number[]; question_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "student"
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
      app_role: ["admin", "moderator", "student"],
    },
  },
} as const
