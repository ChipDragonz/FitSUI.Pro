import React from 'react';
// ✅ ĐÃ THÊM: Zap vào danh sách import
import { Box, Zap, CheckCircle2, XCircle, Save, RotateCcw } from 'lucide-react';
import HeroCard from './HeroCard';
import HeroSelector from './HeroSelector';

const Inventory = ({ 
  items = [], 
  heroes = [], 
  currentHero, 
  onSelectHero, 
  tempEquipment, 
  previewUrls,
  onToggleEquip, 
  onSave, 
  isProcessing, 
  elementMap,
  nextLevelXP 
}) => {
  const PART_NAMES = ["Hat", "Shirt", "Pants", "Shoes", "Gloves", "Armor", "Sword"];
  const SLOTS = ["hat", "shirt", "pants", "shoes", "gloves", "armor", "weapon"]; 

  const RARITY_CONFIG = [
    { id: 0, label: "COMMON", color: "text-gray-500", border: "border-white/5" },
    { id: 1, label: "RARE", color: "text-blue-400", border: "border-blue-500/20" },
    { id: 2, label: "EPIC", color: "text-purple-500", border: "border-purple-500/20" },
    { id: 3, label: "LEGENDARY", color: "text-yellow-400", border: "border-yellow-500/30" }
  ];

  const getOwnedItems = (rarityId, partId) => items.filter(i => i.rarity === rarityId && i.part === partId);
  const hasChanges = Object.values(tempEquipment).some(val => val !== 'none');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in pb-32">
      
      {/* --- LEFT COLUMN: DRESSING ROOM --- */}
      <div className="lg:col-span-4 space-y-6 sticky top-32">
        <div className="bg-slate-950/60 border border-lime-500/10 rounded-3xl p-6 backdrop-blur-2xl">
          <div className="mb-10">
            <HeroSelector 
              heroes={heroes} 
              selectedId={currentHero?.data?.objectId} 
              onSelect={onSelectHero} 
              showMint={false} 
            />
          </div>
          
          {currentHero ? (
            <div className="space-y-8">
              <HeroCard 
                hero={currentHero.data} 
                tempEquipment={previewUrls} 
                elementInfo={elementMap[currentHero.data.content?.fields?.element] || elementMap[0]}
                nextLevelXP={nextLevelXP}
                hideStats={true} 
              />

              <div className="space-y-4 pt-6 border-t border-white/5">
                <button
                  disabled={isProcessing}
                  onClick={() => onSave(tempEquipment)}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${
                    hasChanges 
                      ? 'bg-lime-500 text-slate-950 shadow-[0_10px_30px_rgba(163,230,53,0.2)] hover:-translate-y-1' 
                      : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Save size={16} /> {hasChanges ? "SAVE EQUIPMENT" : "NO CHANGES DETECTED"}</>
                  )}
                </button>
                <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-[0.3em]">
                  {hasChanges ? "CONFIRM TO UPDATE ON BLOCKCHAIN" : "SELECT GEAR ON THE RIGHT TO START"}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl text-gray-500 uppercase font-black text-[10px] tracking-widest">
              SELECT A HERO TO EQUIP GEAR
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: ITEM MATRIX --- */}
      <div className="lg:col-span-8 space-y-10">
        {RARITY_CONFIG.map((rarity) => (
          <div key={rarity.id} className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${rarity.color}`}>
                {rarity.label} ({items.filter(i => i.rarity === rarity.id).length}/7)
              </span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {PART_NAMES.map((name, partId) => {
                const ownedItems = getOwnedItems(rarity.id, partId);
                const hasItem = ownedItems.length > 0;
                const slotKey = SLOTS[partId];
                const isEquipped = hasItem && tempEquipment[slotKey] === ownedItems[0].name;

                return (
                  <div key={partId} className={`relative aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center group ${hasItem ? `${rarity.border} bg-slate-900/60 shadow-xl` : 'border-white/5 bg-black/40 opacity-40'}`}>
                    {hasItem ? (
                      <>
                        {/* Số lượng vật phẩm xN */}
                        {ownedItems.length > 1 && (
                          <div className="absolute top-2 right-2 z-20 bg-slate-950/80 border border-white/20 px-2 py-0.5 rounded-lg backdrop-blur-md shadow-lg pointer-events-none">
                            <span className="text-[10px] font-black text-white">x{ownedItems.length}</span>
                          </div>
                        )}
                        
                        <img src={ownedItems[0].url} className="w-full h-full object-cover rounded-xl p-2" alt={name} />

                        {/* ✅ BADGE CỘNG STR (Góc dưới bên phải) */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-lg pointer-events-none z-10">
                          <Zap size={8} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[9px] font-black text-white italic tracking-tighter">
                            +{ownedItems[0].bonus} STR
                          </span>
                        </div>

                        {/* HOVER ACTIONS */}
                        <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 p-1 rounded-xl z-20">
                          <button 
                            onClick={() => onToggleEquip(slotKey, ownedItems[0].name)}
                            className={`w-full py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 ${isEquipped ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-lime-500 text-slate-950'}`}
                          >
                            {isEquipped ? <><XCircle size={10}/> UNEQUIP</> : <><CheckCircle2 size={10}/> EQUIP</>}
                          </button>
                        </div>
                      </>
                    ) : (
                      <Box className="w-5 h-5 text-gray-800" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;