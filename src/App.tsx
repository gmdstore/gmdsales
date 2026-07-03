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

import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import Login from './components/Login';

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
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<{ status: 'approved' | 'pending' | 'rejected'; role: 'admin' | 'staff'; displayName?: string } | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState<boolean>(true);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user approval document
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setUserProfileLoading(false);
      return;
    }

    setUserProfileLoading(true);
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile({
          status: data.status || 'pending',
          role: data.role || 'staff',
          displayName: data.displayName || currentUser.displayName || ''
        });
        setUserProfileLoading(false);
      } else {
        // Doc doesn't exist yet, bootstrap it
        const isDefaultAdmin = currentUser.email?.toLowerCase() === 'gomudastore@gmail.com';
        const defaultData = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Pengguna Baru',
          status: isDefaultAdmin ? 'approved' : 'pending',
          role: isDefaultAdmin ? 'admin' : 'staff',
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, defaultData);
          setUserProfile({
            status: defaultData.status as any,
            role: defaultData.role as any,
            displayName: defaultData.displayName
          });
        } catch (err) {
          console.error("Error bootstrapping user doc:", err);
          setUserProfile({
            status: isDefaultAdmin ? 'approved' : 'pending',
            role: isDefaultAdmin ? 'admin' : 'staff'
          });
        }
        setUserProfileLoading(false);
      }
    }, (err) => {
      console.error("onSnapshot error for user doc:", err);
      setUserProfileLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'stocks' | 'settings' | 'recapitulation'>('dashboard');
  
  // Mobile sidebar visibility toggle state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // App initialization loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core App states synced with Firestore
  const [brandName, setBrandName] = useState<string>('OmniOrder');
  const [brandLogo, setBrandLogo] = useState<string>('📦');
  const [brandProfile, setBrandProfile] = useState<string>('Sistem Pengelola Transaksi Omnichannel');
  const [brandFooter, setBrandFooter] = useState<string>('OmniOrder – All rights reserved © 2026.');
  const [appFont, setAppFont] = useState<string>('Inter');
  const [appFontWeight, setAppFontWeight] = useState<string>('400');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Transfer', 'COD', 'E-Wallet', 'Lainnya']);
  const [pencatatList, setPencatatList] = useState<string[]>(['Admin 1', 'Admin 2', 'Owner']);
  const [groups, setGroups] = useState<string[]>(INITIAL_GROUPS);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [autoDiscounts, setAutoDiscounts] = useState<AutoDiscount[]>([]);

  // Active editing order
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Order modal triggers
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  // Fetch and synchronize all data from Firestore upon mounting
  useEffect(() => {
    if (!currentUser || userProfile?.status !== 'approved') {
      setIsLoading(false);
      return;
    }
    const initFirebaseData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch settings from Firestore
        const settingsRef = doc(db, "settings", "app_settings");
        const settingsSnap = await getDoc(settingsRef);
        
        let loadedBrandName = 'OmniOrder';
        let loadedBrandLogo = '📦';
        let loadedBrandProfile = 'Sistem Pengelola Transaksi Omnichannel';
        let loadedBrandFooter = 'OmniOrder – All rights reserved © 2026.';
        let loadedAppFont = 'Inter';
        let loadedAppFontWeight = '400';
        let loadedPaymentMethods = ['Transfer', 'COD', 'E-Wallet', 'Lainnya'];
        let loadedPencatatList = ['Admin 1', 'Admin 2', 'Owner'];
        let loadedGroups = INITIAL_GROUPS;
        let productIdsOrder: string[] = [];

        const isFirstTimeInit = !settingsSnap.exists();

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.brandName) loadedBrandName = data.brandName;
          if (data.brandLogo) loadedBrandLogo = data.brandLogo;
          if (data.brandProfile) loadedBrandProfile = data.brandProfile;
          if (data.brandFooter) loadedBrandFooter = data.brandFooter;
          if (data.appFont) loadedAppFont = data.appFont;
          if (data.appFontWeight) loadedAppFontWeight = data.appFontWeight;
          if (data.paymentMethods) loadedPaymentMethods = data.paymentMethods;
          if (data.pencatatList) loadedPencatatList = data.pencatatList;
          if (data.groups) loadedGroups = data.groups;
          if (data.productIdsOrder) productIdsOrder = data.productIdsOrder;
        } else {
          // Document does not exist, initialize it with default values
          await setDoc(settingsRef, {
            brandName: loadedBrandName,
            brandLogo: loadedBrandLogo,
            brandProfile: loadedBrandProfile,
            brandFooter: loadedBrandFooter,
            appFont: loadedAppFont,
            appFontWeight: loadedAppFontWeight,
            paymentMethods: loadedPaymentMethods,
            pencatatList: loadedPencatatList,
            groups: loadedGroups,
            productIdsOrder: INITIAL_PRODUCTS.map(p => p.id)
          });
        }

        // 2. Fetch products from Firestore
        const productsSnap = await getDocs(collection(db, "products"));
        let loadedProducts: Product[] = [];
        if (!productsSnap.empty) {
          productsSnap.forEach(doc => {
            loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
          });
        } else if (isFirstTimeInit) {
          // Seed INITIAL_PRODUCTS if empty on first run
          const batch = writeBatch(db);
          INITIAL_PRODUCTS.forEach(p => {
            batch.set(doc(db, "products", p.id), p);
          });
          await batch.commit();
          loadedProducts = INITIAL_PRODUCTS;
        }

        // Apply drag-and-drop ordering if saved
        if (productIdsOrder.length > 0) {
          loadedProducts.sort((a, b) => {
            const indexA = productIdsOrder.indexOf(a.id);
            const indexB = productIdsOrder.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        }

        // 3. Fetch stocks from Firestore
        const stocksSnap = await getDocs(collection(db, "stocks"));
        let loadedStocks: StockItem[] = [];
        if (!stocksSnap.empty) {
          stocksSnap.forEach(doc => {
            loadedStocks.push({ id: doc.id, ...doc.data() } as StockItem);
          });
        } else if (isFirstTimeInit) {
          // Seed INITIAL_STOCKS if empty on first run
          const batch = writeBatch(db);
          INITIAL_STOCKS.forEach(s => {
            batch.set(doc(db, "stocks", s.id), s);
          });
          await batch.commit();
          loadedStocks = INITIAL_STOCKS;
        }

        // 4. Fetch channels from Firestore
        const channelsSnap = await getDocs(collection(db, "channels"));
        let loadedChannels: Channel[] = [];
        if (!channelsSnap.empty) {
          channelsSnap.forEach(doc => {
            loadedChannels.push({ id: doc.id, ...doc.data() } as Channel);
          });
        } else if (isFirstTimeInit) {
          // Seed INITIAL_CHANNELS if empty on first run
          const batch = writeBatch(db);
          INITIAL_CHANNELS.forEach(c => {
            batch.set(doc(db, "channels", c.id), c);
          });
          await batch.commit();
          loadedChannels = INITIAL_CHANNELS;
        }

        // 5. Fetch orders from Firestore
        const ordersSnap = await getDocs(collection(db, "orders"));
        let loadedOrders: Order[] = [];
        if (!ordersSnap.empty) {
          ordersSnap.forEach(doc => {
            loadedOrders.push({ id: doc.id, ...doc.data() } as Order);
          });
        } else if (isFirstTimeInit) {
          // Adjust default orders to current month and day offset
          const today = new Date();
          const currYear = today.getFullYear();
          const currMonth = String(today.getMonth() + 1).padStart(2, '0');
          const currDay = String(today.getDate()).padStart(2, '0');
          
          const adjustedOrders = INITIAL_ORDERS.map(o => {
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

          // Seed INITIAL_ORDERS if empty on first run
          const batch = writeBatch(db);
          adjustedOrders.forEach(o => {
            batch.set(doc(db, "orders", o.id), o);
          });
          await batch.commit();
          loadedOrders = adjustedOrders;
        }

        // 6. Fetch autoDiscounts from Firestore
        const discountSnap = await getDocs(collection(db, "autoDiscounts"));
        let loadedDiscounts: AutoDiscount[] = [];
        if (!discountSnap.empty) {
          discountSnap.forEach(doc => {
            loadedDiscounts.push({ id: doc.id, ...doc.data() } as AutoDiscount);
          });
        } else if (isFirstTimeInit) {
          const defaultDiscounts: AutoDiscount[] = [
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
          const batch = writeBatch(db);
          defaultDiscounts.forEach(d => {
            batch.set(doc(db, "autoDiscounts", d.id), d);
          });
          await batch.commit();
          loadedDiscounts = defaultDiscounts;
        }

        // Update React states simultaneously
        setBrandName(loadedBrandName);
        setBrandLogo(loadedBrandLogo);
        setBrandProfile(loadedBrandProfile);
        setBrandFooter(loadedBrandFooter);
        setAppFont(loadedAppFont);
        setAppFontWeight(loadedAppFontWeight);
        setPaymentMethods(loadedPaymentMethods);
        setPencatatList(loadedPencatatList);
        setGroups(loadedGroups);
        setProducts(loadedProducts);
        setStocks(loadedStocks);
        setChannels(loadedChannels);
        setOrders(loadedOrders);
        setAutoDiscounts(loadedDiscounts);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch Firebase database documents:", error);
        // Fail-safe: allow proceeding in case of initial setup errors
        setIsLoading(false);
      }
    };

    initFirebaseData();
  }, [currentUser, userProfile]);

  // Sync current time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update layout typography and title side effects in browser
  useEffect(() => {
    document.title = brandName;
  }, [brandName]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', appFont);
  }, [appFont]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-weight', appFontWeight);
  }, [appFontWeight]);


  // Business Operations implementation

  // F-01: Update specific stock level inline (Excel-like matrix edit)
  const handleUpdateStock = async (stockItemId: string, size: string, newQty: number) => {
    setStocks(prev => 
      prev.map(item => {
        if (item.id === stockItemId) {
          const updatedItem = {
            ...item,
            stocks: {
              ...item.stocks,
              [size]: newQty
            }
          };
          // Write to Firestore asynchronously
          setDoc(doc(db, "stocks", stockItemId), updatedItem, { merge: true })
            .catch(err => console.error("Error updating stock in Firestore:", err));
          return updatedItem;
        }
        return item;
      })
    );
  };

  // F-03/F-04: Save Order and subtract warehouse matrix stock dynamically!
  const handleSaveOrder = async (newOrder: Order) => {
    // 1. Add order to state
    setOrders(prev => [newOrder, ...prev]);

    // Save order to Firestore
    try {
      await setDoc(doc(db, "orders", newOrder.id), newOrder);
    } catch (err) {
      console.error("Error saving order to Firestore:", err);
    }

    // 2. Subtract stocks from warehouse metrics in state and Firestore
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

          const updatedItem = {
            ...stockItem,
            stocks: updatedSizeStocks
          };

          // Save stock to Firestore
          setDoc(doc(db, "stocks", stockItem.id), updatedItem)
            .catch(err => console.error("Error saving stock to Firestore:", err));

          return updatedItem;
        }

        return stockItem;
      });
    });
  };

  // Restore previous stocks when deleting an order
  const handleDeleteOrder = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    // 1. Remove order from list
    setOrders(prev => prev.filter(o => o.id !== orderId));
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (err) {
      console.error("Error deleting order from Firestore:", err);
    }

    // 2. Return items back to stocks in state and Firestore
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

          const updatedItem = {
            ...stockItem,
            stocks: updatedSizeStocks
          };

          // Update stock in Firestore
          setDoc(doc(db, "stocks", stockItem.id), updatedItem)
            .catch(err => console.error("Error updating stock in Firestore:", err));

          return updatedItem;
        }

        return stockItem;
      });
    });
  };

  // Adjust warehouse stocks properly by rollback old and commit new quantities
  const handleUpdateOrder = async (updatedOrder: Order, oldOrder: Order) => {
    // 1. Update order metadata in state list
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    try {
      await setDoc(doc(db, "orders", updatedOrder.id), updatedOrder);
    } catch (err) {
      console.error("Error updating order in Firestore:", err);
    }

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

          const updatedItem = {
            ...stockItem,
            stocks: updatedSizeStocks
          };

          // Update stock in Firestore
          setDoc(doc(db, "stocks", stockItem.id), updatedItem)
            .catch(err => console.error("Error updating stock in Firestore:", err));

          return updatedItem;
        }

        return stockItem;
      });
    });
  };

  // Create Category Group
  const handleCreateGroup = async (groupName: string) => {
    if (!groups.includes(groupName)) {
      const nextGroups = [...groups, groupName];
      setGroups(nextGroups);
      try {
        await setDoc(doc(db, "settings", "app_settings"), { groups: nextGroups }, { merge: true });
      } catch (err) {
        console.error("Error creating group in Firestore:", err);
      }
    }
  };

  // Delete Category Group
  const handleDeleteGroup = async (groupName: string) => {
    const nextGroups = groups.filter(g => g !== groupName);
    setGroups(nextGroups);
    try {
      await setDoc(doc(db, "settings", "app_settings"), { groups: nextGroups }, { merge: true });
    } catch (err) {
      console.error("Error deleting group settings in Firestore:", err);
    }

    const fallbackGroup = nextGroups[0] || 'Uncategorized';
    setProducts(prev => {
      return prev.map(p => {
        if (p.group === groupName) {
          const updatedProduct = { ...p, group: fallbackGroup };
          setDoc(doc(db, "products", p.id), updatedProduct)
            .catch(err => console.error("Error updating product group in Firestore:", err));
          return updatedProduct;
        }
        return p;
      });
    });
  };

  // Relocate a product category individually
  const handleUpdateProductGroup = async (productId: string, newGroup: string) => {
    setProducts(prev => 
      prev.map(p => {
        if (p.id === productId) {
          const updatedProduct = { ...p, group: newGroup };
          setDoc(doc(db, "products", productId), updatedProduct)
            .catch(err => console.error("Error updating product group in Firestore:", err));
          return updatedProduct;
        }
        return p;
      })
    );
  };

  // F-01 Product Master mutations: Add, Edit, Delete
  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    try {
      await setDoc(doc(db, "products", newProduct.id), newProduct);
      // Also update the order list with the new product at the end
      await setDoc(doc(db, "settings", "app_settings"), {
        productIdsOrder: [...products.map(p => p.id), newProduct.id]
      }, { merge: true });
    } catch (err) {
      console.error("Error saving new product to Firestore:", err);
    }

    const newStockObjects: StockItem[] = newProduct.colors.map(color => {
      const initialStocks: { [size: string]: number } = {};
      const activeSizes = newProduct.sizes && newProduct.sizes.length > 0 
        ? newProduct.sizes 
        : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

      activeSizes.forEach(sz => {
        initialStocks[sz] = 0;
      });

      const stockItem: StockItem = {
        id: `${newProduct.id}_${color}`,
        productId: newProduct.id,
        productName: newProduct.name,
        color: color,
        stocks: initialStocks
      };

      // Save stock item to Firestore
      setDoc(doc(db, "stocks", stockItem.id), stockItem)
        .catch(err => console.error("Error saving stock item to Firestore:", err));

      return stockItem;
    });
    setStocks(prev => [...prev, ...newStockObjects]);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    try {
      await setDoc(doc(db, "products", updatedProduct.id), updatedProduct);
    } catch (err) {
      console.error("Error updating product in Firestore:", err);
    }

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

        let stockItem: StockItem;
        if (existing) {
          stockItem = {
            ...existing,
            productName: updatedProduct.name,
            stocks: alignedSizeStocks
          };
        } else {
          stockItem = {
            id: `${updatedProduct.id}_${color}`,
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            color: color,
            stocks: alignedSizeStocks
          };
        }

        // Save stock item to Firestore
        setDoc(doc(db, "stocks", stockItem.id), stockItem)
          .catch(err => console.error("Error updating stock item in Firestore:", err));

        return stockItem;
      });

      return [...otherStocks, ...alignedStocks];
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      console.error("Error deleting product from Firestore:", err);
    }

    setStocks(prev => {
      const stocksToDelete = prev.filter(s => s.productId === productId);
      stocksToDelete.forEach(s => {
        deleteDoc(doc(db, "stocks", s.id))
          .catch(err => console.error("Error deleting stock item from Firestore:", err));
      });
      return prev.filter(s => s.productId !== productId);
    });
  };

  // Reorder products sorting persistence
  const handleReorderProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      await setDoc(doc(db, "settings", "app_settings"), {
        productIdsOrder: newProducts.map(p => p.id)
      }, { merge: true });
    } catch (err) {
      console.error("Error saving product order to Firestore:", err);
    }
  };

  // Brand Info and Channels management handlers
  const handleUpdateBrand = async (updated: {
    brandName: string;
    brandLogo: string;
    brandProfile: string;
    brandFooter: string;
  }) => {
    setBrandName(updated.brandName);
    setBrandLogo(updated.brandLogo);
    setBrandProfile(updated.brandProfile);
    setBrandFooter(updated.brandFooter);
    try {
      await setDoc(doc(db, "settings", "app_settings"), {
        brandName: updated.brandName,
        brandLogo: updated.brandLogo,
        brandProfile: updated.brandProfile,
        brandFooter: updated.brandFooter
      }, { merge: true });
    } catch (err) {
      console.error("Error updating brand settings in Firestore:", err);
    }
  };

  const handleAddChannel = async (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
    try {
      await setDoc(doc(db, "channels", newChannel.id), newChannel);
    } catch (err) {
      console.error("Error adding channel to Firestore:", err);
    }
  };

  const handleUpdateChannel = async (updatedChannel: Channel) => {
    setChannels(prev => 
      prev.map(c => c.id === updatedChannel.id ? updatedChannel : c)
    );
    try {
      await setDoc(doc(db, "channels", updatedChannel.id), updatedChannel);
    } catch (err) {
      console.error("Error updating channel in Firestore:", err);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId));
    try {
      await deleteDoc(doc(db, "channels", channelId));
    } catch (err) {
      console.error("Error deleting channel from Firestore:", err);
    }
  };

  // Synchronized payment methods updater
  const updatePaymentMethods = async (newMethods: string[]) => {
    setPaymentMethods(newMethods);
    // Remove deleted payment methods from channels
    const updatedChannels = channels.map(chan => ({
      ...chan,
      paymentMethods: (chan.paymentMethods || []).filter(m => newMethods.includes(m))
    }));
    setChannels(updatedChannels);

    try {
      await setDoc(doc(db, "settings", "app_settings"), { paymentMethods: newMethods }, { merge: true });
      const batch = writeBatch(db);
      updatedChannels.forEach(c => {
        batch.set(doc(db, "channels", c.id), c);
      });
      await batch.commit();
    } catch (err) {
      console.error("Error syncing payment methods to Firestore:", err);
    }
  };

  // Synchronized pencatat admin list updater
  const handleUpdatePencatatList = async (newList: string[]) => {
    setPencatatList(newList);
    try {
      await setDoc(doc(db, "settings", "app_settings"), { pencatatList: newList }, { merge: true });
    } catch (err) {
      console.error("Error syncing admin list to Firestore:", err);
    }
  };

  // Synchronized discount scheme updater
  const handleUpdateAutoDiscounts = async (newDiscounts: AutoDiscount[]) => {
    setAutoDiscounts(newDiscounts);
    try {
      const querySnapshot = await getDocs(collection(db, "autoDiscounts"));
      const existingIds = querySnapshot.docs.map(doc => doc.id);
      const nextIds = newDiscounts.map(d => d.id);
      
      const batch = writeBatch(db);
      
      // Delete removed documents
      existingIds.forEach(id => {
        if (!nextIds.includes(id)) {
          batch.delete(doc(db, "autoDiscounts", id));
        }
      });
      
      // Set or update remaining/new documents
      newDiscounts.forEach(d => {
        batch.set(doc(db, "autoDiscounts", d.id), d);
      });
      
      await batch.commit();
    } catch (err) {
      console.error("Error syncing autoDiscounts to Firestore:", err);
    }
  };

  // Custom typography controllers
  const handleUpdateFont = async (font: string) => {
    setAppFont(font);
    try {
      await setDoc(doc(db, "settings", "app_settings"), { appFont: font }, { merge: true });
    } catch (err) {
      console.error("Error saving font settings in Firestore:", err);
    }
  };

  const handleUpdateFontWeight = async (weight: string) => {
    setAppFontWeight(weight);
    try {
      await setDoc(doc(db, "settings", "app_settings"), { appFontWeight: weight }, { merge: true });
    } catch (err) {
      console.error("Error saving font weight settings in Firestore:", err);
    }
  };

  // Full Firestore database resets restoring defaults
  const handleResetFactoryDefaults = async () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang data? Ini akan mengosongkan transaksi order & produk, mengembalikan parameter brand ke setelan default di server Firestore.")) {
      setIsLoading(true);
      try {
        // Delete all products
        const productsSnap = await getDocs(collection(db, "products"));
        const prodBatch = writeBatch(db);
        productsSnap.forEach(d => prodBatch.delete(d.ref));
        await prodBatch.commit();

        // Delete all stocks
        const stocksSnap = await getDocs(collection(db, "stocks"));
        const stockBatch = writeBatch(db);
        stocksSnap.forEach(d => stockBatch.delete(d.ref));
        await stockBatch.commit();

        // Delete all channels
        const channelsSnap = await getDocs(collection(db, "channels"));
        const chanBatch = writeBatch(db);
        channelsSnap.forEach(d => chanBatch.delete(d.ref));
        await chanBatch.commit();

        // Delete all orders
        const ordersSnap = await getDocs(collection(db, "orders"));
        const orderBatch = writeBatch(db);
        ordersSnap.forEach(d => orderBatch.delete(d.ref));
        await orderBatch.commit();

        // Delete all autoDiscounts
        const discountSnap = await getDocs(collection(db, "autoDiscounts"));
        const discBatch = writeBatch(db);
        discountSnap.forEach(d => discBatch.delete(d.ref));
        await discBatch.commit();

        // Re-set app settings doc
        const settingsRef = doc(db, "settings", "app_settings");
        const defaultSettings = {
          brandName: 'OmniOrder',
          brandLogo: '📦',
          brandProfile: 'Sistem Pengelola Transaksi Omnichannel',
          brandFooter: 'OmniOrder – All rights reserved © 2026.',
          appFont: 'Inter',
          appFontWeight: '400',
          paymentMethods: ['Transfer', 'COD', 'E-Wallet', 'Lainnya'],
          pencatatList: ['Admin 1', 'Admin 2', 'Owner'],
          groups: INITIAL_GROUPS,
          productIdsOrder: INITIAL_PRODUCTS.map(p => p.id)
        };
        await setDoc(settingsRef, defaultSettings);

        // Re-seed products
        const pBatch = writeBatch(db);
        INITIAL_PRODUCTS.forEach(p => pBatch.set(doc(db, "products", p.id), p));
        await pBatch.commit();

        // Re-seed stocks
        const sBatch = writeBatch(db);
        INITIAL_STOCKS.forEach(s => sBatch.set(doc(db, "stocks", s.id), s));
        await sBatch.commit();

        // Re-seed channels
        const cBatch = writeBatch(db);
        INITIAL_CHANNELS.forEach(c => cBatch.set(doc(db, "channels", c.id), c));
        await cBatch.commit();

        // Re-seed orders (with current adjusted date)
        const today = new Date();
        const currYear = today.getFullYear();
        const currMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currDay = String(today.getDate()).padStart(2, '0');
        const adjustedOrders = INITIAL_ORDERS.map(o => {
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
        const oBatch = writeBatch(db);
        adjustedOrders.forEach(o => oBatch.set(doc(db, "orders", o.id), o));
        await oBatch.commit();

        // Re-seed autoDiscounts
        const defaultDiscounts: AutoDiscount[] = [
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
        const dBatch = writeBatch(db);
        defaultDiscounts.forEach(d => dBatch.set(doc(db, "autoDiscounts", d.id), d));
        await dBatch.commit();

        // Reset state values
        setBrandName(defaultSettings.brandName);
        setBrandLogo(defaultSettings.brandLogo);
        setBrandProfile(defaultSettings.brandProfile);
        setBrandFooter(defaultSettings.brandFooter);
        setAppFont(defaultSettings.appFont);
        setAppFontWeight(defaultSettings.appFontWeight);
        setPaymentMethods(defaultSettings.paymentMethods);
        setPencatatList(defaultSettings.pencatatList);
        setGroups(defaultSettings.groups);
        setProducts(INITIAL_PRODUCTS);
        setStocks(INITIAL_STOCKS);
        setChannels(INITIAL_CHANNELS);
        setOrders(adjustedOrders);
        setAutoDiscounts(defaultDiscounts);

        setActiveTab('dashboard');
        setIsMobileSidebarOpen(false);
      } catch (err) {
        console.error("Error resetting factory defaults in Firestore:", err);
        alert("Gagal melakukan reset penuh di Firestore. Silakan periksa koneksi internet Anda.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Synchronous loader component for authentic connection states
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans space-y-4">
        <div className="relative flex h-10 w-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-10 w-10 bg-emerald-500"></span>
        </div>
        <p className="text-xs font-mono text-slate-400">Menyelaraskan Sesi Pengguna...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (userProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans space-y-4">
        <div className="relative flex h-10 w-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-10 w-10 bg-indigo-500"></span>
        </div>
        <p className="text-xs font-mono text-slate-400">Memeriksa Otorisasi Akses...</p>
      </div>
    );
  }

  // Check approval status
  if (userProfile && userProfile.status !== 'approved') {
    const isPending = userProfile.status === 'pending';
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
        {/* Decorative ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 text-3xl">
            {isPending ? '⏳' : '❌'}
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              {isPending ? 'Menunggu Persetujuan Admin' : 'Akses Akun Ditolak'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isPending 
                ? 'Akun Anda telah terdaftar tetapi belum disetujui oleh Administrator. Silakan hubungi pemilik brand atau administrator utama untuk mengaktifkan akses Anda.'
                : 'Akses Anda ke sistem OmniOrder telah ditolak oleh Administrator. Jika ini merupakan kesalahan, silakan hubungi admin.'
              }
            </p>
          </div>

          {/* User Meta Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-1.5 font-sans">
            <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
              <span className="text-slate-500">Nama:</span>
              <span className="text-slate-300 font-medium">{userProfile.displayName || currentUser.displayName || 'Pengguna Baru'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-300 font-medium">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Akses:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPending 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isPending ? '⏳ Menunggu Tinjauan' : '❌ Akses Ditolak'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {isPending && (
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                🔄 Perbarui Status Sekarang
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await signOut(auth);
              }}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-850 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              🚪 Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <span className="text-4xl animate-bounce">⚡</span>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <p className="text-xs tracking-wider text-slate-400 font-medium font-mono uppercase">Sinkronisasi Database Cloud...</p>
          <p className="text-[10px] text-slate-550 font-sans max-w-xs text-center leading-normal">
            Kredensial database OmniOrder Anda sedang dimuat dan disinkronkan secara langsung dengan server Google Firestore.
          </p>
        </div>
      </div>
    );
  }

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
            <p className="text-[10px] text-slate-550 leading-relaxed line-clamp-2 px-1 font-normal">
              {brandProfile}
            </p>
          </div>
        </div>

        {/* Navigation List Item Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <span className="block px-3 text-[9px] font-normal text-slate-400 tracking-wider uppercase mb-2 font-mono">
            Menu Operasional
          </span>

          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal font-sans cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white font-normal shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard Finansial
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal font-sans cursor-pointer transition-all ${activeTab === 'orders' ? 'bg-emerald-500 text-white font-normal shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <ClipboardList className="h-4 w-4" />
            Daftar Pesanan & Detail
          </button>

          <button
            onClick={() => {
              setActiveTab('stocks');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal font-sans cursor-pointer transition-all ${activeTab === 'stocks' ? 'bg-emerald-500 text-white font-normal shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <Layers className="h-4 w-4" />
            Produk & Stok
          </button>

          <button
            onClick={() => {
              setActiveTab('recapitulation');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal font-sans cursor-pointer transition-all ${activeTab === 'recapitulation' ? 'bg-emerald-500 text-white font-normal shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
          >
            <Calendar className="h-4 w-4" />
            Rekapitulasi Penjualan
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-normal font-sans cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white font-normal shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'}`}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-normal rounded-xl text-xs transition-transform transform active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 text-slate-950 strike-2" />
              Pencatatan Order Baru
            </button>
          </div>
        </nav>

        {/* Global Sidebar Footer & System actions */}
        <div className="p-4 border-t border-slate-900 space-y-4">
          <div className="px-2 flex items-center justify-end">
            <span className="text-[9px] font-normal text-slate-400 font-mono tracking-wider uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">MVP</span>
          </div>

          <div className="px-2 text-[10px] text-slate-550 border-t border-slate-900/40 pt-3 flex flex-col gap-1 font-normal">
            <span className="leading-relaxed font-sans">{brandFooter}</span>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-1 font-mono font-normal tracking-wide">
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
      <main className="flex-1 h-screen overflow-y-auto pt-0 px-4 pb-4 md:pt-0 md:px-8 md:pb-8 flex flex-col justify-between">
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
              onReorderProducts={handleReorderProducts}
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
              currentUser={currentUser}
              currentUserProfile={userProfile}
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
              onUpdateFont={handleUpdateFont}
              appFontWeight={appFontWeight}
              onUpdateFontWeight={handleUpdateFontWeight}
              paymentMethods={paymentMethods}
              onUpdatePaymentMethods={updatePaymentMethods}
              pencatatList={pencatatList}
              onUpdatePencatatList={handleUpdatePencatatList}
              autoDiscounts={autoDiscounts}
              onUpdateAutoDiscounts={handleUpdateAutoDiscounts}
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
