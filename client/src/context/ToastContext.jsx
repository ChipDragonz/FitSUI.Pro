import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info, Sparkles, Trophy, Star, Zap } from 'lucide-react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const RARITY_THEMES = {
  0: { label: "COMMON", color: "text-gray-400", border: "border-gray-500/50", glow: "shadow-gray-500/20", bg: "from-gray-500/20" },
  1: { label: "RARE", color: "text-blue-400", border: "border-blue-500/50", glow: "shadow-blue-500/40", bg: "from-blue-500/20" },
  2: { label: "EPIC", color: "text-purple-500", border: "border-purple-500/50", glow: "shadow-purple-500/60", bg: "from-purple-500/20" },
  3: { label: "LEGENDARY", color: "text-yellow-400", border: "border-yellow-500/50", glow: "shadow-yellow-400/80", bg: "from-yellow-400/20" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [activeLoot, setActiveLoot] = useState(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ✅ ĐÃ SỬA: Hàm showLoot nhận đầy đủ 3 tham số quan trọng
  const showLoot = (rarity, itemName, imageUrl) => {
    setActiveLoot({ rarity, itemName, imageUrl });
  };

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    showLoot: showLoot,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* 1. Hệ thống Toast thông báo XP ở góc phải */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* 2. ✅ BẢNG LOOT OVERLAY SIÊU TO Ở GIỮA */}
      <AnimatePresence>
        {activeLoot && (
          <LootOverlay 
            item={activeLoot} 
            onClose={() => setActiveLoot(null)} 
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

const LootOverlay = ({ item, onClose }) => {
  const theme = RARITY_THEMES[item.rarity] || RARITY_THEMES[0];
  
  // ✅ Áp dụng đúng chỉ số từ Smart Contract Move
  const STRENGTH_BONUS = {
    0: "+2",  // COMMON
    1: "+3",  // RARE
    2: "+5",  // EPIC
    3: "+10", // LEGENDARY
  }[item.rarity] || "+0";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative max-w-[320px] w-full bg-slate-900 border-2 ${theme.border} rounded-[2.5rem] p-8 text-center shadow-2xl overflow-hidden`}
      >
        <div className="mb-4 flex justify-center">
          <Trophy size={48} className={`${theme.color} drop-shadow-lg`} />
        </div>

        {/* --- KHUNG ẢNH VẬT PHẨM --- */}
        <div className="relative w-40 h-40 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-white/10 bg-black/60 shadow-inner">
           <img 
             src={item.imageUrl} 
             alt={item.itemName} 
             className="w-full h-full object-cover p-2" 
             onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=NFT+Item"; }}
           />
           
           {/* ✅ BADGE CỘNG SỨC MẠNH (Góc dưới bên phải) */}
           <motion.div 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="absolute bottom-2 right-2 px-3 py-1 rounded-lg border border-white/20 bg-slate-900/90 backdrop-blur-md shadow-lg flex items-center gap-1.5"
           >
             <Zap size={12} className="text-yellow-400 fill-yellow-400" />
             <span className="text-white font-black text-xs tracking-tighter italic">
               {STRENGTH_BONUS} STR
             </span>
           </motion.div>

           <motion.div 
             animate={{ x: ['-100%', '200%'] }} 
             transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
             className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" 
           />
        </div>

        <div className="space-y-1 mb-6 text-center">
          <span className={`text-[9px] font-black tracking-[0.3em] uppercase opacity-70 ${theme.color}`}>
            {theme.label} DISCOVERED
          </span>
          <h1 className="text-white text-2xl font-black italic tracking-tighter uppercase leading-tight">
            {item.itemName}
          </h1>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-white text-slate-950 hover:scale-105 active:scale-95"
        >
          COLLECT REWARD
        </button>

        <Star className={`absolute top-6 left-6 opacity-20 ${theme.color}`} size={16} fill="currentColor" />
        <Sparkles className={`absolute bottom-10 right-6 opacity-20 ${theme.color}`} size={16} />
      </motion.div>
    </div>
  );
};

const ToastItem = ({ message, type, onClose }) => {
  const configs = {
    success: { icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/50', bg: 'from-green-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', border: 'border-red-500/50', bg: 'from-red-500/10' },
    info: { icon: Info, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'from-blue-500/10' },
  };
  const config = configs[type] || configs.info;
  const Icon = config.icon;
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} layout
      className={`pointer-events-auto w-80 p-4 rounded-xl border ${config.border} bg-gradient-to-r ${config.bg} to-slate-900/90 backdrop-blur-xl flex items-start gap-3 relative overflow-hidden`}
    >
      <div className={`mt-0.5 ${config.color}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1"><p className="text-white text-sm font-medium">{message}</p></div>
      <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
      <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 4 }} className={`absolute bottom-0 left-0 h-0.5 ${config.color.replace('text-', 'bg-')}`} />
    </motion.div>
  );
};