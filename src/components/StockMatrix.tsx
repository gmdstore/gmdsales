/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product, StockItem, SIZES, SizeType } from '../types';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Plus, Trash2, Edit2, Check, X, Sliders, Search, ChevronUp, ChevronDown } from 'lucide-react';

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
  onReorderProducts?: (updatedProducts: Product[]) => void;
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
  onDeleteProduct,
  onReorderProducts
}: StockMatrixProps) {
  // Tabs & Grouping Selection
  const [activeGroup, setActiveGroup] = useState<string>('Semua Grup');
  const [isManagingGroups, setIsManagingGroups] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');

  const [isHeaderFloating, setIsHeaderFloating] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current) return;
      const rect = tableContainerRef.current.getBoundingClientRect();
      setIsHeaderFloating(rect.top < 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as any);
    };
  }, []);

  // Master Data Product ADD/EDIT States
  const [isManagingProducts, setIsManagingProducts] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState<string>('');
  const [prodSku, setProdSku] = useState<string>('');
  const [prodGroup, setProdGroup] = useState<string>(groups[0] || 'Best Seller');
  const [prodHpp, setProdHpp] = useState<number>(100000);
  const [prodPrice, setProdPrice] = useState<number>(250000);
  const [prodImageUrl, setProdImageUrl] = useState<string>('👕');
  const [prodColors, setProdColors] = useState<string[]>(['']);
  const [variantSkus, setVariantSkus] = useState<Record<string, string>>({});

  // Column Visibility state
  const [showPhoto, setShowPhoto] = useState<boolean>(false);
  const [showColor, setShowColor] = useState<boolean>(true);
  const [showHpp, setShowHpp] = useState<boolean>(false);
  const [showSku, setShowSku] = useState<boolean>(false);
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

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('default');
  const [isManualReordering, setIsManualReordering] = useState<boolean>(false);

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

  // Sort filtered stock items based on sorting selection
  const sortedMatchingStocks = useMemo(() => {
    const list = [...matchingStocks];
    if (sortBy === 'default') {
      return list.sort((a, b) => {
        const indexA = products.findIndex(p => p.id === a.productId);
        const indexB = products.findIndex(p => p.id === b.productId);
        return indexA - indexB;
      });
    }

    return list.sort((a, b) => {
      const prodA = products.find(p => p.id === a.productId);
      const prodB = products.find(p => p.id === b.productId);
      if (!prodA || !prodB) return 0;

      switch (sortBy) {
        case 'name_asc':
          return prodA.name.localeCompare(prodB.name);
        case 'name_desc':
          return prodB.name.localeCompare(prodA.name);
        case 'sku_asc': {
          const skuA = prodA.sku || '';
          const skuB = prodB.sku || '';
          return skuA.localeCompare(skuB);
        }
        case 'sku_desc': {
          const skuA = prodA.sku || '';
          const skuB = prodB.sku || '';
          return skuB.localeCompare(skuA);
        }
        case 'price_asc':
          return prodA.price - prodB.price;
        case 'price_desc':
          return prodB.price - prodA.price;
        case 'qty_asc': {
          const qtyA = Object.values(a.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          const qtyB = Object.values(b.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          return qtyA - qtyB;
        }
        case 'qty_desc': {
          const qtyA = Object.values(a.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          const qtyB = Object.values(b.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          return qtyB - qtyA;
        }
        case 'hpp_asc': {
          const qtyA = Object.values(a.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          const qtyB = Object.values(b.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          return (qtyA * prodA.hpp) - (qtyB * prodB.hpp);
        }
        case 'hpp_desc': {
          const qtyA = Object.values(a.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          const qtyB = Object.values(b.stocks).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
          return (qtyB * prodB.hpp) - (qtyA * prodA.hpp);
        }
        default:
          return 0;
      }
    });
  }, [matchingStocks, sortBy, products]);

  // List of unique products currently visible in the table
  const visibleProductsInTable = useMemo(() => {
    const uniqueProds: Product[] = [];
    sortedMatchingStocks.forEach(s => {
      const prod = products.find(p => p.id === s.productId);
      if (prod && !uniqueProds.some(p => p.id === prod.id)) {
        uniqueProds.push(prod);
      }
    });
    return uniqueProds;
  }, [sortedMatchingStocks, products]);

  // Move a product up or down manually in the master list based on its visible position
  const handleMoveProduct = (productId: string, direction: 'up' | 'down') => {
    if (!onReorderProducts) return;
    
    const visIndex = visibleProductsInTable.findIndex(p => p.id === productId);
    if (visIndex === -1) return;

    const targetVisIndex = direction === 'up' ? visIndex - 1 : visIndex + 1;
    if (targetVisIndex < 0 || targetVisIndex >= visibleProductsInTable.length) return;

    const currentProd = visibleProductsInTable[visIndex];
    const targetProd = visibleProductsInTable[targetVisIndex];

    const masterIndexCurr = products.findIndex(p => p.id === currentProd.id);
    const masterIndexTarget = products.findIndex(p => p.id === targetProd.id);

    if (masterIndexCurr === -1 || masterIndexTarget === -1) return;

    const reordered = [...products];
    // Swap the products in master list
    reordered[masterIndexCurr] = targetProd;
    reordered[masterIndexTarget] = currentProd;

    onReorderProducts(reordered);
  };

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
    setProdColors(p.colors && p.colors.length > 0 ? p.colors : ['']);
    setVariantSkus(p.variantSkus || {});
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
    setProdColors(['']);
    setVariantSkus({});
    setSelectedSizes(['S', 'M', 'L', 'XL', '2XL']);
  };

  const handleSubmitProductForm = () => {
    const trimmedName = prodName.trim();
    if (!trimmedName) return;

    const validColors = prodColors.map(c => c.trim()).filter(c => c.length > 0);
    if (validColors.length === 0) {
      alert("Harus ada minimal 1 variasi warna.");
      return;
    }

    if (editingProductId) {
      const updatedProduct: Product = {
        id: editingProductId,
        name: trimmedName,
        sku: prodSku,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: validColors,
        variantSkus: variantSkus,
        sizes: selectedSizes
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p_${Date.now()}`,
        name: trimmedName,
        sku: prodSku,
        group: prodGroup,
        hpp: prodHpp,
        price: prodPrice,
        imageUrl: prodImageUrl,
        colors: validColors,
        variantSkus: variantSkus,
        sizes: selectedSizes
      };
      onAddProduct(newProduct);
    }
    handleCancelEditProduct();
  };

  return (
    <div id="stock_matrix_section" className="space-y-6 animate-fade-in text-slate-705 pt-6 md:pt-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>📦</span> Katalog Produk & Stok Sediaan
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 self-start sm:self-auto shrink-0">
          {/* Kelola Produk */}
          <button
            onClick={() => {
              setIsManagingProducts(!isManagingProducts);
              setIsManagingGroups(false);
            }}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2.5 cursor-pointer select-none transition-all duration-200 border text-xs font-bold shadow-3xs ${
              isManagingProducts 
                ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 scale-[1.01]' 
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-205 hover:border-slate-300'
            }`}
          >
            <span>👕</span>
            <div className="text-left leading-tight">
              <div className="font-extrabold text-[11px]">Kelola Produk</div>
              <div className={`text-[9px] ${isManagingProducts ? 'text-emerald-100' : 'text-slate-400'} font-semibold mt-0.5`}>
                {isManagingProducts ? 'Tutup form' : 'Daftar & Edit'}
              </div>
            </div>
          </button>

          {/* Kelola Grup */}
          <button
            onClick={() => {
              setIsManagingGroups(!isManagingGroups);
              setIsManagingProducts(false);
            }}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2.5 cursor-pointer select-none transition-all duration-200 border text-xs font-bold shadow-3xs ${
              isManagingGroups 
                ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600 scale-[1.01]' 
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-205 hover:border-slate-300'
            }`}
          >
            <span>⚙️</span>
            <div className="text-left leading-tight">
              <div className="font-extrabold text-[11px]">Kelola Grup</div>
              <div className={`text-[9px] ${isManagingGroups ? 'text-rose-100' : 'text-slate-400'} font-semibold mt-0.5`}>
                {isManagingGroups ? 'Tutup form' : 'Atur kategori'}
              </div>
            </div>
          </button>
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
              <span className="group-hover:text-slate-900">Tampilkan HPP (Di Bawah Nama Produk)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold select-none group">
              <input
                type="checkbox"
                checked={showSku}
                onChange={(e) => setShowSku(e.target.checked)}
                className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors"
              />
              <span className="group-hover:text-slate-900">Tampilkan SKU Induk</span>
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

        {/* Search & Sort Container */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Real-time Search Input */}
          <div className="relative w-full sm:max-w-md">
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

          {/* Sorting Control Selection */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <span className="text-slate-500 font-extrabold text-[11px] whitespace-nowrap">Urutkan Produk:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (e.target.value !== 'default') {
                    setIsManualReordering(false);
                  }
                }}
                className="w-full sm:w-auto px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-750 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-3xs cursor-pointer min-w-[170px]"
              >
                <option value="default">📌 Urutan Bawaan</option>
                <option value="name_asc">🔤 Nama Produk (A - Z)</option>
                <option value="name_desc">🔤 Nama Produk (Z - A)</option>
                <option value="sku_asc">🏷️ SKU (A - Z)</option>
                <option value="sku_desc">🏷️ SKU (Z - A)</option>
                <option value="price_asc">💵 Harga: Terendah</option>
                <option value="price_desc">💵 Harga: Tertinggi</option>
                <option value="qty_asc">📦 Total Qty: Terendah</option>
                <option value="qty_desc">📦 Total Qty: Tertinggi</option>
                <option value="hpp_asc">💰 Total Nilai HPP: Terendah</option>
                <option value="hpp_desc">💰 Total Nilai HPP: Tertinggi</option>
              </select>
            </div>

            {/* Manual Reorder Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (!isManualReordering) {
                  setSortBy('default');
                }
                setIsManualReordering(!isManualReordering);
              }}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs border ${
                isManualReordering
                  ? 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
              }`}
            >
              {isManualReordering ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Selesai Atur</span>
                </>
              ) : (
                <>
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Atur Urutan Manual</span>
                </>
              )}
            </button>
          </div>
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
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500/80 outline-none"
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
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Nama Produk */}
                  <div className="flex-1">
                    <label className="block font-bold text-slate-700 mb-1">Nama Produk:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Premium Cotton Tee..."
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* SKU Induk */}
                  <div className="w-full sm:w-1/3">
                    <label className="block font-bold text-slate-700 mb-1">SKU Induk:</label>
                    <input
                      type="text"
                      placeholder="Opsional: TEE-001"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-850"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {prodPrice > 0 && prodHpp > 0 && prodPrice < prodHpp && (
                  <div className="bg-rose-50 border border-rose-100 px-3 py-2 text-rose-800 rounded-xl text-[10px] font-bold">
                    ⚠️ Peringatan: Harga jual lebih rendah dari HPP (Rugi modal)!
                  </div>
                )}

                {/* Variasi Warna (List) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Variasi Warna:</label>
                  <div className="space-y-2">
                    {prodColors.map((color, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Warna (Misal: Hitam)"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...prodColors];
                            newColors[index] = e.target.value;
                            setProdColors(newColors);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (prodColors.length > 1) {
                              setProdColors(prodColors.filter((_, i) => i !== index));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProdColors([...prodColors, ''])}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      + Tambah Variasi
                    </button>
                  </div>
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
                  disabled={!prodName.trim() || prodColors.filter(c => c.trim().length > 0).length === 0 || selectedSizes.length === 0}
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
      <div className="bg-white border border-slate-205 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 lg:overflow-visible" id="stock_matrix_table_panel">
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div>
            <span className="font-extrabold text-slate-900 text-sm">Grup: <span className="text-emerald-700 font-black">{activeGroup}</span></span>
            <span className="text-slate-400 ml-2 font-mono font-medium">({sortedMatchingStocks.length} Kombinasi Warna SKU)</span>
          </div>
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">💡 <span>Klik ganda atau klik sel angka ukuran untuk mengubah stok instan.</span></span>
        </div>

        {isManualReordering && sortBy === 'default' && (
          <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-100/70 text-emerald-850 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Mode Atur Urutan Manual aktif. Silakan klik tombol <ChevronUp className="inline h-3.5 w-3.5" /> atau <ChevronDown className="inline h-3.5 w-3.5" /> di kolom "Atur" untuk memindahkan produk ke atas/bawah.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsManualReordering(false)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-normal rounded-lg text-[10px] transition-colors uppercase tracking-wider cursor-pointer"
            >
              Selesai Mengatur
            </button>
          </div>
        )}

        {sortedMatchingStocks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <span className="text-4xl">🗃️</span>
            <p className="text-sm font-normal text-slate-700">
              {searchQuery.trim() 
                ? `Tidak ada produk atau SKU yang cocok dengan pencarian "${searchQuery}".` 
                : `Tidak ada produk terkait grup "${activeGroup}".`}
            </p>
            <p className="text-xs">
              {searchQuery.trim() ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Bisa tambahkan produk baru atau pindahkan sedia produk di atas.'}
            </p>
          </div>
        ) : (
          <div ref={tableContainerRef} className="overflow-x-auto lg:overflow-visible border border-slate-300 rounded-2xl relative">
            <table className="w-full text-left col-auto border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-semibold text-black uppercase tracking-wider">
                  {sortBy === 'default' && isManualReordering && (
                    <th className="py-3 px-2 text-center w-16 bg-slate-100 text-black border-r border-slate-300 sticky top-0 z-20">
                      Atur
                    </th>
                  )}
                  <th className="py-3 px-4 bg-slate-100 text-black sticky top-0 z-20">Nama Produk Master</th>
                  {showColor && <th className="py-3 px-4 bg-slate-100 text-black sticky top-0 z-20">Warna</th>}
                  
                  {/* Sizegroup columns S-4XL */}
                  {SIZES.map(size => (
                    <th key={size} className="py-3 px-2 text-center w-16 bg-slate-100 text-black sticky top-0 z-20 border-l border-slate-300">
                      {size}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center w-20 bg-slate-100 font-semibold text-black border-l border-slate-300 sticky top-0 z-20">Total Qty</th>
                  <th className="py-3 px-4 text-right w-28 bg-slate-100 font-semibold text-black border-l border-slate-300 sticky top-0 z-20">Total HPP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-xs text-slate-750">
                {sortedMatchingStocks.map((stockItem, index) => {
                  const product = products.find(p => p.id === stockItem.productId);
                  if (!product) return null;

                  const totalQty = Object.values(stockItem.stocks).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0) as number;
                  const totalHpp = totalQty * product.hpp;

                  const visIndex = visibleProductsInTable.findIndex(p => p.id === product.id);
                  const isFirstVisible = visIndex === 0;
                  const isLastVisible = visIndex === visibleProductsInTable.length - 1;

                  const currentProductId = stockItem.productId;
                  const isConsecutiveFirstRow = index === 0 || sortedMatchingStocks[index - 1].productId !== currentProductId;
                  const isConsecutiveLastRow = index === sortedMatchingStocks.length - 1 || sortedMatchingStocks[index + 1].productId !== currentProductId;
                  
                  let productRowCount = 0;
                  if (isConsecutiveFirstRow) {
                    productRowCount = 1;
                    for (let i = index + 1; i < sortedMatchingStocks.length; i++) {
                      if (sortedMatchingStocks[i].productId === currentProductId) {
                        productRowCount++;
                      } else {
                        break;
                      }
                    }
                  }

                  let productOverallQty = 0;
                  if (isConsecutiveLastRow) {
                    for (let i = index; i >= 0; i--) {
                      if (sortedMatchingStocks[i].productId === currentProductId) {
                        const itemQty = Object.values(sortedMatchingStocks[i].stocks).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0) as number;
                        productOverallQty += itemQty;
                      } else {
                        break;
                      }
                    }
                  }
                  const productOverallHpp = productOverallQty * product.hpp;

                  let beforeQtyColSpan = 1 + SIZES.length; // Nama(1), SIZES(n)
                  if (sortBy === 'default' && isManualReordering) beforeQtyColSpan++;
                  if (showColor) beforeQtyColSpan++;

                  return (
                    <React.Fragment key={stockItem.id}>
                      <tr className="bg-white text-black hover:bg-slate-50 transition-colors">
                      {/* Manual Sorting controls */}
                      {sortBy === 'default' && isManualReordering && isConsecutiveFirstRow && (
                        <td rowSpan={productRowCount} className="py-3.5 px-2 text-center border-r border-slate-300 whitespace-nowrap bg-white text-black">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(product.id, 'up')}
                              disabled={isFirstVisible}
                              className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                                isFirstVisible ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title="Naikkan posisi produk"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveProduct(product.id, 'down')}
                              disabled={isLastVisible}
                              className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                                isLastVisible ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title="Turunkan posisi produk"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Name */}
                      {isConsecutiveFirstRow && (
                        <td rowSpan={productRowCount} className="py-3.5 px-4 font-normal text-black font-sans bg-white">
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            {showHpp && (
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                HPP: {formatRp(product.hpp)}
                              </span>
                            )}
                            {showSku && product.sku && (
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                SKU: {product.sku}
                              </span>
                            )}
                            {searchQuery && (
                              <span className="text-[9px] text-emerald-600 font-normal mt-0.5">
                                Grup: {product.group}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Optional Color */}
                      {showColor && (
                        <td className="py-3.5 px-4 font-normal text-black bg-white">
                          {stockItem.color}
                        </td>
                      )}

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
                              className="py-3 px-1 text-center font-mono select-none border-l border-slate-300 bg-white text-black"
                              title="Ukuran tidak aktif untuk produk ini"
                            >
                              
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={size} 
                            onClick={() => !isEditing && handleStartEditStock(stockItem.id, size, qtyVal)}
                            className={`py-3 px-1 text-center font-mono cursor-pointer transition-all relative border-l border-slate-300 select-none ${isEditing ? 'bg-amber-100/50 font-normal text-black scale-102 border-amber-300' : qtyVal === 0 ? 'bg-white text-black hover:bg-slate-50' : qtyVal < 5 ? 'bg-white hover:bg-slate-50 font-normal text-black' : 'bg-white hover:bg-slate-50 font-normal text-black'}`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoFocus
                                value={editValue}
                                onFocus={(e) => e.target.select()}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
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
                                className="w-12 text-center text-xs font-normal font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-300 rounded-md px-1 py-0.5 bg-white text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center min-h-[1.5rem]">
                                <span>{qtyVal === 0 ? "" : qtyVal}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Qty column */}
                      <td className="py-3.5 px-4 font-mono font-normal text-black bg-white text-center select-none border-l border-slate-300">
                        {totalQty === 0 ? "" : totalQty}
                      </td>

                      {/* Total HPP column */}
                      <td className="py-3.5 px-4 text-right font-mono font-normal text-black bg-white select-none border-l border-slate-300">
                        {totalQty === 0 ? "" : formatRp(totalHpp)}
                      </td>
                    </tr>
                    {isConsecutiveLastRow && (
                      <tr className="bg-slate-100 font-medium text-black">
                        <td colSpan={beforeQtyColSpan} className="py-2 px-4 text-right font-semibold text-black border-t border-b border-slate-300 bg-slate-100">
                          Total
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-black border-l border-t border-b border-slate-300 bg-slate-100">
                          {productOverallQty}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-black border-l border-t border-b border-slate-300 bg-slate-100">
                          {formatRp(productOverallHpp)}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
