export enum AppView {
  LANDING = 'LANDING',
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

export enum CustomerView {
  HOME = 'HOME', // Rich Menu
  SHOP = 'SHOP',
  CART = 'CART',
  NEW_ARRIVALS = 'NEW_ARRIVALS',
  HOW_TO = 'HOW_TO',
  SUCCESS = 'SUCCESS'
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  unitQty?: number;       // จำนวนชิ้นต่อหน่วย เช่น 1 แพ็ค = 12 ชิ้น (ถ้าไม่มีให้ถือว่า 1)
  bulkQty?: number;       // จำนวนขั้นต่ำพิเศษ เช่น สั่ง 10 แพ็คขึ้นไป
  bulkPrice?: number;     // ราคาพิเศษเมื่อสั่งถึง bulkQty
  stock: number;
  unit?: string;
  image: string;
  images?: string[];
  description?: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  linkedProductIds: string[];
  createdAt: string; // ISO Date
  expiresAt: string; // ISO Date
  isActive: boolean;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED' | 'COMPLETED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerContact: string; // Phone or Line ID
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  address?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: string;
  trackingNumber?: string;
  courier?: string;
  refundAmount?: number; // ยอดที่คืนลูกค้า
  netAmount?: number;    // ยอดสุทธิหลังหักคืน (totalAmount - refundAmount)
  notes?: string;
  managedBy?: string;
  customerLineUserId?: string;
  customerLineDisplayName?: string;
  customerLinePictureUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
