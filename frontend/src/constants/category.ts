export const CATEGORY_TYPES = {
  LEAD_SOURCE: 'LEAD_SOURCE',
  INDUSTRY: 'INDUSTRY',
  COMPANY_TYPE: 'COMPANY_TYPE',
} as const;

export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  LEAD_SOURCE: 'Nguồn Lead',
  INDUSTRY: 'Ngành nghề',
  COMPANY_TYPE: 'Loại hình doanh nghiệp',
};