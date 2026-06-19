/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Product, StockItem, SIZES, SizeType } from '../types';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Plus, Trash2, Edit2, Check, X, Sliders, Search } from 'lucide-react';

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
  const [activeGroup, setActiveGroup] = useState<string>('Semua Grup');
  const [isManagingGroups, setIsManagingGroups] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');

  // Master Data Product ADD/EDIT States
  const [isManagingProducts, setIsManagingProducts] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodSku, setProdSku] = useState<string>('');
  const [prodGroup, setProdGroup] = useState<string>(groups[0] || 'Best Seller');
  const [prodHpp, setProdHpp] = useState<number>(100000);
  const [prodPrice, setProdPrice] = useState<number>(250000);
  const [prodImageUrl, setProdImageUrl] = useState<string>('👕');
  const [prodColorsText, setProdColorsText] = useState<string>('');

  // Column Visibility state
  const [showPhoto, setShowPhoto] = useState<boolean>(false);
  const [showColor, setShowColor] = useState<boolean>(true);
  const [showHpp, setShowHpp] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Excel-like Inline Stock Edit State
  const [editingCell, setEditingCell] = useState<{ stockItemId: string; size: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Pending Stock Save confirmation state
  const [pendingStockSave, setPendingStockSave] = useState<{
    stockItemId: string;
    size: string;
    oldQty: number;
    newQty: number;
    productName: string;
    color: string;
  } | null>(null);

  // Search Query State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pending deletes states
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<string | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [groupWarningMsg, setGroupWarningMsg] = useState<string | null>(null);

  // Product Recategorization helper State
  const [editingProductGroup, setEditingProductGroup] = useState<string | null>(null);

  // Selected sizes checkbox state for Add/Edit Form (default: S, M, L, XL, 2XL)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL', '2XL']);

  // Filter products by active categorized tab
  const filteredProducts = activeGroup === 'Semua Grup' ? products : products.filter(p => p.group === activeGroup);

  // Gather stock matrix items corresponding to filtered products, optionally filtered by real-time search query
  const matchingStocks = stocks.filter(s => {
    const product = products.find(p => p.id === s.productId);
    if (!product) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = product.name.toLowerCase().includes(q);
      const skuMatch = product.sku ? product.sku.toLowerCase().includes(q) : false;
      const colorMatch = s.color.toLowerCase().includes(q);
      const groupMatch = product.group.toLowerCase().includes(q);
      return nameMatch || skuMatch || colorMatch || groupMatch;
    }

    if (activeGroup === 'Semua Grup') {
      return true;
    }

    return product.group === activeGroup;
  });

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

  const handleRequestSaveStock = (stockItemId: string, size: string) => {
    const stockItem = stocks.find(s => s.id === stockItemId);
    if (!stockItem) {
      setEditingCell(null);
      return;
    }
    const product = products.find(p => p.id === stockItem.productId);
    const productName = product ? product.name : stockItem.productName;
    const color = stockItem.color;

    const oldQty = stockItem.stocks[size] ?? 0;
    const cleanValue = editValue.replace(/\D/g, ''); // only allow digits
    const newQty = cleanValue === '' ? 0 : parseInt(cleanValue, 10);

    if (isNaN(newQty) || newQty < 0) {
      setEditingCell(null);
      return;
    }

    if (oldQty === newQty) {
      setEditingCell(null);
      return;
    }

    setPendingStockSave({
      stockItemId,
      size,
      oldQty,
      newQty,
      productName,
      color
    });
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
      setGroupWarningMsg("Harus ada minimal 1 grup produk.");
      return;
    }
    setPendingDeleteGroup(gName);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdSku(p.sku || '');
    setProdGroup(p.group);
    setProdHpp(p.hpp);
    setProdPrice(p.price);
    setProdImageUrl(p.imageUrl);
    setProdColorsText(p.colors.join(', '));
    setSelectedSizes(p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']);
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProdName('');
    setProdSku('');
    setProdGroup(groups[0] || 'Best Seller');
    setProdHpp(100000);
    setProdPrice(250000);
    setProdImageUrl('👕');
    setProdColorsText('');
    setSelectedSizes(['S', 'M', 'L', 'XL', '2XL']);
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

    const skuNormalized = prodSku.trim().toUpperCase();

    if (editingProductId) {
      const updatedProduct: Product = {
        id: editingProductId,
        name: trimmedName,
        sku: skuNormalized || undefined,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: colors,
        sizes: selectedSizes
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p_${Date.now()}`,
        name: trimmedName,
        sku: skuNormalized || undefined,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: colors,
        sizes: selectedSizes
      };
      onAddProduct(newProduct);
    }

    handleCancelEditProduct();
  };

  return (
    <div id="stock_matrix_section" className="space-y-6 animate-fade-in text-slate-705">
      
      {/* Menu Utama Pengelolaan */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
              MENU UTAMA
            </span>
            <h2 className="text-xl font-black text-white mt-2 tracking-tight">Katalog Produk & Stok Sediaan</h2>
            <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">
              Pusat komando pengelolaan produk dan stok. Gunakan tombol status di sebelah kanan untuk membuka manajemen produk secara instan, mengedit variasi warna, mengatur harga pokok (HPP), atau menyusun grup klasifikasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
            {/* Kelola Produk */}
            <button
              onClick={() => {
                setIsManagingProducts(!isManagingProducts);
                setIsManagingGroups(false);
              }}
              className={`px-5 py-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer select-none transition-all duration-200 shadow-md ${
                isManagingProducts 
                  ? 'bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 scale-[1.02]' 
                  : 'bg-slate-800 hover:bg-slate-750 text-white font-bold hover:shadow-lg hover:scale-[1.01]'
              }`}
            >
              <span className="text-xl">📦</span>
              <div className="text-left">
                <div className="text-xs font-black tracking-wide">Kelola Produk</div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {isManagingProducts ? 'Sedang Terbuka (Klik Tutup)' : 'Daftar & Edit Produk'}
                </div>
              </div>
            </button>

            {/* Kelola Grup */}
            <button
              onClick={() => {
                setIsManagingGroups(!isManagingGroups);
                setIsManagingProducts(false);
              }}
              className={`px-5 py-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer select-none transition-all duration-200 shadow-md ${
                isManagingGroups 
                  ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20 hover:bg-rose-600 scale-[1.02]' 
                  : 'bg-slate-800 hover:bg-slate-750 text-white font-bold hover:shadow-lg hover:scale-[1.01]'
              }`}
            >
              <span className="text-xl">⚙️</span>
              <div className="text-left">
                <div className="text-xs font-black tracking-wide">Kelola Grup</div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {isManagingGroups ? 'Sedang Terbuka (Klik Tutup)' : 'Atur & Pindah Kategori'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Visibility Control & Tools Card (Auto-Hidden / Collapsible) */}
      <div className="bg-white border border-slate-205 rounded-3xl p-4 shadow-3xs transition-all duration-300">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-xs cursor-pointer select-none py-1 px-2 hover:bg-slate-50 rounded-xl transition-all"
        >
          <span className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-emerald-500" />
            <span className="font-extrabold text-slate-900">Pengaturan Tampilan Matriks & Kolom</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${showConfig ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              {showConfig ? 'Sedang Terbuka' : 'Sembunyi / Klik Tampilkan'}
            </span>
          </span>
          <span className="text-slate-400 font-bold transition-transform duration-250">
            {showConfig ? '▲' : '▼'}
          </span>
        </button>

        {showConfig && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-700 animate-fade-in pl-2">
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
        )}
      </div>

      {/* Product Group Category Tabs Navigation */}
      <div className="flex flex-col gap-3.5 pb-2 border-b border-slate-250/60">
        {/* Dynamic Category Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => {
              setActiveGroup('Semua Grup');
              setIsManagingGroups(false);
              setIsManagingProducts(false);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl whitespace-nowrap border cursor-pointer select-none transition-all active:scale-95 ${activeGroup === 'Semua Grup' && !isManagingGroups && !isManagingProducts ? 'bg-slate-900 text-white border-slate-950 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 shadow-3xs'}`}
          >
            📂 Semua Grup ({products.length})
          </button>
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

        {/* Real-time Search Input - Placed directly below the button tabs row */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama produk, SKU, warna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-405 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-3xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer font-black text-xs"
              title="Bersihkan Pencarian"
            >
              ✕
            </button>
          )}
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
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                          {p.sku && (
                            <span className="text-[9px] font-mono font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 uppercase tracking-wide">
                              {p.sku}
                            </span>
                          )}
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
                        onClick={() => setPendingDeleteProduct(p)}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Nama Produk */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nama Produk:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Premium Cotton Tee..."
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Kode SKU */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode SKU:</label>
                    <input
                      type="text"
                      placeholder="Contoh: TS-COT"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-mono font-bold uppercase text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
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

                {/* Variasi Ukuran (checkboxes) */}
                <div>
                  <label className="block font-semibold text-slate-705 mb-1 text-[11px]">Variasi Ukuran (Pilih yang Aktif):</label>
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'All Size'].map(sz => {
                      const isChecked = selectedSizes.includes(sz);
                      return (
                        <label 
                          key={sz} 
                          className={`flex items-center gap-1 p-1 max-w-full rounded-lg border text-[10px] font-extrabold cursor-pointer select-none transition-all ${isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 font-medium'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSizes([...selectedSizes, sz]);
                              } else {
                                setSelectedSizes(selectedSizes.filter(s => s !== sz));
                              }
                            }}
                            className="h-3 w-3 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                          />
                          <span className="truncate">{sz}</span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedSizes.length === 0 && (
                    <span className="text-[9px] text-rose-600 font-bold block mt-1">
                      ⚠️ Pilih minimal satu variasi ukuran produk
                    </span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  disabled={!prodName.trim() || !prodColorsText.trim() || selectedSizes.length === 0}
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
            <p className="text-sm font-semibold text-slate-700">
              {searchQuery.trim() 
                ? `Tidak ada produk atau SKU yang cocok dengan pencarian "${searchQuery}".` 
                : `Tidak ada produk terkait grup "${activeGroup}".`}
            </p>
            <p className="text-xs">
              {searchQuery.trim() ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Bisa tambahkan produk baru atau pindahkan sedia produk di atas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left col-auto border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-32">Kode SKU</th>
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
                  <th className="py-3 px-4 text-center w-20 bg-slate-100/80 font-black text-slate-700 border-l border-slate-200">Total Qty</th>
                  {showHpp && <th className="py-3 px-4 text-right w-28 bg-rose-100/40 font-black text-rose-800 border-l border-slate-200">Total HPP</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-750">
                {matchingStocks.map((stockItem) => {
                  const product = products.find(p => p.id === stockItem.productId);
                  if (!product) return null;

                  const totalQty = Object.values(stockItem.stocks).reduce((sum, qty) => sum + (qty ?? 0), 0);
                  const totalHpp = totalQty * product.hpp;

                  return (
                    <tr key={stockItem.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Kode SKU Column */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800/90 whitespace-nowrap">
                        {product.sku ? (
                          <span className="bg-slate-100/80 px-2 py-1 rounded text-[11px] border border-slate-200">
                            {product.sku}
                          </span>
                        ) : (
                          <span className="text-slate-350 italic font-medium text-[11px]">- none -</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {searchQuery && (
                            <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">
                              Grup: {product.group}
                            </span>
                          )}
                        </div>
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
                        const cellQty = stockItem.stocks[size];
                        const isApplicable = cellQty !== undefined;
                        const qtyVal = cellQty ?? 0;
                        const isEditing = editingCell?.stockItemId === stockItem.id && editingCell?.size === size;

                        if (!isApplicable) {
                          return (
                            <td 
                              key={size}
                              className="py-3 px-1 text-center font-mono select-none border-l border-r border-slate-100/40 bg-slate-50/10"
                              title="Ukuran tidak aktif untuk produk ini"
                            >
                              
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={size} 
                            onClick={() => !isEditing && handleStartEditStock(stockItem.id, size, qtyVal)}
                            className={`py-3 px-1 text-center font-mono cursor-pointer transition-all relative border-l border-r border-slate-100/40 select-none ${isEditing ? 'bg-amber-100/50 font-black text-amber-950 scale-102 border-amber-300' : qtyVal === 0 ? 'bg-rose-50/40 text-rose-600/70 hover:bg-rose-100/80' : qtyVal < 5 ? 'bg-amber-50 hover:bg-amber-100/80 font-bold text-amber-600' : 'hover:bg-slate-100/60 font-semibold text-slate-800'}`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ''))}
                                onBlur={() => handleRequestSaveStock(stockItem.id, size)}
                                onWheel={(e) => {
                                  e.preventDefault();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRequestSaveStock(stockItem.id, size);
                                  if (e.key === 'Escape') setEditingCell(null);
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                className="w-12 text-center text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-300 rounded-md px-1 py-0.5 bg-white text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <span>{qtyVal === 0 ? "" : qtyVal}</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Qty column */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 bg-slate-100/20 text-center select-none border-l border-slate-200">
                        {totalQty === 0 ? "" : totalQty}
                      </td>

                      {/* Total HPP column */}
                      {showHpp && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 bg-rose-50/30 select-none border-l border-slate-200">
                          {totalQty === 0 ? "" : formatRp(totalHpp)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Stock Updates */}
      {pendingStockSave && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in" id="confirm_stock_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-105 shadow-2xl relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
            
            <div className="flex items-start gap-4 animate-fade-in">
              <div className="p-3 bg-emerald-55 text-emerald-800 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ✏️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Konfirmasi Perubahan Stok</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin memperbarui kuantitas stok sediaan item berikut?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4.5 space-y-2 text-xs">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-400 font-medium whitespace-nowrap">Produk:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]" title={pendingStockSave.productName}>
                  {pendingStockSave.productName}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Warna:</span>
                <span className="font-semibold text-slate-800">{pendingStockSave.color}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400 font-medium">Ukuran:</span>
                <span className="font-bold text-slate-900 font-mono bg-slate-200/80 px-2.5 py-0.5 rounded text-[11px]">{pendingStockSave.size}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                <span className="text-slate-400 font-medium">Ubah Kuantitas:</span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-rose-600 font-black line-through">{pendingStockSave.oldQty} pcs</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{pendingStockSave.newQty} pcs</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingStockSave(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-705 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStock(pendingStockSave.stockItemId, pendingStockSave.size, pendingStockSave.newQty);
                  setPendingStockSave(null);
                }}
                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer select-none transition-all active:scale-95"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Warning Modal for Minimum Categories */}
      {groupWarningMsg && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="group_warning_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Gagal Menghapus Grup</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {groupWarningMsg}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setGroupWarningMsg(null)}
                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-slate-900 hover:bg-slate-850 rounded-xl cursor-pointer select-none transition-all active:scale-95 text-center"
              >
                Dipahami
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for Group Deletion */}
      {pendingDeleteGroup && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="confirm_delete_group_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Grup Klasifikasi</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus grup <strong className="text-slate-800">"{pendingDeleteGroup}"</strong>?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
              Semua produk di dalam grup ini akan secara otomatis direlokasi/dipindahkan ke grup alternatif: <strong className="text-slate-800 font-bold">"{groups.find(g => g !== pendingDeleteGroup)}"</strong>.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteGroup(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-755 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetFallback = groups.find(g => g !== pendingDeleteGroup) || '';
                  onDeleteGroup(pendingDeleteGroup);
                  setActiveGroup(targetFallback);
                  setPendingDeleteGroup(null);
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

      {/* Confirmation Modal for Product Deletion */}
      {pendingDeleteProduct && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="confirm_delete_product_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Produk Master</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus produk <strong className="text-slate-800">{pendingDeleteProduct.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
               Tindakan ini akan menghapus semua sediaan stok ukuran (<span className="font-mono font-bold">S, M, L, XL, XXL, 3XL, 4XL</span>) dari diagram matriks secara permanen.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteProduct(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-755 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(pendingDeleteProduct.id);
                  setPendingDeleteProduct(null);
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
