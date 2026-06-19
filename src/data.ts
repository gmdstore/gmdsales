/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StockItem, Channel, Order } from './types';

// Standard set of default initial sales channels
export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    commissionPercent: 6.0,
    paymentFeePercent: 2.0,
    flatProcessingFee: 1000,
    freeShippingSubsidyPercent: 4.0,
    freeShippingMaxCap: 10000,
    color: 'bg-orange-100 text-orange-850 border-orange-250',
    paymentMethods: ['Transfer', 'COD', 'E-Wallet']
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    commissionPercent: 5.5,
    paymentFeePercent: 2.0,
    flatProcessingFee: 1000,
    freeShippingSubsidyPercent: 3.0,
    freeShippingMaxCap: 8000,
    color: 'bg-emerald-100 text-emerald-850 border-emerald-250',
    paymentMethods: ['Transfer', 'E-Wallet']
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    commissionPercent: 0.0,
    paymentFeePercent: 0.0,
    flatProcessingFee: 0,
    freeShippingSubsidyPercent: 0.0,
    freeShippingMaxCap: 0,
    color: 'bg-teal-100 text-teal-850 border-teal-250',
    paymentMethods: ['Transfer', 'COD']
  }
];

// Clean slate: no default products
export const INITIAL_PRODUCTS: Product[] = [];

// Clean slate: no default stocks
export const INITIAL_STOCKS: StockItem[] = [];

// Clean slate: default category groups for sorting products
export const INITIAL_GROUPS: string[] = ['Best Seller', 'Slow Moving', 'New Arrivals'];

// Clean slate: no pre-seeded default orders
export const INITIAL_ORDERS: Order[] = [];

/**
 * Clean calculations for order metrics based on the Channel rules.
 * Handled dynamically at order submission time.
 */
export function calculateOrderMetrics(params: {
  price: number;
  hpp: number;
  qty: number;
  discounts: number;
  channel: Channel;
}) {
  const { price, hpp, qty, discounts, channel } = params;
  const totalPrice = price * qty;
  const totalHpp = hpp * qty;

  // Let's compute fees based on active channel parameters
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
