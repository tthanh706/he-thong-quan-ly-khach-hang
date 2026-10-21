export interface OpportunityMember {
  id: number;
  opportunity_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  role: 'member' | 'collaborator';
  added_by: number | null;
  added_by_user?: {
    id: number;
    name: string;
  } | null;
  added_at: string;
  created_at: string;
}

export interface OpportunityOwnershipLog {
  id: number;
  opportunity_id: number;
  from_owner_id: number | null;
  from_owner?: {
    id: number;
    name: string;
  } | null;
  to_owner_id: number;
  to_owner?: {
    id: number;
    name: string;
  };
  changed_by: number;
  changed_by_user?: {
    id: number;
    name: string;
  };
  note: string | null;
  changed_at: string;
}

export interface AddMemberRequest {
  user_id: number;
  role?: 'member' | 'collaborator';
}

export interface TransferOwnershipRequest {
  new_owner_id: number;
  note?: string | null;
  keep_as_member?: boolean;
}