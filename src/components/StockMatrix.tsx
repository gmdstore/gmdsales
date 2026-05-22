/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, StockItem, SIZES, SizeType } from '../types';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Plus, Trash2, Edit2, Check, X, Sliders } from 'lucide-react';

interface StockMatrixProps {
  products: Product[];
  stocks: StockItem[];
  groups: string[];
  userRole: 'owner' | 'staff';
  onChangeRole: (role: 'owner' | 'staff') => void;
  onUpdateStock: (stockItemId: string, size: string, newQty: number) => void;
  onCreateGroup: (groupName: string) => void;
  onDeleteGroup: (groupName: string) => void;
  onUpdateProductGroup: (productId: string, newGroup: string) => void;
}

export default function StockMatrix({
  products,
  stocks,
  groups,
  userRole,
  onChangeRole,
  onUpdateStock,
  onCreateGroup,
  onDeleteGroup,
  onUpdateProductGroup
}: StockMatrixProps) {
  // Tabs & Grouping Selection
  const [activeGroup, setActiveGroup] = useState<string>(groups[0] || 'Best Seller');
  const [isManagingGroups, setIsManagingGroups] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');

  // Column Visibility state
  const [showPhoto, setShowPhoto] = useState<boolean>(true);
  const [showColor, setShowColor] = useState<boolean>(true);
  const [showHpp, setShowHpp] = useState<boolean>(true);

  // Excel-like Inline Stock Edit State
  const [editingCell, setEditingCell] = useState<{ stockItemId: string; size: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Product Recategorization helper State
  const [editingProductGroup, setEditingProductGroup] = useState<string | null>(null);

  // Filter products by active categorized tab
  const filteredProducts = products.filter(p => p.group === activeGroup);

  // Gather stock matrix items corresponding to filtered products
  const matchingStocks = stocks.filter(s => 
    filteredProducts.some(p => p.id === s.productId)
  );

  // Currency Formatter
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleStartEditStock = (stockItemId: string, size: string, currentQty: number) => {
    setEditingCell({ stockItemId, size });
    setEditValue(currentQty.toString());
  };

  const handleSaveStock = (stockItemId: string, size: string) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(stockItemId, size, val);
    }
    setEditingCell(null);
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (trimmed && !groups.includes(trimmed)) {
      onCreateGroup(trimmed);
      setActiveGroup(trimmed);
      setNewGroupName('');
    }
  };

  const handleDeleteGroupClick = (gName: string) => {
    if (groups.length <= 1) {
      alert("Harus ada minimal 1 grup produk.");
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus grup "${gName}"? Semua produk di grup ini akan dipindahkan ke "${groups.find(g => g !== gName)}"`)) {
      onDeleteGroup(gName);
      setActiveGroup(groups.find(g => g !== gName) || '');
    }
  };

  return (
    <div id="stock_matrix_section" className="space-y-6 animate-fade-in text-slate-700">
      
      {/* Upper Controls Bar: Security Permission demonstration */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            {userRole === 'owner' ? (
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wide text-white flex items-center gap-2">
              Hak Akses Menu Finansial
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${userRole === 'owner' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {userRole === 'owner' ? 'Owner / Pemilik' : 'Staff Admin'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {userRole === 'owner' 
                ? 'Semua kolom & laba bersih diaktifkan. Anda bisa mengaktifkan mode privasi HPP.' 
                : 'Peringatan: Kolom HPP Gudang disembunyikan otomatis untuk staf operasional biasa.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/30">
          <span className="text-xs font-semibold text-slate-400 pl-2">Simulasi Role:</span>
          <div className="inline-flex rounded-xl bg-slate-950 p-1">
            <button
              onClick={() => onChangeRole('owner')}
              className={`px-4 py-2 rounded-lg font-bold text-xs cursor-pointer transition-all ${userRole === 'owner' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Owner
            </button>
            <button
              onClick={() => onChangeRole('staff')}
              className={`px-4 py-2 rounded-lg font-bold text-xs cursor-pointer transition-all ${userRole === 'staff' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Admin Staff
            </button>
          </div>
        </div>
      </div>

      {/* Visibility Control & Tools Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-emerald-500" />
            Pengaturan Tampilan Matriks & Kolom
          </h4>
          <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">Filter Panel</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
          <label className="flex items-center gap-2.5 cursor-pointer font-bold select-none group">
            <input
              type="checkbox"
              checked={showPhoto}
              onChange={(e) => setShowPhoto(e.target.checked)}
              className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
            />
            <span className="group-hover:text-slate-900">Tampilkan Foto/Ikon</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer font-bold select-none group">
            <input
              type="checkbox"
              checked={showColor}
              onChange={(e) => setShowColor(e.target.checked)}
              className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
            />
            <span className="group-hover:text-slate-900">Tampilkan Warna</span>
          </label>

          <label 
            className={`flex items-center gap-2.5 select-none ${userRole === 'owner' ? 'cursor-pointer font-bold text-slate-700 group hover:text-slate-900' : 'cursor-not-allowed opacity-40 text-slate-400'}`}
            title={userRole !== 'owner' ? "Hanya bisa diakses oleh Owner" : ""}
          >
            <input
              type="checkbox"
              checked={userRole === 'owner' ? showHpp : false}
              disabled={userRole !== 'owner'}
              onChange={(e) => setShowHpp(e.target.checked)}
              className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 disabled:bg-slate-200"
            />
            <span>Tampilkan HPP (Protected)</span>
          </label>
        </div>
      </div>

      {/* Product Group Category Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-250/60 pb-1.5 gap-4">
        {/* Dynamic Category Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1.5 max-w-full">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => {
                setActiveGroup(group);
                setIsManagingGroups(false);
              }}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl whitespace-nowrap border cursor-pointer select-none transition-all active:scale-95 ${activeGroup === group && !isManagingGroups ? 'bg-slate-900 text-white border-slate-950 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 shadow-3xs'}`}
            >
              {group} ({products.filter(p => p.group === group).length})
            </button>
          ))}
        </div>

        {/* Manage Groups Mode Switcher */}
        <button
          onClick={() => setIsManagingGroups(!isManagingGroups)}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer select-none transition-all ${isManagingGroups ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-slate-100 text-slate-850 border-slate-205 hover:bg-slate-150 shadow-3xs'}`}
        >
          ⚙️ Kelola Grup {isManagingGroups ? 'Selesai' : ''}
        </button>
      </div>

      {/* Category CRUD Modal Drawer inline details */}
      {isManagingGroups && (
        <div className="bg-gradient-to-br from-[#fffbeb] to-amber-50/10 border border-amber-200/70 rounded-3xl p-6 space-y-5 shadow-sm animate-fade-in text-xs text-slate-700">
          <h4 className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
            <span>⚙️</span> Manajemen Grup & Pindah Kategori
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Category Group Form */}
            <form onSubmit={handleAddGroupSubmit} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-150">
              <label className="block font-bold text-slate-800">Tambah Grup Baru:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Misal: Clearance, FlashSale, dll."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500/80 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </form>

            {/* List and Delete dynamic Categories */}
            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-150">
              <label className="block font-bold text-slate-800">Daftar Grup Aktif (Klik Sampah untuk Hapus):</label>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-750 font-semibold shadow-3xs">
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroupClick(g)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Product Re-categorization Option */}
          <div className="border-t border-amber-250/45 pt-5 space-y-3">
            <span className="block font-extrabold text-amber-950">Relokasi Kategori Produk Fast-Edit:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products.map(p => (
                <div key={p.id} className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-1.5 shadow-3xs hover:border-amber-200 transition-all">
                  <div className="truncate pr-1">
                    <span className="font-bold block text-slate-900 truncate">{p.name}</span>
                    <span className="text-[10px] font-medium text-slate-400">Grup: {p.group}</span>
                  </div>
                  <div>
                    <select
                      value={p.group}
                      onChange={(e) => onUpdateProductGroup(p.id, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-extrabold text-slate-800"
                    >
                      {groups.map(gOption => (
                        <option key={gOption} value={gOption}>{gOption}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Matriks Stok Main Table Representation */}
      <div className="bg-white border border-slate-205 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden" id="stock_matrix_table_panel">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div>
            <span className="font-extrabold text-slate-900 text-sm">Grup: <span className="text-emerald-700 font-black">{activeGroup}</span></span>
            <span className="text-slate-400 ml-2 font-mono font-medium">({matchingStocks.length} Kombinasi Warna SKU)</span>
          </div>
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">💡 <span>Klik ganda atau klik sel angka ukuran untuk mengubah stok instan.</span></span>
        </div>

        {matchingStocks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <span className="text-4xl">🗃️</span>
            <p className="text-sm font-semibold text-slate-700">Tidak ada produk terkait grup "{activeGroup}".</p>
            <p className="text-xs">Bisa tambahkan produk baru atau pindahkan sedia produk di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left col-auto border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {showPhoto && <th className="py-3 px-4 w-12 text-center">Ikon</th>}
                  <th className="py-3 px-4">Nama Produk Master</th>
                  {showColor && <th className="py-3 px-4">Warna</th>}
                  {showHpp && userRole === 'owner' && <th className="py-3 px-4 text-right text-rose-800 font-extrabold bg-rose-50/50">HPP</th>}
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  
                  {/* Sizegroup columns S-4XL */}
                  {SIZES.map(size => (
                    <th key={size} className="py-3 px-2 text-center w-16 bg-slate-50/30">
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-750">
                {matchingStocks.map((stockItem) => {
                  const product = products.find(p => p.id === stockItem.productId);
                  if (!product) return null;

                  return (
                    <tr key={stockItem.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Optional Photo element */}
                      {showPhoto && (
                        <td className="py-3.5 px-4 text-center font-emoji text-lg select-none">
                          {product.imageUrl}
                        </td>
                      )}

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                        {product.name}
                      </td>

                      {/* Optional Color */}
                      {showColor && (
                        <td className="py-3.5 px-4 font-semibold text-slate-500">
                          {stockItem.color}
                        </td>
                      )}

                      {/* Optional Protected HPP */}
                      {showHpp && userRole === 'owner' && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 bg-rose-50/40 select-none">
                          {formatRp(product.hpp)}
                        </td>
                      )}

                      {/* Value Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRp(product.price)}
                      </td>

                      {/* Matriks Size levels */}
                      {SIZES.map(size => {
                        const cellQty = stockItem.stocks[size] ?? 0;
                        const isEditing = editingCell?.stockItemId === stockItem.id && editingCell?.size === size;

                        return (
                          <td 
                            key={size} 
                            onClick={() => !isEditing && handleStartEditStock(stockItem.id, size, cellQty)}
                            className={`py-3 px-1 text-center font-mono cursor-pointer transition-all relative border-l border-r border-slate-100/40 select-none ${isEditing ? 'bg-amber-100/50 font-black text-amber-950 scale-102 border-amber-300' : cellQty === 0 ? 'bg-rose-50 text-rose-600 font-extrabold hover:bg-rose-100/80' : cellQty < 5 ? 'bg-amber-50 hover:bg-amber-100/80 font-bold text-amber-600' : 'hover:bg-slate-100/60 font-semibold text-slate-800'}`}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                autoFocus
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveStock(stockItem.id, size)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveStock(stockItem.id, size);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-12 text-center text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-300 rounded-md px-1 py-0.5 bg-white text-slate-900"
                              />
                            ) : (
                              <span>{cellQty}</span>
                            )}
                          </td>
                        );
                      })}
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
