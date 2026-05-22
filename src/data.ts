/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StockItem, Channel, Order } from './types';

// Supported list of channels
export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    commissionPercent: 6.0,
    paymentFeePercent: 2.0,
    flatProcessingFee: 1000,
    freeShippingSubsidyPercent: 4.0,
    freeShippingMaxCap: 10000,
    color: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    commissionPercent: 5.5,
    paymentFeePercent: 2.0,
    flatProcessingFee: 1000,
    freeShippingSubsidyPercent: 3.0,
    freeShippingMaxCap: 8000,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    commissionPercent: 6.0,
    paymentFeePercent: 1.8,
    flatProcessingFee: 1000,
    freeShippingSubsidyPercent: 4.0,
    freeShippingMaxCap: 12000,
    color: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    commissionPercent: 0.0,
    paymentFeePercent: 0.0,
    flatProcessingFee: 0,
    freeShippingSubsidyPercent: 0.0,
    freeShippingMaxCap: 0,
    color: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  {
    id: 'expo',
    name: 'Expo Event',
    commissionPercent: 0.0,
    paymentFeePercent: 1.5, // QRIS fee
    flatProcessingFee: 0,
    freeShippingSubsidyPercent: 0.0,
    freeShippingMaxCap: 0,
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 'toko_fisik',
    name: 'Toko Fisik',
    commissionPercent: 0.0,
    paymentFeePercent: 0.0,
    flatProcessingFee: 0,
    freeShippingSubsidyPercent: 0.0,
    freeShippingMaxCap: 0,
    color: 'bg-violet-100 text-violet-800 border-violet-300'
  }
];

// Seed list of products
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Classic Oversized Hoodie',
    hpp: 120000,
    price: 249000,
    imageUrl: '👕',
    group: 'Best Seller',
    colors: ['Midnight Black', 'Emerald Green', 'Heather Gray']
  },
  {
    id: 'p2',
    name: 'Slim-Fit Cargo Pants',
    hpp: 140000,
    price: 299000,
    imageUrl: '👖',
    group: 'Cashcow',
    colors: ['Olive Green', 'Classic Khaki', 'Midnight Blue']
  },
  {
    id: 'p3',
    name: 'Pique Cotton Polo Shirt',
    hpp: 60000,
    price: 149000,
    imageUrl: '👕',
    group: 'Slow',
    colors: ['Navy Blue', 'Crisp White', 'Mustard Yellow']
  },
  {
    id: 'p4',
    name: 'Heavyweight Pocket Tee',
    hpp: 45000,
    price: 99000,
    imageUrl: '🎽',
    group: 'New',
    colors: ['Sand Beige', 'Off-White', 'Charcoal Gray']
  },
  {
    id: 'p5',
    name: 'Vintage Bomber Jacket',
    hpp: 180000,
    price: 399000,
    imageUrl: '🧥',
    group: 'Discontinue',
    colors: ['Crimson Red', 'Pitch Black']
  }
];

// Initial stock matrix (Products Color combos and sizes)
export const INITIAL_STOCKS: StockItem[] = [
  // Classic Oversized Hoodie
  {
    id: 'p1_Midnight Black',
    productId: 'p1',
    productName: 'Classic Oversized Hoodie',
    color: 'Midnight Black',
    stocks: { S: 15, M: 22, L: 35, XL: 18, '2XL': 12, '3XL': 8, '4XL': 5 }
  },
  {
    id: 'p1_Emerald Green',
    productId: 'p1',
    productName: 'Classic Oversized Hoodie',
    color: 'Emerald Green',
    stocks: { S: 10, M: 18, L: 20, XL: 15, '2XL': 8, '3XL': 4, '4XL': 2 }
  },
  {
    id: 'p1_Heather Gray',
    productId: 'p1',
    productName: 'Classic Oversized Hoodie',
    color: 'Heather Gray',
    stocks: { S: 12, M: 25, L: 30, XL: 22, '2XL': 14, '3XL': 6, '4XL': 3 }
  },
  // Slim-Fit Cargo Pants
  {
    id: 'p2_Olive Green',
    productId: 'p2',
    productName: 'Slim-Fit Cargo Pants',
    color: 'Olive Green',
    stocks: { S: 8, M: 16, L: 24, XL: 12, '2XL': 5, '3XL': 0, '4XL': 0 }
  },
  {
    id: 'p2_Classic Khaki',
    productId: 'p2',
    productName: 'Slim-Fit Cargo Pants',
    color: 'Classic Khaki',
    stocks: { S: 12, M: 20, L: 18, XL: 14, '2XL': 8, '3XL': 2, '4XL': 0 }
  },
  {
    id: 'p2_Midnight Blue',
    productId: 'p2',
    productName: 'Slim-Fit Cargo Pants',
    color: 'Midnight Blue',
    stocks: { S: 15, M: 22, L: 25, XL: 16, '2XL': 10, '3XL': 4, '4XL': 1 }
  },
  // Pique Cotton Polo Shirt
  {
    id: 'p3_Navy Blue',
    productId: 'p3',
    productName: 'Pique Cotton Polo Shirt',
    color: 'Navy Blue',
    stocks: { S: 4, M: 8, L: 12, XL: 8, '2XL': 3, '3XL': 1, '4XL': 0 }
  },
  {
    id: 'p3_Crisp White',
    productId: 'p3',
    productName: 'Pique Cotton Polo Shirt',
    color: 'Crisp White',
    stocks: { S: 6, M: 12, L: 15, XL: 10, '2XL': 5, '3XL': 2, '4XL': 1 }
  },
  {
    id: 'p3_Mustard Yellow',
    productId: 'p3',
    productName: 'Pique Cotton Polo Shirt',
    color: 'Mustard Yellow',
    stocks: { S: 3, M: 5, L: 8, XL: 4, '2XL': 2, '3XL': 0, '4XL': 0 }
  },
  // Heavyweight Pocket Tee
  {
    id: 'p4_Sand Beige',
    productId: 'p4',
    productName: 'Heavyweight Pocket Tee',
    color: 'Sand Beige',
    stocks: { S: 20, M: 35, L: 40, XL: 25, '2XL': 15, '3XL': 10, '4XL': 6 }
  },
  {
    id: 'p4_Off-White',
    productId: 'p4',
    productName: 'Heavyweight Pocket Tee',
    color: 'Off-White',
    stocks: { S: 25, M: 40, L: 45, XL: 30, '2XL': 18, '3XL': 12, '4XL': 8 }
  },
  {
    id: 'p4_Charcoal Gray',
    productId: 'p4',
    productName: 'Heavyweight Pocket Tee',
    color: 'Charcoal Gray',
    stocks: { S: 18, M: 28, L: 35, XL: 22, '2XL': 12, '3XL': 8, '4XL': 4 }
  },
  // Vintage Bomber Jacket
  {
    id: 'p5_Crimson Red',
    productId: 'p5',
    productName: 'Vintage Bomber Jacket',
    color: 'Crimson Red',
    stocks: { S: 0, M: 3, L: 8, XL: 5, '2XL': 2, '3XL': 0, '4XL': 0 }
  },
  {
    id: 'p5_Pitch Black',
    productId: 'p5',
    productName: 'Vintage Bomber Jacket',
    color: 'Pitch Black',
    stocks: { S: 2, M: 5, L: 10, XL: 8, '2XL': 4, '3XL': 1, '4XL': 0 }
  }
];

// Initial group names
export const INITIAL_GROUPS = ['Best Seller', 'Cashcow', 'Slow', 'New', 'Discontinue'];

// Generate dynamic order calculations helper
export function calculateOrderMetrics(params: {
  price: number;
  hpp: number;
  qty: number;
  discounts: number;
  isCod: boolean;
  channel: Channel;
}) {
  const { price, hpp, qty, discounts, isCod, channel } = params;
  const totalPrice = price * qty;
  const totalHpp = hpp * qty;

  // Let's compute fees
  const commission = Number(((totalPrice * channel.commissionPercent) / 100).toFixed(2));
  const paymentFee = Number(((totalPrice * channel.paymentFeePercent) / 100).toFixed(2));
  const processingFee = channel.flatProcessingFee;

  // Shipping subsidy based on % of totalPrice with Max Cap
  let freeShippingSubsidy = (totalPrice * channel.freeShippingSubsidyPercent) / 100;
  if (channel.freeShippingMaxCap > 0 && freeShippingSubsidy > channel.freeShippingMaxCap) {
    freeShippingSubsidy = channel.freeShippingMaxCap;
  }
  freeShippingSubsidy = Number(freeShippingSubsidy.toFixed(2));

  const totalFees = commission + paymentFee + processingFee + freeShippingSubsidy;
  const netRevenue = totalPrice - discounts - totalFees;
  const netProfit = netRevenue - totalHpp;

  return {
    totalPrice,
    totalHpp,
    discounts,
    commission,
    paymentFee,
    processingFee,
    freeShippingSubsidy,
    totalFees,
    netRevenue,
    netProfit
  };
}

// Pre-seeded list of initial historic orders from May 16 to May 22, 2026
export const INITIAL_ORDERS: Order[] = [
  // Today: May 22, 2026
  {
    id: 'ord_1',
    orderNumber: 'SP-20260522-001X',
    dateTime: '2026-05-22T08:15:00.000Z',
    channelId: 'shopee',
    isCod: false,
    products: [
      { productId: 'p1', color: 'Midnight Black', size: 'L', qty: 2, price: 249000, hpp: 120000 },
      { productId: 'p4', color: 'Sand Beige', size: 'XL', qty: 1, price: 99000, hpp: 45000 }
    ],
    totalPrice: 597000,
    totalHpp: 285000,
    discounts: 15000,
    calculatedFees: {
      commission: 35820,   // 6% of 597k
      paymentFee: 11940,   // 2% of 597k
      processingFee: 1000,
      freeShippingSubsidy: 10000, // 4% of 59k = 23.8k, capped at 10k
      totalFees: 58760
    },
    netRevenue: 523240, // 597k - 15k - 58.76k
    netProfit: 238240  // 523.24k - 285k
  },
  {
    id: 'ord_2',
    orderNumber: 'TK-20260522-772L',
    dateTime: '2026-05-22T10:30:00.000Z',
    channelId: 'tokopedia',
    isCod: false,
    products: [
      { productId: 'p2', color: 'Olive Green', size: 'M', qty: 1, price: 299000, hpp: 140000 }
    ],
    totalPrice: 299000,
    totalHpp: 140000,
    discounts: 0,
    calculatedFees: {
      commission: 16445, // 5.5%
      paymentFee: 5980,  // 2%
      processingFee: 1000,
      freeShippingSubsidy: 8000, // 3% of 299k is 8.97k, capped at 8k
      totalFees: 31425
    },
    netRevenue: 267575,
    netProfit: 127575
  },
  {
    id: 'ord_3',
    orderNumber: 'WA-20260522-991A',
    dateTime: '2026-05-22T12:00:00.000Z',
    channelId: 'whatsapp',
    isCod: true,
    products: [
      { productId: 'p3', color: 'Navy Blue', size: 'XL', qty: 3, price: 149000, hpp: 60000 }
    ],
    totalPrice: 447000,
    totalHpp: 180000,
    discounts: 20000,
    calculatedFees: {
      commission: 0,
      paymentFee: 0,
      processingFee: 0,
      freeShippingSubsidy: 0,
      totalFees: 0
    },
    netRevenue: 427000,
    netProfit: 247000
  },
  // May 21
  {
    id: 'ord_4',
    orderNumber: 'TT-20260521-331B',
    dateTime: '2026-05-21T14:20:00.000Z',
    channelId: 'tiktok_shop',
    isCod: false,
    products: [
      { productId: 'p1', color: 'Emerald Green', size: '2XL', qty: 1, price: 249000, hpp: 120000 }
    ],
    totalPrice: 249000,
    totalHpp: 120000,
    discounts: 0,
    calculatedFees: {
      commission: 14940,
      paymentFee: 4482,
      processingFee: 1000,
      freeShippingSubsidy: 9960,
      totalFees: 30382
    },
    netRevenue: 218618,
    netProfit: 98618
  },
  {
    id: 'ord_5',
    orderNumber: 'EX-20260521-881C',
    dateTime: '2026-05-21T16:00:00.000Z',
    channelId: 'expo',
    isCod: false,
    products: [
      { productId: 'p5', color: 'Pitch Black', size: 'XL', qty: 2, price: 399000, hpp: 180000 }
    ],
    totalPrice: 798000,
    totalHpp: 360000,
    discounts: 50000,
    calculatedFees: {
      commission: 0,
      paymentFee: 11970, // 1.5% QRIS
      processingFee: 0,
      freeShippingSubsidy: 0,
      totalFees: 11970
    },
    netRevenue: 736030,
    netProfit: 376030
  },
  // May 20
  {
    id: 'ord_6',
    orderNumber: 'SP-20260520-221M',
    dateTime: '2026-05-20T10:00:00.000Z',
    channelId: 'shopee',
    isCod: false,
    products: [
      { productId: 'p1', color: 'Heather Gray', size: 'M', qty: 3, price: 249000, hpp: 120000 }
    ],
    totalPrice: 747000,
    totalHpp: 360000,
    discounts: 30000,
    calculatedFees: {
      commission: 44820,
      paymentFee: 14940,
      processingFee: 1000,
      freeShippingSubsidy: 10000,
      totalFees: 70760
    },
    netRevenue: 646240,
    netProfit: 286240
  },
  // May 19
  {
    id: 'ord_7',
    orderNumber: 'TK-20260519-002P',
    dateTime: '2026-05-19T11:00:00.000Z',
    channelId: 'tokopedia',
    isCod: false,
    products: [
      { productId: 'p2', color: 'Classic Khaki', size: 'XL', qty: 2, price: 299000, hpp: 140000 }
    ],
    totalPrice: 598000,
    totalHpp: 280000,
    discounts: 10000,
    calculatedFees: {
      commission: 32890,
      paymentFee: 11960,
      processingFee: 1000,
      freeShippingSubsidy: 8000,
      totalFees: 53850
    },
    netRevenue: 534150,
    netProfit: 254150
  },
  // May 18
  {
    id: 'ord_8',
    orderNumber: 'TF-20260518-111A',
    dateTime: '2026-05-18T15:30:00.000Z',
    channelId: 'toko_fisik',
    isCod: false,
    products: [
      { productId: 'p4', color: 'Off-White', size: 'M', qty: 4, price: 99000, hpp: 45000 }
    ],
    totalPrice: 396000,
    totalHpp: 180000,
    discounts: 0,
    calculatedFees: {
      commission: 0,
      paymentFee: 0,
      processingFee: 0,
      freeShippingSubsidy: 0,
      totalFees: 0
    },
    netRevenue: 396000,
    netProfit: 216000
  },
  // May 17
  {
    id: 'ord_9',
    orderNumber: 'WA-20260517-552Z',
    dateTime: '2026-05-17T09:45:00.000Z',
    channelId: 'whatsapp',
    isCod: false,
    products: [
      { productId: 'p1', color: 'Midnight Black', size: '2XL', qty: 2, price: 249000, hpp: 120000 }
    ],
    totalPrice: 498000,
    totalHpp: 240000,
    discounts: 0,
    calculatedFees: {
      commission: 0,
      paymentFee: 0,
      processingFee: 0,
      freeShippingSubsidy: 0,
      totalFees: 0
    },
    netRevenue: 498000,
    netProfit: 258000
  },
  // May 16
  {
    id: 'ord_10',
    orderNumber: 'SP-20260516-7789',
    dateTime: '2026-05-16T13:10:00.000Z',
    channelId: 'shopee',
    isCod: false,
    products: [
      { productId: 'p3', color: 'Crisp White', size: 'M', qty: 5, price: 149000, hpp: 60000 }
    ],
    totalPrice: 745000,
    totalHpp: 300000,
    discounts: 40000,
    calculatedFees: {
      commission: 44700,
      paymentFee: 14900,
      processingFee: 1000,
      freeShippingSubsidy: 10000,
      totalFees: 70600
    },
    netRevenue: 634400,
    netProfit: 334400
  }
];
