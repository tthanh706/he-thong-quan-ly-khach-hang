export interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  manager: string;
  type: 'company' | 'department' | 'team';
  children?: DepartmentNode[];
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  manager: string;
  parentId: string;
  type: 'department' | 'team';
}