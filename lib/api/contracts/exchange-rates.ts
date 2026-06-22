export type ExchangeRate = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  label: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
