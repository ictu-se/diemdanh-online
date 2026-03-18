export type Attendee = {
  id: string;
  full_name: string;
  organization_name: string;
  email: string;
  phone_number: string;
  is_present: boolean;
  checked_in_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      attendees: {
        Row: Attendee;
        Insert: {
          id?: string;
          full_name: string;
          organization_name: string;
          email: string;
          phone_number: string;
          is_present?: boolean;
          checked_in_at?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          organization_name?: string;
          email?: string;
          phone_number?: string;
          is_present?: boolean;
          checked_in_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
