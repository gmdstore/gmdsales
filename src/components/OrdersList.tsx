/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Order, Channel, Product } from '../types';
import { Search, Filter, Edit2, Trash2, Calendar, ShoppingBag, DollarSign, AlertCircle, RefreshCw, Copy, Check, Info } from 'lucide-react';

interface OrdersListProps {
  orders: Order[];
  channels: Channel[];
  products: Product[];
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrdersList({
  orders,
  channels,
  products,
  onEditOrder,
  onDeleteOrder
}: OrdersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'all' | 'Transfer' | 'COD' | 'E-Wallet' | 'Lainnya'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ orderId: string; type: 'discount' | 'commission' } | null>(null);

  React.useEffect(() => {
    const handleDocumentClick = () => {
      setActiveTooltip(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Format currency helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter orders
  const filteredOrders = orders.filter(ord => {
    const matchSearch = ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchChannel = selectedChannelId === 'all' ? true : ord.channelId === selectedChannelId;
    const matchPayment = selectedPaymentMethod === 'all' ? true : ord.paymentMethod === selectedPaymentMethod;
    
    // Check Date Range Filter
    const matchDate = () => {
      if (dateFilter === 'all') return true;

      const orderDate = new Date(ord.dateTime);
      if (isNaN(orderDate.getTime())) return true; // fallback for invalid dates

      const now = new Date();
      
      // Today (local midnight to local end of day)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Yesterday
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

      // This Week (Monday to Sunday)
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);

      // This Month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      switch (dateFilter) {
        case 'today':
          return orderDate >= todayStart && orderDate <= todayEnd;
        case 'yesterday':
          return orderDate >= yesterdayStart && orderDate <= yesterdayEnd;
        case 'this_week':
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        case 'this_month':
          return orderDate >= startOfMonth && orderDate <= endOfMonth;
        case 'custom': {
          if (!customStartDate && !customEndDate) return true;
          let match = true;
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            match = match && orderDate >= start;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            match = match && orderDate <= end;
          }
          return match;
        }
        default:
          return true;
      }
    };

    return matchSearch && matchChannel && matchPayment && matchDate();
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Calculate summary metrics for filtered orders
  const metrics = useMemo(() => {
    let totalHargaJual = 0;
    let totalDiskonVoucher = 0;
    let totalKomisi = 0;
    let totalOmset = 0;
    let totalHpp = 0;
    let totalLaba = 0;

    filteredOrders.forEach((order) => {
      // 1. Total Harga Jual (harga jual yang sudah dikurangi diskon & voucher, matches the 'Harga Jual' column total sum)
      const totalGross = order.products.reduce((sum, pr) => sum + (pr.price * pr.qty), 0);
      order.products.forEach((p) => {
        const allocatedVoucherPerUnit = totalGross > 0 ? (p.price / totalGross) * order.discounts : 0;
        const finalPrice = Math.max(0, p.price - allocatedVoucherPerUnit);
        totalHargaJual += finalPrice * p.qty;

        // Item-level automatic discounts (track for diskon card)
        totalDiskonVoucher += (p.discountAmount ?? 0) * p.qty;
      });

      // 2. Extra Store discounts (manual discounts / vouchers entered)
      totalDiskonVoucher += order.discounts;

      // 3. Total Komisi (sum of commission, paymentFee, processingFee, and freeShippingSubsidy)
      totalKomisi += order.calculatedFees.totalFees;

      // 4. Total Omset (ambil dari data kolom omset, which is order.netRevenue)
      totalOmset += order.netRevenue;

      // 5. Total HPP
      totalHpp += order.totalHpp;

      // 6. Total Laba Bersih
      totalLaba += order.netProfit;
    });

    return {
      totalHargaJual,
      totalDiskonVoucher,
      totalKomisi,
      totalOmset,
      totalHpp,
      totalLaba,
    };
  }, [filteredOrders]);

  const handleDeleteClick = (order: Order) => {
    setPendingDeleteOrder(order);
  };

  return (
    <div id="orders_section" className="space-y-6 animate-fade-in text-xs text-slate-700 pt-6 md:pt-8">
      
      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>📋</span> Daftar Pesanan & Pengelolaan Transaksi
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Pantau semua data pesanan dari berbagai saluran penjualan. Anda bisa mengubah detail produk, jumlah barang, diskon, atau menghapus pesanan untuk mengembalikan stok.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan No. Pesanan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-normal focus:outline-none transition-all text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-normal text-[10px]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tanggal */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="text-slate-405 font-normal flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0" title="Tanggal">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Tanggal</option>
                <option value="today">Hari Ini</option>
                <option value="yesterday">Kemarin</option>
                <option value="this_week">Minggu Ini</option>
                <option value="this_month">Bulan Ini</option>
                <option value="custom">📅 Rentang Kustom</option>
              </select>
            </div>

            {/* Custom Range Picker */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 animate-fade-in">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer w-[115px]"
                  title="Tanggal Mulai"
                />
                <span className="text-slate-400 font-normal">s/d</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer w-[115px]"
                  title="Tanggal Selesai"
                />
              </div>
            )}

            {/* Filter Channel */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="text-slate-405 font-normal flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0" title="Saluran">
                <Filter className="h-3.5 w-3.5" />
              </span>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Saluran</option>
                {channels.map((chan) => (
                  <option key={chan.id} value={chan.id}>{chan.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Payment Method */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-405 font-normal flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0" title="Metode Pembayaran">
                💳
              </span>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Metode</option>
                {['Transfer', 'COD', 'E-Wallet', 'Lainnya'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Statistics Cards Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 animate-fade-in">
        
        {/* Total Pesanan Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total Pesanan</span>
          <span className="text-slate-900 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {filteredOrders.length} <span className="text-[10px] text-slate-400 font-sans font-normal">Pesanan</span>
          </span>
        </div>

        {/* Total Harga Jual Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total Harga Jual</span>
          <span className="text-slate-900 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {formatRp(metrics.totalHargaJual)}
          </span>
        </div>

        {/* Total Diskon & Voucher Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total Diskon</span>
          <span className="text-rose-600 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {formatRp(metrics.totalDiskonVoucher)}
          </span>
        </div>

        {/* Total Komisi Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total Komisi</span>
          <span className="text-amber-600 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {formatRp(metrics.totalKomisi)}
          </span>
        </div>

        {/* Total Omset Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs ring-1 ring-emerald-500/5">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total Omset</span>
          <span className="text-emerald-700 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {formatRp(metrics.totalOmset)}
          </span>
        </div>

        {/* Total HPP Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-3xs">
          <span className="text-slate-400 text-[10px] uppercase font-normal tracking-wider block">Total HPP</span>
          <span className="text-slate-700 font-normal text-sm sm:text-base block mt-1.5 font-mono">
            {formatRp(metrics.totalHpp)}
          </span>
        </div>

        {/* Total Laba Card */}
        <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-4 shadow-3xs ring-1 ring-emerald-500/15">
          <span className="text-emerald-805 text-[10px] uppercase font-normal tracking-wider block">Total Laba Bersih</span>
          <span className={`font-normal text-sm sm:text-base block mt-1.5 font-mono ${metrics.totalLaba >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatRp(metrics.totalLaba)}
          </span>
        </div>

      </div>

      {/* Main Table Panel representation */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-4xl block select-none">📭</span>
            <span className="block font-normal text-slate-800 text-sm">Tidak Ada Transaksi Pesanan Ditemukan</span>
            <p className="text-slate-450 max-w-sm mx-auto">
              Cobalah mengubah kriteria pencarian atau buat pencatatan pesanan baru melalui tombol "Pencatatan Order Baru" di sidebar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[320px] pb-24">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-normal text-slate-500 tracking-wide uppercase text-[10px]">
                  <th className="py-2 px-3 w-48">Kanal / ID Pesanan</th>
                  <th className="py-2 px-3 w-32">Tanggal & Jam</th>
                  <th className="py-2 px-3 min-w-[180px]">Rincian Barang Belanja</th>
                  <th className="py-2 px-3 w-16 text-center">Qty</th>
                  <th className="py-2 px-3 w-28 text-right text-slate-800">Harga Jual</th>
                  <th className="py-2 px-3 w-40 text-right text-rose-700">Diskon & Voucher</th>
                  <th className="py-2 px-3 w-32 text-right text-rose-700">Total Komisi</th>
                  <th className="py-2 px-3 text-right text-emerald-800 bg-emerald-50/30">Omset</th>
                  <th className="py-2 px-3 text-right">HPP Item</th>
                  <th className="py-2 px-3 text-right text-emerald-950 bg-emerald-100/10">Laba</th>
                  <th className="py-2 px-3 text-center w-36">Bayar & PIC</th>
                  <th className="py-2 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  const channel = channels.find(c => c.id.toLowerCase() === ord.channelId.toLowerCase() || c.name.toLowerCase() === ord.channelId.toLowerCase()) || {
                    id: ord.channelId,
                    name: ord.channelId && ord.channelId !== 'unknown' ? ord.channelId : 'Unknown',
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  const totalAutoDiscount = ord.products.reduce((sum, p) => sum + ((p.discountAmount ?? 0) * p.qty), 0);
                  const totalDiscount = totalAutoDiscount + ord.discounts;

                  return (
                    <tr key={ord.id} className="relative hover:z-30 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Badge and order number */}
                      <td className="py-2 px-3 space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          {channel.color && channel.color.includes('|') ? (
                            (() => {
                              const [bg, text] = channel.color.split('|');
                              return (
                                <span 
                                  style={{ backgroundColor: bg, color: text }}
                                  className="inline-block px-1.5 py-0.5 text-[9px] font-normal tracking-wide uppercase rounded border border-slate-200 shadow-3xs"
                                >
                                  {channel.name}
                                </span>
                              );
                            })()
                          ) : (
                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-normal tracking-wide uppercase rounded ${channel.color ? channel.color.split(' ').filter(c => !c.startsWith('border-')).join(' ') : 'bg-slate-100 text-slate-700'}`}>
                              {channel.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-normal text-slate-900 tracking-wide break-all" title={ord.orderNumber}>
                            {ord.orderNumber}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(ord.orderNumber, ord.id)} 
                            className="text-slate-400 hover:text-emerald-600 transition-colors relative"
                            title={copiedId === ord.id ? "Berhasil disalin!" : "Salin No. Pesanan"}
                          >
                             {copiedId === ord.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                             {copiedId === ord.id && (
                                <span className="absolute -top-7 left-1/2 -ml-9 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg z-10 animate-fade-in">
                                  Disalin!
                                </span>
                             )}
                          </button>
                        </div>
                      </td>

                      {/* Created DateTime */}
                      <td className="py-2 px-3 font-mono text-slate-600 text-xs">
                        <div className="font-normal text-slate-900 leading-tight">
                          {new Date(ord.dateTime).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-normal">
                          <span>🕒</span>
                          {new Date(ord.dateTime).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Ordered items details */}
                      <td className="py-1.5 px-3 min-w-[180px]">
                        <div className="flex flex-col gap-1">
                          {ord.products.map((p, pIdx) => {
                            const matchedProduct = products.find(prod => prod.id === p.productId);
                            const resolvedName = matchedProduct ? matchedProduct.name : 'Produk Master';
                            return (
                              <div 
                                key={pIdx} 
                                className="text-[12px] font-mono h-[32px] flex flex-col justify-center text-slate-700"
                              >
                                <div className="truncate leading-tight font-normal text-slate-950">{resolvedName}</div>
                                <div className="text-slate-500 text-[10px] truncate leading-none mt-0.5">{p.color} • {p.size}</div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Qty column with highlight */}
                      <td className="py-1.5 px-3 w-16 text-center">
                        <div className="flex flex-col gap-1">
                          {ord.products.map((p, pIdx) => {
                            const isQtyHighlight = p.qty > 1;
                            return (
                              <div 
                                key={pIdx} 
                                className={`text-[11px] font-mono text-center h-[32px] flex items-center justify-center transition-all ${
                                  isQtyHighlight 
                                    ? 'bg-emerald-50 text-emerald-800 font-normal rounded px-1.5 py-0.5 border border-emerald-200 shadow-3xs max-w-fit mx-auto' 
                                    : 'font-normal text-slate-550'
                                  }`}
                              >
                                x{p.qty}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                                {/* Harga Jual column */}
                      <td className="py-1.5 px-3 w-28 text-right font-mono text-slate-900 text-xs font-normal">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const totalGross = ord.products.reduce((sum, pr) => sum + (pr.price * pr.qty), 0);
                            return ord.products.map((p, pIdx) => {
                              const discAmt = p.discountAmount ?? 0;
                              const hasAutoDisc = discAmt > 0;
                              const hasVoucherDisc = ord.discounts > 0;
                              const hasAnyDisc = hasAutoDisc || hasVoucherDisc;
                              
                              const originalVal = p.originalPrice || (p.price + discAmt);
                              const priceBeforeVoucher = hasAutoDisc ? originalVal : p.price;
                              
                              const allocatedVoucherPerUnit = totalGross > 0 ? (p.price / totalGross) * ord.discounts : 0;
                              const finalPrice = Math.max(0, p.price - allocatedVoucherPerUnit);
                              
                              const totalOriginalVal = priceBeforeVoucher * p.qty;
                              const totalFinalPrice = finalPrice * p.qty;
                              const totalNormalPrice = p.price * p.qty;
                              
                              return (
                                <div 
                                  key={pIdx} 
                                  className="h-[32px] flex flex-col justify-center items-end"
                                >
                                  {hasAnyDisc ? (
                                    <>
                                      <span className="text-[10px] text-slate-400 line-through font-normal leading-none mb-0.5" title={hasAutoDisc && hasVoucherDisc ? "Sebelum Diskon & Voucher" : hasAutoDisc ? "Sebelum Diskon" : "Sebelum Voucher"}>
                                        {formatRp(totalOriginalVal)}
                                      </span>
                                      <span className="text-slate-950 font-normal leading-none">
                                        {formatRp(totalFinalPrice)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-900 font-normal leading-none">
                                      {formatRp(totalNormalPrice)}
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </td>

                      {/* Diskon & Voucher column */}
                      <td className="py-1.5 px-3 w-40 text-right font-mono text-xs text-rose-600">
                        {totalDiscount > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-normal leading-none">
                              -{formatRp(totalDiscount)}
                            </span>
                            <div className="relative inline-block shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTooltip(prev => 
                                    prev && prev.orderId === ord.id && prev.type === 'discount'
                                      ? null
                                      : { orderId: ord.id, type: 'discount' }
                                  );
                                }}
                                className="p-0.5 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 focus:outline-none cursor-pointer transition-colors"
                                title="Rincian Diskon"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* Custom CSS Click Tooltip for Combined Discount */}
                              <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2.5 ${activeTooltip && activeTooltip.orderId === ord.id && activeTooltip.type === 'discount' ? 'flex' : 'hidden'} flex-col gap-1 bg-slate-950 text-slate-100 text-[10px] p-2 rounded-xl shadow-xl border border-slate-800 z-50 min-w-[180px] text-left font-sans transition-all duration-200 animate-fade-in`}>
                                {ord.products.filter(p => (p.discountAmount ?? 0) > 0).map((p, pIdx) => (
                                  <div key={pIdx} className="flex justify-between gap-4">
                                    <span className="text-slate-400 truncate max-w-[100px]">{p.discountName || 'Diskon Otomatis'}</span>
                                    <span className="font-mono text-rose-300 font-normal">-{formatRp((p.discountAmount ?? 0) * p.qty)}</span>
                                  </div>
                                ))}
                                {ord.discounts > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Voucher</span>
                                    <span className="font-mono text-rose-300 font-normal">-{formatRp(ord.discounts)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 mt-0.5 font-normal text-rose-400">
                                  <span>Total Diskon:</span>
                                  <span className="font-mono">-{formatRp(totalDiscount)}</span>
                                </div>
                                {/* Triangle indicator */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-950 border-t border-r border-slate-800 rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">-</span>
                        )}
                      </td>

                      {/* Calculated Commission & Fees (Total Komisi) */}
                      <td className="py-1.5 px-3 w-32 text-right font-mono text-xs text-rose-600">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-normal leading-none">
                            -{formatRp(ord.calculatedFees.totalFees)}
                          </span>
                          <div className="relative inline-block shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltip(prev => 
                                  prev && prev.orderId === ord.id && prev.type === 'commission'
                                    ? null
                                    : { orderId: ord.id, type: 'commission' }
                                );
                              }}
                              className="p-0.5 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 focus:outline-none cursor-pointer transition-colors"
                              title="Rincian Komisi & Biaya"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Custom CSS Click Tooltip */}
                            <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-2.5 ${activeTooltip && activeTooltip.orderId === ord.id && activeTooltip.type === 'commission' ? 'flex' : 'hidden'} flex-col gap-1 bg-slate-950 text-slate-100 text-[10px] p-2 rounded-xl shadow-xl border border-slate-800 z-50 min-w-[180px] text-left font-sans transition-all duration-200 animate-fade-in`}>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Komisi:</span>
                                <span className="font-mono text-rose-300 font-normal">-{formatRp(ord.calculatedFees.commission)}</span>
                              </div>
                              
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Layanan:</span>
                                <span className="font-mono text-rose-300 font-normal">-{formatRp(ord.calculatedFees.paymentFee)}</span>
                              </div>
                              
                              {ord.calculatedFees.processingFee > 0 && (
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Proses:</span>
                                  <span className="font-mono text-rose-300 font-normal">-{formatRp(ord.calculatedFees.processingFee)}</span>
                                </div>
                              )}
                              
                              {ord.calculatedFees.freeShippingSubsidy > 0 && (
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">Subsidi Ongkir:</span>
                                  <span className="font-mono text-rose-300 font-normal">-{formatRp(ord.calculatedFees.freeShippingSubsidy)}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 mt-0.5 font-normal text-rose-400">
                                <span>Total Komisi:</span>
                                <span className="font-mono">-{formatRp(ord.calculatedFees.totalFees)}</span>
                              </div>
                              
                              {/* Triangle indicator */}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-950 border-t border-r border-slate-800 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Estimation Net revenue color badge */}
                      <td className="py-2 px-3 text-right font-mono font-normal text-slate-800 bg-emerald-50/20 whitespace-nowrap text-xs">
                        {formatRp(ord.netRevenue)}
                      </td>

                      {/* Locked HPP cost */}
                      <td className="py-2 px-3 text-right font-mono text-slate-500 font-normal text-xs">
                        {formatRp(ord.totalHpp)}
                      </td>

                      {/* Estimation profitable margin color badge */}
                      <td className={`py-2 px-3 text-right font-mono font-normal bg-emerald-100/5 whitespace-nowrap text-xs ${ord.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatRp(ord.netProfit)}
                      </td>

                      {/* Payment Method & Recorder PIC Column */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <span className="inline-block text-[9.5px] font-normal uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-3xs">
                            {ord.paymentMethod}
                          </span>
                          {ord.pencatat ? (
                            <span className="inline-block text-[9.5px] font-normal uppercase bg-sky-50 border border-sky-200 text-sky-700 px-1.5 py-0.5 rounded-md shadow-3xs" title="Nama Pencatat">
                              👤 {ord.pencatat}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-350 italic font-normal">-</span>
                          )}
                        </div>
                      </td>

                      {/* Control buttons */}
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(ord)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50/55 rounded border border-slate-200 cursor-pointer transition-colors"
                            title="Hapus permanen dan kembalikan stok"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditOrder(ord)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded border border-slate-200 cursor-pointer transition-colors"
                            title="Ubah detail barang/diskon entri"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Delete Order */}
      {pendingDeleteOrder && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="confirm_delete_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Transaksi Pesanan</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus pesanan <strong className="text-slate-800">{pendingDeleteOrder.orderNumber}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4 space-y-2 text-xs">
              <div className="text-slate-500 text-[11px] leading-relaxed">
                Tindakan ini akan mengembalikan semua alokasi kuantitas item pesanan (<span className="font-bold text-slate-950">{pendingDeleteOrder.products.reduce((sum, p) => sum + p.qty, 0)} pcs</span>) kembali menjadi sediaan di matriks stok gudang.
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteOrder(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(pendingDeleteOrder.id);
                  setPendingDeleteOrder(null);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 rounded-xl shadow-md shadow-rose-500/10 cursor-pointer select-none transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
