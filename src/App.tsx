/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, StockItem, Channel, Order } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_STOCKS, 
  INITIAL_CHANNELS, 
  INITIAL_GROUPS, 
  INITIAL_ORDERS 
} from './data';
import Dashboard from './components/Dashboard';
import StockMatrix from './components/StockMatrix';
import OrderModal from './components/OrderModal';
import ChannelsConfig from './components/ChannelsConfig';

import { 
  Plus, 
  LayoutDashboard, 
  Layers, 
  Settings2, 
  ShieldAlert, 
  ShieldCheck, 
  FileText,
  HelpCircle,
  TrendingDown,
  BookOpen
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stocks' | 'channels'>('dashboard');
  
  // Security Role simulation: 'owner' | 'staff'
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('owner');

  // Load and preserve operational state in localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('omni_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [stocks, setStocks] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('omni_stocks');
    return saved ? JSON.parse(saved) : INITIAL_STOCKS;
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('omni_channels');
    return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  });

  const [groups, setGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('omni_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('omni_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Modal control triggers
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [showPrdHelper, setShowPrdHelper] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('omni_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('omni_stocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('omni_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('omni_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('omni_orders', JSON.stringify(orders));
  }, [orders]);

  // Operational function adjustments 

  // F-01: Update specific stock level (Excel-like edit)
  const handleUpdateStock = (stockItemId: string, size: string, newQty: number) => {
    setStocks(prev => 
      prev.map(item => {
        if (item.id === stockItemId) {
          return {
            ...item,
            stocks: {
              ...item.stocks,
              [size]: newQty
            }
          };
        }
        return item;
      })
    );
  };

  // F-03/F-04: Save Order and Automatically subtract warehouse matrix stock!
  const handleSaveOrder = (newOrder: Order) => {
    // 1. Save new Order into local registry
    setOrders(prev => [newOrder, ...prev]);

    // 2. Subtract warehouse matrix stock levels immediately
    setStocks(prevStocks => {
      // Create a mutable copy of stocks
      return prevStocks.map(stockItem => {
        // Find if this stockItem correlates to any item purchased in the order
        // Key format is `${productId}_${color}`
        const matchedPurchasedItems = newOrder.products.filter(purchased => 
          `${purchased.productId}_${purchased.color}` === stockItem.id
        );

        if (matchedPurchasedItems.length > 0) {
          // Subtract quantities from the sizes in stocks
          const updatedSizeStocks = { ...stockItem.stocks };
          matchedPurchasedItems.forEach(purchased => {
            const currentStockVal = updatedSizeStocks[purchased.size] ?? 0;
            // Deduct the quantity, lock at 0 min
            updatedSizeStocks[purchased.size] = Math.max(0, currentStockVal - purchased.qty);
          });

          return {
            ...stockItem,
            stocks: updatedSizeStocks
          };
        }

        return stockItem;
      });
    });
  };

  // Create Category Group
  const handleCreateGroup = (groupName: string) => {
    if (!groups.includes(groupName)) {
      setGroups(prev => [...prev, groupName]);
    }
  };

  // Delete Category Group
  const handleDeleteGroup = (groupName: string) => {
    const nextGroups = groups.filter(g => g !== groupName);
    setGroups(nextGroups);

    // Relocate products in the deleted group to the first remaining group
    const fallbackGroup = nextGroups[0] || 'Uncategorized';
    setProducts(prev => 
      prev.map(p => {
        if (p.group === groupName) {
          return { ...p, group: fallbackGroup };
        }
        return p;
      })
    );
  };

  // Relocate a product category individually
  const handleUpdateProductGroup = (productId: string, newGroup: string) => {
    setProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          return { ...p, group: newGroup };
        }
        return p;
      })
    );
  };

  // Update Sales channels guidelines
  const handleUpdateChannel = (updatedChannel: Channel) => {
    setChannels(prev => 
      prev.map(c => c.id === updatedChannel.id ? updatedChannel : c)
    );
  };

  // Restore mock factory defaults handler
  const handleResetFactoryDefaults = () => {
    if (confirm("Apakah Anda yakin ingin mengembalikan data awal simulasi OmniOrder? Kontak order baru dan perubahan stok kustom Anda akan dibersihkan.")) {
      localStorage.removeItem('omni_products');
      localStorage.removeItem('omni_stocks');
      localStorage.removeItem('omni_channels');
      localStorage.removeItem('omni_groups');
      localStorage.removeItem('omni_orders');

      setProducts(INITIAL_PRODUCTS);
      setStocks(INITIAL_STOCKS);
      setChannels(INITIAL_CHANNELS);
      setGroups(INITIAL_GROUPS);
      setOrders(INITIAL_ORDERS);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Top Main Navigation Navigation Board */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 shadow-2xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Brand Title */}
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-slate-900 text-white rounded-xl shadow-md text-base leading-none font-black select-none">
                📦
              </span>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                  OmniOrder
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-250 roundedpx px-2 py-0.5 ml-2 font-black tracking-wider uppercase align-middle shadow-3xs">
                  MVP Fase 1
                </span>
              </div>
            </div>

            {/* Quick action simulation stats */}
            <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
              <button
                onClick={() => setShowPrdHelper(!showPrdHelper)}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 cursor-pointer transition-all"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                Daftar Fitur Checklist
              </button>

              <div className="h-4 w-px bg-slate-200" />

              <span className="text-slate-500">
                User Role: <span className="text-slate-950 font-black">{userRole === 'owner' ? '👑 Owner' : '👥 Staff Admin'}</span>
              </span>
            </div>
            
          </div>
        </div>

        {/* Dynamic Nav Tabs Navigation Panel */}
        <div className="bg-slate-50 border-t border-slate-150 py-1.5 px-2">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl transition-all font-extrabold cursor-pointer border text-xs shadow-3xs ${activeTab === 'dashboard' ? 'bg-slate-900 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Finansial
              </button>

              <button
                onClick={() => setActiveTab('stocks')}
                className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl transition-all font-extrabold cursor-pointer border text-xs shadow-3xs ${activeTab === 'stocks' ? 'bg-slate-900 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Layers className="h-4 w-4" />
                Matriks Stok Gudang
              </button>

              <button
                onClick={() => setActiveTab('channels')}
                className={`inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl transition-all font-extrabold cursor-pointer border text-xs shadow-3xs ${activeTab === 'channels' ? 'bg-slate-900 border-slate-950 text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Settings2 className="h-4 w-4" />
                Kanal Omnichannel
              </button>
            </div>

            <button
              onClick={handleResetFactoryDefaults}
              className="text-[11px] font-bold text-slate-400 hover:text-red-500 hover:underline cursor-pointer transition-colors"
              title="Reset manual order database & stocks data back to initial draft values"
            >
              🔄 Reset Simulasi Awal
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic View Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Dynamic display views */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            orders={orders} 
            channels={channels}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
          />
        )}

        {activeTab === 'stocks' && (
          <StockMatrix
            products={products}
            stocks={stocks}
            groups={groups}
            userRole={userRole}
            onChangeRole={setUserRole}
            onUpdateStock={handleUpdateStock}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            onUpdateProductGroup={handleUpdateProductGroup}
          />
        )}

        {activeTab === 'channels' && (
          <ChannelsConfig
            channels={channels}
            onUpdateChannel={handleUpdateChannel}
            userRole={userRole}
          />
        )}

        {/* PRD Features Checklist Panel Overlay */}
        {showPrdHelper && (
          <div className="mt-8 bg-emerald-50/70 border border-emerald-150 p-6 rounded-3xl space-y-4 animate-fade-in text-xs text-gray-700">
            <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-emerald-600" />
                Checklist Implementasi Fitur Sesuai Dokumen PRD
              </h3>
              <button
                onClick={() => setShowPrdHelper(false)}
                className="text-gray-400 hover:text-gray-650 cursor-pointer text-sm font-bold"
              >
                ✕ Sembunyikan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="block font-bold text-emerald-900 leading-normal uppercase text-[10px] tracking-wider">F-01: Master Data & Matriks Stok:</span>
                <ul className="space-y-1.5 list-disc list-inside text-gray-600">
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Dynamic Tab Category Navigation**: Pilih Best Seller, Cashcow, dll.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Kelola Grup**: Tambah/Hapus kategori, relocasi produk aman.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Tabel Matriks Silang**: Baris (Nama + Warna) & Kolom (Ukuran S-4XL).</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Excel Inline Edit**: Klik sel ukuran untuk set kuantitas.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Protected HPP Column**: Menggunakan Role switcher (Owner vs Staff).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="block font-bold text-emerald-900 leading-normal uppercase text-[10px] tracking-wider">F-02, F-03 & F-04: Dashboard & Input Order:</span>
                <ul className="space-y-1.5 list-disc list-inside text-gray-600">
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Ringkasan Finansial**: Banding Hari Ini vs Bulan Ini lengkap.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Interactive Trend Chart**: Grafis dengan hovering & floating label.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Instant Spaces/Duplicate Validation**: Merah jika spasi/ganda.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Auto-Search Autocomplete**: Keranjang item mencari mengetik 3+ huruf.</li>
                  <li><span className="text-emerald-600 font-extrabold">✓</span> **Auto Potong Stok**: Gudang otomatis berkurang saat disave.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Modal pencatatan pesanan */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        products={products}
        stocks={stocks}
        channels={channels}
        orders={orders}
        onSaveOrder={handleSaveOrder}
      />

      {/* Subtle Site Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 mt-12 text-center text-[11px] text-gray-400 font-medium">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OmniOrder – All rights reserved © 2026.</span>
          <div className="flex items-center gap-3">
            <span>Versi Dokumen PRD: v1.5</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span>Local Time: 22 Mei 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
