/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, StockItem, Channel, Order, SIZES } from '../types';
import { calculateOrderMetrics } from '../data';
import { AlertTriangle, Plus, Trash2, Calendar, Clipboard, HelpCircle, AlertCircle } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  stocks: StockItem[];
  channels: Channel[];
  orders: Order[];
  onSaveOrder: (newOrder: Order) => void;
  editingOrder?: Order | null;
  onUpdateOrder?: (updatedOrder: Order, oldOrder: Order) => void;
}

interface CartItem {
  productId: string;
  productName: string;
  color: string;
  size: string;
  qty: number;
  price: number;
  hpp: number;
  imageUrl: string;
  searchQuery: string;
  showDropdown: boolean;
}

export default function OrderModal({
  isOpen,
  onClose,
  products,
  stocks,
  channels,
  orders,
  onSaveOrder,
  editingOrder = null,
  onUpdateOrder
}: OrderModalProps) {
  // Basic properties
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('shopee');
  const [isCod, setIsCod] = useState<boolean>(false);
  const [discounts, setDiscounts] = useState<number>(0);
  const [dateTime, setDateTime] = useState<string>('');

  // Shopping list cart state (start with 1 empty row)
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: '',
      productName: '',
      color: '',
      size: 'M',
      qty: 1,
      price: 0,
      hpp: 0,
      imageUrl: '',
      searchQuery: '',
      showDropdown: false
    }
  ]);

  // Validation messages
  const [orderNumberError, setOrderNumberError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  // Initialize Default dates-relative details on open
  useEffect(() => {
    if (isOpen) {
      if (editingOrder) {
        setOrderNumber(editingOrder.orderNumber);
        setChannelId(editingOrder.channelId);
        setIsCod(editingOrder.isCod);
        setDiscounts(editingOrder.discounts);
        setDateTime(editingOrder.dateTime);
        
        const mappedCart = editingOrder.products.map(p => {
          const matchedProduct = products.find(prod => prod.id === p.productId);
          return {
            productId: p.productId,
            productName: matchedProduct ? matchedProduct.name : 'Produk Master',
            color: p.color,
            size: p.size,
            qty: p.qty,
            price: p.price,
            hpp: p.hpp,
            imageUrl: matchedProduct ? matchedProduct.imageUrl : '',
            searchQuery: matchedProduct ? matchedProduct.name : '',
            showDropdown: false
          };
        });
        
        setCart(mappedCart.length > 0 ? mappedCart : [
          {
            productId: '',
            productName: '',
            color: '',
            size: 'M',
            qty: 1,
            price: 0,
            hpp: 0,
            imageUrl: '',
            searchQuery: '',
            showDropdown: false
          }
        ]);
        setStockError(null);
        setOrderNumberError(null);
      } else {
        // Set timestamp relative to 2026-05-22
        const timePart = new Date().toTimeString().slice(0, 8); // e.g. "08:15:30"
        setDateTime(`2026-05-22T${timePart}.000Z`);

        // Reset values
        setOrderNumber('');
        setChannelId('shopee');
        setIsCod(false);
        setDiscounts(0);
        setStockError(null);
        setOrderNumberError(null);
        setCart([
          {
            productId: '',
            productName: '',
            color: '',
            size: 'M',
            qty: 1,
            price: 0,
            hpp: 0,
            imageUrl: '',
            searchQuery: '',
            showDropdown: false
          }
        ]);
      }
    }
  }, [isOpen, editingOrder, products]);

  // Validate Order Number on change
  useEffect(() => {
    const trimmed = orderNumber.trim();
    if (trimmed !== orderNumber) {
      setOrderNumberError('Nomor pesanan tidak boleh mengandung spasi biasa.');
      return;
    }
    if (orderNumber.includes(' ')) {
      setOrderNumberError('Spasi terdeteksi! Gunakan karakter strip (-) atau tanpa spasi.');
      return;
    }
    const isDuplicate = orders.some(o => 
      o.id !== editingOrder?.id && 
      o.orderNumber.toUpperCase() === trimmed.toUpperCase()
    );
    if (trimmed && isDuplicate) {
      setOrderNumberError('No Pesanan Ganda! ID transaksi ini sudah pernah terekam.');
      return;
    }
    setOrderNumberError(null);
  }, [orderNumber, orders, editingOrder]);

  if (!isOpen) return null;

  // Selected channel rates
  const selectedChannel = channels.find(c => c.id === channelId) || channels[0];

  // Paste single button helper (and simulation fallback for iframe environments)
  const handlePasteOrderNumber = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        setOrderNumber(text.trim());
      } else {
        throw new Error('Not allowed');
      }
    } catch {
      // Simulation paste triggers neat mockup code matching active channel prefix + unique random timestamp token
      const prefix = channelId === 'shopee' ? 'SP' : channelId === 'tokopedia' ? 'TK' : channelId === 'tiktok_shop' ? 'TT' : 'OMNI';
      const randomId = `${prefix}-20260522-P${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderNumber(randomId);
    }
  };

  // Add Row to Cart
  const handleAddCartRow = () => {
    setCart([
      ...cart,
      {
        productId: '',
        productName: '',
        color: '',
        size: 'M',
        qty: 1,
        price: 0,
        hpp: 0,
        imageUrl: '',
        searchQuery: '',
        showDropdown: false
      }
    ]);
  };

  // Remove Row
  const handleRemoveCartRow = (index: number) => {
    if (cart.length === 1) return;
    const next = [...cart];
    next.splice(index, 1);
    setCart(next);
  };

  // Search product change handler (Min 3 characters trigger)
  const handleProductSearchTextChange = (index: number, val: string) => {
    const next = [...cart];
    next[index].searchQuery = val;
    next[index].showDropdown = val.trim().length >= 3;
    setCart(next);
  };

  // Select Product item
  const handleSelectProduct = (index: number, product: Product) => {
    const next = [...cart];
    next[index].productId = product.id;
    next[index].productName = product.name;
    next[index].price = product.price;
    next[index].hpp = product.hpp;
    next[index].imageUrl = product.imageUrl;
    next[index].searchQuery = product.name;
    next[index].showDropdown = false;
    // Set first color of product as the default selected color
    next[index].color = product.colors[0] || '';
    setCart(next);
  };

  const handleUpdateColor = (index: number, color: string) => {
    const next = [...cart];
    next[index].color = color;
    setCart(next);
  };

  const handleUpdateSize = (index: number, size: string) => {
    const next = [...cart];
    next[index].size = size;
    setCart(next);
  };

  const handleUpdateQty = (index: number, qty: number) => {
    const next = [...cart];
    next[index].qty = Math.max(1, qty);
    setCart(next);
  };

  // Dynamically calculate subtotals, gross omset before fees
  const grossTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalHpp = cart.reduce((sum, item) => sum + (item.hpp * item.qty), 0);

  // Calculated Channel Fees using the helper
  const commission = Number(((grossTotalPrice * selectedChannel.commissionPercent) / 100).toFixed(2));
  const paymentFee = Number(((grossTotalPrice * selectedChannel.paymentFeePercent) / 100).toFixed(2));
  const processingFee = selectedChannel.flatProcessingFee;

  let freeShippingSubsidy = (grossTotalPrice * selectedChannel.freeShippingSubsidyPercent) / 100;
  if (selectedChannel.freeShippingMaxCap > 0 && freeShippingSubsidy > selectedChannel.freeShippingMaxCap) {
    freeShippingSubsidy = selectedChannel.freeShippingMaxCap;
  }
  freeShippingSubsidy = Number(freeShippingSubsidy.toFixed(2));

  const totalDeductions = commission + paymentFee + processingFee + freeShippingSubsidy;
  const simulatedNetRevenue = grossTotalPrice - discounts - totalDeductions;
  const simulatedNetProfit = simulatedNetRevenue - totalHpp;

  // Render prices helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Validation before submission
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedOrderNum = orderNumber.trim();
    if (!trimmedOrderNum) {
      alert("Masukkan nomor pesanan.");
      return;
    }

    if (orderNumberError) {
      alert("ID Pesanan tidak valid. Periksa spasi atau ID ganda.");
      return;
    }

    // Check if any cart row has unselected items
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      if (!item.productId) {
        alert(`Baris #${i + 1} belum memilih nama produk master.`);
        return;
      }
      if (!item.color) {
        alert(`Baris #${i + 1} belum memilih variasi warna.`);
        return;
      }
    }

    // STRICT STOCK CHECK INVENTORY INTEGRITY
    // Validate each row against active stocks array
    let stockErrorFound = false;
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      if (!item.productId) continue;
      
      // StockItem is generated as productid_color
      const key = `${item.productId}_${item.color}`;
      const stockItem = stocks.find(s => s.id === key);
      let available = stockItem?.stocks[item.size] ?? 0;

      // Add back the previous order allocation quantity for correct delta calculation
      if (editingOrder) {
        const oldItem = editingOrder.products.find(op => 
          op.productId === item.productId &&
          op.color === item.color &&
          op.size === item.size
        );
        if (oldItem) {
          available += oldItem.qty;
        }
      }

      if (item.qty > available) {
        setStockError(`Stok produk "${item.productName}" (${item.color} - ${item.size}) tidak mencukupi! Tersedia di gudang saat ini (termasuk alokasi pesanan ini): ${available} pcs.`);
        stockErrorFound = true;
        break;
      }
    }

    if (stockErrorFound) {
      return;
    }

    // Reset stock warning error if valid
    setStockError(null);

    // Map into finalized Order structure
    const orderItems = cart.map(item => ({
      productId: item.productId,
      color: item.color,
      size: item.size,
      qty: item.qty,
      price: item.price,
      hpp: item.hpp
    }));

    const finalOrderObj: Order = {
      id: editingOrder ? editingOrder.id : `ord_${Date.now()}`,
      orderNumber: trimmedOrderNum,
      dateTime: dateTime || new Date().toISOString(),
      channelId,
      isCod,
      products: orderItems,
      totalPrice: grossTotalPrice,
      totalHpp,
      discounts,
      calculatedFees: {
        commission,
        paymentFee,
        processingFee,
        freeShippingSubsidy,
        totalFees: totalDeductions
      },
      netRevenue: simulatedNetRevenue,
      netProfit: simulatedNetProfit
    };

    if (editingOrder && onUpdateOrder) {
      onUpdateOrder(finalOrderObj, editingOrder);
    } else {
      onSaveOrder(finalOrderObj);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Background layer */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Surface Body Wrapper */}
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl border border-gray-100 z-10 max-h-[88vh] overflow-y-auto flex flex-col scale-in relative">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
              {editingOrder ? (
                <>
                  <span>✏️</span> Edit Detail & Koreksi Stok Pesanan
                </>
              ) : (
                <>
                  <span>➕</span> Input Pencatatan Pesanan & Potong Stok Baru
                </>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {editingOrder 
                ? `Mengubah rincian transaksi #${editingOrder.orderNumber} dan memulihkan/menyesuaikan alokasi produk di gudang secara otomatis.`
                : 'Formulir omnichannel cepat untuk mengurangi sediaan gudang instan.'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer text-sm font-bold"
          >
            ✕ Close
          </button>
        </div>

        {/* Input Form Body */}
        <form onSubmit={handleSaveSubmit} className="p-6 space-y-6 flex-1 text-xs">
          
          {/* Section 1: Transaction Coordinates info */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-start shadow-3xs">
            
            {/* Datetime Field Defaults Automatic */}
            <div className="space-y-1.5 col-span-1">
              <label className="font-bold text-slate-700 block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Tanggal & Jam Entry
              </label>
              <input
                type="text"
                readOnly
                value={new Date(dateTime || '').toLocaleString('id-ID')}
                className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed text-center"
              />
            </div>

            {/* Central Transaction Invoice No Validation */}
            <div className="space-y-1.5 col-span-2">
              <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                No. Pesanan ID
                <span className="text-rose-500 font-extrabold">*</span>
                {orderNumberError && (
                  <span className="text-[9px] text-rose-500 font-extrabold block bg-rose-50 px-2 py-0.5 rounded border border-rose-100/80 animate-pulse">
                    Spasi/ID Ganda Terdeteksi!
                  </span>
                )}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="Contoh: SP-20260522-XYZ"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className={`flex-1 px-3 py-2 bg-white border rounded-xl text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-emerald-500 tracking-wider transition-all ${orderNumberError ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30 text-rose-800' : 'border-slate-200 text-slate-800'}`}
                />
                <button
                  type="button"
                  onClick={handlePasteOrderNumber}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
                  title="Salin No Pesanan otomatis dari clipboard (atau klik untuk buat dummy id)"
                >
                  <Clipboard className="h-3.5 w-3.5 text-slate-500" />
                  PASTE
                </button>
              </div>
            </div>

            {/* Sales Medium Choice */}
            <div className="space-y-1.5 col-span-1">
              <label className="font-bold text-slate-700 block">Saluran Penjualan</label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 shadow-3xs"
              >
                {channels.map(chan => (
                  <option key={chan.id} value={chan.id}>{chan.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Interactive Shopping Cart List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                🛒 Keranjang Belanja Item
                <span className="text-[10px] text-slate-400 font-mono font-bold">({cart.length} Baris Produk)</span>
              </h3>
              
              <button
                type="button"
                onClick={handleAddCartRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-emerald-700 bg-emerald-50 text-[11px] font-black hover:bg-emerald-100 rounded-xl border border-emerald-200 cursor-pointer transition-all shadow-3xs"
              >
                <Plus className="h-3.5 w-3.5" /> TAMBAH BARIS
              </button>
            </div>

            {/* Shopping ledger items lines */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const isProductSelected = !!item.productId;
                const activeProduct = products.find(p => p.id === item.productId);

                // Autocomplete product matched list based on 3 letters searchQuery
                const filteredSearchProducts = products.filter(p => 
                  p.name.toLowerCase().includes(item.searchQuery.toLowerCase())
                );

                return (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl relative flex flex-col md:flex-row md:items-center gap-3 shadow-3xs hover:border-slate-350 transition-all">
                    
                    {/* Floating Delete button */}
                    {cart.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCartRow(idx)}
                        className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-1.5 text-slate-400 hover:text-red-500 rounded-xl bg-white border border-slate-200 hover:border-red-200 cursor-pointer transition-colors shadow-3xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Left: Thumbnail Icon if chosen */}
                    <div className="h-8 w-8 rounded-lg bg-white border border-slate-250/70 flex items-center justify-center font-emoji text-base select-none shadow-3xs">
                      {item.imageUrl || '🛍️'}
                    </div>

                    {/* Column 1: Autocomplete Product name */}
                    <div className="flex-1 min-w-[210px] relative">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Nama Produk (Min. 3 Huruf)</label>
                      <input
                        type="text"
                        placeholder="Ketik 3+ huruf (Hoodie, Cargo...)"
                        value={item.searchQuery}
                        onChange={(e) => handleProductSearchTextChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      {/* Floating Autocomplete Dropdown List */}
                      {item.showDropdown && filteredSearchProducts.length > 0 && (
                        <div className="absolute left-0 right-0 top-12 bg-white rounded-xl shadow-lg border border-slate-200 z-30 max-h-36 overflow-y-auto py-1 text-left animate-fade-in">
                          {filteredSearchProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProduct(idx, p)}
                              className="w-full px-3 py-1.5 text-left text-[11px] font-bold hover:bg-emerald-50 hover:text-emerald-700 block truncate cursor-pointer"
                            >
                              <span className="font-emoji mr-1.5">{p.imageUrl}</span> {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Color selection */}
                    <div className="w-[140px]">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Warna</label>
                      <select
                        disabled={!isProductSelected}
                        value={item.color}
                        onChange={(e) => handleUpdateColor(idx, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {!isProductSelected && <option value="">Pilih Produk</option>}
                        {activeProduct?.colors.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    {/* Column 3: Sizes dropdown */}
                    <div className="w-[85px]">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Ukuran</label>
                      <select
                        disabled={!isProductSelected}
                        value={item.size}
                        onChange={(e) => handleUpdateSize(idx, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-mono font-extrabold text-slate-800 text-center disabled:opacity-40"
                      >
                        {SIZES.map(sz => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>

                    {/* Column 4: Qty Input */}
                    <div className="w-[75px]">
                      <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Kuantitas</label>
                      <input
                        type="number"
                        disabled={!isProductSelected}
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2 py-1 bg-white border border-slate-250 rounded-xl text-xs font-mono font-extrabold text-slate-800 text-center disabled:opacity-40"
                      />
                    </div>

                    {/* Column 5: Locked price and Subtotal value */}
                    <div className="w-[125px] text-right font-mono pr-1">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide">LOCKED SUB</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {isProductSelected ? formatRp(item.price * item.qty) : '-'}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Financial settings discounts & COD switch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start border-t border-slate-150 pt-5">
            
            {/* Store Discounts & COD checking coordinates */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 text-xs uppercase tracking-wider">Opsi Transaksi & Diskon</h4>
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block text-xs">Potongan Diskon Tambahan Toko (Rp):</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={discounts}
                  onChange={(e) => setDiscounts(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-mono font-extrabold text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* COD Checklist option */}
              <div className="bg-rose-50/50 border border-rose-100 p-4.5 rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCod}
                    onChange={(e) => setIsCod(e.target.checked)}
                    className="h-5 w-5 rounded-lg text-rose-600 focus:ring-rose-500 border-rose-300 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-rose-950 block text-xs">Pesanan Menggunakan Metode COD</span>
                    <span className="text-[10px] text-rose-500 font-medium block mt-0.5">Tandai jika transaksi merupakan pembayaran di tempat saat paket sampai</span>
                  </div>
                </label>
              </div>
            </div>

            {/* F-04 Automatic Fees Calculator Recap ledger */}
            <div className="bg-slate-50 border border-slate-250 rounded-3xl p-5 space-y-4 font-sans max-w-full shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-slate-800 text-xs">Kalkulator Potongan Otomatis Saluran</h4>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md">{selectedChannel.name} rules</span>
              </div>

              <div className="space-y-2.5 text-slate-600 font-bold font-mono text-[11px] leading-relaxed">
                
                {/* Gross omset */}
                <div className="flex justify-between">
                  <span>Omset Kotor (Subtotal):</span>
                  <span className="text-slate-900 font-extrabold">{formatRp(grossTotalPrice)}</span>
                </div>

                {/* extra discount */}
                {discounts > 0 && (
                  <div className="flex justify-between text-rose-600 font-extrabold">
                    <span>Diskon Toko:</span>
                    <span>-{formatRp(discounts)}</span>
                  </div>
                )}

                {/* komisi */}
                <div className="flex justify-between">
                  <span>Komisi Platform ({selectedChannel.commissionPercent}%):</span>
                  <span>{commission > 0 ? `-${formatRp(commission)}` : '-'}</span>
                </div>

                {/* payment fee */}
                <div className="flex justify-between">
                  <span>Biaya Pembayaran ({selectedChannel.paymentFeePercent}%):</span>
                  <span>{paymentFee > 0 ? `-${formatRp(paymentFee)}` : '-'}</span>
                </div>

                {/* process fee flat */}
                <div className="flex justify-between">
                  <span>Biaya Proses Flat:</span>
                  <span>{processingFee > 0 ? `-${formatRp(processingFee)}` : '-'}</span>
                </div>

                {/* shipping subsidy with CAP warning indicator */}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 font-sans">
                    Subsidi Ongkir ({selectedChannel.freeShippingSubsidyPercent}%):
                    {selectedChannel.freeShippingMaxCap > 0 && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded font-bold" title={`Potongan gratis ongkir dibatasi maksimal ${formatRp(selectedChannel.freeShippingMaxCap)}`}>
                        Capped
                      </span>
                    )}
                  </span>
                  <span>{freeShippingSubsidy > 0 ? `-${formatRp(freeShippingSubsidy)}` : '-'}</span>
                </div>

                {/* Total Deductions/Fees */}
                <div className="flex justify-between border-t border-slate-200 pt-2.5 text-slate-750 font-sans font-bold">
                  <span>Total Pemotongan Bersih:</span>
                  <span className="font-extrabold text-rose-600">-{formatRp(totalDeductions)}</span>
                </div>

                {/* Final Net Omset/Revenue */}
                <div className="flex justify-between border-t border-slate-300 pt-3 text-xs text-emerald-800 font-black font-sans">
                  <span className="tracking-wide uppercase text-[10px] self-center">Estimasi Omset Bersih:</span>
                  <span className="bg-emerald-100 border border-emerald-250 px-3 py-1.5 rounded-xl text-[14px] shadow-3xs">{formatRp(simulatedNetRevenue)}</span>
                </div>

              </div>
            </div>

          </div>

          {/* STOCK ERROR BANNER INSTANT BLOCK */}
          {stockError && (
            <div className="bg-rose-50 border border-rose-200 p-4.5 rounded-2xl text-rose-800 flex items-start gap-2.5 animate-bounce shadow-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-rose-900 block">GAGAL SIMPAN: Masalah Integritas Gudang</span>
                <span className="font-mono mt-1 block leading-relaxed">{stockError}</span>
              </div>
            </div>
          )}

          {/* Duplicates/Validations Warning banner */}
          {orderNumberError && (
            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-amber-900 flex items-center gap-2.5 shadow-3xs">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span className="font-bold leading-normal">Form Terkunci: ID Invoice bermasalah. Perbaiki spasi atau selesaikan no pesanan yang sudah terekam.</span>
            </div>
          )}

          {/* Modal Buttons Form Control Footer */}
          <div className="border-t border-slate-150 pt-5 flex items-center justify-end gap-3 sticky bottom-0 bg-white z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-250 text-slate-700 font-bold rounded-xl cursor-pointer transition-all shadow-3xs"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={!!orderNumberError || !!stockError || !orderNumber.trim()}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-extrabold rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all scale-100 hover:scale-[1.01] active:scale-[0.99]"
            >
              Simpan Entri & Potong Stok
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
