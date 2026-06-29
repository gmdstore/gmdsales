/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, Channel, Product } from '../types';
import { Search, Filter, Edit2, Trash2, Calendar, ShoppingBag, DollarSign, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

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
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    return matchSearch && matchChannel && matchPayment;
  });

  const handleDeleteClick = (order: Order) => {
    setPendingDeleteOrder(order);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700">
      
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
        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-150 border border-slate-205 rounded-2xl px-4 py-2.5 text-slate-700 font-extrabold select-none self-start sm:self-auto shadow-3xs">
          <span>📦 Total: {filteredOrders.length} Pesanan</span>
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
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold focus:outline-none transition-all text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-[10px]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Channel */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="text-slate-405 font-bold flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Saluran
              </span>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Saluran</option>
                {channels.map((chan) => (
                  <option key={chan.id} value={chan.id}>{chan.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Payment Method */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-405 font-bold flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0">
                💳 Metode
              </span>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Metode</option>
                {['Transfer', 'COD', 'E-Wallet', 'Lainnya'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Panel representation */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-4xl block select-none">📭</span>
            <span className="block font-black text-slate-800 text-sm">Tidak Ada Transaksi Pesanan Ditemukan</span>
            <p className="text-slate-450 max-w-sm mx-auto">
              Cobalah mengubah kriteria pencarian atau buat pencatatan pesanan baru melalui tombol "Pencatatan Order Baru" di sidebar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-500 tracking-wide uppercase text-[10px]">
                  <th className="py-2 px-3 w-48">Kanal / ID Pesanan</th>
                  <th className="py-2 px-3 w-32">Tanggal & Jam</th>
                  <th className="py-2 px-3 min-w-[180px]">Rincian Barang Belanja</th>
                  <th className="py-2 px-3 w-16 text-center">Qty</th>
                  <th className="py-2 px-3 w-28 text-right text-slate-800">Harga Jual</th>
                  <th className="py-2 px-3 w-44 text-right text-rose-700">Diskon & Potongan</th>
                  <th className="py-2 px-3 text-right">Potongan Biaya</th>
                  <th className="py-2 px-3 text-right">HPP Item</th>
                  <th className="py-2 px-3 text-right text-emerald-800 bg-emerald-50/30">Omset</th>
                  <th className="py-2 px-3 text-right text-emerald-950 bg-emerald-100/10">Laba</th>
                  <th className="py-2 px-3 text-center w-36">Bayar & PIC</th>
                  <th className="py-2 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  const channel = channels.find(c => c.id === ord.channelId) || {
                    id: ord.channelId,
                    name: 'Unknown',
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Badge and order number */}
                      <td className="py-2 px-3 space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black tracking-wide uppercase rounded ${channel.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')}`}>
                            {channel.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-black text-slate-900 tracking-wide break-all" title={ord.orderNumber}>
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
                        <div className="font-bold text-slate-900 leading-tight">
                          {new Date(ord.dateTime).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
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
                                <div className="truncate leading-tight font-bold text-slate-950">{resolvedName}</div>
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
                                    ? 'bg-emerald-50 text-emerald-800 font-extrabold rounded px-1.5 py-0.5 border border-emerald-200 shadow-3xs max-w-fit mx-auto' 
                                    : 'font-semibold text-slate-550'
                                }`}
                              >
                                x{p.qty}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Harga Jual column */}
                      <td className="py-1.5 px-3 w-28 text-right font-mono text-slate-900 text-xs font-extrabold">
                        <div className="flex flex-col gap-1">
                          {ord.products.map((p, pIdx) => {
                            const discAmt = p.discountAmount ?? 0;
                            const hasDisc = discAmt > 0;
                            const originalVal = p.originalPrice || (p.price + discAmt);
                            return (
                              <div 
                                key={pIdx} 
                                className="h-[32px] flex flex-col justify-center items-end"
                              >
                                {hasDisc ? (
                                  <>
                                    <span className="text-[10px] text-slate-400 line-through font-normal leading-none mb-0.5">
                                      {formatRp(originalVal)}
                                    </span>
                                    <span className="text-slate-950 font-black leading-none">
                                      {formatRp(p.price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-900 font-extrabold leading-none">
                                    {formatRp(p.price)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Diskon & Voucher column */}
                      <td className="py-1.5 px-3 w-44 text-right font-mono text-[11px] text-rose-600">
                        <div className="flex flex-col gap-1">
                          {ord.products.map((p, pIdx) => {
                            const discAmt = p.discountAmount ?? 0;
                            const hasDisc = discAmt > 0;
                            return (
                              <div 
                                key={pIdx} 
                                className="h-[32px] flex flex-col justify-center items-end"
                              >
                                {hasDisc ? (
                                  <>
                                    <span className="font-extrabold leading-none">-{formatRp(discAmt)}</span>
                                    {p.discountName && (
                                      <span className="text-[9px] text-slate-400 truncate max-w-[115px] leading-none mt-0.5" title={p.discountName}>
                                        {p.discountName}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-300 leading-none">-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Order-level Voucher Discount */}
                        {ord.discounts > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex flex-col justify-center items-end">
                            <span className="font-extrabold text-rose-600 text-[11px] leading-none font-mono">
                              -{formatRp(ord.discounts)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mt-1">
                              Voucher
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Calculated Commission & Fees (Potongan Biaya) */}
                      <td className="py-1.5 px-3 text-right font-mono text-[11px] text-rose-600" title="Klik detail biaya">
                        <div className="flex flex-col justify-center items-end">
                          <span className="font-extrabold leading-none">-{formatRp(ord.calculatedFees.totalFees)}</span>
                          <span className="text-[9px] text-slate-400 font-medium leading-none mt-1 font-sans">
                            K: {ord.calculatedFees.commission > 0 ? formatRp(ord.calculatedFees.commission) : '0'} | P: {ord.calculatedFees.paymentFee > 0 ? formatRp(ord.calculatedFees.paymentFee) : '0'}
                          </span>
                        </div>
                      </td>

                      {/* Locked HPP cost */}
                      <td className="py-2 px-3 text-right font-mono text-slate-500 font-medium text-xs">
                        {formatRp(ord.totalHpp)}
                      </td>

                      {/* Estimation Net revenue color badge */}
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-800 bg-emerald-50/20 whitespace-nowrap text-xs">
                        {formatRp(ord.netRevenue)}
                      </td>

                      {/* Estimation profitable margin color badge */}
                      <td className={`py-2 px-3 text-right font-mono font-black bg-emerald-100/5 whitespace-nowrap text-xs ${ord.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatRp(ord.netProfit)}
                      </td>

                      {/* Payment Method & Recorder PIC Column */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <span className="inline-block text-[9.5px] font-black uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-3xs">
                            {ord.paymentMethod}
                          </span>
                          {ord.pencatat ? (
                            <span className="inline-block text-[9.5px] font-extrabold uppercase bg-sky-50 border border-sky-200 text-sky-700 px-1.5 py-0.5 rounded-md shadow-3xs" title="Nama Pencatat">
                              👤 {ord.pencatat}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-350 italic font-medium">-</span>
                          )}
                        </div>
                      </td>

                      {/* Control buttons */}
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditOrder(ord)}
                            className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold border border-slate-250 cursor-pointer flex items-center gap-0.5 transition-all text-[10.5px]"
                            title="Ubah detail barang/diskon entri"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(ord)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50/55 rounded border border-slate-200 cursor-pointer transition-colors"
                            title="Hapus permanen dan kembalikan stok"
                          >
                            <Trash2 className="h-3 w-3" />
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
