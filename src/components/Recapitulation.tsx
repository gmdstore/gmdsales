import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, Channel } from '../types';
import { Calendar, TrendingUp, Coins, ShoppingBag, Layers } from 'lucide-react';

interface RecapitulationProps {
  orders: Order[];
  channels: Channel[];
}

export default function Recapitulation({ orders, channels }: RecapitulationProps) {
  // Get list of available months from existing orders, plus current month
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const currYear = d.getFullYear();
    const currMonth = String(d.getMonth() + 1).padStart(2, '0');
    return `${currYear}-${currMonth}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
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

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthStr); // ensure current month is always present

    orders.forEach(o => {
      if (o.dateTime) {
        const parts = o.dateTime.split('T')[0];
        if (parts) {
          const monthPart = parts.substring(0, 7); // YYYY-MM
          if (/^\d{4}-\d{2}$/.test(monthPart)) {
            monthsSet.add(monthPart);
          }
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [orders, currentMonthStr]);

  // Generate all calendar dates inside the selected month
  const datesInMonth = useMemo(() => {
    const list: string[] = [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed

    // Number of days in this month
    const totalDays = new Date(year, month, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      list.push(`${yearStr}-${monthStr}-${dayStr}`);
    }
    return list;
  }, [selectedMonth]);

  // Formatting currency
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Human readable month name
  const formatMonthLabel = (mYearMonth: string) => {
    const [y, m] = mYearMonth.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    return `${months[monthIdx] || m} ${y}`;
  };

  // Format date grid header/label cleanly (e.g. "Kamis, 15 Jun")
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = monthsShort[d.getMonth()];
    
    return {
      dayName,
      dateNum,
      monthName,
      fullLabel: `${dayName}, ${dateNum} ${monthName}`
    };
  };

  // Group and optimize order data lookup for the selected month
  const aggregatedData = useMemo(() => {
    // Map of keys: date_channelId => { qty, netRevenue, netProfit, ordersCount }
    const lookup: { [key: string]: { qty: number; netRevenue: number; netProfit: number } } = {};

    orders.forEach(ord => {
      if (!ord.dateTime) return;
      const orderDate = ord.dateTime.split('T')[0];
      if (!orderDate || !orderDate.startsWith(selectedMonth)) return;

      const channelId = ord.channelId;
      const key = `${orderDate}_${channelId}`;

      const totalQty = ord.products.reduce((acc, p) => acc + (p.qty ?? 0), 0);
      const netRev = ord.netRevenue;
      const netProf = ord.netProfit;

      if (!lookup[key]) {
        lookup[key] = { qty: 0, netRevenue: 0, netProfit: 0 };
      }

      lookup[key].qty += totalQty;
      lookup[key].netRevenue += netRev;
      lookup[key].netProfit += netProf;
    });

    return lookup;
  }, [orders, selectedMonth]);

  // Compute stats summary card inputs specifically for the selected month
  const monthSummary = useMemo(() => {
    let totalQty = 0;
    let totalNetRevenue = 0;
    let totalNetProfit = 0;
    let activeOrdersCount = 0;

    orders.forEach(ord => {
      if (!ord.dateTime || !ord.dateTime.startsWith(selectedMonth)) return;
      
      const ordQty = ord.products.reduce((acc, p) => acc + p.qty, 0);
      totalQty += ordQty;
      totalNetRevenue += ord.netRevenue;
      totalNetProfit += ord.netProfit;
      activeOrdersCount++;
    });

    return {
      totalQty,
      totalNetRevenue,
      totalNetProfit,
      activeOrdersCount
    };
  }, [orders, selectedMonth]);

  return (
    <div className="space-y-6 animate-fade-in" id="recapitulation_active_page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>📊</span> Rekapitulasi Penjualan Harian
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Ringkasan harian distribusi jumlah pesanan item (pcs) dan pendapatan bersih (omset terpotong beban) berdasarkan opsi saluran.
          </p>
        </div>

        {/* Month Selection Input */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 hover:border-slate-300 focus-within:ring-1 focus-within:ring-emerald-500 transition-all shadow-3xs">
            <span className="text-slate-400 font-normal text-xs flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-500" /> Periode
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-normal text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Consolidation Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Item Terjual */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wider">Total Item Terjual</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-normal text-slate-900">{monthSummary.totalQty}</span>
              <span className="text-[10px] text-slate-400 font-normal">pcs</span>
            </div>
          </div>
        </div>

        {/* Omset Bersih */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wider">Total Omset Bersih</span>
            <span className="text-base font-normal text-emerald-700 block mt-0.5">
              {formatRp(monthSummary.totalNetRevenue)}
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wider">Estimasi Laba Bersih</span>
            <span className={`text-base font-normal block mt-0.5 ${monthSummary.totalNetProfit >= 0 ? 'text-rose-600' : 'text-red-600'}`}>
              {formatRp(monthSummary.totalNetProfit)}
            </span>
          </div>
        </div>

        {/* Transaksi Terpencatat */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-wider">Total Transaksi</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-normal text-slate-800">{monthSummary.activeOrdersCount}</span>
              <span className="text-[10px] text-slate-450 font-normal">pesanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Recapitulation Table */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-3xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">🗓️ Sebaran Saluran Harian – {formatMonthLabel(selectedMonth)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Setiap sel menampilkan: [Pcs / Kuantitas Terbawah] & [RP / Total Omset Bersih]</p>
          </div>
        </div>

        <div ref={tableContainerRef} className="overflow-x-auto lg:overflow-visible border border-slate-100/60 rounded-2xl relative">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-transparent font-normal text-slate-600 tracking-wide uppercase text-[9px] border-b border-slate-100">
                <th className="py-3.5 px-4 w-32 font-normal bg-transparent">Tanggal</th>
                
                {/* Dynamically List Channels as Columns */}
                {channels.map(chan => {
                  const hasPipe = chan.color && chan.color.includes('|');
                  const [bg, text] = hasPipe ? chan.color.split('|') : ['', ''];
                  return (
                    <th key={chan.id} className="py-3.5 px-4 text-center min-w-[130px] border-r border-slate-100/80 sticky top-0 z-20 bg-transparent">
                      {hasPipe ? (
                        <span 
                          style={{ backgroundColor: bg, color: text }}
                          className={`inline-block font-normal rounded border border-slate-200 transition-all duration-300 ease-out ${
                            isHeaderFloating 
                              ? 'px-3.5 py-1.5 text-[10px] shadow-sm scale-110' 
                              : 'px-2 py-0.5 text-[8px]'
                          }`}
                        >
                          {chan.name}
                        </span>
                      ) : (
                        <span className={`inline-block font-normal rounded transition-all duration-300 ease-out ${
                          isHeaderFloating 
                            ? 'px-3.5 py-1.5 text-[10px] shadow-sm scale-110' 
                            : 'px-2 py-0.5 text-[8px]'
                        } ${chan.color.split(' ').filter(c => !c.startsWith('border-')).join(' ')}`}>
                          {chan.name}
                        </span>
                      )}
                    </th>
                  );
                })}
                
                <th className="py-3.5 px-4 text-center min-w-[140px] text-emerald-800 font-normal border-l border-slate-205 sticky top-0 z-20 bg-transparent">
                  <span className={`inline-block font-normal rounded bg-emerald-100 text-emerald-800 transition-all duration-300 ease-out ${
                    isHeaderFloating 
                      ? 'px-3.5 py-1.5 text-[10px] shadow-sm scale-110' 
                      : 'px-2 py-0.5 text-[8px]'
                  }`}>
                    Total Harian
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datesInMonth.map(date => {
                const dateMeta = formatDateLabel(date);
                
                // Track total for this row
                let rowTotalQty = 0;
                let rowTotalNetRevenue = 0;

                return (
                  <tr key={date} className="hover:bg-slate-50/50 transition-colors">
                    {/* Date label column */}
                    <td className="py-3 px-4 font-mono font-normal text-slate-700 bg-slate-50/30">
                      <div className="text-slate-850 font-normal">{dateMeta.dateNum}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{dateMeta.dayName}</div>
                    </td>

                    {/* Channel Value cells */}
                    {channels.map(chan => {
                      const lookupKey = `${date}_${chan.id}`;
                      const cellVal = aggregatedData[lookupKey];
                      
                      const qty = cellVal ? cellVal.qty : 0;
                      const netRev = cellVal ? cellVal.netRevenue : 0;

                      rowTotalQty += qty;
                      rowTotalNetRevenue += netRev;

                      // Strict layout rule: if both are 0, we render blank space as requested
                      const isBlank = qty === 0 && netRev === 0;

                      return (
                        <td key={chan.id} className="py-2.5 px-4 text-center font-mono border-r border-slate-100/40">
                          {!isBlank ? (
                            <div className="space-y-0.5 leading-tight">
                              <span className="block font-normal text-slate-900 text-xs">{qty} <span className="text-[9px] text-slate-400 font-normal">pcs</span></span>
                              <span className="block text-[10px] font-normal text-emerald-600">{formatRp(netRev)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Combined Row Level Total Column */}
                    <td className="py-2.5 px-4 text-center font-mono bg-emerald-50/5 border-l border-slate-205">
                      {rowTotalQty > 0 || rowTotalNetRevenue > 0 ? (
                        <div className="space-y-0.5 leading-tight">
                          <span className="block font-normal text-slate-900 text-xs">
                            {rowTotalQty} <span className="text-[9px] text-slate-450 font-normal">pcs</span>
                          </span>
                          <span className="block text-[10px] font-normal text-emerald-700">
                            {formatRp(rowTotalNetRevenue)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Monthly totals per channel - Footer Column */}
              <tr className="bg-slate-100/50 font-normal text-[10px] border-t-2 border-slate-200">
                <td className="py-4 px-4 font-normal text-slate-800 bg-slate-100">
                  Total Bulanan
                </td>
                
                {channels.map(chan => {
                  // Compute month aggregation for this channel
                  let chanTotalQty = 0;
                  let chanTotalNetRevenue = 0;

                  datesInMonth.forEach(date => {
                    const lookupKey = `${date}_${chan.id}`;
                    if (aggregatedData[lookupKey]) {
                      chanTotalQty += aggregatedData[lookupKey].qty;
                      chanTotalNetRevenue += aggregatedData[lookupKey].netRevenue;
                    }
                  });

                  return (
                    <td key={chan.id} className="py-4 px-4 text-center font-mono">
                      <div className="space-y-0.5">
                        <span className="block font-normal text-slate-900 text-xs">{chanTotalQty > 0 ? `${chanTotalQty} pcs` : '-'}</span>
                        <span className="block text-[10px] font-normal text-emerald-700">{chanTotalNetRevenue > 0 ? formatRp(chanTotalNetRevenue) : '-'}</span>
                      </div>
                    </td>
                  );
                })}

                <td className="py-4 px-4 text-center font-mono bg-emerald-100/10">
                  <div className="space-y-0.5 leading-tight">
                    <span className="block font-normal text-slate-900 text-xs">
                      {monthSummary.totalQty > 0 ? `${monthSummary.totalQty} pcs` : '-'}
                    </span>
                    <span className="block text-xs font-normal text-emerald-800">
                      {monthSummary.totalNetRevenue > 0 ? formatRp(monthSummary.totalNetRevenue) : '-'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Daily Average per channel - Footer Column */}
              <tr className="bg-slate-50/75 font-normal text-[10px] border-t border-slate-200">
                <td className="py-4 px-4 font-normal text-slate-700 bg-slate-50">
                  Rata-rata Harian
                </td>
                
                {channels.map(chan => {
                  // Compute average for this channel over all days in the month
                  let chanTotalQty = 0;
                  let chanTotalNetRevenue = 0;

                  datesInMonth.forEach(date => {
                    const lookupKey = `${date}_${chan.id}`;
                    if (aggregatedData[lookupKey]) {
                      chanTotalQty += aggregatedData[lookupKey].qty;
                      chanTotalNetRevenue += aggregatedData[lookupKey].netRevenue;
                    }
                  });

                  const daysCount = datesInMonth.length;
                  const avgQty = chanTotalQty / daysCount;
                  const avgNetRev = chanTotalNetRevenue / daysCount;

                  return (
                    <td key={chan.id} className="py-4 px-4 text-center font-mono text-slate-600">
                      <div className="space-y-0.5">
                        <span className="block font-normal text-slate-700 text-xs">
                          {chanTotalQty > 0 ? `${avgQty.toFixed(1)} pcs` : '-'}
                        </span>
                        <span className="block text-[10px] font-normal text-emerald-600">
                          {chanTotalNetRevenue > 0 ? `${formatRp(avgNetRev)}` : '-'}
                        </span>
                      </div>
                    </td>
                  );
                })}

                <td className="py-4 px-4 text-center font-mono bg-emerald-50/5">
                  <div className="space-y-0.5 leading-tight">
                    <span className="block font-normal text-slate-800 text-xs">
                      {monthSummary.totalQty > 0 ? `${(monthSummary.totalQty / datesInMonth.length).toFixed(1)} pcs` : '-'}
                    </span>
                    <span className="block text-[10px] font-normal text-emerald-600">
                      {monthSummary.totalNetRevenue > 0 ? `${formatRp(monthSummary.totalNetRevenue / datesInMonth.length)}` : '-'}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
