/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Channel } from '../types';
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
  onUpdateFont
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

  const [channelSuccessMsg, setChannelSuccessMsg] = useState<string | null>(null);
  const [pendingDeleteChannel, setPendingDeleteChannel] = useState<Channel | null>(null);
  const [channelWarningMsg, setChannelWarningMsg] = useState<string | null>(null);

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
        color: chanColor
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
        color: chanColor
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
      
      {/* Tab Header Banner */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 font-sans tracking-tight">
          <span>⚙️</span> Pengaturan Brand & Saluran Omnichannel
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Kustomisasi visual toko, identitas brand, deskripsi profil operasional, footer, serta skema potongan komisi finansial per kanal penjualan.
        </p>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-center font-emoji text-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">Teks ini akan dirender di bagian bawah sidebar menu secara terus menerus.</span>
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                        className="w-full px-2.5 py-1 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
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
                        className="w-full px-2.5 py-1 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
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
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
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
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-center text-slate-800"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
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

      {/* Warning Modal for Sales Channels Limit */}
      {channelWarningMsg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="channel_warning_modal">
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
        </div>
      )}

      {/* Confirmation Modal for Delete Sales Channel */}
      {pendingDeleteChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="confirm_delete_channel_modal">
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
        </div>
      )}
    </div>
  );
}
