export interface WebForm {
  id: number;
  name: string;
  code: string;
  embed_token: string;
  source: string;
  title?: string;
  description?: string;
  submit_button_text: string;
  success_message?: string;
  is_active: boolean;
  submission_count: number;
  rate_limit_per_minute: number;
  created_by?: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  leads_count?: number;
  embed_snippets?: {
    embed_token: string;
    submit_url: string;
    iframe_code: string;
    html_snippet: string;
  };
  recent_leads?: CapturedLead[];
  created_at: string;
  updated_at: string;
}

export interface CapturedLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  interest_demand?: string;
  source: string;
  status: string;
  web_form_id?: number;
  ip_address?: string;
  created_at: string;
}

export interface CreateWebFormData {
  name: string;
  source?: string;
  title?: string;
  description?: string;
  submit_button_text?: string;
  success_message?: string;
  rate_limit_per_minute?: number;
  is_active?: boolean;
}

export interface PublicLeadSubmitPayload {
  name: string;
  email: string;
  phone: string;
  company?: string;
  interest_demand?: string;
  _hp_website?: string; // honeypot
}
