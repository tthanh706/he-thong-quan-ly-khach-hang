export interface AuditLogItem {
  id: number;
  username: string;
  action: string;
  targetModule: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface CustomFieldItem {
  id: number;
  module: 'Customer' | 'Opportunity';
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Select';
  isRequired: boolean;
}