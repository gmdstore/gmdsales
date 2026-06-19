/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Channel, Product } from '../types';
import { TrendingUp, ShoppingBag, BadgeAlert, Coins, Percent, DollarSign, ArrowRight, Clipboard, Search, Filter, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  channels: Channel[];
  products: Product[];
  onOpenOrderModal: () => void;
}

export default function Dashboard({ orders, channels, products, onOpenOrderModal }: DashboardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [selectedCod, setSelectedCod] = useState<'all' | 'cod' | 'non-cod'>('all');

  // Helper formatting currency
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatShortRp = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}k`;
    }
    return `Rp ${value}`;
  };

  // Determine today's date dynamically based on local time
  const today = new Date();
  const year = today.getFullYear();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const targetDateStr = `${year}-${monthStr}-${dayStr}`;
  const currentMonthPrefix = `${year}-${monthStr}`;

  const getFormattedToday = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  };
  
  // Filter today's orders
  const todayOrders = orders.filter(o => o.dateTime.startsWith(targetDateStr));
  
  // Filter today's orders with search/filter criteria matching precisely the behavior in OrdersList
  const filteredTodayOrders = todayOrders.filter(ord => {
    const matchSearch = ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchChannel = selectedChannelId === 'all' ? true : ord.channelId === selectedChannelId;
    const matchCod = selectedCod === 'all' ? true : selectedCod === 'cod' ? ord.isCod : !ord.isCod;
    return matchSearch && matchChannel && matchCod;
  });
  
  // Filter this month's orders
  const monthOrders = orders.filter(o => o.dateTime.startsWith(currentMonthPrefix));

  // Calculate stats for Period
  const getStats = (periodOrders: Order[]) => {
    let gross = 0;
    let net = 0;
    let totalItems = 0;
    const count = periodOrders.length;

    periodOrders.forEach(o => {
      gross += o.totalPrice;
      net += o.netRevenue;
      o.products.forEach(p => {
        totalItems += p.qty;
      });
    });

    return { gross, net, totalItems, count };
  };

  const todayStats = getStats(todayOrders);
  const monthStats = getStats(monthOrders);

  // Running days in current month up to today
  const runningDays = today.getDate();
  const avgNetPerDay = monthStats.net / runningDays;

  // Channel Contribution Calculation
  const channelContribution = channels.map(chan => {
    const chanOrders = orders.filter(o => o.channelId === chan.id);
    let chanNetRevenue = 0;
    let chanQty = 0;

    chanOrders.forEach(o => {
      chanNetRevenue += o.netRevenue;
      o.products.forEach(p => {
        chanQty += p.qty;
      });
    });

    return {
      ...chan,
      netRevenue: chanNetRevenue,
      qty: chanQty
    };
  });

  // Calculate percentages
  const totalNetAll = channelContribution.reduce((sum, c) => sum + c.netRevenue, 0) || 1;
  const channelContributionSorted = channelContribution
    .map(c => ({
      ...c,
      percentage: Number(((c.netRevenue / totalNetAll) * 100).toFixed(1))
    }))
    .sort((a, b) => b.netRevenue - a.netRevenue);

  // 7 Days Trend Calculation
  // We go backwards from dynamically calculated today's date
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const dy = String(date.getDate()).padStart(2, '0');
      const dateString = `${yr}-${mo}-${dy}`;
      
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayNum = date.getDate();
      
      // Calculate net revenue for this date
      const dayOrders = orders.filter(o => o.dateTime.startsWith(dateString));
      const netRev = dayOrders.reduce((sum, o) => sum + o.netRevenue, 0);

      list.push({
        dateLabel: `${dayName} ${dayNum}`,
        netRevenue: netRev,
        dateString
      });
    }
    return list;
  };

  const trendData = getLast7Days();
  const maxRevenueTrend = Math.max(...trendData.map(d => d.netRevenue), 100000);

  // SVG parameters for manual line chart
  const containerWidth = 600;
  const containerHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const points = trendData.map((d, index) => {
    const x = paddingX + (index * (containerWidth - 2 * paddingX)) / 6;
    // scale height inversely
    const y = containerHeight - paddingY - (d.netRevenue * (containerHeight - 2 * paddingY)) / maxRevenueTrend;
    return { x, y, ...d };
  });

  // Build SVG Path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${containerHeight - paddingY} L ${points[0].x} ${containerHeight - paddingY} Z` 
    : '';

  return (
    <div id="dashboard_section" className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Dashboard Performa Finansial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data Terkonsolidasi Omnichannel per tanggal <span className="font-semibold text-slate-800">{getFormattedToday()}</span>
          </p>
        </div>
        
        <button
          id="btn_floating_add_order"
          onClick={onOpenOrderModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 hover:scale-[1.02] active:scale-[0.98] transition-all bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-slate-950/10 cursor-pointer"
        >
          <span className="text-lg leading-none">➕</span> Input Pesanan Baru
        </button>
      </div>

      {/* Financial Summary Grid (Today vs This Month side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-transparent" id="financial_summary_cards">
        
        {/* HARI INI CARD */}
        <div className="bg-gradient-to-br from-white to-amber-50/10 border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-200/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-550 animate-pulse"></span>
                Hari Ini ({today.getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][today.getMonth()]})
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Coins className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Omset Kotor</span>
                <span className="text-2xl font-bold text-slate-800 font-sans tracking-tight">
                  {formatRp(todayStats.gross)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Omset Bersih</span>
                <span className="text-3xl font-black text-emerald-600 font-sans tracking-tight">
                  {formatRp(todayStats.net)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100/80 text-xs text-slate-600">
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total Pesanan</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{todayStats.count} Transaksi</span>
            </div>
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total Terjual</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{todayStats.totalItems} Pcs</span>
            </div>
          </div>
        </div>

        {/* BULAN INI CARD */}
        <div className="bg-gradient-to-br from-white to-emerald-50/10 border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-200/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200/60 font-medium">
                Bulan Ini ({['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][today.getMonth()]} {today.getFullYear()})
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Total Omset Kotor</span>
                <span className="text-2xl font-bold text-slate-800 font-sans tracking-tight">
                  {formatRp(monthStats.gross)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Omset Bersih Riil</span>
                <span className="text-3xl font-black text-emerald-600 font-sans tracking-tight">
                  {formatRp(monthStats.net)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100/80 text-xs text-slate-600">
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase">Average / Hari</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{formatRp(avgNetPerDay)}</span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase">Total Transaksi</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{monthStats.count}</span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase">Kuantitas Item</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{monthStats.totalItems} Pcs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Chart + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: 7-day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300" id="revenue_trend_chart_panel">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">7 Hari Tren Pendapatan</h3>
              <p className="text-xs text-slate-400">Nilai omset bersih real-time per hari</p>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
              GRAFIK INTERAKTIF
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full overflow-hidden flex justify-center bg-slate-50/50 border border-slate-100 rounded-2xl p-3 select-none">
            <svg
              viewBox={`0 0 ${containerWidth} ${containerHeight}`}
              className="w-full h-auto max-h-[220px]"
            >
              {/* Grid-lines */}
              <line x1={paddingX} y1={paddingY} x2={containerWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={paddingX} y1={containerHeight / 2} x2={containerWidth - paddingX} y2={containerHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={paddingX} y1={containerHeight - paddingY} x2={containerWidth - paddingX} y2={containerHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />

              {/* Area fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#chartGradient)"
                  opacity="0.15"
                />
              )}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points and Labels */}
              {points.map((p, idx) => {
                const isHovered = hoveredPoint === idx;
                return (
                  <g key={idx}>
                    {/* Hover hotspot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Floating background indicator on top of nodes */}
                    {p.netRevenue > 0 && (
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="text-[10px] font-bold font-mono fill-emerald-700 pointer-events-none animate-fade-in"
                      >
                        {formatShortRp(p.netRevenue)}
                      </text>
                    )}

                    {/* Node circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? "6" : "4.5"}
                      fill={isHovered ? "#059669" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all duration-150 pointer-events-none"
                    />

                    {/* X Axis Labels */}
                    <text
                      x={p.x}
                      y={containerHeight - 8}
                      textAnchor="middle"
                      className="text-[10px] font-semibold font-mono fill-slate-400"
                    >
                      {p.dateLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive tooltip box displaying accurate details */}
            {hoveredPoint !== null && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl px-3 py-1.5 text-xs shadow-lg font-sans border border-slate-800 z-10 animate-fade-in">
                <span className="font-semibold block text-center text-[10px] text-slate-400 uppercase">
                  {trendData[hoveredPoint].dateLabel}
                </span>
                <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                  {formatRp(trendData[hoveredPoint].netRevenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Channel Contribution */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300" id="channel_contribution_panel">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Kontribusi Omset Saluran</h3>
            <p className="text-xs text-slate-400 mb-4">Urutan saluran berdasarkan omset bersih tertinggi</p>
          </div>

          <div className="space-y-4">
            {channelContributionSorted.map((chan, idx) => (
              <div key={chan.id} className="group">
                <div className="flex justify-between text-xs font-semibold text-slate-705 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">#{idx+1}</span>
                    <span className="text-slate-850 font-sans font-bold">{chan.name}</span>
                    <span className="text-[10px] font-mono font-medium text-slate-400">({chan.qty} Pcs)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900 font-mono font-bold">{formatShortRp(chan.netRevenue)}</span>
                    <span className="text-slate-400 ml-1.5 font-mono text-[10px]">{chan.percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar with nice styling */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(chan.percentage, 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Section: Today's Orders History Feed */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300" id="today_orders_feed_table">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              📋 Riwayat Pesanan Masuk Hari Ini
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-750 text-xs font-mono font-bold rounded-full">
                {filteredTodayOrders.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Catatan transaksi operasional real-time tanggal {getFormattedToday()}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-105 border border-slate-205 rounded-2xl px-4 py-2 text-slate-700 font-extrabold select-none text-xs shadow-3xs">
            <span>📦 Total: {filteredTodayOrders.length} Pesanan</span>
          </div>
        </div>

        {/* Filter and Search Bar Panel */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 mb-6 space-y-4 shadow-3xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search bar */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Cari berdasarkan No. Pesanan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-250 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold focus:outline-none transition-all text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Channel */}
              <div className="flex items-center gap-1 bg-white border border-slate-250 rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
                <span className="text-slate-405 font-bold flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0">
                  <Filter className="h-3.5 w-3.5" /> Saluran
                </span>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pl-1.5"
                >
                  <option value="all">Semua Saluran</option>
                  {channels.map((chan) => (
                    <option key={chan.id} value={chan.id}>{chan.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter COD Status */}
              <div className="flex items-center gap-1 bg-white border border-slate-250 rounded-xl px-2.5 py-1.5">
                <span className="text-slate-405 font-bold flex items-center pr-1.5 border-r border-slate-200 gap-1 shrink-0">
                  ⭐ COD
                </span>
                <select
                  value={selectedCod}
                  onChange={(e) => setSelectedCod(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pl-1.5"
                >
                  <option value="all">Semua Status</option>
                  <option value="cod">Hanya COD</option>
                  <option value="non-cod">Non-COD</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Orders List / Table */}
        {filteredTodayOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-4xl block select-none">📭</span>
            <span className="block font-black text-slate-800 text-sm">Tidak Ada Transaksi Pesanan Ditemukan</span>
            <p className="text-slate-455 text-xs max-w-sm mx-auto leading-relaxed">
              Cobalah mengubah kriteria pencarian atau buat pencatatan pesanan hari ini dengan tombol "Input Pesanan Baru" di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-3xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-505 tracking-wide uppercase text-[10px]">
                  <th className="py-3 px-4 w-32">Kanal / ID Pesanan</th>
                  <th className="py-3 px-4 w-36">Tanggal & Jam</th>
                  <th className="py-3 px-4 min-w-[200px]">Rincian Barang Belanja</th>
                  <th className="py-3 px-4 w-16 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Potongan Toko</th>
                  <th className="py-3 px-4 text-right">Potongan Biaya</th>
                  <th className="py-3 px-4 text-right">HPP Item</th>
                  <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/10 font-black">Omset Bersih</th>
                  <th className="py-3 px-4 text-right text-emerald-900 bg-emerald-100/5 font-black">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTodayOrders.map((ord) => {
                  const channel = channels.find(c => c.id === ord.channelId) || {
                    id: ord.channelId,
                    name: 'Unknown',
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  };

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Badge and order number */}
                      <td className="py-4 px-4 space-y-1">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded-md ${channel.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')}`}>
                          {channel.name}
                        </span>
                        <div className="font-mono text-xs font-black text-slate-900 tracking-wide break-all" title={ord.orderNumber}>
                          {ord.orderNumber}
                        </div>
                        {ord.isCod && (
                          <span className="inline-block text-[9px] font-extrabold uppercase bg-rose-50 border border-rose-100/80 text-rose-600 px-1.5 py-0.2 rounded mt-1.5 flex-auto">
                            🤝 COD
                          </span>
                        )}
                      </td>

                      {/* Created DateTime */}
                      <td className="py-4 px-4 font-mono text-slate-600 text-xs">
                        <div className="font-black text-slate-900 leading-tight">
                          {new Date(ord.dateTime).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold">
                          <span>🕒</span>
                          {new Date(ord.dateTime).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </div>
                      </td>

                      {/* Ordered items details */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex flex-col gap-1.5">
                          {ord.products.map((p, pIdx) => {
                            const matchedProduct = products.find(prod => prod.id === p.productId);
                            const resolvedName = matchedProduct ? matchedProduct.name : 'Produk Master';
                            return (
                              <div 
                                key={pIdx} 
                                className="text-[11px] font-mono h-[36px] flex flex-col justify-center text-slate-700"
                              >
                                <div className="truncate leading-normal font-semibold text-slate-900">{resolvedName}</div>
                                <div className="text-slate-450 text-[9px] truncate leading-normal">{p.color} • {p.size}</div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Qty column with highlight */}
                      <td className="py-3 px-4 w-16 text-center">
                        <div className="flex flex-col gap-1.5">
                          {ord.products.map((p, pIdx) => {
                            const isQtyHighlight = p.qty > 1;
                            return (
                              <div 
                                key={pIdx} 
                                className={`text-[11px] font-mono text-center h-[36px] flex items-center justify-center transition-all ${
                                  isQtyHighlight 
                                    ? 'bg-amber-100 text-amber-955 font-black rounded-lg p-0 m-0 shadow-2xs border border-amber-200' 
                                    : 'font-semibold text-slate-500'
                                }`}
                              >
                                x{p.qty}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Total Discounts */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-rose-600">
                        {ord.discounts > 0 ? `-${formatRp(ord.discounts)}` : '-'}
                      </td>

                      {/* Calculated Commission & Fees */}
                      <td className="py-4 px-4 text-right space-y-0.5" title="Klik detail biaya">
                        <div className="font-mono text-rose-700 font-bold">
                          -{formatRp(ord.calculatedFees.totalFees)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-semibold font-sans">
                          K: {ord.calculatedFees.commission > 0 ? `${formatRp(ord.calculatedFees.commission)}` : '0'} | P: {ord.calculatedFees.paymentFee > 0 ? `${formatRp(ord.calculatedFees.paymentFee)}` : '0'}
                        </div>
                      </td>

                      {/* Locked HPP cost */}
                      <td className="py-4 px-4 text-right font-mono text-slate-500 font-medium">
                        {formatRp(ord.totalHpp)}
                      </td>

                      {/* Estimation Net revenue color badge */}
                      <td className="py-4 px-4 text-right font-mono font-black text-slate-800 bg-emerald-50/20 whitespace-nowrap">
                        {formatRp(ord.netRevenue)}
                      </td>

                      {/* Estimation profitable margin color badge */}
                      <td className={`py-4 px-4 text-right font-mono font-black bg-emerald-100/5 whitespace-nowrap ${ord.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatRp(ord.netProfit)}
                      </td>
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
