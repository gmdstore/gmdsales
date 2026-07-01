/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Channel, Product } from '../types';
import { TrendingUp, Coins, Filter } from 'lucide-react';

type FilterType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'specific_month' | 'custom';

interface DashboardProps {
  orders: Order[];
  channels: Channel[];
  products: Product[];
  onOpenOrderModal: () => void;
}

export default function Dashboard({ orders, channels, products, onOpenOrderModal }: DashboardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Determine today's date dynamically based on local time
  const today = new Date();
  const year = today.getFullYear();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const targetDateStr = `${year}-${monthStr}-${dayStr}`;
  const todayYMD = targetDateStr;

  // Filter States
  const [filterType, setFilterType] = useState<FilterType>('this_month');
  const currentMonthKey = `${year}-${monthStr}`;
  const [selectedSpecificMonth, setSelectedSpecificMonth] = useState<string>(currentMonthKey);
  const [customStartDate, setCustomStartDate] = useState<string>(todayYMD);
  const [customEndDate, setCustomEndDate] = useState<string>(todayYMD);

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

  const formatSuperShortRp = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}jt`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return `${value}`;
  };

  const formatTwoLinesRp = (value: number) => {
    if (value >= 1000000) {
      return {
        num: (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1),
        unit: 'juta'
      };
    } else if (value >= 1000) {
      return {
        num: (value / 1000).toFixed(0),
        unit: 'ribu'
      };
    }
    return {
      num: String(value),
      unit: ''
    };
  };

  const getFormattedToday = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  };

  // Helper function to resolve dynamic range YYYY-MM-DD
  const getFilterRange = (): { start: string; end: string; label: string } => {
    const now = new Date();
    const formatYMD = (d: Date) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${dy}`;
    };

    switch (filterType) {
      case 'today': {
        const todayStr = formatYMD(now);
        return { start: todayStr, end: todayStr, label: 'Hari Ini' };
      }
      case 'yesterday': {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const yestStr = formatYMD(yesterday);
        return { start: yestStr, end: yestStr, label: 'Kemarin' };
      }
      case 'this_week': {
        const monday = new Date();
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return { 
          start: formatYMD(monday), 
          end: formatYMD(sunday), 
          label: 'Minggu Ini' 
        };
      }
      case 'this_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: formatYMD(firstDay),
          end: formatYMD(lastDay),
          label: 'Bulan Ini'
        };
      }
      case 'last_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: formatYMD(firstDay),
          end: formatYMD(lastDay),
          label: 'Bulan Lalu'
        };
      }
      case 'specific_month': {
        if (!selectedSpecificMonth) {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return { start: formatYMD(firstDay), end: formatYMD(lastDay), label: 'Bulan Ini' };
        }
        const [yr, mo] = selectedSpecificMonth.split('-');
        const yearNum = parseInt(yr, 10);
        const monthNum = parseInt(mo, 10) - 1;
        const firstDay = new Date(yearNum, monthNum, 1);
        const lastDay = new Date(yearNum, monthNum + 1, 0);
        
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return {
          start: formatYMD(firstDay),
          end: formatYMD(lastDay),
          label: `${monthNames[monthNum]} ${yearNum}`
        };
      }
      case 'custom': {
        return {
          start: customStartDate || formatYMD(now),
          end: customEndDate || formatYMD(now),
          label: 'Kustom'
        };
      }
      default: {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: formatYMD(firstDay), end: formatYMD(lastDay), label: 'Bulan Ini' };
      }
    }
  };

  const { start: startDateStr, end: endDateStr, label: filterLabel } = getFilterRange();
  
  // Filter today's orders (Fixed comparison card)
  const todayOrders = orders.filter(o => o.dateTime.startsWith(targetDateStr));

  // Filter orders by selected period (Dynamic)
  const filteredOrders = orders.filter(o => {
    if (!o.dateTime) return false;
    const orderDate = o.dateTime.substring(0, 10);
    return orderDate >= startDateStr && orderDate <= endDateStr;
  });

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
  const filteredStats = getStats(filteredOrders);

  // Calculate days in selected period up to today
  const getDaysInPeriod = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    let end = new Date(endStr);
    
    // Create a local "today" date object with time set to 00:00:00
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    
    // set start & end at 00:00:00 to calculate exact days
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // If the end date is in the future relative to today, cap it at today
    if (end > todayLocal) {
      end = todayLocal;
    }
    
    // If the start date is in the future, return 1 to avoid dividing by 0 or negative numbers
    if (start > todayLocal) {
      return 1;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  };
  
  const daysInPeriod = getDaysInPeriod(startDateStr, endDateStr);
  const avgNetPerDayFiltered = filteredStats.net / daysInPeriod;

  // Generate list of months from orders + current month dynamically
  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthKey);
    
    orders.forEach(o => {
      if (o.dateTime && o.dateTime.length >= 7) {
        monthsSet.add(o.dateTime.substring(0, 7));
      }
    });
    
    const sorted = Array.from(monthsSet).sort().reverse(); // Show newest first
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return sorted.map(m => {
      const [yr, mo] = m.split('-');
      const monthIndex = parseInt(mo, 10) - 1;
      return {
        value: m,
        label: `${monthNames[monthIndex]} ${yr}`
      };
    });
  };

  // Dynamic Channel Contribution Calculation based on selected filter range
  const channelContribution = channels.map(chan => {
    const chanOrders = filteredOrders.filter(o => o.channelId === chan.id);
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

  // Dynamic Trend Calculation based on selected filter range (limit to max 90 days for performance)
  const getTrendDataForRange = (startStr: string, endStr: string) => {
    const list = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = Math.min(diffDays, 90);
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const dy = String(date.getDate()).padStart(2, '0');
      const dateString = `${yr}-${mo}-${dy}`;
      
      const dayNum = date.getDate();
      const monthShort = date.toLocaleDateString('id-ID', { month: 'short' });
      
      const dayOrders = orders.filter(o => o.dateTime.startsWith(dateString));
      const netRev = dayOrders.reduce((sum, o) => sum + o.netRevenue, 0);

      list.push({
        dateLabel: `${dayNum} ${monthShort}`,
        netRevenue: netRev,
        dateString,
        dayNum
      });
    }
    return list;
  };

  const trendData = getTrendDataForRange(startDateStr, endDateStr);
  const maxRevenueTrend = Math.max(...trendData.map(d => d.netRevenue), 100000);

  // SVG parameters for manual bar chart
  const containerWidth = 1000;
  const containerHeight = 300;
  const paddingX = 35;
  const paddingY = 40;

  // Compute spacing and width for each bar
  const barSpacing = (containerWidth - 2 * paddingX) / trendData.length;
  let barWidth = Math.max(3, barSpacing * 0.72);

  // Make bars proportional when there are fewer than 15 days (e.g., today, yesterday, this week)
  if (trendData.length < 15) {
    barWidth = Math.min(barWidth, 40);
  }

  const points = trendData.map((d, index) => {
    // X is the center of the bar
    const x = paddingX + (index * barSpacing) + barSpacing / 2;
    // scale height inversely
    const y = containerHeight - paddingY - (d.netRevenue * (containerHeight - 2 * paddingY)) / maxRevenueTrend;
    const barHeight = Math.max(0, (containerHeight - paddingY) - y);
    return { x, y, barHeight, barWidth, ...d };
  });

  return (
    <div id="dashboard_section" className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>📈</span> Dashboard Performa Finansial
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
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

      {/* Date Filter Panel */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4" id="date_filter_panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📅</span>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Filter Jangka Waktu Data</h2>
              <p className="text-[11px] text-slate-400">Pilih periode laporan untuk memperbarui ringkasan, kontribusi saluran, dan grafik</p>
            </div>
          </div>
          
          {/* Current selected range summary badge */}
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-2 self-start md:self-auto shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              Aktif: <strong className="font-extrabold">{filterLabel}</strong> ({startDateStr.split('-').reverse().join('/')} s.d {endDateStr.split('-').reverse().join('/')})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
          
          {/* Preset Buttons - spans 5 cols */}
          <div className="xl:col-span-5 flex flex-wrap gap-2 items-center">
            {[
              { type: 'today', label: 'Hari Ini' },
              { type: 'yesterday', label: 'Kemarin' },
              { type: 'this_week', label: 'Minggu Ini' },
              { type: 'this_month', label: 'Bulan Ini' },
              { type: 'last_month', label: 'Bulan Lalu' }
            ].map(preset => (
              <button
                key={preset.type}
                onClick={() => setFilterType(preset.type as FilterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border ${
                  filterType === preset.type
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Specific Month selector - spans 3 cols */}
          <div className="xl:col-span-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Bulan:</span>
            <select
              value={filterType === 'specific_month' ? selectedSpecificMonth : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedSpecificMonth(e.target.value);
                  setFilterType('specific_month');
                }
              }}
              className={`w-full text-xs font-semibold rounded-xl px-2.5 py-1.5 cursor-pointer transition-all duration-150 border bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                filterType === 'specific_month'
                  ? 'border-emerald-500 text-emerald-800 bg-emerald-50/20'
                  : 'border-slate-200/80 text-slate-600 hover:border-slate-300'
              }`}
            >
              <option value="" disabled>-- Pilih Bulan --</option>
              {getAvailableMonths().map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Inputs - spans 4 cols (wider for two inputs) */}
          <div className="xl:col-span-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Kustom:</span>
            <div className={`flex items-center gap-1.5 w-full rounded-xl px-2 py-1 border transition-all duration-150 ${
              filterType === 'custom'
                ? 'border-emerald-500 bg-emerald-50/10'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setFilterType('custom');
                }}
                className="bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none w-full cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-bold font-mono">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setFilterType('custom');
                }}
                className="bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Financial Summary Grid (Today vs This Month vs Channel Contribution side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-transparent" id="financial_summary_cards">
        
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
                Ringkasan {filterLabel}
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block">Omset Bersih Riil</span>
                <span className="text-3xl font-black text-emerald-600 font-sans tracking-tight">
                  {formatRp(filteredStats.net)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100/80 text-xs text-slate-600">
            <div className="bg-emerald-50/30 p-2.5 rounded-2xl border border-emerald-100/50 transition-all duration-200">
              <span className="block text-[9px] text-emerald-800 font-bold uppercase tracking-wider">Avg / Hari</span>
              <span className="text-xs font-black text-emerald-600 mt-0.5 block truncate font-sans">{formatRp(avgNetPerDayFiltered || 0)}</span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase">Transaksi</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{filteredStats.count}</span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase">Item</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{filteredStats.totalItems} Pcs</span>
            </div>
          </div>
        </div>

        {/* KONTRIBUSI SALURAN CARD */}
        <div className="bg-gradient-to-br from-white to-sky-50/10 border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-sky-200/80 transition-all duration-300 relative overflow-hidden group" id="channel_contribution_panel">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-500 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-800 text-xs font-semibold rounded-full border border-sky-200/60 font-medium">
                Kontribusi Omset Saluran
              </span>
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                <Filter className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {channelContributionSorted.slice(0, 3).map((chan, idx) => (
                <div key={chan.id} className="group/item">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-mono">#{idx+1}</span>
                      <span className="text-slate-700 font-sans font-bold truncate max-w-[100px]">{chan.name}</span>
                      <span className="text-[9px] font-mono font-medium text-slate-400">({chan.qty} Pcs)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 font-mono font-bold text-[11px]">{formatShortRp(chan.netRevenue)}</span>
                    </div>
                  </div>

                  {/* Progress Bar with nice styling */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(chan.percentage, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
              {channelContributionSorted.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">Belum ada transaksi</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100/80 text-[10px] text-slate-400 font-semibold uppercase flex justify-between items-center">
            <span>Total Saluran</span>
            <span className="text-xs font-bold text-sky-600 font-mono">{channelContributionSorted.length} Aktif</span>
          </div>
        </div>

      </div>

      {/* Secondary Row: Full Width Revenue Trend Chart */}
      <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300" id="revenue_trend_chart_panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Tren Pendapatan Bulan Berjalan</h3>
            <p className="text-xs text-slate-400">Nilai omset bersih real-time per hari untuk bulan ini</p>
          </div>
          <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
            GRAFIK BATANG INTERAKTIF
          </span>
        </div>

        {/* SVG Bar Chart */}
        <div className="relative w-full overflow-hidden flex justify-center bg-slate-50/50 border border-slate-100 rounded-2xl p-3 select-none">
          <svg
            viewBox={`0 0 ${containerWidth} ${containerHeight}`}
            className="w-full h-auto max-h-[340px]"
          >
            {/* Grid-lines */}
            <line x1={paddingX} y1={paddingY} x2={containerWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={paddingX} y1={containerHeight / 2} x2={containerWidth - paddingX} y2={containerHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={paddingX} y1={containerHeight - paddingY} x2={containerWidth - paddingX} y2={containerHeight - paddingY} stroke="#e2e8f0" strokeWidth="1" />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="hoverBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>

            {/* Interactive Bars and Labels */}
            {points.map((p, idx) => {
              const isHovered = hoveredPoint === idx;
              return (
                <g key={idx}>
                  {/* Hover hotspot spanning the entire column width and chart height for perfect contiguous mouse interaction */}
                  <rect
                    x={p.x - barSpacing / 2}
                    y={paddingY}
                    width={barSpacing}
                    height={containerHeight - paddingY * 2}
                    fill="white"
                    opacity="0"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  
                  {/* Actual Bar Rect */}
                  <rect
                    x={p.x - p.barWidth / 2}
                    y={p.y}
                    width={p.barWidth}
                    height={p.barHeight}
                    rx={Math.max(1.5, p.barWidth * 0.15)}
                    fill={isHovered ? "url(#hoverBarGradient)" : "url(#barGradient)"}
                    className="transition-all duration-200 pointer-events-none"
                  />

                  {/* Income text indicator on top of the bars (ujung batang) */}
                  {p.netRevenue > 0 && (() => {
                    const label = formatTwoLinesRp(p.netRevenue);
                    return (
                      <text
                        x={p.x}
                        y={p.y - (label.unit ? 19 : 10)}
                        textAnchor="middle"
                        className={`text-[10px] font-mono transition-all duration-150 pointer-events-none leading-none ${
                          isHovered ? 'fill-emerald-800' : 'fill-slate-600'
                        }`}
                      >
                        <tspan x={p.x} dy="0" className={isHovered ? 'font-black text-[12px]' : 'font-extrabold'}>{label.num}</tspan>
                        {label.unit && (
                          <tspan x={p.x} dy="10" className={`font-bold ${isHovered ? 'text-[9.5px]' : 'text-[8.5px] opacity-90'}`}>{label.unit}</tspan>
                        )}
                      </text>
                    );
                  })()}

                  {/* X Axis Labels - Render all dates at the bottom */}
                  <text
                    x={p.x}
                    y={containerHeight - 12}
                    textAnchor="middle"
                    className={`text-[10.5px] font-bold font-mono transition-all duration-150 pointer-events-none ${
                      isHovered ? 'fill-emerald-600 font-black text-[13px]' : 'fill-slate-500'
                    }`}
                  >
                    {p.dayNum}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive tooltip box displaying accurate details */}
          {hoveredPoint !== null && (
            <div className="absolute top-4 left-0 right-0 mx-auto w-fit bg-slate-900 text-white rounded-xl px-4 py-2 text-xs shadow-xl font-sans border border-slate-800 z-10 animate-fade-in text-center pointer-events-none">
              <span className="font-semibold block text-[10px] text-slate-400 uppercase tracking-wider">
                {trendData[hoveredPoint].dateLabel}
              </span>
              <span className="font-mono text-emerald-400 font-extrabold block mt-0.5 text-sm">
                {formatRp(trendData[hoveredPoint].netRevenue)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
