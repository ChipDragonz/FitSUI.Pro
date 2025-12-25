import React from 'react';
import { Box, Zap, Activity, CheckCircle2, XCircle, Save } from 'lucide-react';import HeroCard from './HeroCard';
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
  nextLevelXP,
  totalStrength,
  onChainItemsMetadata
}) => {
  const PART_NAMES = ["Shield", "Cloak", "Pants", "Shirt", "Gloves", "Necklace", "Sword"];
  const SLOTS = ["shield", "cloak", "pants", "shirt", "gloves", "necklace", "sword"];

  // ✅ 1. CẤU HÌNH PHÁT SÁNG CHO KHO ĐỒ (Aura & Glow)
  const RARITY_CONFIG = [
    { 
      id: 0, label: "COMMON", color: "text-gray-500", 
      border: "border-white/5", 
      glow: "shadow-none",
      aura: "bg-slate-500/5" 
    },
    { 
      id: 1, label: "RARE", color: "text-blue-400", 
      border: "border-blue-500/40", 
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      aura: "bg-blue-500/10" 
    },
    { 
      id: 2, label: "EPIC", color: "text-purple-500", 
      border: "border-purple-500/50", 
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
      aura: "bg-purple-500/15" 
    },
    { 
      id: 3, label: "LEGENDARY", color: "text-yellow-400", 
      border: "border-yellow-400/60", 
      glow: "shadow-[0_0_25px_rgba(250,204,21,0.5)]",
      aura: "bg-yellow-500/20" 
    }
  ];

  const getOwnedItems = (rarityId, partId) => items.filter(i => i.rarity === rarityId && i.part === partId);

  const hasChanges = Object.keys(tempEquipment).some(slot => {
    const previewItemName = tempEquipment[slot]; 
    const onChainItemName = onChainItemsMetadata[slot]?.name || 'none';
    return previewItemName !== onChainItemName;
  });

  const buttonLabel = hasChanges ? "SAVE EQUIPMENT" : "NO CHANGES DETECTED";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in pb-32">
      
      {/* --- CỘT TRÁI: PHÒNG THAY ĐỒ --- */}
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
                onChainItemsMetadata={onChainItemsMetadata}
                inventoryItems={items}
                elementInfo={elementMap[currentHero.data.content?.fields?.element] || elementMap[0]}
                nextLevelXP={nextLevelXP}
                totalStrength={totalStrength}
                hideStats={true} 
                isInventoryMode={true}
                isAnimated={false} 
                onSlotClick={(slotId) => onToggleEquip(slotId, tempEquipment[slotId])} 
              />

              <div className="space-y-4 pt-6 border-t border-white/5">
                <button
                  disabled={!hasChanges || isProcessing}
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
                    <><Save size={16} /> {buttonLabel}</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl text-gray-500 uppercase font-black text-[10px] tracking-widest">
              SELECT A HERO TO EQUIP GEAR
            </div>
          )}
        </div>
      </div>

      {/* --- CỘT PHẢI: KHO ĐỒ --- */}
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
                  <div key={partId} className={`relative aspect-square rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center group 
                    ${hasItem 
                      ? `${rarity.border} ${rarity.glow} bg-slate-900/40 backdrop-blur-sm` 
                      : 'border-white/5 bg-black/40 opacity-40'}`}>
                    
                    {hasItem && (
                      <>
                        {/* ✅ HIỆU ỨNG AURA NỀN (Hào quang nhấp nháy) */}
                        <div className={`absolute inset-0 rounded-2xl animate-pulse opacity-30 ${rarity.aura}`}></div>
                        
                        {ownedItems.length > 1 && (
                          <div className="absolute top-2 right-2 z-30 bg-slate-950/80 border border-white/20 px-2 py-0.5 rounded-lg backdrop-blur-md shadow-lg">
                            <span className="text-[10px] font-black text-white">x{ownedItems.length}</span>
                          </div>
                        )}

                        <img 
                          src={ownedItems[0].url} 
                          className="w-full h-full object-cover rounded-xl p-2 z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
                          alt={name} 
                        />

                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-lg z-20">
  {partId === 3 ? ( // Nếu là món Shirt (Part 3)
    <>
      <Activity size={8} className="text-lime-400 fill-lime-400" />
      <span className="text-[9px] font-black text-white italic tracking-tighter">+{ownedItems[0].bonus} REGEN</span>
    </>
  ) : ( // Các món khác giữ nguyên STR
    <>
      <Zap size={8} className="text-yellow-400 fill-yellow-400" />
      <span className="text-[9px] font-black text-white italic tracking-tighter">+{ownedItems[0].bonus} STR</span>
    </>
  )}
</div>

                        <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-1 rounded-xl z-40">
                          <button 
                            onClick={() => onToggleEquip(slotKey, ownedItems[0].name)}
                            className={`w-full py-2 rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1 transition-transform active:scale-95 ${isEquipped ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-lime-500 text-slate-950'}`}
                          >
                            {isEquipped ? <><XCircle size={10}/> UNEQUIP</> : <><CheckCircle2 size={10}/> EQUIP</>}
                          </button>
                        </div>
                      </>
                    )}
                    {!hasItem && (
  <div className="flex flex-col items-center gap-1 opacity-20">
    <Box className="w-5 h-5 text-gray-400" />
    <span className="text-[7px] font-black uppercase tracking-tighter">{name}</span>
  </div>
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