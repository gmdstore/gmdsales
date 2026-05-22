/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Channel, Product } from '../types';
import { Search, Filter, Edit2, Trash2, Calendar, ShoppingBag, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [selectedCod, setSelectedCod] = useState<'all' | 'cod' | 'non-cod'>('all');

  // Format currency helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Filter orders
  const filteredOrders = orders.filter(ord => {
    const matchSearch = ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchChannel = selectedChannelId === 'all' ? true : ord.channelId === selectedChannelId;
    const matchCod = selectedCod === 'all' ? true : selectedCod === 'cod' ? ord.isCod : !ord.isCod;
    return matchSearch && matchChannel && matchCod;
  });

  const handleDeleteClick = (order: Order) => {
    const confirmMsg = `Apakah Anda yakin ingin menghapus pesanan "${order.orderNumber}"?\nTindakan ini akan mengembalikan semua alokasi kuantitas item pesanan (${order.products.reduce((sum, p) => sum + p.qty, 0)} pcs) kembali ke matriks stok sediaan gudang.`;
    if (confirm(confirmMsg)) {
      onDeleteOrder(order.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700">
      
      {/* Header Info Block */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <span>📋</span> Daftar Pesanan & Pengelolaan Transaksi
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau semua data pesanan dari berbagai saluran penjualan. Anda bisa mengubah detail produk, jumlah barang, diskon, atau menghapus pesanan untuk mengembalikan stok.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-150 border border-slate-205 rounded-2xl px-4 py-2 text-slate-700 font-extrabold select-none self-start md:self-auto shadow-3xs">
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
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold focus:outline-none transition-all text-xs"
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
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
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

            {/* Filter COD Status */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-405 font-bold flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0">
                ⭐ COD
              </span>
              <select
                value={selectedCod}
                onChange={(e) => setSelectedCod(e.target.value as any)}
                className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pl-1.5"
              >
                <option value="all">Semua Status</option>
                <option value="cod">Hanya COD</option>
                <option value="non-cod">Non-COD</option>
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
                <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-505 tracking-wide uppercase text-[10px]">
                  <th className="py-3 px-4 w-32">Kanal / ID Pesanan</th>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Rincian Barang Belanja</th>
                  <th className="py-3 px-4 text-right">Potongan Toko</th>
                  <th className="py-3 px-4 text-right">Potongan Biaya</th>
                  <th className="py-3 px-4 text-right">HPP Item</th>
                  <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/30">Omset Bersih</th>
                  <th className="py-3 px-4 text-right text-emerald-900 bg-emerald-100/10">Laba Bersih</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
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
                      <td className="py-4 px-4 space-y-1">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded-md border ${channel.color}`}>
                          {channel.name}
                        </span>
                        <div className="font-mono text-xs font-black text-slate-900 tracking-wide break-all" title={ord.orderNumber}>
                          {ord.orderNumber}
                        </div>
                        {ord.isCod && (
                          <span className="inline-block text-[9px] font-extrabold uppercase bg-rose-50 border border-rose-100/80 text-rose-600 px-1.5 py-0.2 rounded mt-1.5 flex-auto">
                            🤝 COD
                          </span>
                        )}
                      </td>

                      {/* Created DateTime */}
                      <td className="py-4 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                        {new Date(ord.dateTime).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Ordered items details */}
                      <td className="py-4 px-4 space-y-1">
                        {ord.products.map((p, pIdx) => {
                          const matchedProduct = products.find(prod => prod.id === p.productId);
                          const resolvedName = matchedProduct ? matchedProduct.name : 'Produk Master';
                          return (
                            <div key={pIdx} className="font-mono text-slate-700 font-semibold leading-normal">
                              • <span className="font-bold text-slate-900">{resolvedName}</span> ({p.color} - {p.size}) 
                              <span className="text-slate-950 font-black ml-1 bg-slate-100/80 border border-slate-200/50 px-1 py-0.1 rounded-md text-[10px]">x{p.qty}</span>
                            </div>
                          );
                        })}
                      </td>

                      {/* Total Discounts */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-rose-600">
                        {ord.discounts > 0 ? `-${formatRp(ord.discounts)}` : '-'}
                      </td>

                      {/* Calculated Commission & Fees */}
                      <td className="py-4 px-4 text-right space-y-0.5" title="Klik detail biaya">
                        <div className="font-mono text-rose-700 font-bold">
                          -{formatRp(ord.calculatedFees.totalFees)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-semibold font-sans">
                          K: {ord.calculatedFees.commission > 0 ? `${formatRp(ord.calculatedFees.commission)}` : '0'} | P: {ord.calculatedFees.paymentFee > 0 ? `${formatRp(ord.calculatedFees.paymentFee)}` : '0'}
                        </div>
                      </td>

                      {/* Locked HPP cost */}
                      <td className="py-4 px-4 text-right font-mono text-slate-500 font-medium">
                        {formatRp(ord.totalHpp)}
                      </td>

                      {/* Estimation Net revenue color badge */}
                      <td className="py-4 px-4 text-right font-mono font-black text-slate-800 bg-emerald-50/20 whitespace-nowrap">
                        {formatRp(ord.netRevenue)}
                      </td>

                      {/* Estimation profitable margin color badge */}
                      <td className={`py-4 px-4 text-right font-mono font-black bg-emerald-100/5 whitespace-nowrap ${ord.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatRp(ord.netProfit)}
                      </td>

                      {/* Control buttons */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditOrder(ord)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold border border-slate-250 cursor-pointer flex items-center gap-1 transition-all"
                            title="Ubah detail barang/diskon entri"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(ord)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/55 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                            title="Hapus permanen dan kembalikan stok"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
