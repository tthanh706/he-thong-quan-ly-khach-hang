interface BadgeProps {
  label: string;
  variant: 'lead' | 'prospect' | 'active' | 'inactive' | 'draft' | 'paused' | 'completed' | 'default';
}

const variantClass: Record<string, string> = {
  lead:      'badge badge--lead',
  prospect:  'badge badge--prospect',
  active:    'badge badge--active',
  inactive:  'badge badge--inactive',
  draft:     'badge badge--draft',
  paused:    'badge badge--paused',
  completed: 'badge badge--completed',
  default:   'badge badge--default',
};

const labelMap: Record<string, string> = {
  lead: 'Tiềm năng', prospect: 'Triển vọng', active: 'Hoạt động',
  inactive: 'Không HĐ', draft: 'Nháp', paused: 'Tạm dừng',
  completed: 'Hoàn thành',
};

export default function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={variantClass[variant] ?? variantClass.default}>
      {labelMap[label] ?? label}
    </span>
  );
}
