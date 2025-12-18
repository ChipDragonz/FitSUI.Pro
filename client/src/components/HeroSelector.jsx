import React, { useState, useEffect } from 'react';
import { ChevronDown, UserPlus, Clock } from 'lucide-react';

const HeroSelector = ({ heroes, selectedId, onSelect, onMint, nextMintTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Logic đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (nextMintTime > now) {
        setIsLocked(true);
        const diff = nextMintTime - now;
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Format số đẹp (01, 02...)
        const f = (n) => n.toString().padStart(2, '0');
        setTimeLeft(`${f(h)}:${f(m)}:${f(s)}`);
      } else {
        setIsLocked(false);
        setTimeLeft('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextMintTime]);

  return (
    <div className="space-y-4">
      {/* DROPDOWN CHỌN HERO */}
      <div className="relative group">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
          SELECT HERO
        </label>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full appearance-none bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 pr-10 font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {heroes.map((h) => (
              <option key={h.data.objectId} value={h.data.objectId} className="bg-slate-900">
                {h.data.content.fields.name} (Lv.{h.data.content.fields.level})
              </option>
            ))}
            {heroes.length === 0 && <option>Chưa có Hero nào</option>}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- LOGIC HIỂN THỊ NÚT MINT / COUNTDOWN --- */}
<div className="w-full mt-4">
  {nextMintTime > Date.now() ? (
    /* 1. TRẠNG THÁI ĐANG ĐỢI (COOLDOWN) */
    <div className="flex flex-col items-center justify-center p-5 bg-white/5 border border-white/10 rounded-2xl cursor-not-allowed group relative overflow-hidden">
      {/* Hiệu ứng tia sáng quét ngang nhẹ nhàng khi đang hồi */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <span className="text-[10px] font-black tracking-[0.4em] text-lime-500/60 uppercase mb-1 animate-pulse">
        Next Mint In
      </span>
      
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white italic tracking-tighter">
          {/* Tính số giờ còn lại */}
          {Math.floor((nextMintTime - Date.now()) / 3600000)}
        </span>
        <span className="text-xs font-bold text-gray-500 uppercase">Hours</span>
        
        <span className="text-2xl font-black text-white italic tracking-tighter ml-2">
          {/* Tính số phút còn lại */}
          {Math.floor(((nextMintTime - Date.now()) % 3600000) / 60000)}
        </span>
        <span className="text-xs font-bold text-gray-500 uppercase">Min</span>
      </div>
      
      <p className="text-[9px] text-gray-600 font-bold uppercase mt-2 tracking-widest">
        Stamina recovering...
      </p>
    </div>
  ) : (
    /* 2. TRẠNG THÁI SẴN SÀNG MINT (TOXIC BUTTON) */
    <button 
      onClick={onMint}
      className="w-full bg-gradient-to-r from-lime-400 to-emerald-600 p-4 rounded-2xl text-slate-950 font-black text-lg uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)]"
    >
      Mint New Fighter
    </button>
  )}
</div>
    </div>
  );
};

export default HeroSelector;