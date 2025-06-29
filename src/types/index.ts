// Types for the Supabase database tables

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'teacher' | 'admin';
  current_plan: 'free' | 'pro';
  pro_trial_enabled?: boolean;
  pro_trial_start_date?: string | null;
  pro_subscription_active?: boolean;
  subscription_start_date?: string | null;
  subscription_expires_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  teacher_id: string;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  teacher_id: string;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  created_at: string;
}

export interface Evaluation {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  created_at: string;
  date: string;
  is_published: boolean;
  teacher_id: string;
  value?: number;
  criterion_id?: string;
  student_id?: string;
  evaluation_title_id?: string;
}

export interface Criteria {
  id: string;
  evaluation_id: string;
  name: string;
  description: string | null;
  max_score: number;
  weight: number;
  created_at: string;
}

export interface StudentEvaluation {
  id: string;
  student_id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConditionalFormatting {
  id: string;
  min_score: number;
  max_score: number;
  color: string;
  teacher_id: string;
  created_at: string;
  evaluation_title?: string | null;
  evaluation_title_id?: string | null;
}

export interface EvaluationWithScore extends Evaluation {
  avg_score: number | null;
  max_possible_score: number | null;
}

export interface StudentTotalWithFormatting {
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  class_name: string;
  total: number;
  total_color: string;
  teacher_id: string;
  evaluation_title: string;
}

export interface Payment {
  id: string;
  user_id: string;
  email: string;
  amount: number;
  currency: string;
  method: string;
  plan_name: string;
  status: 'waiting' | 'paid' | 'failed' | 'cancelled';
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  subscription_id?: string;
  plan_expiration_date?: string;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface Session {
  user: User | null;
  error: Error | null;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}