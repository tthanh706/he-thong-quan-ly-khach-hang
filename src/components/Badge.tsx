import type { ReactNode } from 'react';

export type BadgeTone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'orange';

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
