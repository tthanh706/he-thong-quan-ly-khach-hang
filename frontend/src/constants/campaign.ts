export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Đang chạy' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

export const CAMPAIGN_CHANNEL_OPTIONS = [
  { value: 'facebook', label: 'Facebook Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'zalo', label: 'Zalo OA / Zalo Ads' },
  { value: 'website', label: 'Website / SEO' },
  { value: 'offline', label: 'Offline / Event' },
  { value: 'other', label: 'Khác' },
] as const;

export const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  active: 'green',
  paused: 'orange',
  completed: 'blue',
  cancelled: 'red',
};