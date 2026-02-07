// User & Auth Types
export type UserRole = 'ADMIN' | 'MODERATOR' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  birthday: string;
  address: string;
  grade: number;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

// Class Types
export interface Class {
  id: string;
  title: string;
  description: string;
  gradeMin: number;
  gradeMax: number;
  monthlyFeeAmount: number;
  isPrivate: boolean;
  privateCode?: string;
  adminOtpPhone?: string;
  createdBy: string;
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  userId: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'REMOVED';
}

export interface ClassMonth {
  id: string;
  classId: string;
  yearMonth: string;
  monthlyFeeAmountOverride?: number;
}

export interface ClassDay {
  id: string;
  classMonthId: string;
  date: string;
  isExtra: boolean;
  title?: string;
}

export interface Lesson {
  id: string;
  classDayId: string;
  title: string;
  description: string;
  notesText?: string;
  pdfUrl?: string;
  youtubeUrl?: string;
  createdBy: string;
  createdAt: string;
}

// Payment Types
export type PaymentType = 'CLASS_MONTH' | 'RANK_PAPER' | 'SHOP_ORDER';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: string;
  userId: string;
  paymentType: PaymentType;
  refId: string;
  amount: number;
  slipUrl: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  note?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  isActive: boolean;
}

// Coupon Types
export type DiscountType = 'PERCENT' | 'FIXED' | 'FULL';
export type CouponScopeType = 'CLASS_MONTH' | 'CLASS' | 'RANK_PAPER' | 'SHOP_PRODUCT' | 'SHOP_ORDER';

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  scopeType: CouponScopeType;
  scopeRefId?: string;
  expiresAt?: string;
  maxUsesPerUser: number;
  createdAt: string;
}

// Rank Paper Types
export type PublishStatus = 'DRAFT' | 'PUBLISHED';

export interface RankPaper {
  id: string;
  title: string;
  grade: number;
  classId?: string;
  feeAmount?: number;
  timeLimitMinutes: number;
  hasMcq: boolean;
  hasShortEssay: boolean;
  hasEssay: boolean;
  essayPdfUrl?: string;
  reviewVideoUrl?: string;
  publishStatus: PublishStatus;
  createdAt: string;
}

export interface RankMcqQuestion {
  id: string;
  rankPaperId: string;
  qNo: number;
  questionText?: string;
  questionImageUrl?: string;
  options: RankMcqOption[];
}

export interface RankMcqOption {
  id: string;
  questionId: string;
  optionNo: number;
  optionText?: string;
  optionImageUrl?: string;
  isCorrect: boolean;
}

export interface RankAttempt {
  id: string;
  rankPaperId: string;
  userId: string;
  startedAt: string;
  endsAt: string;
  submittedAt?: string;
  autoClosed: boolean;
}

// Shop Types
export type ProductType = 'SOFT' | 'PRINTED' | 'BOTH';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID_VERIFIED' | 'REJECTED';

export interface ShopProduct {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  priceSoft?: number;
  pricePrinted?: number;
  priceBoth?: number;
  pdfUrl?: string;
  isActive: boolean;
}

export interface ShopOrder {
  id: string;
  userId: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  selectedType: ProductType;
  price: number;
}

// Notification Types
export type NotificationTargetType = 'ALL' | 'CLASS' | 'USER_LIST';

export interface Notification {
  id: string;
  targetType: NotificationTargetType;
  targetRef?: string;
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
}
