export type PaymentMethod = {
  id: string;
  name: string;
  slug: string;
  category: string;
  methodType: 'digital' | 'bank' | 'crypto' | 'cash';
  exchangeRateId: string | null;
  details: Array<{ key: string; value: string }>;
  exchangeRate?: {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    label: string;
    isActive?: boolean;
  } | null;
  sortOrder: number;
  isActive: boolean;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export type PaymentRequest = {
  id: string;
  userId: string;
  athleteName: string;
  planId: string;
  planName: string;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodCategory: string;
  fullName: string;
  phone: string;
  country: string;
  sellerCode: string;
  email: string;
  amount: number;
  amountUsd?: number;
  amountConverted?: number | null;
  convertedCurrency?: string | null;
  exchangeRateSnapshot?: number | null;
  status: PaymentRequestStatus;
  rejectionReason: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  receiptMime: string;
  receiptSize: number;
  receiptUrl?: string;
};

export type SubmitPaymentRequestInput = {
  planId: string;
  paymentMethodId: string;
  fullName: string;
  phone: string;
  country: string;
  sellerCode?: string;
  email: string;
  amountUsd?: number;
  amountConverted?: number;
  convertedCurrency?: string;
  exchangeRateSnapshot?: number;
  receipt: File;
};
