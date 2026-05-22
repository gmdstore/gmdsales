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
  onUpdateStock: (stockItemId: string, size: string, newQty: number) => void;
  onCreateGroup: (groupName: string) => void;
  onDeleteGroup: (groupName: string) => void;
  onUpdateProductGroup: (productId: string, newGroup: string) => void;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export default function StockMatrix({
  products,
  stocks,
  groups,
  onUpdateStock,
  onCreateGroup,
  onDeleteGroup,
  onUpdateProductGroup,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: StockMatrixProps) {
  // Tabs & Grouping Selection
  const [activeGroup, setActiveGroup] = useState<string>(groups[0] || 'Best Seller');
  const [isManagingGroups, setIsManagingGroups] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');

  // Master Data Product ADD/EDIT States
  const [isManagingProducts, setIsManagingProducts] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodGroup, setProdGroup] = useState<string>(groups[0] || 'Best Seller');
  const [prodHpp, setProdHpp] = useState<number>(100000);
  const [prodPrice, setProdPrice] = useState<number>(250000);
  const [prodImageUrl, setProdImageUrl] = useState<string>('👕');
  const [prodColorsText, setProdColorsText] = useState<string>('');

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

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdGroup(p.group);
    setProdHpp(p.hpp);
    setProdPrice(p.price);
    setProdImageUrl(p.imageUrl);
    setProdColorsText(p.colors.join(', '));
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdGroup(groups[0] || 'Best Seller');
    setProdHpp(100000);
    setProdPrice(250000);
    setProdImageUrl('👕');
    setProdColorsText('');
  };

  const handleSubmitProductForm = () => {
    const trimmedName = prodName.trim();
    if (!trimmedName) return;

    const colors = prodColorsText
      .split(',')
      .map(col => col.trim())
      .filter(col => col.length > 0);

    if (colors.length === 0) {
      alert("Harus ada minimal 1 variasi warna.");
      return;
    }

    if (editingProductId) {
      const updatedProduct: Product = {
        id: editingProductId,
        name: trimmedName,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: colors
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p_${Date.now()}`,
        name: trimmedName,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: colors
      };
      onAddProduct(newProduct);
    }

    handleCancelEditProduct();
  };

  return (
    <div id="stock_matrix_section" className="space-y-6 animate-fade-in text-slate-700">
      
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

          <label className="flex items-center gap-2.5 cursor-pointer font-bold select-none group">
            <input
              type="checkbox"
              checked={showHpp}
              onChange={(e) => setShowHpp(e.target.checked)}
              className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
            />
            <span className="group-hover:text-slate-900">Tampilkan HPP (Harga Pokok Penjualan)</span>
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
                setIsManagingProducts(false);
              }}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl whitespace-nowrap border cursor-pointer select-none transition-all active:scale-95 ${activeGroup === group && !isManagingGroups && !isManagingProducts ? 'bg-slate-900 text-white border-slate-950 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 shadow-3xs'}`}
            >
              {group} ({products.filter(p => p.group === group).length})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manage Products Switcher */}
          <button
            onClick={() => {
              setIsManagingProducts(!isManagingProducts);
              setIsManagingGroups(false);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer select-none transition-all ${isManagingProducts ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-850 border-slate-205 hover:bg-slate-150 shadow-3xs'}`}
          >
            📦 Kelola Produk {isManagingProducts ? 'Selesai' : ''}
          </button>

          {/* Manage Groups Mode Switcher */}
          <button
            onClick={() => {
              setIsManagingGroups(!isManagingGroups);
              setIsManagingProducts(false);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer select-none transition-all ${isManagingGroups ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-slate-100 text-slate-850 border-slate-205 hover:bg-slate-150 shadow-3xs'}`}
          >
            ⚙️ Kelola Grup {isManagingGroups ? 'Selesai' : ''}
          </button>
        </div>
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

      {/* Product CRUD Management Panel */}
      {isManagingProducts && (
        <div className="bg-gradient-to-br from-[#f0fdf4] to-emerald-50/10 border border-emerald-200/70 rounded-3xl p-6 space-y-5 shadow-sm animate-fade-in text-xs text-slate-700">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h4 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
              <span>📦</span> Kelola Master Produk & Variasi Warna
            </h4>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-200">
              Operational Database
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Master Products List (7 span) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-150 space-y-4 max-h-[450px] overflow-y-auto">
              <span className="block font-bold text-slate-800 text-xs">Daftar Produk Master ({products.length}):</span>
              
              <div className="divide-y divide-slate-100">
                {products.map(p => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-9 w-9 rounded-xl border border-slate-100 shadow-3xs flex items-center justify-center font-emoji text-lg bg-slate-50 select-none">
                        {p.imageUrl}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-extrabold">
                            {p.group}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold space-x-2">
                          <span className="text-rose-600 font-bold">HPP: {formatRp(p.hpp)}</span>
                          <span className="text-slate-500 font-bold">Jual: {formatRp(p.price)}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-1 font-semibold truncate max-w-xs" title={p.colors.join(', ')}>
                          Warna: {p.colors.map(col => (
                            <span key={col} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded mr-1">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEditProduct(p)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
                        title="Edit Produk ini"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
                        title="Hapus Produk ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Add/Edit Product form (5 span) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-slate-900 text-xs">
                  {editingProductId ? '📝 Edit Produk Master' : '✨ Tambah Produk Baru'}
                </span>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEditProduct}
                    className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Nama Produk */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Produk:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Premium Cotton Tee, Slim Chino Pants..."
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Kategori / Group */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grup/Kategori:</label>
                    <select
                      value={prodGroup}
                      onChange={(e) => setProdGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-extrabold text-slate-850"
                    >
                      {groups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Icon Emoji Selection */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ikon Emoji: <span className="font-emoji font-bold text-sm ml-1">{prodImageUrl}</span></label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="👕"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-center text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Popular Emojis selector row */}
                <div className="p-2 border border-dashed border-slate-200 rounded-xl flex flex-wrap gap-2 items-center justify-center bg-slate-50/55">
                  <span className="text-[10px] font-bold text-slate-400 mr-1 shrink-0">Ikon:</span>
                  {['👕', '👖', '🎽', '🧥', '👟', '🎒', '🧢', '🕶️', '👗', '👚', '🧣', '👜'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setProdImageUrl(em)}
                      className={`text-sm cursor-pointer hover:scale-125 transition-all p-1 rounded-lg ${prodImageUrl === em ? 'bg-emerald-100 border border-emerald-350 scale-110 shadow-3xs' : 'hover:bg-slate-200 border border-transparent'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* HPP (Harga Pokok Penjualan) */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">HPP (Modal Prod.):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5000"
                      placeholder="100000"
                      value={prodHpp}
                      onChange={(e) => setProdHpp(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Harga Jual */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Harga Jual:</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5000"
                      placeholder="200000"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {prodPrice > 0 && prodHpp > 0 && prodPrice < prodHpp && (
                  <div className="bg-rose-50 border border-rose-100 px-3 py-2 text-rose-800 rounded-xl text-[10px] font-bold">
                    ⚠️ Peringatan: Harga jual lebih rendah dari HPP (Rugi modal)!
                  </div>
                )}

                {/* Variasi Warna (tags/comma separated) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Variasi Warna (koma):</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Hitam, Biru Navy, Putih"
                    value={prodColorsText}
                    onChange={(e) => setProdColorsText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-slate-850 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                    Pemisah koma. Menghasilkan sedia baris entri stok tersendiri.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={!prodName.trim() || !prodColorsText.trim()}
                  onClick={handleSubmitProductForm}
                  className="w-full mt-2 py-2.5 bg-slate-900 border border-slate-950 hover:bg-slate-850 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs animate-pulse"
                >
                  {editingProductId ? '💾 Simpan Perubahan Produk' : '✨ Daftarkan Produk & Buat Matriks'}
                </button>
              </div>

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
                  {showHpp && <th className="py-3 px-4 text-right text-rose-800 font-extrabold bg-rose-50/50">HPP</th>}
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
                      {showHpp && (
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
