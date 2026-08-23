import React from 'react';
import {
  User,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  Server,
  X
} from 'lucide-react';
import { ServerInfo, UserInfo } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: UserInfo | null;
  serverInfo: ServerInfo | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userInfo,
  serverInfo,
}) => {
  if (!isOpen) return null;

  const formatExpDate = () => {
    if (!userInfo?.exp_date) return 'Sınırsız';
    const timestamp = parseInt(userInfo.exp_date, 10);
    if (isNaN(timestamp) || timestamp <= 0) return 'Sınırsız';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getRemainingDays = () => {
    if (!userInfo?.exp_date) return 'Sınırsız';
    const timestamp = parseInt(userInfo.exp_date, 10);
    if (isNaN(timestamp) || timestamp <= 0) return 'Sınırsız';
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    if (diff <= 0) return 'Süresi Doldu';
    const days = Math.ceil(diff / (24 * 3600));
    return `${days} Gün Kaldı`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn select-none">
      <div className="glass-modal max-w-lg w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hesap & Abonelik Bilgileri</h2>
              <p className="text-xs text-gray-400">Aktif IPTV kullanıcı ve paket detayları</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Kullanıcı Adı */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Kullanıcı Adı</span>
              <p className="text-xs font-bold text-white truncate">{userInfo?.username || '-'}</p>
            </div>

            {/* Durum */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Hesap Durumu</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>{userInfo?.status === 'Active' ? 'Aktif' : userInfo?.status || 'Aktif'}</span>
              </span>
            </div>

            {/* Bitiş Tarihi */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Abonelik Bitiş</span>
              <p className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatExpDate()}</span>
              </p>
            </div>

            {/* Kalan Süre */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Kalan Süre</span>
              <p className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{getRemainingDays()}</span>
              </p>
            </div>

            {/* Eşzamanlı Bağlantı Limiti */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Bağlantı Limiti</span>
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {userInfo?.active_cons || '1'} / {userInfo?.max_connections || '1'} Cihaz
                </span>
              </p>
            </div>

            {/* Sunucu Protokolü */}
            <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-gray-400 block mb-1">Sunucu Saati</span>
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-yellow-400" />
                <span>{serverInfo?.timezone || 'Europe/Istanbul'}</span>
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
