/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { User, signOut, updateProfile, updatePassword } from 'firebase/auth';
import { CheckCircle, Info, Trash2, RefreshCw, User as UserIcon } from 'lucide-react';

interface AkunProps {
  currentUser: User | null;
  currentUserProfile: { status: 'approved' | 'pending' | 'rejected'; role: 'admin' | 'staff'; displayName?: string } | null;
}

export default function AkunComponent({
  currentUser,
  currentUserProfile
}: AkunProps) {
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
      // Also update the Firestore users doc
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { displayName: trimmed });

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

  const isAdmin = currentUserProfile?.role === 'admin' || currentUser?.email?.toLowerCase() === 'gomudastore@gmail.com';

  return (
    <div id="akun_section" className="space-y-8 animate-fade-in text-xs text-slate-700 pt-6 md:pt-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans flex items-center gap-2.5">
            <span>👤</span> Akun
          </h1>
        </div>
      </div>

      <div className="space-y-8 w-full max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* User Settings & Account Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                👤 Pengaturan Akun & Keamanan Sesi
              </h3>
            </div>

            {userSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-2xl text-[11px] font-normal flex items-center gap-2 animate-fade-in">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{userSuccessMsg}</span>
              </div>
            )}

            {userErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-[11px] font-normal flex items-center gap-2 animate-fade-in">
                <Info className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Account details readonly info */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-1.5 font-sans text-[11px]">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Email Akun:</span>
                  <span className="text-slate-800 font-medium">{currentUser?.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Hak Akses (Role):</span>
                  <span className="text-slate-800 font-bold uppercase">{currentUserProfile?.role || 'staff'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User ID (UID):</span>
                  <span className="text-slate-500 font-mono text-[9px] truncate max-w-[150px]" title={currentUser?.uid}>{currentUser?.uid}</span>
                </div>
              </div>

              {/* Form 1: Profile Name Update */}
              <form onSubmit={handleUpdateUserProfile} className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-normal text-slate-800 text-xs">Ubah Nama Profil:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    placeholder="Nama lengkap pengguna"
                    disabled={isSavingUser}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-normal rounded-xl text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>

              {/* Form 2: Password Update */}
              <form onSubmit={handleUpdateUserPassword} className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="block font-normal text-slate-800 text-xs">Ubah Kata Sandi:</label>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Kata sandi baru (min 6 karakter)"
                    disabled={isSavingUser}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    disabled={isSavingUser}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  Ganti Kata Sandi
                </button>
              </form>

              {/* Log Out Session Button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  🚪 Keluar dari Sistem
                </button>
              </div>
            </div>
          </div>

          {/* Admin User Management Card */}
          {isAdmin ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  👥 Manajemen Pengguna
                </h3>
              </div>

              {usersLoading && (
                <div className="text-center py-4 space-y-2">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-500" />
                  <p className="text-[10px] text-slate-400">Memuat daftar pengguna...</p>
                </div>
              )}

              {usersError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-[11px] font-normal">
                  {usersError}
                </div>
              )}

              {!usersLoading && !usersError && usersList.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-4">Belum ada pengguna lain yang terdaftar.</p>
              )}

              {!usersLoading && !usersError && usersList.length > 0 && (
                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/25">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider select-none">
                          <th className="px-4 py-3 font-semibold">Pengguna</th>
                          <th className="px-4 py-3 font-semibold">Peran</th>
                          <th className="px-4 py-3 font-semibold">Status Akses</th>
                          <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-xs">
                        {usersList.map((usr) => {
                          const isSelf = usr.uid === currentUser?.uid;
                          const displayName = usr.displayName || 'Tanpa Nama';
                          const initial = displayName.trim().charAt(0).toUpperCase();

                          return (
                            <tr key={usr.id} className="hover:bg-slate-50/50 transition-colors">
                              {/* User Profil */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 uppercase text-xs shrink-0 select-none">
                                    {initial || <UserIcon className="h-3.5 w-3.5 text-slate-400" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                      <span className="truncate max-w-[150px]" title={displayName}>{displayName}</span>
                                      {isSelf && (
                                        <span className="text-[8px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md font-normal font-sans shrink-0">
                                          Sesi Anda
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[180px]" title={usr.email}>
                                      {usr.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Peran (Role) */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isSelf ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                                    🛡️ ADMIN
                                  </span>
                                ) : (
                                  <select
                                    value={usr.role}
                                    onChange={(e) => handleUpdateUserRole(usr.uid, e.target.value as 'admin' | 'staff')}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] px-2 py-1 font-bold outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 w-[110px]"
                                  >
                                    <option value="admin">🛡️ Admin</option>
                                    <option value="staff">👤 Staff</option>
                                  </select>
                                )}
                              </td>

                              {/* Status Akses */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isSelf ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                    ● Aktif
                                  </span>
                                ) : (
                                  <select
                                    value={usr.status}
                                    onChange={(e) => handleUpdateUserStatus(usr.uid, e.target.value as 'approved' | 'pending' | 'rejected')}
                                    className={`border text-[10px] rounded-lg px-2 py-1 font-bold outline-none cursor-pointer focus:ring-1 w-[110px] ${
                                      usr.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400'
                                        : usr.status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400 animate-pulse'
                                        : 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400'
                                    }`}
                                  >
                                    <option value="approved">● Aktif</option>
                                    <option value="pending">⏳ Menunggu</option>
                                    <option value="rejected">✕ Ditolak</option>
                                  </select>
                                )}
                              </td>

                              {/* Aksi & Kontrol */}
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {isSelf ? (
                                  <span className="text-[10px] text-slate-400 italic font-normal px-2">Tidak ada aksi</span>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Delete authorization */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUserDoc(usr.uid)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 text-[10px]"
                                      title="Hapus Hak Akses Pengguna"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline font-semibold">Hapus Akses</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col items-center justify-center text-center py-12">
              <span className="text-3xl">🔒</span>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mt-2">Izin Manajemen Pengguna Terbatas</h4>
              <p className="text-[10.5px] text-slate-400 max-w-xs">Hanya pengguna dengan peran <strong>Administrator</strong> yang memiliki hak akses untuk menyetujui, menolak, atau mengubah perizinan staff lain.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
