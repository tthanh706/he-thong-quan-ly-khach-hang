export interface TeamMember {
  id: number;
  name: string;
  email: string;
}

export interface PerformanceMember {
  user_id: number;
  name: string;
  email: string;
  calls: number;
  meetings: number;
  quotations: number;
  total_activities: number;
  assigned_leads: number;
  responded_leads: number;
  responded_within_sla: number;
  missed_sla: number;
  sla_rate: number;
}

export interface PerformanceSummary {
  member_count: number;
  calls: number;
  meetings: number;
  quotations: number;
  total_activities: number;
  assigned_leads: number;
  responded_within_sla: number;
  sla_rate: number;
}

export interface PerformanceReport {
  period: {
    date_from: string;
    date_to: string;
  };
  summary: PerformanceSummary;
  members: PerformanceMember[];
}