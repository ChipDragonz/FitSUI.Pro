import React from 'react';
import { ChevronDown, UserPlus } from 'lucide-react';

const HeroSelector = ({ heroes, selectedId, onSelect, onMint }) => {
  
  // Trường hợp chưa có Hero
  if (heroes.length === 0) {
    return (
      <div className="text-center p-8 bg-white/5 rounded-2xl border border-dashed border-white/20 backdrop-blur-sm">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Chưa có nhân vật</h3>
        <p className="text-gray-400 text-sm mb-6">Tạo ngay một chiến binh để bắt đầu hành trình!</p>
        <button 
          onClick={onMint}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          + MINT HERO MIỄN PHÍ
        </button>
      </div>
    );
  }

  // Trường hợp đã có Hero -> Dropdown đẹp
  return (
    <div className="relative mb-6">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
        Chọn nhân vật
      </label>
      <div className="relative">
        <select 
          value={selectedId} 
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-black/40 border border-white/10 text-white pl-4 pr-10 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer font-bold transition-all hover:bg-black/60"
        >
          {heroes.map((h) => (
            <option key={h.data.objectId} value={h.data.objectId} className="bg-gray-900 text-white">
              {h.data.content.fields.name} (Lv.{h.data.content.fields.level})
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      
      {/* Nút Mint nhỏ bên dưới nếu muốn mint thêm */}
      <button 
        onClick={onMint}
        className="mt-4 w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" /> Mint thêm Hero khác
      </button>
    </div>
  );
};

export default HeroSelector;