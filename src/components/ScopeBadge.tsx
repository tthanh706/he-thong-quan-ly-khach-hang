import { Badge, type BadgeTone } from './Badge';
import type { Scope } from '../types';
import { SCOPE_LABEL } from '../types';

const TONE: Record<Scope, BadgeTone> = {
  own: 'blue',
  team: 'violet',
  all: 'orange',
};

const HINT: Record<Scope, string> = {
  own: 'Chỉ bản ghi bạn sở hữu',
  team: 'Bản ghi của bạn và nhóm bạn',
  all: 'Toàn bộ bản ghi trong hệ thống',
};

export function ScopeBadge({ scope }: { scope: Scope }) {
  return (
    <Badge tone={TONE[scope]}>
      {SCOPE_LABEL[scope]} · {HINT[scope]}
    </Badge>
  );
}
