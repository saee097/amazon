// types/supabase.ts
/**
 * Minimal TypeScript type definitions for the Supabase tables used in this project.
 * In a real project you would generate these automatically with `supabase gen types`.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // UUID (references auth.users.id)
          role: 'superadmin' | 'admin' | 'customer';
          created_at: string; // timestamp
        };
        Insert: {
          id: string;
          role: 'superadmin' | 'admin' | 'customer';
          created_at?: string;
        };
        Update: Partial<{
          role: 'superadmin' | 'admin' | 'customer';
        }>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_by: string; // admin or superadmin user id
          created_at: string;
        };
        Insert: {
          name: string;
          email: string;
          created_by: string;
        };
        Update: Partial<{
          name: string;
          email: string;
        }>;
      };
      admins: {
        Row: {
          id: string; // same as auth.users.id
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
        };
        Update: Partial<{
          email: string;
        }>;
      };
    };
  };
};
