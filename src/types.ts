/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  sku?: string;
  hpp: number;
  price: number;
  imageUrl: string;
  group: string; // Dynamic product category group (e.g. "Best Seller", "Cashcow", "Slow", "New", "Discontinue")
  colors: string[];
  sizes?: string[]; // Allowed sizes for this product
}

export interface StockItem {
  id: string; // Format: `${productId}_${color}`
  productId: string;
  productName: string;
  color: string;
  stocks: { [size: string]: number }; // Size (S, M, L, XL, 2XL, 3XL, 4XL) to available stock quantity
}

export type PaymentMethodType = string;

export interface Channel {
  id: string; // e.g., 'shopee', 'tokopedia', 'tiktok', 'whatsapp', 'expo', 'toko_fisik'
  name: string;
  commissionPercent: number; // in % (e.g. 6.0)
  paymentFeePercent: number; // in % (e.g. 2.0)
  flatProcessingFee: number; // in Rp (e.g. 1000)
  freeShippingSubsidyPercent: number; // in % (e.g. 4.0)
  freeShippingMaxCap: number; // in Rp (e.g. 10000)
  color: string; // theme color class for badges like 'bg-orange-100 text-orange-800'
  paymentMethods: PaymentMethodType[]; // Methods available for this channel
}

export interface OrderProduct {
  productId: string;
  color: string;
  size: string;
  qty: number;
  price: number; // locked price at time of order
  hpp: number; // locked HPP at time of order
}

export interface Order {
  id: string;
  orderNumber: string; // Input validation: must not contain spaces and must be unique
  dateTime: string; // ISO date string or standard datetime
  channelId: string;
  paymentMethod: PaymentMethodType;
  products: OrderProduct[];
  totalPrice: number; // Omset Kotor: sum(price * qty)
  totalHpp: number; // sum(hpp * qty)
  discounts: number; // extra store discounts entered in popup
  // Detailed calculations (F-04 Calculator)
  calculatedFees: {
    commission: number;
    paymentFee: number;
    processingFee: number;
    freeShippingSubsidy: number;
    totalFees: number;
  };
  netRevenue: number; // Omset Bersih = totalPrice - discounts - totalFees
  netProfit: number; // Laba Bersih = netRevenue - totalHpp
}

export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'All Size'] as const;
export type SizeType = typeof SIZES[number];
