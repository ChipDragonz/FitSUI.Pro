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
          Chọn nhân vật
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

      {/* NÚT MINT HOẶC ĐỒNG HỒ ĐẾM NGƯỢC */}
      <button
        onClick={onMint}
        disabled={isLocked}
        className={`
          w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
          ${isLocked 
            ? 'bg-slate-800/50 text-gray-400 border border-white/5 cursor-not-allowed' 
            : 'bg-white/5 hover:bg-white/10 text-blue-400 border border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
        `}
      >
        {isLocked ? (
          <>
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Hồi chiêu: <span className="text-white font-mono">{timeLeft}</span></span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Mint thêm Hero khác</span>
          </>
        )}
      </button>
    </div>
  );
};

export default HeroSelector;