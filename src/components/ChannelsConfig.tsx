/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Channel } from '../types';
import { Percent, Edit3, Settings, Save, CheckCircle2, ShieldClose } from 'lucide-react';

interface ChannelsConfigProps {
  channels: Channel[];
  onUpdateChannel: (updated: Channel) => void;
  userRole: 'owner' | 'staff';
}

export default function ChannelsConfig({ channels, onUpdateChannel, userRole }: ChannelsConfigProps) {
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  
  // Quick channel edit states
  const [commission, setCommission] = useState<number>(0);
  const [paymentFee, setPaymentFee] = useState<number>(0);
  const [flatFee, setFlatFee] = useState<number>(0);
  const [shippingPercent, setShippingPercent] = useState<number>(0);
  const [shippingMaxCap, setShippingMaxCap] = useState<number>(0);

  const handleStartEdit = (chan: Channel) => {
    setEditingChannelId(chan.id);
    setCommission(chan.commissionPercent);
    setPaymentFee(chan.paymentFeePercent);
    setFlatFee(chan.flatProcessingFee);
    setShippingPercent(chan.freeShippingSubsidyPercent);
    setShippingMaxCap(chan.freeShippingMaxCap);
  };

  const handleSave = (chan: Channel) => {
    const updated: Channel = {
      ...chan,
      commissionPercent: Number(commission),
      paymentFeePercent: Number(paymentFee),
      flatProcessingFee: Math.max(0, parseInt(flatFee.toString(), 10) || 0),
      freeShippingSubsidyPercent: Number(shippingPercent),
      freeShippingMaxCap: Math.max(0, parseInt(shippingMaxCap.toString(), 10) || 0)
    };
    onUpdateChannel(updated);
    setEditingChannelId(null);
  };

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div id="channels_config_section" className="space-y-6 animate-fade-in text-xs text-slate-700">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <span>⚙️</span> Pengaturan Master Data Saluran Omnichannel
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Konfigurasi skema komisi, biaya penanganan, dan limit gratis ongkir bagi masing-masing kanal penjualan.
        </p>
      </div>

      {userRole === 'staff' && (
        <div className="bg-amber-50/80 border border-amber-200/60 p-4.5 rounded-2xl text-amber-800 flex items-center gap-3 shadow-3xs">
          <ShieldClose className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <span className="font-bold leading-normal block">Akses Terbatas: Hanya pemangku kebijakan (Owner) yang diperbolehkan menyesuaikan skema pembagian laba dan biaya komisi platform. Silakan ganti role ke "Owner" di menu matriks stok untuk mengubah data.</span>
        </div>
      )}

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map(chan => {
          const isEditing = editingChannelId === chan.id;

          return (
            <div 
              key={chan.id} 
              className={`bg-white border rounded-3xl p-6 shadow-sm space-y-5 transition-all duration-300 ${isEditing ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80 hover:shadow-md'}`}
            >
              {/* Card Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className={`inline-block px-3 py-1 font-extrabold rounded-lg text-[10px] uppercase border shadow-3xs ${chan.color}`}>
                  {chan.name}
                </span>

                {userRole === 'owner' && (
                  !isEditing ? (
                    <button
                      onClick={() => handleStartEdit(chan)}
                      className="px-3 py-1.5 text-slate-800 font-extrabold hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer text-[10px] shadow-3xs"
                    >
                      <Edit3 className="h-3 w-3 text-slate-500" /> EDIT
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSave(chan)}
                      className="px-3 py-1.5 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-all text-[10px] shadow-sm"
                    >
                      <Save className="h-3 w-3" /> SIMPAN
                    </button>
                  )
                )}
              </div>

              {/* Attributes Form/Ledger Details */}
              <div className="space-y-3.5 font-mono">
                
                {/* 1. Komisi */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-bold font-sans">Komisi Platform:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={commission}
                        onChange={(e) => setCommission(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 px-1.5 py-1 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-bold text-xs"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">{chan.commissionPercent}%</span>
                  )}
                </div>

                {/* 2. Biaya pembayaran gateway */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-bold font-sans">Biaya Gerbang Pembayaran:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={paymentFee}
                        onChange={(e) => setPaymentFee(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 px-1.5 py-1 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-bold text-xs"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">{chan.paymentFeePercent}%</span>
                  )}
                </div>

                {/* 3. Handling fee flat */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-bold font-sans">Biaya Proses Flat:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                      <span>Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={flatFee}
                        onChange={(e) => setFlatFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 px-1.5 py-1 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-bold"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">{formatRp(chan.flatProcessingFee)}</span>
                  )}
                </div>

                {/* 4. Subsidi ongkir % */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-bold font-sans">Subsidi Ongkir Gratis:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={shippingPercent}
                        onChange={(e) => setShippingPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 px-1.5 py-1 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-bold text-xs"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">{chan.freeShippingSubsidyPercent}%</span>
                  )}
                </div>

                {/* 5. Max Cap/Limit of free shipping */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-bold font-sans">Batas Maks Subsidi:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                      <span>Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={shippingMaxCap}
                        onChange={(e) => setShippingMaxCap(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 px-1.5 py-1 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-bold"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200 text-[10px] rounded-lg shadow-3xs">
                      {chan.freeShippingMaxCap > 0 ? formatRp(chan.freeShippingMaxCap) : 'Tidak dibatasi'}
                    </span>
                  )}
                </div>

              </div>

              {/* Status footer warning */}
              <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-2xl text-[10px] text-slate-400 font-bold leading-normal block text-center">
                <span>Perhitungan real-time otomatis saat merekam transaksi id.</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
