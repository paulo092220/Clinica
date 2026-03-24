
export type UserRole = 'ADMIN' | 'DENTIST';

export interface User {
  id: string;
  name: string;
  role: string;
  roleType: UserRole;
  avatar: string;
  color: string;
  password?: string;
}

export interface GalleryItem {
  id: string;
  date: string;
  type: 'Photo' | 'X-Ray';
  url: string; // base64 or blob url
  notes?: string;
}

export interface ConsumedItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  doctor: string;
  observations: string;
  amountPaidCUP: number;
  amountPaidUSD: number;
  extraChargeCUP?: number;
  extraChargeUSD?: number;
  extraChargeReason?: string;
  paidCurrency: Currency;
  paymentMethod: PaymentMethod;
  services: PerformedService[];
  suppliesUsed?: ConsumedItem[];
  followUpTreatment?: string;
  appointmentCreatedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone?: string;
  treatingDoctor?: string;
  lastVisit: string;
  nextAppointment?: string;
  history: TreatmentRecord[];
  gallery: GalleryItem[];
  age: number;
  odontogramData?: Record<number, Record<string, 'red' | 'blue' | 'green' | 'none'>>;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';
export type Currency = 'CUP' | 'USD';

export interface PerformedService {
  serviceId: string;
  name: string;
  priceCUP: number;
  priceUSD: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  priceCUP: number;
  priceUSD: number;
  exchangeRate: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number; 
  doctorName?: string;
  date: string;
  time: string;
  serviceId: string;
  type: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  priceCUP: number;
  priceUSD: number;
  reservationFeeCUP: number; 
  reservationFeeUSD: number; 
  paymentMethod: PaymentMethod;
  createdAt?: string;
}

export interface CommissionEntry {
  id: string;
  appointmentId?: string;
  doctorName: string;
  patientName: string;
  treatmentType: string;
  date: string;
  priceCUP: number;
  priceUSD: number;
  commissionPercentage: number;
  commissionCUP: number;
  commissionUSD: number;
  status: 'pending' | 'paid';
}

export interface FixedExpense {
  id: string;
  category: 'Limpieza' | 'Alquiler' | 'Electricidad' | 'Merienda' | 'Marketing' | 'Mantenimiento' | 'Insumos' | 'Otros';
  amountCUP: number;
  amountUSD: number;
  date: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  priceCUP: number;
  priceUSD: number;
  lastRestock?: string;
  history: InventoryTransaction[];
}

export interface InventoryTransaction {
  id: string;
  date: string;
  type: 'In' | 'Out';
  quantity: number;
  note?: string;
  doctorName?: string;
}

export interface DistributionConfig {
  investmentRecovery: number; // % (e.g., 40)
  operatingCosts: number;    // % (e.g., 20)
  investorPartner: number;   // % (e.g., 15)
  doctorCommission: number;  // % (fixed 25 in prompt, but let's allow editing if needed)
}

export interface Investment {
  id: string;
  name: string;
  amountCUP: number;
  amountUSD: number;
  date: string;
  category: 'Equipamiento' | 'Infraestructura' | 'Tecnología' | 'Mobiliario' | 'Otros';
  status: 'Planificado' | 'Realizado' | 'En Proceso';
  notes?: string;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  PATIENTS = 'patients',
  CALENDAR = 'calendar',
  AI_CONSULTANT = 'ai-consultant',
  COMMISSIONS = 'commissions',
  SERVICES = 'services',
  BILLING = 'billing',
  SETTINGS = 'settings',
  STATISTICS = 'statistics',
  FINANCIAL_DISTRIBUTION = 'financial-distribution',
  INVENTORY = 'inventory',
  INVESTMENTS = 'investments'
}
