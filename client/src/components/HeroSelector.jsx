import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

/**
 * @param heroes: Danh sách Hero NFT
 * @param selectedId: ID Hero đang chọn
 * @param onSelect: Hàm xử lý khi chọn Hero khác
 * @param onMint: Hàm gọi giao dịch Mint
 * @param nextMintTime: Mốc thời gian (ms) được Mint tiếp theo
 * @param showMint: Toggle ẩn/hiện phần Mint (mặc định là true)
 */
const HeroSelector = ({ heroes, selectedId, onSelect, onMint, nextMintTime, showMint = true }) => { 
  // 1. STATE ĐỂ QUẢN LÝ ĐẾM NGƯỢC CHI TIẾT
  const [countdown, setCountdown] = useState({
    hours: 0,
    mins: 0,
    secs: 0,
    isReady: false
  });

  // 2. EFFECT CHẠY BỘ ĐẾM MỖI GIÂY
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = nextMintTime - now;

      if (diff <= 0) {
        setCountdown({ hours: 0, mins: 0, secs: 0, isReady: true });
      } else {
        setCountdown({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000), // ✅ THÊM GIÂY Ở ĐÂY
          isReady: false
        });
      }
    };

    // Chạy lần đầu và thiết lập interval
    updateTimer();
    const timer = setInterval(updateTimer, 1000); 

    return () => clearInterval(timer);
  }, [nextMintTime]);

  // Hàm format số (thêm số 0 phía trước)
  const f = (n) => n.toString().padStart(2, '0');

  return (
    <div className="space-y-6">
      {/* --- PHẦN 1: HEADER --- */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-lime-500 uppercase tracking-[0.2em]">Active Squad</p>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            Select <span className="text-white/40">Hero</span>
          </h3>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{heroes.length} Total</span>
        </div>
      </div>

      {/* --- PHẦN 2: DROPDOWN CHỌN HERO --- */}
      <div className="relative group">
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-[#0f172a]/40 border border-white/10 text-white rounded-xl px-5 py-4 pr-12 font-bold text-sm focus:outline-none focus:border-lime-500/50 transition-all cursor-pointer hover:bg-slate-900/60"
        >
          {heroes.map((h) => (
            <option key={h.data.objectId} value={h.data.objectId} className="bg-slate-900">
              {h.data.content.fields.name} (LV.{h.data.content.fields.level})
            </option>
          ))}
          {heroes.length === 0 && <option>No Heroes Available</option>}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lime-500 group-hover:scale-110 transition-transform">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* --- PHẦN 3: MINT SECTION (Fix lỗi 0 Hours 0 Min) --- */}
      {showMint && (
        <div className="w-full mt-4">
          {!countdown.isReady ? (
            /* ⏳ TRẠNG THÁI ĐANG ĐẾM NGƯỢC (COOLDOWN) */
            <div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-white/5 rounded-2xl cursor-not-allowed group relative overflow-hidden transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="text-[10px] font-black tracking-[0.4em] text-lime-500/60 uppercase mb-3 animate-pulse">
                Next Mint In
              </span>
              
              <div className="flex items-center gap-3">
                {/* Giờ (Chỉ hiện nếu có) */}
                {countdown.hours > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{f(countdown.hours)}</p>
                    <p className="text-[8px] text-gray-600 font-black uppercase mt-1">Hrs</p>
                  </div>
                )}

                {/* Phút */}
                <div className="text-center">
                  <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{f(countdown.mins)}</p>
                  <p className="text-[8px] text-gray-600 font-black uppercase mt-1">Min</p>
                </div>

                <span className="text-2xl font-black text-white/20 -translate-y-2">:</span>

                {/* ✅ GIÂY: Sẽ giúp ní thấy bộ đếm đang thực sự chạy */}
                <div className="text-center">
                  <p className="text-3xl font-black text-lime-400 italic tracking-tighter leading-none">{f(countdown.secs)}</p>
                  <p className="text-[8px] text-lime-500/40 font-black uppercase mt-1">Sec</p>
                </div>
              </div>

              <p className="text-[9px] text-gray-600 font-bold uppercase mt-4 tracking-widest opacity-50">
                Genetic Matrix Stabilizing...
              </p>
            </div>
          ) : (
            /* 🚀 TRẠNG THÁI SẴN SÀNG MINT */
            <button 
              onClick={onMint}
              className="w-full bg-gradient-to-r from-lime-400 to-emerald-600 p-5 rounded-2xl text-slate-950 font-black text-lg uppercase tracking-tighter hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-spin" />
              Summon New Hero
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HeroSelector;