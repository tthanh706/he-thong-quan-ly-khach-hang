export interface CustomerHierarchy {
  id: number;
  name: string;
  parent_customer_id: number | null;
  children: CustomerHierarchy[];
}

export interface ContractCustomer {
  id: number;
  name: string;
  parent_customer_id: number | null;
}

export interface Contract {
  id: number;
  customer_id: number;
  contract_code: string;
  contract_name: string;
  contract_value: string;
  status: string;
  signed_date: string | null;
  customer?: ContractCustomer;
}

export interface GroupContractValue {
  customer_id: number;
  customer_name: string;
  group_customer_ids: number[];
  total_contract_value: string;
  contracts: Contract[];
}

export interface UpdateParentPayload {
  parent_customer_id: number | null;
}
