export interface Client {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  payrollSent: boolean;
  union?: {
    name?: string;
    baseDate?: string;
  };
} 