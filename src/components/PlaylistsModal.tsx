import React, { useState } from 'react';
import {
  ListVideo,
  Plus,
  Trash2,
  CheckCircle2,
  Globe,
  User,
  KeyRound,
  Tag,
  X,
  Link,
  ShieldCheck,
  Server,
  FileText,
  Pencil
} from 'lucide-react';
import { PlaylistType, XtreamCredentials } from '../types';
import { StorageService } from '../services/storage';
import { XtreamApiClient } from '../services/xtreamApi';

interface PlaylistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlaylist: (cred: XtreamCredentials) => void;
  activePlaylistId: string | null;
}

export const PlaylistsModal: React.FC<PlaylistsModalProps> = ({
  isOpen,
  onClose,
  onSelectPlaylist,
  activePlaylistId,
}) => {
  const [playlists, setPlaylists] = useState<XtreamCredentials[]>(() =>
    StorageService.getSavedCredentials()
  );
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<PlaylistType>('xtream');

  // Form Fields
  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    resetForm();
    setEditingId(null);
    setLoginType('xtream');
    setIsAddingNew(true);
  };

  const handleStartEdit = (e: React.MouseEvent, p: XtreamCredentials) => {
    e.stopPropagation();
    const isM3u = p.type === 'm3u' || (!p.username && !p.password);
    setEditingId(p.id || null);
    setLoginType(isM3u ? 'm3u' : 'xtream');
    setName(p.name || '');
    setServerUrl(p.serverUrl || '');
    setUsername(p.username || '');
    setPassword(p.password || '');
    setM3uUrl(p.m3uUrl || p.serverUrl || '');
    setErrorMsg('');
    setIsAddingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (loginType === 'xtream') {
      if (!serverUrl.trim() || !username.trim() || !password.trim()) {
        setErrorMsg('Lütfen Sunucu Adresi, Kullanıcı Adı ve Şifre alanlarını doldurun.');
        return;
      }

      const updatedCred: XtreamCredentials = {
        id: editingId || undefined,
        name: name.trim() || `Xtream (${username.trim()})`,
        type: 'xtream',
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password: password.trim(),
      };

      const saved = StorageService.saveCredential(updatedCred);
      setPlaylists(StorageService.getSavedCredentials());
      setIsAddingNew(false);
      resetForm();
      onSelectPlaylist(saved);
    } else {
      // 2. Seçenek: Kullanıcı adı ve şifresiz (M3U URL)
      if (!m3uUrl.trim()) {
        setErrorMsg('Lütfen M3U Çalma Listesi bağlantı adresini (URL) girin.');
        return;
      }

      // If M3U URL actually has embedded Xtream parameters, parse them automatically
      const extracted = XtreamApiClient.extractXtreamFromUrl(m3uUrl.trim());
      
      const updatedCred: XtreamCredentials = {
        id: editingId || undefined,
        name: name.trim() || 'M3U Çalma Listesi',
        type: extracted ? 'xtream' : 'm3u',
        serverUrl: extracted ? extracted.serverUrl : m3uUrl.trim(),
        username: extracted ? extracted.username : '',
        password: extracted ? extracted.password : '',
        m3uUrl: m3uUrl.trim(),
      };

      const saved = StorageService.saveCredential(updatedCred);
      setPlaylists(StorageService.getSavedCredentials());
      setIsAddingNew(false);
      resetForm();
      onSelectPlaylist(saved);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setServerUrl('');
    setUsername('');
    setPassword('');
    setM3uUrl('');
    setErrorMsg('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bu IPTV hesabını ve bu hesaba ait izleme geçmişini tamamen silmek istediğinize emin misiniz?')) {
      StorageService.removeCredential(id);
      const remaining = StorageService.getSavedCredentials();
      setPlaylists(remaining);
      if (activePlaylistId === id) {
        if (remaining.length > 0) {
          onSelectPlaylist(remaining[0]);
        } else {
          StorageService.clearAllResumePositions();
          window.location.reload();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn select-none">
      <div className="glass-modal max-w-xl w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Başlık Barı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ListVideo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isAddingNew
                  ? (editingId ? 'Hesap / Liste Bilgilerini Düzenle' : 'Yeni Çalma Listesi Ekle')
                  : 'Çalma Listeleri & Hesaplar'}
              </h2>
              <p className="text-xs text-gray-400">
                {isAddingNew
                  ? (editingId ? 'Sunucu URL, kullanıcı adı veya şifrenizi güncelleyin' : 'Kullanıcı adı/şifreli veya şifresiz M3U bağlantısı ekleyin')
                  : 'Kayıtlı profillerinizi yönetin, düzenleyin veya yenisini ekleyin'}
              </p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {!isAddingNew ? (
            <>
              {/* Kayıtlı Listeler */}
              <div className="space-y-2.5">
                {playlists.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 flex flex-col items-center">
                    <Server className="w-12 h-12 text-gray-600 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-bold text-white mb-1">Kayıtlı Çalma Listesi Yok</p>
                    <p className="text-xs text-gray-400 max-w-xs text-center">
                      İster kullanıcı adı ve şifrenizle, isterseniz şifresiz tek bir M3U linki ile listenizi ekleyebilirsiniz.
                    </p>
                  </div>
                ) : (
                  playlists.map((p) => {
                    const isActive = activePlaylistId === p.id;
                    const isM3u = p.type === 'm3u' || (!p.username && !p.password);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPlaylist(p);
                          onClose();
                        }}
                        className={`p-4 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                          isActive
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-white shadow-md'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isM3u ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {isM3u ? <Link className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                          </div>
                          <div className="truncate flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-white truncate">{p.name}</p>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                isM3u ? 'bg-purple-500/30 text-purple-300' : 'bg-cyan-500/30 text-cyan-300'
                              }`}>
                                {isM3u ? 'Şifresiz M3U' : 'Xtream API'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                              {p.m3uUrl || p.serverUrl}
                            </p>
                            {!isM3u && p.username && (
                              <p className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
                                Kullanıcı: {p.username}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0 ml-3">
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/30 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 flex items-center space-x-1 mr-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </span>
                          )}

                          {/* Düzenle Butonu */}
                          <button
                            onClick={(e) => handleStartEdit(e, p)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                            title="Hesap Bilgilerini Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Sil Butonu */}
                          <button
                            onClick={(e) => handleDelete(e, p.id || '')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Hesabı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Aksiyon Butonu */}
              <div className="pt-2">
                <button
                  onClick={handleStartAdd}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Çalma Listesi / Hesap Ekle</span>
                </button>
              </div>
            </>
          ) : (
            /* 2 Seçenekli Liste Ekleme & Düzenleme Ekranı */
            <div className="space-y-4">
              
              {/* Giriş Yöntemi Seçim Sekmeleri (2 Seçenek) */}
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginType('xtream')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                    loginType === 'xtream'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>1. Kullanıcı Adı & Şifreli</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginType('m3u')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                    loginType === 'm3u'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  <span>2. Şifresiz M3U Linki</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Çalma Listesi / Hesap Adı:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ev IPTV, Spor Paketi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                {/* 1. SEÇENEK: XTREAM CODES API */}
                {loginType === 'xtream' ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sunucu URL'si (.xyz:80 formatında):</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="http://sunucuadresi.xyz:80"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Kullanıcı Adı:</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="kullanici_adi"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Şifre:</span>
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* 2. SEÇENEK: ŞİFRESİZ M3U LINKI */
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1.5">
                        <Link className="w-3.5 h-3.5 text-purple-400" />
                        <span>M3U / M3U8 Çalma Listesi Bağlantı Linki (URL):</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="https://iptv-org.github.io/iptv/countries/tr.m3u veya playlist linki"
                        value={m3uUrl}
                        onChange={(e) => setM3uUrl(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                      />
                    </div>

                    {/* Hızlı Test Örnekleri */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                        Test İçin Çalışan Örnek Listeler (Tek Tıkla Doldur):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setName('Türkiye Ulusal & Tematik Kanallar');
                            setM3uUrl('https://iptv-org.github.io/iptv/countries/tr.m3u');
                          }}
                          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 text-[11px] font-bold text-left transition-all flex items-center space-x-1.5"
                        >
                          <span>🇹🇷</span>
                          <span className="truncate">Türkiye Kanalları (100+)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setName('Dünya Haber Kanalları');
                            setM3uUrl('https://iptv-org.github.io/iptv/categories/news.m3u');
                          }}
                          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-200 text-[11px] font-bold text-left transition-all flex items-center space-x-1.5"
                        >
                          <span>🌍</span>
                          <span className="truncate">Dünya Haber Kanalları</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setName('Örnek Film & Dizi Arşivi (VOD Test)');
                            setM3uUrl('http://localhost:5173/demo_vod.m3u');
                          }}
                          className="col-span-2 p-2 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-pink-200 text-[11px] font-bold text-left transition-all flex items-center space-x-1.5 shadow-sm"
                        >
                          <span>🎬</span>
                          <span className="truncate">Örnek Film & Dizi Arşivi (Kaldığı Yerden Devam Etme Testi)</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[11px] text-purple-300">
                      ℹ️ <strong>Şifresiz Giriş:</strong> Bu seçenekte kullanıcı adı ve şifre girmenize gerek yoktur. M3U linki girdiğinizde tüm canlı kanallar, filmler ve diziler otomatik olarak yüklenecektir.
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
                  >
                    {editingId ? 'Değişiklikleri Kaydet ve Bağlan' : 'Çalma Listesini Yükle ve Başlat'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      resetForm();
                    }}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-semibold text-xs transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
