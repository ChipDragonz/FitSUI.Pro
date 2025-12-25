import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, Zap, Info } from 'lucide-react';
// ✅ 1. IMPORT HERO AVATAR
import HeroAvatar from './HeroAvatar';

const FusionZone = ({ heroes, onFuse, isProcessing, allHeroesEquipment = {} }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const ELEMENT_MAP = {
    0: { label: "METAL", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/5" },
    1: { label: "WOOD", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
    2: { label: "WATER", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/5" },
    3: { label: "FIRE", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/5" },
    4: { label: "EARTH", color: "text-orange-700", border: "border-orange-900/30", bg: "bg-orange-900/5" }
  };

  const groupedHeroes = heroes.reduce((acc, hero) => {
    const element = hero.data.content?.fields?.element || 0;
    if (!acc[element]) acc[element] = [];
    acc[element].push(hero);
    return acc;
  }, {});

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedHeroes = heroes.filter(h => selectedIds.includes(h.data.objectId));
  
  const canFuse = selectedIds.length === 3 && 
    selectedHeroes.every(h => h.data.content.fields.level === selectedHeroes[0].data.content.fields.level) &&
    selectedHeroes.every(h => h.data.content.fields.element === selectedHeroes[0].data.content.fields.element);

  return (
    <div className="space-y-16 animate-fade-in pb-32">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">
          Evolution <span className="text-lime-400">Lab</span>
        </h2>
        <div className="flex items-center justify-center gap-2 opacity-40">
           <Info size={12} className="text-lime-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select 3 identical heroes to evolve</p>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(ELEMENT_MAP).map(([elementId, config]) => {
          const heroesInGroup = groupedHeroes[elementId] || [];
          if (heroesInGroup.length === 0) return null;

          return (
            <div key={elementId} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-black tracking-[0.3em] ${config.color}`}>{config.label} CLASS</span>
                  <span className="text-[10px] font-bold text-gray-600">({heroesInGroup.length})</span>
                </div>
                <div className="h-[1px] flex-1 bg-white/5 shadow-[0_1px_0_rgba(255,255,255,0.02)]"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-2">
                {heroesInGroup.map((hero) => {
                  const heroId = hero.data.objectId;
                  // ✅ 2. LẤY DATA TRANG BỊ CHO TỪNG CON
                  // Nếu dApp của ní chưa lưu mapping này, ní cần sync nó ở App.jsx
                  const heroEquipment = allHeroesEquipment[heroId] || { 
                    body: hero.data.content.fields.url 
                  };

                  return (
                    <motion.div 
                      key={heroId}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSelect(heroId)}
                      className={`relative cursor-pointer p-3 rounded-2xl border transition-all duration-500 ${
                        selectedIds.includes(heroId) 
                          ? 'border-lime-500 bg-lime-500/10 shadow-[0_0_30px_rgba(163,230,53,0.3)]' 
                          : `border-white/5 bg-slate-900/40 hover:border-white/20`
                      }`}
                    >
                      {/* ✅ 3. THAY THẾ <IMG> BẰNG <HEROAVATAR> */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/60 mb-3 border border-white/5 flex items-center justify-center">
                        <div className="w-[110%] h-[110%]"> {/* Scale nhẹ để Hero hiện rõ hơn trong ô nhỏ */}
                          <HeroAvatar equipment={heroEquipment} />
                        </div>
                        <div className="absolute top-2 right-2 z-50 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-lime-400 border border-white/10">
                          LVL {hero.data.content.fields.level}
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <p className="font-bold text-[10px] truncate text-gray-200 uppercase tracking-tighter">
                          {hero.data.content.fields.name}
                        </p>
                        <span className="text-[9px] font-black text-white/30 italic">#{hero.data.content.fields.number}</span>
                      </div>
                      
                      {selectedIds.includes(heroId) && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center shadow-lg z-50">
                          <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- FUSION CONTROL BAR --- */}
      <div className="max-w-xl mx-auto pt-10">
        <div className="bg-slate-950/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-lime-500/5 to-transparent pointer-events-none"></div>
          <div className="text-center space-y-1 relative z-10">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em] block mb-2">Selection Status</span>
            <div className="flex items-center justify-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${selectedIds.length === 3 ? 'bg-lime-500 shadow-[0_0_15px_#a3e635]' : 'bg-gray-800'}`}></div>
              <span className="text-2xl font-black text-white italic tracking-tighter uppercase">
                {selectedIds.length} / 3 <span className="text-white/20">Heroes</span>
              </span>
            </div>
          </div>

          <button
            disabled={!canFuse || isProcessing}
            onClick={() => onFuse(selectedIds)}
            className="relative group/btn active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
          >
            {canFuse && (
              <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-2xl blur-2xl opacity-70 group-hover/btn:opacity-100 transition duration-500 animate-pulse"></div>
            )}
            <div className="relative bg-[#111827] border border-white/10 px-16 py-6 rounded-2xl flex items-center gap-4 min-w-[360px] justify-center shadow-inner hover:bg-[#1a1f2e] transition-colors">
              <span className="text-xl font-black text-gray-400 group-hover/btn:text-white uppercase tracking-tighter italic transition-colors">
                {isProcessing ? "Evolving..." : canFuse ? "⚡ START EVOLUTION" : "SELECT 3 IDENTICAL HEROES"}
              </span>
              {canFuse && <Sparkles className="text-lime-400 w-6 h-6 animate-spin-slow" />}
            </div>
          </button>

          {!canFuse && selectedIds.length === 3 && (
            <div className="flex items-center gap-2 text-red-500 animate-fade-in relative z-10">
               <AlertCircle size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Same Level & Class Required</span>
            </div>
          )}

          {selectedIds.length > 0 && (
            <button 
              onClick={() => setSelectedIds([])}
              className="text-[9px] font-black text-gray-600 hover:text-white transition-colors uppercase tracking-[0.3em] relative z-10"
            >
              Reset Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FusionZone;