import { SEED } from '../data/seed';
import type { Activity, Customer, EntityName, Opportunity, OwnedRecord, Quote, Team, User } from '../types';

export interface Database {
  teams: Team[];
  users: User[];
  customers: Customer[];
  opportunities: Opportunity[];
  activities: Activity[];
  quotes: Quote[];
}

function cloneDatabase(seed: Database): Database {
  return structuredClone(seed);
}

type Patch<T> = Partial<Omit<T, 'id' | 'createdAt'>>;

/**
 * Cơ sở dữ liệu in-memory mô phỏng API thật.
 * Lớp này KHÔNG biết gì về phân quyền - mọi quy tắc nằm ở ScopedRepository.
 */
export class CrmStore {
  private state: Database;
  private readonly listeners = new Set<() => void>();

  constructor(seed: Database = SEED) {
    this.state = cloneDatabase(seed);
  }

  users(): User[] {
    return this.state.users;
  }

  teams(): Team[] {
    return this.state.teams;
  }

  userById(id: string): User | undefined {
    return this.state.users.find((user) => user.id === id);
  }

  teamById(id: string): Team | undefined {
    return this.state.teams.find((team) => team.id === id);
  }

  userName(id: string): string {
    return this.userById(id)?.name ?? 'Không rõ';
  }

  teamName(id: string): string {
    return this.teamById(id)?.name ?? 'Không rõ';
  }

  /** Lấy toàn bộ bản ghi của một module (chưa lọc phạm vi) */
  table(entity: EntityName): OwnedRecord[] {
    switch (entity) {
      case 'customer':
        return this.state.customers;
      case 'opportunity':
        return this.state.opportunities;
      case 'activity':
        return this.state.activities;
      case 'quote':
        return this.state.quotes;
      default: {
        const exhaustive: never = entity;
        return exhaustive;
      }
    }
  }

  find(entity: EntityName, id: string): OwnedRecord | undefined {
    return this.table(entity).find((row) => row.id === id);
  }

  insert<T extends OwnedRecord>(entity: EntityName, row: T): T {
    this.table(entity).push(row);
    this.emit();
    return row;
  }

  update<T extends OwnedRecord>(entity: EntityName, id: string, patch: Patch<T>): T | undefined {
    const rows = this.table(entity);
    const index = rows.findIndex((row) => row.id === id);
    const current = rows[index] as T | undefined;
    if (index === -1 || !current) return undefined;
    const next = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    } as T;
    rows[index] = next;
    this.emit();
    return next;
  }

  remove(entity: EntityName, id: string): boolean {
    const rows = this.table(entity);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return false;
    rows.splice(index, 1);
    this.emit();
    return true;
  }

  reset(): void {
    this.state = cloneDatabase(SEED);
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const store = new CrmStore();
