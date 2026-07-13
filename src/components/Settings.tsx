/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Channel, Product, AutoDiscount } from '../types';
import { Percent, Edit3, Settings, Save, Trash2, PlusCircle, CheckCircle, Info, Heart, Database, Wifi, WifiOff, RefreshCw, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, limit, query, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { User, signOut, updateProfile, updatePassword } from 'firebase/auth';

interface SettingsProps {
  currentUser: User | null;
  currentUserProfile: { status: 'approved' | 'pending' | 'rejected'; role: 'admin' | 'staff'; displayName?: string } | null;
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
  appFontWeight: string;
  onUpdateFontWeight: (weightValue: string) => void;
  appFontSize?: string;
  onUpdateFontSize?: (sizeValue: string) => void;
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
  currentUser,
  currentUserProfile,
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
  appFontWeight,
  onUpdateFontWeight,
  appFontSize = '14px',
  onUpdateFontSize,
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
  const [chanColor, setChanColor] = useState('#f1f5f9|#334155');
  const [chanPaymentMethods, setChanPaymentMethods] = useState<string[]>([]);
  const [showChanForm, setShowChanForm] = useState(false);

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
  const [showDiscForm, setShowDiscForm] = useState(false);
  const [discountSuccessMsg, setDiscountSuccessMsg] = useState<string | null>(null);
  const [pendingDeleteDiscount, setPendingDeleteDiscount] = useState<AutoDiscount | null>(null);

  // Payment methods and PIC list inline editing / confirmation states
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>('');
  const [confirmDeletePaymentIndex, setConfirmDeletePaymentIndex] = useState<number | null>(null);

  const [editingPicIndex, setEditingPicIndex] = useState<number | null>(null);
  const [editingPicValue, setEditingPicValue] = useState<string>('');
  const [confirmDeletePicIndex, setConfirmDeletePicIndex] = useState<number | null>(null);

  // User Auth & Settings states
  const [userNameInput, setUserNameInput] = useState(currentUser?.displayName || "");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUserNameInput(currentUser.displayName || "");
    }
  }, [currentUser]);

  // User listing state for admin
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Subscribe to all users if current user is an admin
  useEffect(() => {
    const isAdmin = currentUserProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === 'gomudastore@gmail.com';
    if (!isAdmin) {
      setUsersList([]);
      return;
    }

    setUsersLoading(true);
    const usersCollectionRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollectionRef, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort users by email
      list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      setUsersList(list);
      setUsersLoading(false);
    }, (err) => {
      console.error("Error loading users list:", err);
      setUsersError("Gagal memuat daftar pengguna.");
      setUsersLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, currentUserProfile]);

  const handleUpdateUserStatus = async (uid: string, status: 'approved' | 'pending' | 'rejected') => {
    try {
      if (uid === currentUser?.uid) {
        alert("Anda tidak dapat mengubah status akses Anda sendiri.");
        return;
      }
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { status });
    } catch (err: any) {
      console.error("Error updating user status:", err);
      alert("Gagal memperbarui status akses pengguna: " + (err.message || err));
    }
  };

  const handleUpdateUserRole = async (uid: string, role: 'admin' | 'staff') => {
    try {
      if (uid === currentUser?.uid) {
        alert("Anda tidak dapat mengubah peran Anda sendiri.");
        return;
      }
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { role });
    } catch (err: any) {
      console.error("Error updating user role:", err);
      alert("Gagal memperbarui peran pengguna: " + (err.message || err));
    }
  };

  const handleDeleteUserDoc = async (uid: string) => {
    if (uid === currentUser?.uid) {
      alert("Anda tidak dapat menghapus dokumen akses Anda sendiri.");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus hak akses pengguna ini? Pengguna akan diminta mendaftar/menunggu persetujuan kembali.")) {
      return;
    }
    try {
      const userDocRef = doc(db, "users", uid);
      await deleteDoc(userDocRef);
    } catch (err: any) {
      console.error("Error deleting user document:", err);
      alert("Gagal menghapus akses pengguna: " + (err.message || err));
    }
  };

  // Draft discount state and database sync controls
  const [localAutoDiscounts, setLocalAutoDiscounts] = useState<AutoDiscount[]>(autoDiscounts);
  const [isSavingDiscounts, setIsSavingDiscounts] = useState(false);

  useEffect(() => {
    setLocalAutoDiscounts(autoDiscounts);
  }, [autoDiscounts]);

  const hasUnsavedDiscounts = JSON.stringify(localAutoDiscounts) !== JSON.stringify(autoDiscounts);

  const handleSaveDiscountsToDatabase = async () => {
    setIsSavingDiscounts(true);
    try {
      await onUpdateAutoDiscounts(localAutoDiscounts);
      setDiscountSuccessMsg("Semua skema diskon otomatis berhasil disimpan dan disinkronkan ke Firestore!");
      setTimeout(() => setDiscountSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Error saving discounts to Firestore:", err);
      alert("Gagal menyimpan diskon otomatis ke Firestore.");
    } finally {
      setIsSavingDiscounts(false);
    }
  };

  // Firebase testing states
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const handleTestFirebase = async () => {
    setFirebaseStatus('testing');
    setFirebaseError(null);
    try {
      const q = query(collection(db, "orders"), limit(1));
      await getDocs(q);
      setFirebaseStatus('connected');
    } catch (err: any) {
      console.error("Firebase Connection Test failed:", err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.toLowerCase().includes("permission-denied") || 
        err?.code === "permission-denied" || 
        errMsg.toLowerCase().includes("insufficient permissions")
      ) {
        setFirebaseStatus('connected');
        setFirebaseError("permission-denied");
      } else {
        setFirebaseStatus('failed');
        setFirebaseError(errMsg);
      }
    }
  };

  // Helper to parse hex colors from chanColor
  const parseChanColor = (colorStr: string) => {
    if (colorStr && colorStr.includes('|')) {
      const [bg, text] = colorStr.split('|');
      return { bg, text };
    }
    // Fallbacks for legacy Tailwind color classes
    if (colorStr && colorStr.includes('bg-orange-105')) return { bg: '#ffedd5', text: '#ea580c' };
    if (colorStr && colorStr.includes('bg-orange-100')) return { bg: '#ffedd5', text: '#ea580c' };
    if (colorStr && colorStr.includes('bg-emerald-105')) return { bg: '#d1fae5', text: '#059669' };
    if (colorStr && colorStr.includes('bg-emerald-100')) return { bg: '#d1fae5', text: '#059669' };
    if (colorStr && colorStr.includes('bg-teal-105')) return { bg: '#ccfbf1', text: '#0d9488' };
    if (colorStr && colorStr.includes('bg-teal-100')) return { bg: '#ccfbf1', text: '#0d9488' };
    if (colorStr && colorStr.includes('bg-slate-900')) return { bg: '#0f172a', text: '#ffffff' };
    if (colorStr && colorStr.includes('bg-indigo-105')) return { bg: '#e0e7ff', text: '#4f46e5' };
    if (colorStr && colorStr.includes('bg-indigo-100')) return { bg: '#e0e7ff', text: '#4f46e5' };
    if (colorStr && colorStr.includes('bg-violet-105')) return { bg: '#f3e8ff', text: '#7c3aed' };
    if (colorStr && colorStr.includes('bg-violet-100')) return { bg: '#f3e8ff', text: '#7c3aed' };
    if (colorStr && colorStr.includes('bg-rose-105')) return { bg: '#ffe4e6', text: '#e11d48' };
    if (colorStr && colorStr.includes('bg-rose-100')) return { bg: '#ffe4e6', text: '#e11d48' };
    if (colorStr && colorStr.includes('bg-amber-105')) return { bg: '#fef3c7', text: '#d97706' };
    if (colorStr && colorStr.includes('bg-amber-100')) return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#f1f5f9', text: '#334155' }; // default gray
  };

  const { bg: currentBg, text: currentText } = parseChanColor(chanColor);

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

  const handleUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const trimmed = userNameInput.trim();
    if (!trimmed) {
      setUserErrorMsg("Nama pengguna tidak boleh kosong.");
      return;
    }
    setIsSavingUser(true);
    setUserSuccessMsg(null);
    setUserErrorMsg(null);
    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmed
      });
      setUserSuccessMsg("Nama profil berhasil diperbarui!");
      setTimeout(() => setUserSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setUserErrorMsg(err?.message || "Gagal memperbarui nama profil.");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!newPasswordInput) {
      setUserErrorMsg("Kata sandi baru tidak boleh kosong.");
      return;
    }
    if (newPasswordInput.length < 6) {
      setUserErrorMsg("Kata sandi baru minimal harus 6 karakter.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setUserErrorMsg("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    setIsSavingUser(true);
    setUserSuccessMsg(null);
    setUserErrorMsg(null);
    try {
      await updatePassword(auth.currentUser, newPasswordInput);
      setUserSuccessMsg("Kata sandi berhasil diubah!");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setTimeout(() => setUserSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Error updating password:", err);
      if (err.code === 'auth/requires-recent-login') {
        setUserErrorMsg("Demi keamanan, tindakan ini memerlukan Anda untuk keluar dan masuk kembali sebelum mengubah kata sandi.");
      } else {
        setUserErrorMsg(err?.message || "Gagal mengubah kata sandi.");
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Error logging out:", err);
      alert("Gagal keluar dari akun.");
    }
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
    setShowChanForm(true);
  };

  const handleCancelChannelEdit = () => {
    setEditingChanId(null);
    setChanName('');
    setChanCommission(0);
    setChanPayment(0);
    setChanFlat(0);
    setChanShipping(0);
    setChanShippingMax(0);
    setChanColor('#f1f5f9|#334155');
    setChanPaymentMethods([]);
    setShowChanForm(false);
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
    <div id="settings_section" className="space-y-8 animate-fade-in text-xs text-slate-700 pt-6 md:pt-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>⚙️</span> Pengaturan
          </h1>
        </div>
      </div>

      <div className="space-y-8 w-full max-w-4xl mx-auto">
        
        {/* Left Column: Brand Customization Form & Footer Setup */}
        <div className="space-y-6">
          <form onSubmit={handleSaveBrandInfo} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                🏠 Identitas Brand & Profil
              </h3>
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
                  <label className="block font-normal text-slate-700 mb-1">Logo (Emoji/Icon):</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="👕"
                    value={inputBrandLogo}
                    onChange={(e) => setInputBrandLogo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-emoji text-lg focus:ring-1 focus:ring-emerald-500 outline-none font-normal"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block font-normal text-slate-700 mb-1">Nama Brand:</label>
                  <input
                    type="text"
                    required
                    placeholder="OmniOrder Store"
                    value={inputBrandName}
                    onChange={(e) => setInputBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Shop profile / Description sentence */}
              <div>
                <label className="block font-normal text-slate-700 mb-1">Profil Toko / Tagline:</label>
                <textarea
                  required
                  rows={2}
                  maxLength={150}
                  placeholder="Ketik profil singkat toko, misal: Grosir Pakaian Anak & Remaja Online-Offline Jakarta Barat"
                  value={inputBrandProfile}
                  onChange={(e) => setInputBrandProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Customizable Footer Text */}
              <div>
                <label className="block font-normal text-slate-700 mb-1">Custom Teks Footer Hak Cipta:</label>
                <input
                  type="text"
                  required
                  placeholder="© 2026 PT. Busana Sejahtera Mandiri - Hak Cipta Dilindungi"
                  value={inputBrandFooter}
                  onChange={(e) => setInputBrandFooter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">Teks ini akan dirender di bagian bawah sidebar menu secara terus menerus.</span>
              </div>

              {/* Dynamic Font Selector option */}
              <div className="border-t border-slate-100/80 pt-4 mt-2 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="select_font_style" className="block font-normal text-slate-700 mb-1.5 flex items-center gap-1.5 text-xs">
                      <span>🔤</span> Gaya Font (Tipografi):
                    </label>
                    <select
                      id="select_font_style"
                      value={appFont}
                      onChange={(e) => onUpdateFont(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                      style={{ fontFamily: appFont }}
                    >
                      {[
                        { name: 'Inter (Sleek/Clean)', value: 'Inter' },
                        { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
                        { name: 'Outfit (Geometric)', value: 'Outfit' },
                        { name: 'JetBrains Mono', value: 'JetBrains Mono' },
                        { name: 'Playfair Display (Elegant Serif)', value: 'Playfair Display' }
                      ].map((fontItem) => (
                        <option
                          key={fontItem.value}
                          value={fontItem.value}
                          style={{ fontFamily: fontItem.value }}
                        >
                          {fontItem.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select_font_weight" className="block font-normal text-slate-700 mb-1.5 flex items-center gap-1.5 text-xs">
                      <span>⚖️</span> Ketebalan Font Utama:
                    </label>
                    <select
                      id="select_font_weight"
                      value={appFontWeight}
                      onChange={(e) => onUpdateFontWeight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                      style={{ fontFamily: appFont, fontWeight: appFontWeight }}
                    >
                      {[
                        { label: 'Tipis (300)', value: '300' },
                        { label: 'Normal (400)', value: '400' },
                        { label: 'Medium (500)', value: '500' },
                        { label: 'Semi-Tebal (600)', value: '600' },
                        { label: 'Tebal (700)', value: '700' },
                        { label: 'Sangat Tebal (800)', value: '800' }
                      ].map((weightItem) => (
                        <option
                          key={weightItem.value}
                          value={weightItem.value}
                          style={{ fontFamily: appFont, fontWeight: weightItem.value }}
                        >
                          {weightItem.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select_font_size" className="block font-normal text-slate-700 mb-1.5 flex items-center gap-1.5 text-xs">
                      <span>📏</span> Ukuran Huruf Sistem:
                    </label>
                    <select
                      id="select_font_size"
                      value={appFontSize}
                      onChange={(e) => onUpdateFontSize && onUpdateFontSize(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      {[
                        { label: 'Sangat Kecil (12px)', value: '12px' },
                        { label: 'Kecil (13px)', value: '13px' },
                        { label: 'Normal (14px)', value: '14px' },
                        { label: 'Sedang (15px)', value: '15px' },
                        { label: 'Besar (16px)', value: '16px' },
                        { label: 'Sangat Besar (17px)', value: '17px' }
                      ].map((sizeItem) => (
                        <option
                          key={sizeItem.value}
                          value={sizeItem.value}
                        >
                          {sizeItem.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                  Mengubah seluruh font tampilan Dashboard, detail, nominal angka, tombol input, dan halaman pesanan secara merata beserta tingkat ketebalan dan ukurannya.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-950 text-white font-normal rounded-xl shadow-md transition-all cursor-pointer font-sans"
              >
                💾 Terapkan & Simpan Identitas Brand
              </button>
            </div>
          </form>

          {/* Removed User Settings & Admin User Management Cards (moved to Akun.tsx) */}
        </div>

        {/* Right Column: Channels Configuration Manager CRUD */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span>📈</span> Saluran & Komisi Omnichannel
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-800 border-indigo-200 px-2.5 py-0.5 rounded-full font-normal tracking-wider uppercase font-mono mr-1">
                  {channels.length} Aktif
                </span>
                {!showChanForm && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancelChannelEdit();
                      setShowChanForm(true);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-normal rounded-xl text-[10px] cursor-pointer transition-colors shadow-xs"
                  >
                    ➕ Tambah Saluran
                  </button>
                )}
              </div>
            </div>

            {/* Notifications */}
            {channelSuccessMsg && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl flex items-center gap-2 animate-fade-in font-normal">
                <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{channelSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-6">
              
              {/* Operational Active Channel List */}
              <div className="space-y-3">
                <span className="block font-normal text-slate-800 pb-1 border-b border-slate-50">Daftar Saluran Penjual:</span>
                
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                  {channels.map((chan) => {
                    const hasPipe = chan.color && chan.color.includes('|');
                    const [bg, text] = hasPipe ? chan.color.split('|') : ['', ''];
                    return (
                      <div key={chan.id} className="py-3 flex items-center justify-between gap-3 group">
                        <div className="min-w-0 flex items-center gap-2">
                          {hasPipe ? (
                            <span 
                              style={{ backgroundColor: bg, color: text }}
                              className="inline-block px-2.5 py-1 text-[10px] font-normal rounded-lg border border-slate-200 shadow-3xs tracking-wide uppercase"
                            >
                              {chan.name}
                            </span>
                          ) : (
                            <span className={`inline-block px-2.5 py-1 text-[10px] font-normal rounded-lg border shadow-3xs tracking-wide uppercase ${chan.color}`}>
                              {chan.name}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="text-[9px] text-slate-400 font-mono font-normal space-y-0.5">
                              <div className="flex gap-2">
                                <span>Komisi: <span className="text-slate-700 font-normal">{chan.commissionPercent}%</span></span>
                                <span>P.Fee: <span className="text-slate-700 font-normal">{chan.paymentFeePercent}%</span></span>
                              </div>
                              <div className="flex gap-2">
                                <span>Flat: <span className="text-slate-700 font-normal">{formatRp(chan.flatProcessingFee)}</span></span>
                                <span>MaxSub: <span className="text-amber-700 font-normal">{formatRp(chan.freeShippingMaxCap)}</span></span>
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
                    );
                  })}
                </div>
              </div>

              {/* Add/Edit Channel form */}
              {showChanForm && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-3xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-normal text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      {editingChanId ? '📝 Edit Skema Saluran' : '✨ Tambah Saluran Baru'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    {/* Channel Name */}
                    <div>
                      <label className="block font-normal text-slate-700 mb-0.5">Nama Saluran:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Shopee Premium, TikTok Mall, Ekspor"
                        value={chanName}
                        onChange={(e) => setChanName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Platform Commission Percent */}
                      <div>
                        <label className="block font-normal text-slate-700 mb-0.5">Biaya Komisi (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="5"
                          value={chanCommission}
                          onChange={(e) => setChanCommission(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-normal text-center text-slate-800"
                        />
                      </div>

                      {/* Payment Gateway Fee Percent */}
                      <div>
                        <label className="block font-normal text-slate-700 mb-0.5">Biaya Payment (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="2"
                          value={chanPayment}
                          onChange={(e) => setChanPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-normal text-center text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Flat processing fee */}
                      <div>
                        <label className="block font-normal text-slate-700 mb-0.5">Biaya Proses (Rp):</label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          placeholder="1000"
                          value={chanFlat}
                          onChange={(e) => setChanFlat(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-normal text-center text-slate-800"
                        />
                      </div>

                      {/* Free shipping subsidy percent */}
                      <div>
                        <label className="block font-normal text-slate-700 mb-0.5">Subsidi Ongkir (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="4"
                          value={chanShipping}
                          onChange={(e) => setChanShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-normal text-center text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Free shipping maximum limit cap */}
                    <div>
                      <label className="block font-normal text-slate-700 mb-0.5">Batas Maks Subs Ongkir (Rp):</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="10000"
                        value={chanShippingMax}
                        onChange={(e) => setChanShippingMax(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-normal text-slate-800"
                      />
                    </div>


                    {/* Payment Methods Checkboxes */}
                    <div className="py-2">
                      <label className="block font-normal text-slate-700 mb-1.5">Metode Pembayaran:</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 border border-slate-200 rounded-2xl">
                        {paymentMethods.map((m) => (
                          <label key={m} className="flex items-center gap-1.5 cursor-pointer text-slate-800 text-[11px] font-normal">
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
                      <div className="space-y-2.5 bg-white p-3 border border-slate-200 rounded-2xl">
                        <span className="block font-normal text-[10px] text-slate-500 uppercase tracking-wider">Kustom Kode Hex Warna Badge:</span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Background Color Picker & Hex Code */}
                          <div>
                            <label className="block text-[10px] font-normal text-slate-600 mb-1">Background:</label>
                            <div className="flex gap-1.5">
                              <input
                                 type="color"
                                 value={currentBg}
                                 onChange={(e) => setChanColor(`${e.target.value}|${currentText}`)}
                                 className="w-7 h-7 p-0 bg-transparent border-0 rounded-md cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                maxLength={7}
                                value={currentBg}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.startsWith('#') && val.length <= 7) {
                                    setChanColor(`${val}|${currentText}`);
                                  }
                                }}
                                placeholder="#ffffff"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-normal text-slate-850 outline-none"
                              />
                            </div>
                          </div>

                          {/* Text Color Picker & Hex Code */}
                          <div>
                            <label className="block text-[10px] font-normal text-slate-600 mb-1">Warna Huruf:</label>
                            <div className="flex gap-1.5">
                              <input
                                 type="color"
                                 value={currentText}
                                 onChange={(e) => setChanColor(`${currentBg}|${e.target.value}`)}
                                 className="w-7 h-7 p-0 bg-transparent border-0 rounded-md cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                maxLength={7}
                                value={currentText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.startsWith('#') && val.length <= 7) {
                                    setChanColor(`${currentBg}|${val}`);
                                  }
                                }}
                                placeholder="#000000"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-normal text-slate-850 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Live Preview of the Badge */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-normal text-slate-400 uppercase">Preview Badge:</span>
                          <span 
                            style={{ backgroundColor: currentBg, color: currentText }}
                            className="inline-block px-2.5 py-1 text-[10px] font-normal rounded-lg border border-slate-200 tracking-wide uppercase"
                          >
                            {chanName || 'PREVIEW'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for Form */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelChannelEdit}
                        className="flex-1 py-2 text-xs font-normal bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors cursor-pointer text-center"
                      >
                        Batal / Sembunyikan
                      </button>
                      <button
                        type="button"
                        disabled={!chanName.trim()}
                        onClick={handleSaveChannel}
                        className="flex-1 py-2 text-xs font-normal bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-colors disabled:opacity-40 cursor-pointer text-center"
                      >
                        {editingChanId ? '💾 Simpan Perubahan' : '➕ Tambah Saluran'}
                      </button>
                    </div>

                  </div>
                </div>
              )}


            </div>
          </div>
        </div>

      </div>

      {/* SECTION: automatic discounts settings */}
      <div className="w-full max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 mt-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>🏷️</span> Diskon Otomatis Produk
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedDiscounts && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                ⚠️ Ada Perubahan Draf
              </span>
            )}
            <span className="text-[10px] bg-rose-50 text-rose-800 border-rose-200 px-2 py-0.5 rounded-full font-normal tracking-wider uppercase font-mono mr-1">
              {localAutoDiscounts.length} Skema Aktif
            </span>
            {!showDiscForm && (
              <button
                type="button"
                onClick={() => {
                  setEditingDiscId(null);
                  setDiscName('');
                  setDiscType('percent');
                  setDiscValue(0);
                  setDiscSelectedChannels(['all']);
                  setDiscSelectedProducts(['all']);
                  setShowDiscForm(true);
                }}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-normal rounded-xl text-[10px] cursor-pointer transition-colors shadow-xs"
              >
                ➕ Tambah Diskon
              </button>
            )}
          </div>
        </div>

        {discountSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-2xl flex items-center gap-2 animate-fade-in font-normal text-xs">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{discountSuccessMsg}</span>
          </div>
        )}

        {hasUnsavedDiscounts && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-850 rounded-2xl flex items-center justify-between gap-3 animate-fade-in font-normal text-xs">
            <div className="flex items-center gap-2">
              <span className="animate-bounce">⚠️</span>
              <span>Anda memiliki perubahan pengaturan diskon yang belum disimpan ke database.</span>
            </div>
            <button
              onClick={handleSaveDiscountsToDatabase}
              disabled={isSavingDiscounts}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors text-xs shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {isSavingDiscounts ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Simpan Sekarang
                </>
              )}
            </button>
          </div>
        )}

        <div className="space-y-8 w-full max-w-4xl mx-auto">
          {/* Active Rules List (On Top) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>📋 Daftar Aturan Diskon Terdaftar</span>
              <span className="text-[10px] text-slate-400 font-normal uppercase font-sans">Sistem Prioritas Auto-Match</span>
            </h4>

            {localAutoDiscounts.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <span className="text-2xl block">🏷️</span>
                <p className="text-xs font-normal text-slate-500">Belum ada aturan diskon otomatis.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Gunakan form di bawah untuk membuat aturan diskon otomatis pertama Anda.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {localAutoDiscounts.map((discount, index) => {
                  return (
                    <div
                      key={discount.id}
                      className={`p-4 border rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between md:flex-row md:items-center gap-4 ${
                        discount.isActive
                          ? 'bg-white border-slate-200 shadow-3xs'
                          : 'bg-slate-50/55 border-slate-200 opacity-65'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md w-5 h-5 flex items-center justify-center border border-slate-200">
                            {index + 1}
                          </span>
                          <h5 className="font-normal text-slate-900 text-xs">
                            {discount.name}
                          </h5>
                          <span className={`text-[9px] font-normal px-1.5 py-0.2 rounded-full border uppercase leading-tight ${
                            discount.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {discount.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-normal">
                          Besar Potongan: <strong className="text-rose-600 font-normal">{discount.type === 'percent' ? `${discount.value}%` : `Rp ${discount.value.toLocaleString('id-ID')}`}</strong>
                        </div>

                        {/* Applied channels list */}
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-normal text-slate-400 block uppercase">Saluran Terpilih:</span>
                          <div className="flex flex-wrap gap-1">
                            {discount.channelIds.includes('all') ? (
                              <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-normal">Semua Saluran (Global)</span>
                            ) : (
                              discount.channelIds.map(chanId => {
                                const chan = channels.find(c => c.id === chanId);
                                return (
                                  <span key={chanId} className="text-[9px] bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-normal flex items-center gap-0.5">
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
                          <span className="text-[9.5px] font-normal text-slate-400 block uppercase">Produk Terpilih:</span>
                          <div className="flex flex-wrap gap-1">
                            {discount.productIds.includes('all') ? (
                              <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-normal">Semua Produk Master</span>
                            ) : (
                              discount.productIds.map(prodId => {
                                const prod = products.find(p => p.id === prodId);
                                return (
                                  <span key={prodId} className="text-[9px] bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
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
                            const updated = localAutoDiscounts.map(d => d.id === discount.id ? { ...d, isActive: !d.isActive } : d);
                            setLocalAutoDiscounts(updated);
                          }}
                          className={`px-3 py-1 text-[9.5px] font-normal rounded-lg border transition-all cursor-pointer ${
                            discount.isActive
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {discount.isActive ? '⛔ Nonaktifkan' : '⚡ Aktifkan'}
                        </button>

                        <div className="flex gap-1.5 w-full md:w-auto">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => {
                              if (index > 0) {
                                const newDiscounts = [...localAutoDiscounts];
                                const temp = newDiscounts[index - 1];
                                newDiscounts[index - 1] = newDiscounts[index];
                                newDiscounts[index] = temp;
                                const orderedDiscounts = newDiscounts.map((d, i) => ({ ...d, order: i }));
                                setLocalAutoDiscounts(orderedDiscounts);
                              }
                            }}
                            disabled={index === 0}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Naikkan Prioritas"
                          >
                            <ArrowUp className="h-3.5 w-3.5 mx-auto" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => {
                              if (index < localAutoDiscounts.length - 1) {
                                const newDiscounts = [...localAutoDiscounts];
                                const temp = newDiscounts[index + 1];
                                newDiscounts[index + 1] = newDiscounts[index];
                                newDiscounts[index] = temp;
                                const orderedDiscounts = newDiscounts.map((d, i) => ({ ...d, order: i }));
                                setLocalAutoDiscounts(orderedDiscounts);
                              }
                            }}
                            disabled={index === localAutoDiscounts.length - 1}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Turunkan Prioritas"
                          >
                            <ArrowDown className="h-3.5 w-3.5 mx-auto" />
                          </button>

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
                              setShowDiscForm(true);
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
                            className="flex-1 md:flex-initial p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer transition-colors"
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

            {/* Save & Confirm Button Section */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[11px] text-slate-500 font-normal">
                {hasUnsavedDiscounts ? (
                  <span className="text-amber-600 flex items-center gap-1.5 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Ada perubahan draf diskon belum disimpan!
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-505 bg-emerald-500"></span>
                    Pengaturan sinkron dengan database Firestore.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveDiscountsToDatabase}
                disabled={isSavingDiscounts}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  hasUnsavedDiscounts
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/25 active:scale-95 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isSavingDiscounts ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sedang Menyimpan ke Database...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan & Konfirmasi Aturan Diskon
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form (Below the list) */}
          {showDiscForm && (
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
                isActive: editingDiscId ? (localAutoDiscounts.find(d => d.id === editingDiscId)?.isActive ?? true) : true,
                order: editingDiscId ? (localAutoDiscounts.find(d => d.id === editingDiscId)?.order ?? localAutoDiscounts.length) : localAutoDiscounts.length
              };

              let nextDiscounts: AutoDiscount[];
              if (editingDiscId) {
                nextDiscounts = localAutoDiscounts.map(d => d.id === editingDiscId ? newDiscount : d);
                setDiscountSuccessMsg("Draf skema diskon berhasil diperbarui! Jangan lupa simpan perubahan.");
              } else {
                nextDiscounts = [...localAutoDiscounts, newDiscount];
                setDiscountSuccessMsg("Draf skema diskon baru berhasil ditambahkan! Jangan lupa simpan perubahan.");
              }
              setLocalAutoDiscounts(nextDiscounts);

              // Reset form
              setEditingDiscId(null);
              setDiscName('');
              setDiscType('percent');
              setDiscValue(0);
              setDiscSelectedChannels(['all']);
              setDiscSelectedProducts(['all']);
              setShowDiscForm(false);

              setTimeout(() => setDiscountSuccessMsg(null), 3000);
            }} className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-normal text-xs text-slate-800 uppercase tracking-wider">
              {editingDiscId ? '📝 Edit Aturan Diskon' : '✨ Buat Aturan Diskon Baru'}
            </h4>

            {/* Discount Name */}
            <div>
              <label className="block font-normal text-slate-700 mb-1 text-[11px]">Nama Pengaturan Diskon:</label>
              <input
                type="text"
                required
                placeholder="Contoh: Promo Shopee Live 10%"
                value={discName}
                onChange={(e) => setDiscName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-normal text-slate-700 mb-1 text-[11px]">Jenis Diskon:</label>
                <select
                  value={discType}
                  onChange={(e) => setDiscType(e.target.value as 'percent' | 'nominal')}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal (Rupiah)</option>
                </select>
              </div>

              <div>
                <label className="block font-normal text-slate-700 mb-1 text-[11px]">Nilai Potongan:</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={discValue || ''}
                    onChange={(e) => setDiscValue(Number(e.target.value))}
                    placeholder={discType === 'percent' ? '10' : '5000'}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-normal text-slate-400">
                    {discType === 'percent' ? '%' : 'Rp'}
                  </span>
                </div>
              </div>
            </div>

            {/* Channels Selection - interactive select badge lists */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-normal text-slate-700 text-[11px]">Diterapkan di Saluran (Kanal):</label>
                <button
                  type="button"
                  onClick={() => {
                    if (discSelectedChannels.includes('all')) {
                      setDiscSelectedChannels([]);
                    } else {
                      setDiscSelectedChannels(['all']);
                    }
                  }}
                  className={`text-[9px] font-normal uppercase px-1.5 py-0.5 rounded border transition-all ${
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
                        className={`px-2 py-1 text-[10px] font-normal rounded-lg border transition-all flex items-center gap-1 ${
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
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 text-[10px] text-emerald-800 font-normal leading-relaxed">
                  📢 Aturan diskon ini berlaku otomatis untuk <strong>Semua Saluran Penjualan</strong> yang aktif.
                </div>
              )}
            </div>

            {/* Products Selection - interactive select badge lists */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-normal text-slate-700 text-[11px]">Berlaku untuk Produk Mana Saja:</label>
                <button
                  type="button"
                  onClick={() => {
                    if (discSelectedProducts.includes('all')) {
                      setDiscSelectedProducts([]);
                    } else {
                      setDiscSelectedProducts(['all']);
                    }
                  }}
                  className={`text-[9px] font-normal uppercase px-1.5 py-0.5 rounded border transition-all ${
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
                        className={`px-2 py-1 text-[10px] font-normal rounded-lg border transition-all flex items-center gap-1.5 ${
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
                <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-2.5 text-[10px] text-indigo-800 font-normal leading-relaxed">
                  📢 Aturan diskon ini berlaku otomatis untuk <strong>Semua Jenis Produk Master</strong> yang terdaftar.
                </div>
              )}
            </div>

            {/* Actions for Form */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingDiscId(null);
                  setDiscName('');
                  setDiscType('percent');
                  setDiscValue(0);
                  setDiscSelectedChannels(['all']);
                  setDiscSelectedProducts(['all']);
                  setShowDiscForm(false);
                }}
                className="flex-1 py-2 text-xs font-normal bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-colors cursor-pointer text-center"
              >
                Batal / Sembunyikan
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-normal bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-colors cursor-pointer text-center"
              >
                {editingDiscId ? '💾 Simpan Perubahan' : '➕ Tambah Aturan Diskon'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>

      {/* SECTION: Payment Methods & PIC Operator Settings */}
      <div className="w-full max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 mt-8 space-y-6 shadow-sm">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <span>💳</span> Metode Pembayaran & PIC Operator
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Konfigurasi pilihan metode bayar dan personel pencatat (PIC) yang dapat dipilih ketika membuat pesanan baru.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Metode Pembayaran */}
          <div className="bg-slate-50/55 border border-slate-200 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                💳 Pilihan Metode Pembayaran
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {paymentMethods.length} Pilihan
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] content-start">
              {paymentMethods.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Belum ada metode pembayaran yang terdaftar.</span>
              ) : (
                paymentMethods.map((m, idx) => {
                  const isEditing = editingPaymentIndex === idx;
                  const isConfirmingDelete = confirmDeletePaymentIndex === idx;

                  if (isEditing) {
                    return (
                      <span key={idx} className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-lg p-1 text-[10px] shadow-3xs">
                        <input
                          type="text"
                          value={editingPaymentValue}
                          onChange={(e) => setEditingPaymentValue(e.target.value)}
                          className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded-md text-[10px] text-slate-800 font-medium outline-none focus:ring-1 focus:ring-emerald-500 w-24"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = editingPaymentValue.trim();
                              if (val) {
                                const updated = [...paymentMethods];
                                updated[idx] = val;
                                onUpdatePaymentMethods(updated);
                                setEditingPaymentIndex(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingPaymentIndex(null);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = editingPaymentValue.trim();
                            if (val) {
                              const updated = [...paymentMethods];
                              updated[idx] = val;
                              onUpdatePaymentMethods(updated);
                              setEditingPaymentIndex(null);
                            }
                          }}
                          className="text-emerald-600 hover:text-emerald-800 p-0.5 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPaymentIndex(null)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Batal"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  }

                  if (isConfirmingDelete) {
                    return (
                      <span key={idx} className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 text-[10px] shadow-3xs animate-pulse">
                        <span className="font-semibold text-rose-700 px-1">Hapus?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePaymentMethods(paymentMethods.filter((_, i) => i !== idx));
                            setConfirmDeletePaymentIndex(null);
                          }}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer"
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePaymentIndex(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </span>
                    );
                  }

                  return (
                    <span key={idx} className="flex items-center gap-1.5 bg-white text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-normal border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors shadow-3xs group">
                      <span className="font-medium">{m}</span>
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingPaymentIndex(idx);
                            setEditingPaymentValue(m);
                            setConfirmDeletePaymentIndex(null);
                          }} 
                          className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="h-3 w-3"/>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setConfirmDeletePaymentIndex(idx);
                            setEditingPaymentIndex(null);
                          }} 
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3"/>
                        </button>
                      </div>
                    </span>
                  );
                })
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                id="new_method_input_card"
                placeholder="Contoh: Bank BCA, Tunai, ShopeePay"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new_method_input_card') as HTMLInputElement;
                  const val = input?.value.trim();
                  if (val && !paymentMethods.includes(val)) {
                    onUpdatePaymentMethods([...paymentMethods, val]);
                    input.value = '';
                  }
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-normal rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
              >
                Tambah
              </button>
            </div>
          </div>

          {/* Card 2: PIC / Operator / Pencatat */}
          <div className="bg-slate-50/55 border border-slate-200 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                👤 Daftar PIC & Operator
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {pencatatList.length} Personel
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] content-start">
              {pencatatList.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Belum ada PIC/Pencatat yang terdaftar.</span>
              ) : (
                pencatatList.map((p, idx) => {
                  const isEditing = editingPicIndex === idx;
                  const isConfirmingDelete = confirmDeletePicIndex === idx;

                  if (isEditing) {
                    return (
                      <span key={idx} className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-lg p-1 text-[10px] shadow-3xs">
                        <input
                          type="text"
                          value={editingPicValue}
                          onChange={(e) => setEditingPicValue(e.target.value)}
                          className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded-md text-[10px] text-slate-800 font-medium outline-none focus:ring-1 focus:ring-emerald-500 w-24"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = editingPicValue.trim();
                              if (val) {
                                const updated = [...pencatatList];
                                updated[idx] = val;
                                onUpdatePencatatList(updated);
                                setEditingPicIndex(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingPicIndex(null);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = editingPicValue.trim();
                            if (val) {
                              const updated = [...pencatatList];
                              updated[idx] = val;
                              onUpdatePencatatList(updated);
                              setEditingPicIndex(null);
                            }
                          }}
                          className="text-emerald-600 hover:text-emerald-800 p-0.5 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPicIndex(null)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Batal"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  }

                  if (isConfirmingDelete) {
                    return (
                      <span key={idx} className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 text-[10px] shadow-3xs animate-pulse">
                        <span className="font-semibold text-rose-700 px-1">Hapus?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePencatatList(pencatatList.filter((_, i) => i !== idx));
                            setConfirmDeletePicIndex(null);
                          }}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer"
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePicIndex(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </span>
                    );
                  }

                  return (
                    <span key={idx} className="flex items-center gap-1.5 bg-white text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-normal border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors shadow-3xs group">
                      <span className="font-medium">{p}</span>
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingPicIndex(idx);
                            setEditingPicValue(p);
                            setConfirmDeletePicIndex(null);
                          }} 
                          className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="h-3 w-3"/>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setConfirmDeletePicIndex(idx);
                            setEditingPicIndex(null);
                          }} 
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3"/>
                        </button>
                      </div>
                    </span>
                  );
                })
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                id="new_pencatat_input_card"
                placeholder="Contoh: Admin Susi, Admin Joni"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                  const input = document.getElementById('new_pencatat_input_card') as HTMLInputElement;
                  const val = input?.value.trim();
                  if (val && !pencatatList.includes(val)) {
                    onUpdatePencatatList([...pencatatList, val]);
                    input.value = '';
                  }
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-normal rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Connection Tester Card */}
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" /> Koneksi Database Firebase
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-normal tracking-wider uppercase flex items-center gap-1 ${
              firebaseStatus === 'connected' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              firebaseStatus === 'failed' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
              firebaseStatus === 'testing' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {firebaseStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3 shrink-0 text-emerald-600" />
                  Terhubung
                </>
              ) : firebaseStatus === 'failed' ? (
                <>
                  <WifiOff className="h-3 w-3 shrink-0 text-rose-600" />
                  Gagal
                </>
              ) : firebaseStatus === 'testing' ? (
                <>
                  <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-amber-600" />
                  Menguji...
                </>
              ) : (
                'Belum Diuji'
              )}
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 font-mono text-[10px] text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Project ID:</span>
                <span className="text-slate-800 font-medium">omniorder-c5bf4</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Database Engine:</span>
                <span className="text-slate-800 font-medium">Cloud Firestore</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth Status:</span>
                <span className="text-slate-800 font-medium">Firebase Auth Ready</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Klik tombol di bawah ini untuk menguji secara langsung apakah kredensial SDK Firebase yang Anda cantumkan di berkas <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">src/firebase.ts</code> telah terhubung ke server Firebase dengan aman dan valid.
            </p>

            {firebaseStatus === 'connected' && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 rounded-2xl space-y-1 font-sans">
                <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Koneksi Firebase Berhasil!
                </p>
                <p className="text-[10px] text-emerald-700 leading-normal">
                  {firebaseError === "permission-denied" 
                    ? "Aplikasi berhasil menghubungi Firestore! Catatan: Aturan Keamanan (Security Rules) menolak akses publik (normal jika rules terkunci). Koneksi fisik valid!"
                    : "Aplikasi berhasil berkomunikasi secara langsung dengan database Firestore Anda secara real-time."}
                </p>
              </div>
            )}

            {firebaseStatus === 'failed' && (
              <div className="p-3 bg-rose-50/80 border border-rose-200/80 text-rose-800 rounded-2xl space-y-1 font-sans">
                <p className="font-bold flex items-center gap-1.5 text-xs text-rose-900">
                  <WifiOff className="h-4 w-4 text-rose-600 shrink-0" />
                  Koneksi Gagal
                </p>
                <p className="text-[10px] text-rose-700 leading-normal font-mono break-all">
                  {firebaseError}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleTestFirebase}
              disabled={firebaseStatus === 'testing'}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-medium rounded-xl shadow-3xs transition-all cursor-pointer flex items-center justify-center gap-2 font-sans disabled:opacity-50 text-xs"
            >
              {firebaseStatus === 'testing' ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                  Menguji Koneksi...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-slate-600" />
                  Uji Hubungan Database
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal for Sales Channels Limit */}
      {channelWarningMsg && createPortal(
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[100] p-4" id="channel_warning_modal">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
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
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
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

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
              Data perhitungan transaksi sebelumnya yang terkait saluran ini mungkin menggunakan skema fallback/bawaan.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteChannel(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer select-none transition-all active:scale-95"
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
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative overflow-hidden animate-scale-up text-xs">
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

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 text-[11px] leading-relaxed text-slate-500">
              Diskon ini tidak akan lagi diterapkan secara otomatis pada transaksi baru. Transaksi lama tidak akan terpengaruh.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteDiscount(null)}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer select-none transition-all active:scale-95"
              >
                Batal
              </button>
               <button
                type="button"
                onClick={() => {
                  setLocalAutoDiscounts(localAutoDiscounts.filter(d => d.id !== pendingDeleteDiscount.id));
                  setDiscountSuccessMsg(`Berhasil menghapus draf aturan diskon "${pendingDeleteDiscount.name}". Klik Simpan untuk konfirmasi ke database.`);
                  setPendingDeleteDiscount(null);
                  setTimeout(() => setDiscountSuccessMsg(null), 4000);
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
