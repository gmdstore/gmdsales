import React, { useState } from 'react';
import { 
  auth 
} from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Error translators for Indonesian language
  const translateError = (code: string, message: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email atau kata sandi salah. Harap periksa kembali.';
      case 'auth/email-already-in-use':
        return 'Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk.';
      case 'auth/weak-password':
        return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
      case 'auth/missing-password':
        return 'Kata sandi wajib diisi.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi nanti.';
      default:
        return message || 'Terjadi kesalahan sistem. Silakan coba lagi.';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Harap isi semua kolom email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setErrorMsg(translateError(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !password || !confirmPassword || !trimmedName) {
      setErrorMsg('Semua kolom wajib diisi untuk pendaftaran.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      // Update display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: trimmedName
        });
      }
      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke Dashboard...');
    } catch (err: any) {
      console.error("Sign-up error:", err);
      setErrorMsg(translateError(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Harap masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('Tautan pengaturan ulang sandi telah dikirim ke email Anda. Periksa kotak masuk atau spam.');
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMsg(translateError(err.code, err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[10000ms]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10"
      >
        
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner text-2xl">
            📦
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            OmniOrder Platform
          </h1>
          <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-xs mx-auto">
            Sistem Pencatatan Transaksi & Manajemen Stok Multikanal Terintegrasi
          </p>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs font-normal"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-355 text-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs font-normal animate-fade-in"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-450 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms Switcher */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@omniorder.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-normal text-slate-300">Kata Sandi</label>
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  tabIndex={-1}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:scale-100 select-none"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Masuk ke Akun
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-4 text-center border-t border-slate-800/60">
              <p className="text-xs text-slate-400">
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setMode('signup');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  Daftar Pengguna Baru
                </button>
              </p>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Nama Lengkap</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Kata Sandi (Min 6 Karakter)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Buat kata sandi baru"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-indigo-500 hover:bg-indigo-600 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:scale-100 select-none"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Daftar Sekarang
                </>
              )}
            </button>

            <div className="pt-4 text-center border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('signin');
                }}
                className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                Sudah memiliki akun? <span className="text-emerald-400 font-medium">Masuk Disini</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-1.5 text-center">
              <span className="text-2xl block">🔑</span>
              <h3 className="text-xs font-bold text-slate-200">Lupa Kata Sandi?</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Ketik email Anda di bawah. Kami akan mengirimkan tautan untuk menyetel ulang kata sandi Anda.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-normal text-slate-300">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/85 border border-slate-800 rounded-2xl text-slate-200 text-xs font-normal focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                  Mengirim...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Kirim Tautan Atur Ulang
                </>
              )}
            </button>

            <div className="pt-4 text-center border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('signin');
                }}
                className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                Kembali ke <span className="text-emerald-400 font-medium">Halaman Masuk</span>
              </button>
            </div>
          </form>
        )}

      </motion.div>
    </div>
  );
}
