/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Channel, Product, AutoDiscount } from '../types';
import { Percent, Edit3, Settings, Save, Trash2, PlusCircle, CheckCircle, Info, Heart } from 'lucide-react';

interface SettingsProps {
  // Brand configurations
  brandName: string;
  brandLogo: string;
  brandProfile: string;
  brandFooter: string;
  onUpdateBrand: (updated: {
    brandName: string;
    brandLogo: string;
    brandProfile: string;
    brandFooter: string;
  }) => void;

  // Channel configurations
  channels: Channel[];
  onAddChannel: (newChannel: Channel) => void;
  onUpdateChannel: (updatedChannel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;

  // Font configurations
  appFont: string;
  onUpdateFont: (fontValue: string) => void;
  // Payment Method configurations
  paymentMethods: string[];
  onUpdatePaymentMethods: (methods: string[]) => void;
  // Pencatat configurations
  pencatatList: string[];
  onUpdatePencatatList: (list: string[]) => void;
  // Auto Discount configurations
  autoDiscounts: AutoDiscount[];
  onUpdateAutoDiscounts: (discounts: AutoDiscount[]) => void;
  products: Product[];
}

export default function SettingsComponent({
  brandName,
  brandLogo,
  brandProfile,
  brandFooter,
  onUpdateBrand,
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  appFont,
  onUpdateFont,
  paymentMethods,
  onUpdatePaymentMethods,
  pencatatList,
  onUpdatePencatatList,
  autoDiscounts,
  onUpdateAutoDiscounts,
  products
}: SettingsProps) {
  // Brand identity edit states
  const [inputBrandName, setInputBrandName] = useState(brandName);
  const [inputBrandLogo, setInputBrandLogo] = useState(brandLogo);
  const [inputBrandProfile, setInputBrandProfile] = useState(brandProfile);
  const [inputBrandFooter, setInputBrandFooter] = useState(brandFooter);
  const [brandSuccessMsg, setBrandSuccessMsg] = useState(false);

  // Sales Channel form states
  const [editingChanId, setEditingChanId] = useState<string | null>(null);
  const [chanName, setChanName] = useState('');
  const [chanCommission, setChanCommission] = useState<number>(0);
  const [chanPayment, setChanPayment] = useState<number>(0);
  const [chanFlat, setChanFlat] = useState<number>(0);
  const [chanShipping, setChanShipping] = useState<number>(0);
  const [chanShippingMax, setChanShippingMax] = useState<number>(0);
  const [chanColor, setChanColor] = useState('bg-slate-100 text-slate-850 border-slate-250');
  const [chanPaymentMethods, setChanPaymentMethods] = useState<string[]>([]);

  const [channelSuccessMsg, setChannelSuccessMsg] = useState<string | null>(null);
  const [pendingDeleteChannel, setPendingDeleteChannel] = useState<Channel | null>(null);
  const [channelWarningMsg, setChannelWarningMsg] = useState<string | null>(null);

  // Auto Discount form states
  const [editingDiscId, setEditingDiscId] = useState<string | null>(null);
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState<'percent' | 'nominal'>('percent');
  const [discValue, setDiscValue] = useState<number>(0);
  const [discSelectedChannels, setDiscSelectedChannels] = useState<string[]>(['all']);
  const [discSelectedProducts, setDiscSelectedProducts] = useState<string[]>(['all']);
  const [discountSuccessMsg, setDiscountSuccessMsg] = useState<string | null>(null);
  const [pendingDeleteDiscount, setPendingDeleteDiscount] = useState<AutoDiscount | null>(null);

  // Colors preset options in Tailwind css
  const colorPresets = [
    { label: 'Orange (Shopee)', value: 'bg-orange-100 text-orange-900 border-orange-250' },
    { label: 'Emerald (Tokopedia)', value: 'bg-emerald-100 text-emerald-900 border-emerald-250' },
    { label: 'Teal (WhatsApp)', value: 'bg-teal-100 text-teal-900 border-teal-250' },
    { label: 'Midnight (TikTok)', value: 'bg-slate-900 text-white border-slate-950 shadow-xs' },
    { label: 'Indigo (Expo)', value: 'bg-indigo-100 text-indigo-900 border-indigo-250' },
    { label: 'Violet (Store)', value: 'bg-violet-100 text-violet-900 border-violet-250' },
    { label: 'Rose (Promo)', value: 'bg-rose-100 text-rose-900 border-rose-250' },
    { label: 'Amber (Market)', value: 'bg-amber-100 text-amber-900 border-amber-250' }
  ];

  const handleSaveBrandInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrand({
      brandName: inputBrandName.trim() || 'OmniOrder',
      brandLogo: inputBrandLogo.trim() || '📦',
      brandProfile: inputBrandProfile.trim(),
      brandFooter: inputBrandFooter.trim() || 'OmniOrder – All rights reserved © 2026.'
    });
    setBrandSuccessMsg(true);
    setTimeout(() => setBrandSuccessMsg(false), 3000);
  };

  const handleStartEditChannel = (chan: Channel) => {
    setEditingChanId(chan.id);
    setChanName(chan.name);
    setChanCommission(chan.commissionPercent);
    setChanPayment(chan.paymentFeePercent);
    setChanFlat(chan.flatProcessingFee);
    setChanShipping(chan.freeShippingSubsidyPercent);
    setChanShippingMax(chan.freeShippingMaxCap);
    setChanColor(chan.color);
    setChanPaymentMethods(chan.paymentMethods || []);
  };

  const handleCancelChannelEdit = () => {
    setEditingChanId(null);
    setChanName('');
    setChanCommission(0);
    setChanPayment(0);
    setChanFlat(0);
    setChanShipping(0);
    setChanShippingMax(0);
    setChanColor('bg-slate-100 text-slate-850 border-slate-250');
    setChanPaymentMethods([]);
  };

  const handleSaveChannel = () => {
    const trimmedName = chanName.trim();
    if (!trimmedName) {
      alert('Nama saluran penjualan tidak boleh kosong.');
      return;
    }

    if (editingChanId) {
      // Update
      const updated: Channel = {
        id: editingChanId,
        name: trimmedName,
        commissionPercent: Number(chanCommission),
        paymentFeePercent: Number(chanPayment),
        flatProcessingFee: Math.max(0, parseInt(chanFlat.toString(), 10) || 0),
        freeShippingSubsidyPercent: Number(chanShipping),
        freeShippingMaxCap: Math.max(0, parseInt(chanShippingMax.toString(), 10) || 0),
        color: chanColor,
        paymentMethods: chanPaymentMethods as any
      };
      onUpdateChannel(updated);
      setChannelSuccessMsg(`Berhasil memperbarui saluran "${trimmedName}"`);
    } else {
      // Create New
      const generatedId = trimmedName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const newChannel: Channel = {
        id: generatedId,
        name: trimmedName,
        commissionPercent: Number(chanCommission),
        paymentFeePercent: Number(chanPayment),
        flatProcessingFee: Math.max(0, parseInt(chanFlat.toString(), 10) || 0),
        freeShippingSubsidyPercent: Number(chanShipping),
        freeShippingMaxCap: Math.max(0, parseInt(chanShippingMax.toString(), 10) || 0),
        color: chanColor,
        paymentMethods: chanPaymentMethods as any
      };
      onAddChannel(newChannel);
      setChannelSuccessMsg(`Berhasil menambahkan saluran baru "${trimmedName}"`);
    }

    handleCancelChannelEdit();
    setTimeout(() => setChannelSuccessMsg(null), 3000);
  };

  const handleDeleteChannelClick = (chan: Channel) => {
    if (channels.length <= 1) {
      setChannelWarningMsg('Minimal harus tersisa 1 saluran penjualan untuk operasional toko.');
      return;
    }
    setPendingDeleteChannel(chan);
  };

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div id="settings_section" className="space-y-8 animate-fade-in text-xs text-slate-700">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>⚙️</span> Pengaturan Brand & Saluran Omnichannel
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Kustomisasi visual toko, identitas brand, deskripsi profil operasional, footer, serta skema potongan komisi finansial per kanal penjualan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Brand Customization Form & Footer Setup (xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-6">
          <form onSubmit={handleSaveBrandInfo} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                🏠 Identitas Brand & Profil Toko
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Berpengaruh pada header sidebar utama, judul, deskripsi profil dan global footer</p>
            </div>

            {/* Success feedback message */}
            {brandSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 animate-fade-in font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Pengaturan Identitas Toko Berhasil Disimpan!</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Brand logo & Brand Name row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Logo (Emoji/Icon):</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="👕"
                    value={inputBrandLogo}
                    onChange={(e) => setInputBrandLogo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-emoji text-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Brand:</label>
                  <input
                    type="text"
                    required
                    placeholder="OmniOrder Store"
                    value={inputBrandName}
                    onChange={(e) => setInputBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Shop profile / Description sentence */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Profil Toko / Tagline:</label>
                <textarea
                  required
                  rows={2}
                  maxLength={150}
                  placeholder="Ketik profil singkat toko, misal: Grosir Pakaian Anak & Remaja Online-Offline Jakarta Barat"
                  value={inputBrandProfile}
                  onChange={(e) => setInputBrandProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Customizable Footer Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Teks Footer Hak Cipta:</label>
                <input
                  type="text"
                  required
                  placeholder="© 2026 PT. Busana Sejahtera Mandiri - Hak Cipta Dilindungi"
                  value={inputBrandFooter}
                  onChange={(e) => setInputBrandFooter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">Teks ini akan dirender di bagian bawah sidebar menu secara terus menerus.</span>
              </div>

              {/* CRUD Payment Methods */}
              <div className="border-t border-slate-100/80 pt-4 mt-2">
                <label className="block font-bold text-slate-800 mb-1.5 text-xs">💳 Atur Metode Pembayaran:</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {paymentMethods.map((m, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200">
                      {m}
                      <button type="button" onClick={() => {
                        const newName = prompt('Ubah Metode Pembayaran:', m);
                        if (newName && newName.trim() !== m) {
                          const updated = [...paymentMethods];
                          updated[idx] = newName.trim();
                          onUpdatePaymentMethods(updated);
                        }
                      }} className="text-slate-400 hover:text-emerald-600"><Edit3 className="h-3 w-3"/></button>
                      <button type="button" onClick={() => onUpdatePaymentMethods(paymentMethods.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-3 w-3"/></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new_method_input"
                    placeholder="Contoh: Bank BCA"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !paymentMethods.includes(val)) {
                          onUpdatePaymentMethods([...paymentMethods, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* CRUD Pencatat / Operator / PIC */}
              <div className="border-t border-slate-100/80 pt-4 mt-2">
                <label className="block font-bold text-slate-800 mb-1.5 text-xs">👤 Atur Daftar Pencatat / Operator / PIC:</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {pencatatList.map((p, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200">
                      {p}
                      <button type="button" onClick={() => {
                        const newName = prompt('Ubah Nama Pencatat:', p);
                        if (newName && newName.trim() !== p) {
                          const updated = [...pencatatList];
                          updated[idx] = newName.trim();
                          onUpdatePencatatList(updated);
                        }
                      }} className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"><Edit3 className="h-3 w-3"/></button>
                      <button type="button" onClick={() => onUpdatePencatatList(pencatatList.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 className="h-3 w-3"/></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new_pencatat_input"
                    placeholder="Contoh: Admin Susi"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !pencatatList.includes(val)) {
                          onUpdatePencatatList([...pencatatList, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new_pencatat_input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val && !pencatatList.includes(val)) {
                        onUpdatePencatatList([...pencatatList, val]);
                        input.value = '';
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Dynamic Font Selector option */}
              <div className="border-t border-slate-100/80 pt-4 mt-2">
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 text-xs">
                  <span>🔤</span> Pilih Gaya Font (Tipografi):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { name: 'Inter (Sleek/Clean)', value: 'Inter' },
                    { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
                    { name: 'Outfit (Geometric)', value: 'Outfit' },
                    { name: 'JetBrains Mono', value: 'JetBrains Mono' },
                    { name: 'Playfair Display (Elegant Serif)', value: 'Playfair Display' }
                  ].map((fontItem) => (
                    <button
                      key={fontItem.value}
                      type="button"
                      onClick={() => onUpdateFont(fontItem.value)}
                      className={`px-3 py-2 text-xs font-black rounded-xl border text-left transition-all cursor-pointer ${
                        appFont === fontItem.value
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-850 ring-2 ring-emerald-500/10 shadow-xs'
                          : 'bg-slate-50 border-slate-250 text-slate-700 hover:bg-slate-100'
                      }`}
                      style={{ fontFamily: fontItem.value }}
                    >
                      {fontItem.name}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 block mt-2.5 leading-normal">
                  Mengubah seluruh font tampilan Dashboard, detail, nominal angka, tombol input, dan halaman pesanan secara merata.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-950 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer font-sans"
              >
                💾 Terapkan & Simpan Identitas Brand
              </button>
            </div>
          </form>

          {/* Quick Info Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-150 rounded-3xl space-y-2.5 shadow-3xs">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Info className="h-4 w-4 text-emerald-600 shrink-0" /> Sistem Multi-Persistensi Mandiri
            </h4>
            <span className="block text-slate-600 font-medium leading-relaxed">
              Semua detail pengaturan brand di atas dan seluruh matriks sediaan gudang tersimpan aman di internal peramban peranti Anda (<span className="font-bold">localStorage</span>). Data yang Anda ubah akan langsung merestrukturisasi judul aplikasi di sebelah kiri secara instan.
            </span>
          </div>
        </div>

        {/* Right Column: Channels Configuration Manager CRUD (xl:col-span-7) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span>📈</span> Manajemen Saluran & Biaya Komisi Omnichannel
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Sesuaikan parameter diskon, gratis ongkir, atau tambahkan kanal baru secara otonom</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-200 px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase font-mono">
                {channels.length} Aktif
              </span>
            </div>

            {/* Notifications */}
            {channelSuccessMsg && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl flex items-center gap-2 animate-fade-in font-bold">
                <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{channelSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Operational Active Channel List (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-3">
                <span className="block font-bold text-slate-800 pb-1 border-b border-slate-50">Daftar Saluran Penjual:</span>
                
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                  {channels.map((chan) => (
                    <div key={chan.id} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-lg border shadow-3xs tracking-wide uppercase ${chan.color}`}>
                          {chan.name}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-mono font-semibold space-y-0.5">
                            <div className="flex gap-2">
                              <span>Komisi: <span className="text-slate-700 font-bold">{chan.commissionPercent}%</span></span>
                              <span>P.Fee: <span className="text-slate-700 font-bold">{chan.paymentFeePercent}%</span></span>
                            </div>
                            <div className="flex gap-2">
                              <span>Flat: <span className="text-slate-700 font-bold">{formatRp(chan.flatProcessingFee)}</span></span>
                              <span>MaxSub: <span className="text-amber-700 font-bold">{formatRp(chan.freeShippingMaxCap)}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEditChannel(chan)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
                          title="Edit skema finansial saluran ini"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannelClick(chan)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
                          title="Hapus saluran ini dari sistem"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add/Edit Channel form (lg:col-span-6) */}
              <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    {editingChanId ? '📝 Edit Skema Saluran' : '✨ Tambah Saluran Baru'}
                  </span>
                  {editingChanId && (
                    <button
                      type="button"
                      onClick={handleCancelChannelEdit}
                      className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                    >
                      Batal
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-[11px]">
                  {/* Channel Name */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Nama Saluran:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Shopee Premium, TikTok Mall, Ekspor"
                      value={chanName}
                      onChange={(e) => setChanName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Platform Commission Percent */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Biaya Komisi (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="5"
                        value={chanCommission}
                        onChange={(e) => setChanCommission(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
                      />
                    </div>

                    {/* Payment Gateway Fee Percent */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Biaya Payment (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="2"
                        value={chanPayment}
                        onChange={(e) => setChanPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Flat processing fee */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Biaya Proses (Rp):</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="1000"
                        value={chanFlat}
                        onChange={(e) => setChanFlat(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
                      />
                    </div>

                    {/* Free shipping subsidy percent */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Subsidi Ongkir (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="4"
                        value={chanShipping}
                        onChange={(e) => setChanShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Free shipping maximum limit cap */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-0.5">Batas Maks Subs Ongkir (Rp):</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="10000"
                      value={chanShippingMax}
                      onChange={(e) => setChanShippingMax(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>


                  {/* Payment Methods Checkboxes */}
                  <div className="py-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Metode Pembayaran:</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 border border-slate-200 rounded-2xl">
                      {paymentMethods.map((m) => (
                        <label key={m} className="flex items-center gap-1.5 cursor-pointer text-slate-800 text-[11px] font-bold">
                          <input
                            type="checkbox"
                            checked={(chanPaymentMethods || []).includes(m)}
                            onChange={(e) => {
                              const safeMethods = chanPaymentMethods || [];
                              if (e.target.checked) setChanPaymentMethods([...safeMethods, m]);
                              else setChanPaymentMethods(safeMethods.filter(i => i !== m));
                            }}
                            className="h-3 w-3 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Channel Color Theme Badge Previewer Grid */}
                  <div>
                    <span className="block font-bold text-slate-700 mb-1 leading-normal">Tema Warna Badge:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {colorPresets.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setChanColor(preset.value)}
                          className={`p-1.5 text-[8px] rounded border font-bold text-center truncate ${chanColor === preset.value ? 'ring-2 ring-emerald-505 bg-slate-105 border-slate-350 scale-102 font-black' : 'bg-white hover:bg-slate-100 border-slate-200'}`}
                          title={preset.label}
                        >
                          {preset.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit operational button */}
                  <button
                    type="button"
                    disabled={!chanName.trim()}
                    onClick={handleSaveChannel}
                    className="w-full py-2 bg-slate-900 border border-slate-950 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {editingChanId ? '💾 Update Saluran' : '✨ Daftarkan Saluran'}
                  </button>

                </div>
              </div>


            </div>
          </div>
        </div>

      </div>

      {/* SECTION: automatic discounts settings */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 mt-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>🏷️</span> Pengaturan Diskon Otomatis Produk (Auto Discounts)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Konfigurasikan diskon otomatis (persentase atau nominal rupiah) yang berlaku per saluran dan per produk</p>
          </div>
          <span className="text-[10px] bg-rose-50 text-rose-800 border-rose-200 px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase font-mono">
            {autoDiscounts.length} Skema Aktif
          </span>
        </div>

        {discountSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-2xl flex items-center gap-2 animate-fade-in font-bold text-xs">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{discountSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (lg:col-span-5) */}
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!discName.trim()) {
              alert("Masukkan nama aturan diskon.");
              return;
            }
            if (discValue <= 0) {
              alert("Masukkan nilai diskon yang valid (lebih besar dari 0).");
              return;
            }
            if (discSelectedChannels.length === 0) {
              alert("Pilih setidaknya satu saluran.");
              return;
            }
            if (discSelectedProducts.length === 0) {
              alert("Pilih setidaknya satu produk.");
              return;
            }

            const newDiscount = {
              id: editingDiscId || `disc_${Date.now()}`,
              name: discName.trim(),
              type: discType,
              value: Number(discValue),
              channelIds: discSelectedChannels,
              productIds: discSelectedProducts,
              isActive: editingDiscId ? (autoDiscounts.find(d => d.id === editingDiscId)?.isActive ?? true) : true
            };

            if (editingDiscId) {
              onUpdateAutoDiscounts(autoDiscounts.map(d => d.id === editingDiscId ? newDiscount : d));
              setDiscountSuccessMsg("Skema diskon otomatis berhasil diperbarui!");
            } else {
              onUpdateAutoDiscounts([...autoDiscounts, newDiscount]);
              setDiscountSuccessMsg("Skema diskon otomatis baru berhasil ditambahkan!");
            }

            // Reset form
            setEditingDiscId(null);
            setDiscName('');
            setDiscType('percent');
            setDiscValue(0);
            setDiscSelectedChannels(['all']);
            setDiscSelectedProducts(['all']);

            setTimeout(() => setDiscountSuccessMsg(null), 3000);
          }} className="lg:col-span-5 space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-150">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              {editingDiscId ? '📝 Edit Aturan Diskon' : '✨ Buat Aturan Diskon Baru'}
            </h4>

            {/* Discount Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Nama Pengaturan Diskon:</label>
              <input
                type="text"
                required
                placeholder="Contoh: Promo Shopee Live 10%"
                value={discName}
                onChange={(e) => setDiscName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Jenis Diskon:</label>
                <select
                  value={discType}
                  onChange={(e) => setDiscType(e.target.value as 'percent' | 'nominal')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal (Rupiah)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Nilai Potongan:</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={discValue || ''}
                    onChange={(e) => setDiscValue(Number(e.target.value))}
                    placeholder={discType === 'percent' ? '10' : '5000'}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-black text-slate-400">
                    {discType === 'percent' ? '%' : 'Rp'}
                  </span>
                </div>
              </div>
            </div>

            {/* Channels Selection - interactive select badge lists */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700 text-[11px]">Diterapkan di Saluran (Kanal):</label>
                <button
                  type="button"
                  onClick={() => {
                    if (discSelectedChannels.includes('all')) {
                      setDiscSelectedChannels([]);
                    } else {
                      setDiscSelectedChannels(['all']);
                    }
                  }}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border transition-all ${
                    discSelectedChannels.includes('all')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {discSelectedChannels.includes('all') ? '✓ Semua Saluran Terpilih' : 'Pilih Semua Saluran'}
                </button>
              </div>

              {!discSelectedChannels.includes('all') && (
                <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 max-h-[110px] overflow-y-auto">
                  {channels.map((chan) => {
                    const isSelected = discSelectedChannels.includes(chan.id);
                    return (
                      <button
                        type="button"
                        key={chan.id}
                        onClick={() => {
                          if (isSelected) {
                            setDiscSelectedChannels(discSelectedChannels.filter(id => id !== chan.id));
                          } else {
                            setDiscSelectedChannels([...discSelectedChannels, chan.id]);
                          }
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{'🛍️'}</span>
                        <span>{chan.name}</span>
                        {isSelected && <span className="text-emerald-600 text-[9px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {discSelectedChannels.includes('all') && (
                <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-2.5 text-[10px] text-emerald-800 font-semibold leading-relaxed">
                  📢 Aturan diskon ini berlaku otomatis untuk <strong>Semua Saluran Penjualan</strong> yang aktif.
                </div>
              )}
            </div>

            {/* Products Selection - interactive select badge lists */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-slate-700 text-[11px]">Berlaku untuk Produk Mana Saja:</label>
                <button
                  type="button"
                  onClick={() => {
                    if (discSelectedProducts.includes('all')) {
                      setDiscSelectedProducts([]);
                    } else {
                      setDiscSelectedProducts(['all']);
                    }
                  }}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border transition-all ${
                    discSelectedProducts.includes('all')
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {discSelectedProducts.includes('all') ? '✓ Semua Produk Terpilih' : 'Pilih Semua Produk'}
                </button>
              </div>

              {!discSelectedProducts.includes('all') && (
                <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 max-h-[140px] overflow-y-auto">
                  {products.map((prod) => {
                    const isSelected = discSelectedProducts.includes(prod.id);
                    return (
                      <button
                        type="button"
                        key={prod.id}
                        onClick={() => {
                          if (isSelected) {
                            setDiscSelectedProducts(discSelectedProducts.filter(id => id !== prod.id));
                          } else {
                            setDiscSelectedProducts([...discSelectedProducts, prod.id]);
                          }
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt="" className="w-3.5 h-3.5 rounded object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[10px]">📦</span>
                        )}
                        <span className="truncate max-w-[120px]">{prod.name}</span>
                        {isSelected && <span className="text-indigo-600 text-[9px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {discSelectedProducts.includes('all') && (
                <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-2.5 text-[10px] text-indigo-800 font-semibold leading-relaxed">
                  📢 Aturan diskon ini berlaku otomatis untuk <strong>Semua Jenis Produk Master</strong> yang terdaftar.
                </div>
              )}
            </div>

            {/* Actions for Form */}
            <div className="flex gap-2 pt-2">
              {editingDiscId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDiscId(null);
                    setDiscName('');
                    setDiscType('percent');
                    setDiscValue(0);
                    setDiscSelectedChannels(['all']);
                    setDiscSelectedProducts(['all']);
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-colors"
              >
                {editingDiscId ? '💾 Simpan Perubahan' : '➕ Tambah Aturan Diskon'}
              </button>
            </div>
          </form>

          {/* Right Column: Active Rules List (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>📋 Daftar Aturan Diskon Terdaftar</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase font-sans">Sistem Prioritas Auto-Match</span>
            </h4>

            {autoDiscounts.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <span className="text-2xl block">🏷️</span>
                <p className="text-xs font-extrabold text-slate-500">Belum ada aturan diskon otomatis.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Gunakan form di sebelah kiri untuk membuat aturan diskon otomatis pertama Anda.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {autoDiscounts.map((discount) => {
                  return (
                    <div
                      key={discount.id}
                      className={`p-4 border rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between md:flex-row md:items-center gap-4 ${
                        discount.isActive
                          ? 'bg-white border-slate-200 shadow-3xs'
                          : 'bg-slate-50/55 border-slate-150 opacity-65'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-xs">
                            {discount.name}
                          </h5>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border uppercase leading-tight ${
                            discount.isActive
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {discount.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">
                          Besar Potongan: <strong className="text-rose-600 font-extrabold">{discount.type === 'percent' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}</strong>
                        </div>

                        {/* Applied channels list */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Saluran Terpilih:</span>
                          <div className="flex flex-wrap gap-1">
                            {discount.channelIds.includes('all') ? (
                              <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-extrabold">Semua Saluran (Global)</span>
                            ) : (
                              discount.channelIds.map(chanId => {
                                const chan = channels.find(c => c.id === chanId);
                                return (
                                  <span key={chanId} className="text-[9px] bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                    <span>{'🛍️'}</span>
                                    <span>{chan?.name || chanId}</span>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Applied products list */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Produk Terpilih:</span>
                          <div className="flex flex-wrap gap-1">
                            {discount.productIds.includes('all') ? (
                              <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-extrabold">Semua Produk Master</span>
                            ) : (
                              discount.productIds.map(prodId => {
                                const prod = products.find(p => p.id === prodId);
                                return (
                                  <span key={prodId} className="text-[9px] bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                    {prod?.imageUrl ? (
                                      <img src={prod.imageUrl} alt="" className="w-3 h-3 rounded object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span>📦</span>
                                    )}
                                    <span>{prod?.name || prodId}</span>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0">
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = autoDiscounts.map(d => d.id === discount.id ? { ...d, isActive: !d.isActive } : d);
                            onUpdateAutoDiscounts(updated);
                          }}
                          className={`px-3 py-1 text-[9.5px] font-black rounded-lg border transition-all cursor-pointer ${
                            discount.isActive
                              ? 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {discount.isActive ? '⛔ Nonaktifkan' : '⚡ Aktifkan'}
                        </button>

                        <div className="flex gap-1.5 w-full md:w-auto">
                          {/* Edit Rule */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiscId(discount.id);
                              setDiscName(discount.name);
                              setDiscType(discount.type);
                              setDiscValue(discount.value);
                              setDiscSelectedChannels(discount.channelIds);
                              setDiscSelectedProducts(discount.productIds);
                              // Smooth scroll to form on mobile
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className="flex-1 md:flex-initial p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/60 rounded-lg cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5 mx-auto" />
                          </button>

                          {/* Delete Rule */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingDeleteDiscount(discount);
                            }}
                            className="flex-1 md:flex-initial p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250/60 rounded-lg cursor-pointer transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Modal for Sales Channels Limit */}
      {channelWarningMsg && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="channel_warning_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Aksi Dibatalkan</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {channelWarningMsg}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setChannelWarningMsg(null)}
                className="flex-1 py-2.5 px-4 text-xs font-black text-white bg-slate-900 hover:bg-slate-850 rounded-xl cursor-pointer select-none transition-all active:scale-95 text-center"
              >
                Dipahami
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for Delete Sales Channel */}
      {pendingDeleteChannel && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="confirm_delete_channel_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Saluran Penjualan</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus saluran <strong className="text-slate-800">{pendingDeleteChannel.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
              Data perhitungan transaksi sebelumnya yang terkait saluran ini mungkin menggunakan skema fallback/bawaan.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteChannel(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteChannel(pendingDeleteChannel.id);
                  setChannelSuccessMsg(`Mengeluarkan saluran "${pendingDeleteChannel.name}" dari sistem`);
                  setPendingDeleteChannel(null);
                  setTimeout(() => setChannelSuccessMsg(null), 3000);
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

      {/* Confirmation Modal for Delete Auto Discount */}
      {pendingDeleteDiscount && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="confirm_delete_discount_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0 text-xl font-bold flex items-center justify-center h-10 w-10">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Skema Diskon Otomatis</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus skema diskon otomatis <strong className="text-slate-800">{pendingDeleteDiscount.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
              Diskon ini tidak akan lagi diterapkan secara otomatis pada transaksi baru. Transaksi lama tidak akan terpengaruh.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteDiscount(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-150 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAutoDiscounts(autoDiscounts.filter(d => d.id !== pendingDeleteDiscount.id));
                  setDiscountSuccessMsg(`Berhasil menghapus aturan diskon "${pendingDeleteDiscount.name}"`);
                  setPendingDeleteDiscount(null);
                  setTimeout(() => setDiscountSuccessMsg(null), 3000);
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
