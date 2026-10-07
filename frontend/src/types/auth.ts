export type UserRole = 'SALES_REP' | 'TEAM_LEADER' | 'SALES_DIRECTOR';
export type DataScope = 'MINE' | 'TEAM' | 'ALL';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  scope: DataScope;
}