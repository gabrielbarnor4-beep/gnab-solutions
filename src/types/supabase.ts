// Generated via `supabase gen types typescript --project-id <id> > src/types/supabase.ts`
// Last generated: 2026-09-03 — commit this file. Re-generate after any migration 027+.
// This is a lightweight stub covering tables used in strict mode; expand via real gen.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string
          name: string
          category: string | null
          short_description: string | null
          full_description: string | null
          image_url: string | null
          published: boolean
          show_in_footer: boolean
          footer_label: string | null
          footer_path: string | null
          display_order: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['services']['Row']>
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
      site_settings: { Row: { key: string; value: string; updated_at: string }; Insert: { key: string; value: string }; Update: { value?: string } }
      products: { Row: { id: string; name: string; category: string | null; status: string; display_order: number; image_url: string | null; deleted_at: string | null }; Insert: Partial<Database['public']['Tables']['products']['Row']>; Update: Partial<Database['public']['Tables']['products']['Row']> }
      // ... other tables use lib/siteData.tsx Row helpers until full gen
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
