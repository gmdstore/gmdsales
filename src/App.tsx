/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, StockItem, Channel, Order, AutoDiscount } from './types';
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
import SettingsComponent from './components/Settings';
import OrdersList from './components/OrdersList';
import Recapitulation from './components/Recapitulation';

import { 
  Plus, 
  LayoutDashboard, 
  Layers, 
  Settings2, 
  RotateCcw,
  Menu,
  X,
  Heart,
  ClipboardList,
  Calendar
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'stocks' | 'settings' | 'recapitulation'>('dashboard');
  
  // Mobile sidebar visibility toggle state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Active editing order
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Dynamic Brand Identity configurations
  const [brandName, setBrandName] = useState<string>(() => {
    return localStorage.getItem('omni_brand_name') || 'OmniOrder';
  });
  const [brandLogo, setBrandLogo] = useState<string>(() => {
    return localStorage.getItem('omni_brand_logo') || '📦';
  });
  const [brandProfile, setBrandProfile] = useState<string>(() => {
    return localStorage.getItem('omni_brand_profile') || 'Sistem Pengelola Transaksi Omnichannel';
  });
  const [brandFooter, setBrandFooter] = useState<string>(() => {
    return localStorage.getItem('omni_brand_footer') || 'OmniOrder – All rights reserved © 2026.';
  });

  const [appFont, setAppFont] = useState<string>(() => {
    return localStorage.getItem('omni_app_font') || 'Inter';
  });

  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    const saved = localStorage.getItem('omni_payment_methods');
    return saved ? JSON.parse(saved) : ['Transfer', 'COD', 'E-Wallet', 'Lainnya'];
  });

  const [pencatatList, setPencatatList] = useState<string[]>(() => {
    const saved = localStorage.getItem('omni_pencatat_list');
    return saved ? JSON.parse(saved) : ['Admin 1', 'Admin 2', 'Owner'];
  });

  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscount[]>(() => {
    const saved = localStorage.getItem('omni_auto_discounts');
    return saved ? JSON.parse(saved) : [
      {
        id: 'disc_default_1',
        name: 'Diskon Gajian 10%',
        type: 'percent',
        value: 10,
        channelIds: ['shopee', 'tokopedia'],
        productIds: ['all'],
        isActive: true
      },
      {
        id: 'disc_default_2',
        name: 'Potongan Flat Rp 5rb',
        type: 'nominal',
        value: 5000,
        channelIds: ['all'],
        productIds: ['all'],
        isActive: true
      }
    ];
  });

  const updatePaymentMethods = (newMethods: string[]) => {
    setPaymentMethods(newMethods);
    // Remove deleted payment methods from channels
    setChannels(prevChannels => prevChannels.map(chan => ({
      ...chan,
      paymentMethods: (chan.paymentMethods || []).filter(m => newMethods.includes(m))
    })));
  };

  // Preserve operational state in localStorage
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
    const loadedOrders: Order[] = saved ? JSON.parse(saved) : INITIAL_ORDERS;

    // Synchronize legacy mock data or saved May dates to today's active month & relative day
    const today = new Date();
    const currYear = today.getFullYear();
    const currMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currDay = String(today.getDate()).padStart(2, '0');

    return loadedOrders.map(o => {
      if (o.dateTime && (o.dateTime.startsWith('2026-05') || o.dateTime.includes('2026-05-22'))) {
        const timePart = o.dateTime.split('T')[1] || '12:00:00.000Z';
        const orderDate = o.dateTime.split('T')[0];
        const dayOffset = orderDate.endsWith('-22') ? currDay : orderDate.split('-')[2];
        return {
          ...o,
          dateTime: `${currYear}-${currMonth}-${dayOffset}T${timePart}`,
          orderNumber: o.orderNumber.replace(/20260522/, `${currYear}${currMonth}${currDay}`)
        };
      }
      return o;
    });
  });

  // Order modal triggers
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  // Sync to localStorage and HTML page tab document title
  useEffect(() => {
    localStorage.setItem('omni_brand_name', brandName);
    document.title = brandName;
  }, [brandName]);

  useEffect(() => {
    localStorage.setItem('omni_brand_logo', brandLogo);
  }, [brandLogo]);

  useEffect(() => {
    localStorage.setItem('omni_brand_profile', brandProfile);
  }, [brandProfile]);

  useEffect(() => {
    localStorage.setItem('omni_brand_footer', brandFooter);
  }, [brandFooter]);

  useEffect(() => {
    localStorage.setItem('omni_app_font', appFont);
    document.documentElement.style.setProperty('--app-font', appFont);
  }, [appFont]);

  useEffect(() => {
    localStorage.setItem('omni_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('omni_pencatat_list', JSON.stringify(pencatatList));
  }, [pencatatList]);

  useEffect(() => {
    localStorage.setItem('omni_auto_discounts', JSON.stringify(autoDiscounts));
  }, [autoDiscounts]);

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


  // Business Operations implementation

  // F-01: Update specific stock level inline (Excel-like matrix edit)
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

  // F-03/F-04: Save Order and subtract warehouse matrix stock dynamically!
  const handleSaveOrder = (newOrder: Order) => {
    // 1. Add order to state
    setOrders(prev => [newOrder, ...prev]);

    // 2. Subtract stocks from warehouse metrics
    setStocks(prevStocks => {
      return prevStocks.map(stockItem => {
        const matchedPurchasedItems = newOrder.products.filter(purchased => 
          `${purchased.productId}_${purchased.color}` === stockItem.id
        );

        if (matchedPurchasedItems.length > 0) {
          const updatedSizeStocks = { ...stockItem.stocks };
          matchedPurchasedItems.forEach(purchased => {
            const currentStockVal = updatedSizeStocks[purchased.size] ?? 0;
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

  // Restore previous stocks when deleting an order
  const handleDeleteOrder = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // 1. Remove order from list
    setOrders(prev => prev.filter(o => o.id !== orderId));

    // 2. Return items back to stocks
    setStocks(prevStocks => {
      return prevStocks.map(stockItem => {
        const matchedPurchasedItems = targetOrder.products.filter(purchased => 
          `${purchased.productId}_${purchased.color}` === stockItem.id
        );

        if (matchedPurchasedItems.length > 0) {
          const updatedSizeStocks = { ...stockItem.stocks };
          matchedPurchasedItems.forEach(purchased => {
            const currentStockVal = updatedSizeStocks[purchased.size] ?? 0;
            updatedSizeStocks[purchased.size] = currentStockVal + purchased.qty;
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

  // Adjust warehouse stocks properly by rollback old and commit new quantities
  const handleUpdateOrder = (updatedOrder: Order, oldOrder: Order) => {
    // 1. Update order metadata in state list
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

    // 2. Adjust warehouse stocks by adding back old bought items, then subtracting updated bought items
    setStocks(prevStocks => {
      return prevStocks.map(stockItem => {
        // Rollback old order allocation
        const matchedOldItems = oldOrder.products.filter(purchased => 
          `${purchased.productId}_${purchased.color}` === stockItem.id
        );
        // Commit new order allocation
        const matchedNewItems = updatedOrder.products.filter(purchased => 
          `${purchased.productId}_${purchased.color}` === stockItem.id
        );

        if (matchedOldItems.length > 0 || matchedNewItems.length > 0) {
          const updatedSizeStocks = { ...stockItem.stocks };
          
          // Phase 1: Add back old quantities
          matchedOldItems.forEach(purchased => {
            const currentStockVal = updatedSizeStocks[purchased.size] ?? 0;
            updatedSizeStocks[purchased.size] = currentStockVal + purchased.qty;
          });

          // Phase 2: Deduct new quantities
          matchedNewItems.forEach(purchased => {
            const currentStockVal = updatedSizeStocks[purchased.size] ?? 0;
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

  // F-01 Product Master mutations: Add, Edit, Delete
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);

    const newStockObjects: StockItem[] = newProduct.colors.map(color => {
      const initialStocks: { [size: string]: number } = {};
      const activeSizes = newProduct.sizes && newProduct.sizes.length > 0 
        ? newProduct.sizes 
        : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

      activeSizes.forEach(sz => {
        initialStocks[sz] = 0;
      });

      return {
        id: `${newProduct.id}_${color}`,
        productId: newProduct.id,
        productName: newProduct.name,
        color: color,
        stocks: initialStocks
      };
    });
    setStocks(prev => [...prev, ...newStockObjects]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    setStocks(prevStocks => {
      const otherStocks = prevStocks.filter(s => s.productId !== updatedProduct.id);
      const currentProductStocks = prevStocks.filter(s => s.productId === updatedProduct.id);

      const alignedStocks: StockItem[] = updatedProduct.colors.map(color => {
        const existing = currentProductStocks.find(s => s.color === color);
        
        const activeSizes = updatedProduct.sizes && updatedProduct.sizes.length > 0
          ? updatedProduct.sizes
          : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

        const alignedSizeStocks: { [size: string]: number } = {};
        activeSizes.forEach(sz => {
          alignedSizeStocks[sz] = existing?.stocks?.[sz] ?? 0;
        });

        if (existing) {
          return {
            ...existing,
            productName: updatedProduct.name,
            stocks: alignedSizeStocks
          };
        } else {
          return {
            id: `${updatedProduct.id}_${color}`,
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            color: color,
            stocks: alignedSizeStocks
          };
        }
      });

      return [...otherStocks, ...alignedStocks];
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setStocks(prev => prev.filter(s => s.productId !== productId));
  };

  // Brand Info and Channels management handlers
  const handleUpdateBrand = (updated: {
    brandName: string;
    brandLogo: string;
    brandProfile: string;
    brandFooter: string;
  }) => {
    setBrandName(updated.brandName);
    setBrandLogo(updated.brandLogo);
    setBrandProfile(updated.brandProfile);
    setBrandFooter(updated.brandFooter);
  };

  const handleAddChannel = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
  };

  const handleUpdateChannel = (updatedChannel: Channel) => {
    setChannels(prev => 
      prev.map(c => c.id === updatedChannel.id ? updatedChannel : c)
    );
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId));
  };

  // Full hard factory settings reset to restore original mock template
  const handleResetFactoryDefaults = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang data? Ini akan mengosongkan transaksi order & produk, mengembalikan parameter brand ke setelan default.")) {
      localStorage.removeItem('omni_products');
      localStorage.removeItem('omni_stocks');
      localStorage.removeItem('omni_channels');
      localStorage.removeItem('omni_groups');
      localStorage.removeItem('omni_orders');
      localStorage.removeItem('omni_brand_name');
      localStorage.removeItem('omni_brand_logo');
      localStorage.removeItem('omni_brand_profile');
      localStorage.removeItem('omni_brand_footer');
      localStorage.removeItem('omni_app_font');
      localStorage.removeItem('omni_pencatat_list');

      setProducts(INITIAL_PRODUCTS);
      setStocks(INITIAL_STOCKS);
      setChannels(INITIAL_CHANNELS);
      setGroups(INITIAL_GROUPS);
      setOrders(INITIAL_ORDERS);
      setBrandName('OmniOrder');
      setBrandLogo('📦');
      setBrandProfile('Sistem Pengelola Transaksi Omnichannel');
      setBrandFooter('OmniOrder – All rights reserved © 2026.');
      setAppFont('Inter');
      setPencatatList(['Admin 1', 'Admin 2', 'Owner']);
      setActiveTab('dashboard');
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Mobile Top Navigation Header */}
      <div className="flex md:hidden items-center justify-between px-5 h-16 bg-white border-b border-slate-205 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-emoji select-none">{brandLogo}</span>
          <span className="font-extrabold tracking-tight text-slate-900 text-sm">{brandName}</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Left Sidebar Menu Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:static flex flex-col w-64 md:w-72 bg-slate-950 text-slate-100 border-r border-slate-900 shrink-0 z-50 shadow-2xl md:shadow-none h-screen sticky top-0`}
      >
        {/* Mobile close overlay icon */}
        <div className="flex md:hidden justify-end p-4 pb-0">
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Company Logo Badge Info Section */}
        <div className="p-6 pb-5 flex flex-col items-center text-center border-b border-slate-900">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center text-2xl font-emoji select-none scale-102 mb-3.5">
            {brandLogo}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black tracking-tight text-white line-clamp-1">
              {brandName}
            </h1>
            <p className="text-[10px] text-slate-550 leading-relaxed line-clamp-2 px-1 font-medium">
              {brandProfile}
            </p>
          </div>
        </div>

        {/* Navigation List Item Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <span className="block px-3 text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-2 font-mono">
            Menu Operasional
          </span>

          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white font-heavy shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Finansial
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${activeTab === 'orders' ? 'bg-emerald-500 text-white font-heavy shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <ClipboardList className="h-4 w-4" />
            Daftar Pesanan & Detail
          </button>

          <button
            onClick={() => {
              setActiveTab('stocks');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${activeTab === 'stocks' ? 'bg-emerald-500 text-white font-heavy shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <Layers className="h-4 w-4" />
            Produk & Stok
          </button>

          <button
            onClick={() => {
              setActiveTab('recapitulation');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${activeTab === 'recapitulation' ? 'bg-emerald-500 text-white font-heavy shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <Calendar className="h-4 w-4" />
            Rekapitulasi Penjualan
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white font-heavy shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <Settings2 className="h-4 w-4" />
            Pengaturan Brand & Kanal
          </button>

          <div className="pt-4 border-t border-slate-900">
            {/* Quick Record Order button */}
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-black rounded-xl text-xs transition-transform transform active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-slate-950 strike-2" />
              Pencatatan Order Baru
            </button>
          </div>
        </nav>

        {/* Global Sidebar Footer & System actions */}
        <div className="p-4 border-t border-slate-900 space-y-4">
          <div className="px-2 flex items-center justify-between">
            <button
              onClick={handleResetFactoryDefaults}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
              title="Kembalikan sistem ke data kosong instan"
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              Reset setelan sistem
            </button>
            <span className="text-[9px] font-semibold text-slate-400 font-mono tracking-wider uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">MVP</span>
          </div>

          <div className="px-2 text-[10px] text-slate-550 border-t border-slate-900/40 pt-3 flex flex-col gap-1 font-medium">
            <span className="leading-relaxed font-sans">{brandFooter}</span>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-1 font-mono font-bold tracking-wide">
              <span>Local Time: {(() => {
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const dayName = days[currentTime.getDay()];
                const timeStr = currentTime.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });
                return `${dayName}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()} - ${timeStr} WIB`;
              })()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile active drawer state */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden animate-fade-in"
        />
      )}

      {/* Dynamic Render Workspace Area */}
      <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard 
              orders={orders} 
              channels={channels}
              products={products}
              onOpenOrderModal={() => {
                setEditingOrder(null);
                setIsOrderModalOpen(true);
              }}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersList
              orders={orders}
              channels={channels}
              products={products}
              onEditOrder={(order) => {
                setEditingOrder(order);
                setIsOrderModalOpen(true);
              }}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'stocks' && (
            <StockMatrix
              products={products}
              stocks={stocks}
              groups={groups}
              onUpdateStock={handleUpdateStock}
              onCreateGroup={handleCreateGroup}
              onDeleteGroup={handleDeleteGroup}
              onUpdateProductGroup={handleUpdateProductGroup}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'recapitulation' && (
            <Recapitulation
              orders={orders}
              channels={channels}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsComponent
              brandName={brandName}
              brandLogo={brandLogo}
              brandProfile={brandProfile}
              brandFooter={brandFooter}
              onUpdateBrand={handleUpdateBrand}
              channels={channels}
              onAddChannel={handleAddChannel}
              onUpdateChannel={handleUpdateChannel}
              onDeleteChannel={handleDeleteChannel}
              appFont={appFont}
              onUpdateFont={setAppFont}
              paymentMethods={paymentMethods}
              onUpdatePaymentMethods={updatePaymentMethods}
              pencatatList={pencatatList}
              onUpdatePencatatList={setPencatatList}
              autoDiscounts={autoDiscounts}
              onUpdateAutoDiscounts={setAutoDiscounts}
              products={products}
            />
          )}
        </div>
      </main>

      {/* Record sales purchase model */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        products={products}
        stocks={stocks}
        channels={channels}
        orders={orders}
        onSaveOrder={handleSaveOrder}
        editingOrder={editingOrder}
        onUpdateOrder={handleUpdateOrder}
        paymentMethods={paymentMethods}
        pencatatList={pencatatList}
        autoDiscounts={autoDiscounts}
      />

    </div>
  );
}
