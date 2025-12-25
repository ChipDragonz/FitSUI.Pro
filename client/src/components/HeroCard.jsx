import React, { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Zap, Shield, Activity, Box } from 'lucide-react';

import HeroAvatar from './HeroAvatar';



const HeroCard = ({

  hero, totalStrength, stamina: dynamicStamina, staminaProgress = 0,

  tempEquipment, onChainItemsMetadata, inventoryItems = [],

  elementInfo, nextLevelXP, hideStats = false, isInventoryMode = false, onSlotClick

}) => {

  if (!hero || !hero.content || !hero.content.fields) return null;



  const fields = hero.content.fields;

  const level = Number(fields.level || 0);

  const xp = Number(fields.xp || 0);

  const baseStrength = Number(fields.strength || 1);

  const stamina = dynamicStamina !== undefined ? dynamicStamina : Number(fields.stamina || 0);

  const maxStamina = 100 + (level * 15);

 

  // ✅ FIX LỖI: Định nghĩa xpPercentage và staminaPercentage

  const xpPercentage = nextLevelXP > 0 ? Math.min((xp / nextLevelXP) * 100, 100) : 0;

  const staminaPercentage = Math.min((stamina / maxStamina) * 100, 100);



  // ✅ 1. CẤU HÌNH AURA PHÁT SÁNG (Sáng rõ màu Tím/Xanh khi thử đồ)

  const RARITY_CONFIG = {

    0: { border: "border-slate-500/40", shadow: "none", auraColor: "rgba(148,163,184,0.2)" },

    1: { border: "border-blue-400", shadow: "0 0 20px rgba(59,130,246,0.8)", auraColor: "rgba(59,130,246,0.5)" },

    2: { border: "border-purple-500", shadow: "0 0 25px rgba(168,85,247,0.9)", auraColor: "rgba(168,85,247,0.6)" },

    3: { border: "border-yellow-400", shadow: "0 0 30px rgba(250,204,21,1.0)", auraColor: "rgba(250,204,21,0.7)" }

  };



  const EQUIPMENT_SLOTS = [

    { id: 'hat', label: 'HEAD', pos: 'top-[4%] left-[4%]' },

    { id: 'armor', label: 'ARMOR', pos: 'top-[4%] right-[4%]' },

    { id: 'shirt', label: 'SHIRT', pos: 'top-[35%] left-[1%]' },

    { id: 'gloves', label: 'GLOVES', pos: 'top-[35%] right-[1%]' },

    { id: 'weapon', label: 'WEAPON', pos: 'top-[62%] left-[4%]' },

    { id: 'shoes', label: 'SHOES', pos: 'top-[62%] right-[4%]' },

    { id: 'pants', label: 'PANTS', pos: 'bottom-[12%] left-1/2 -translate-x-1/2' },

  ];



  const [showPlusOne, setShowPlusOne] = useState(false);

  const prevStaminaRef = useRef(stamina);



  useEffect(() => {

    if (stamina > prevStaminaRef.current) {

      setShowPlusOne(true);

      const timer = setTimeout(() => setShowPlusOne(false), 2000);

      return () => clearTimeout(timer);

    }

    prevStaminaRef.current = stamina;

  }, [stamina]);



  const config = elementInfo || { label: 'METAL', color: 'text-yellow-400', border: 'border-yellow-500/50' };



  return (

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative group w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] border-2 ${config.border} bg-gray-900/80 backdrop-blur-xl shadow-2xl transition-all flex flex-col`}>

      <div className={`relative w-full z-10 transition-all duration-500 ${isInventoryMode ? 'h-[520px]' : 'h-[450px]'}`}>

         <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ${isInventoryMode ? 'scale-[0.72] translate-y-0' : 'scale-[1.0] translate-y-5'}`}>

            <HeroAvatar equipment={tempEquipment} />

         </div>



         {isInventoryMode && EQUIPMENT_SLOTS.map((slot) => {

           const displayUrl = tempEquipment[slot.id]; // URL từ previewUrls

           const isEquipped = displayUrl && displayUrl !== 'none';

           

           // ✅ 2. DÒ TÌM ĐỘ HIẾM TỨC THÌ (Dò cả đồ đang thử lẫn đồ đã mặc)

           let currentRarity = 0;

           if (isEquipped) {

              const itemInInv = inventoryItems.find(i => i.url === displayUrl || i.name === displayUrl);

              if (itemInInv) {

                currentRarity = itemInInv.rarity;

              } else {

                const onChain = onChainItemsMetadata?.[slot.id];

                if (onChain && (onChain.url === displayUrl || onChain.name === displayUrl)) currentRarity = onChain.rarity;

              }

           }



           const rStyle = RARITY_CONFIG[currentRarity] || RARITY_CONFIG[0];



           return (

             <button

               key={slot.id}

               onClick={() => isEquipped && onSlotClick && onSlotClick(slot.id)}

               className={`absolute ${slot.pos} w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 z-20 group/slot

               ${isEquipped ? `${rStyle.border} bg-slate-900/40` : 'border-white/5 bg-black/40 opacity-60'}`}

               style={{ boxShadow: isEquipped ? rStyle.shadow : 'none' }}

             >

               {isEquipped ? (

                 <>

                   {/* ✅ HIỆU ỨNG AURA PHÁT SÁNG NHẤP NHÁY */}

                   <div className="absolute inset-0 rounded-2xl animate-pulse opacity-40" style={{ backgroundColor: rStyle.auraColor }}></div>

                   <motion.img initial={{ scale: 0 }} animate={{ scale: 1 }} src={displayUrl} alt={slot.label} className="w-10 h-10 md:w-11 md:h-11 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] z-10" />

                   <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center rounded-2xl transition-opacity border border-red-500/40 z-20"><span className="text-[8px] font-black text-white">REMOVE</span></div>

                 </>

               ) : (

                 <Box size={16} className="text-gray-700 opacity-30" />

               )}

               <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase text-gray-500 tracking-widest whitespace-nowrap">{slot.label}</span>

             </button>

           );

         })}

      </div>



      <div className={`relative z-30 p-6 flex flex-col justify-end bg-gradient-to-t from-black via-gray-900/95 to-transparent ${isInventoryMode ? 'pt-14' : '-mt-16 pt-16'}`}>

        <div className={`absolute right-6 bg-lime-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${isInventoryMode ? 'top-2' : 'top-12'}`}>LVL {level}</div>

        <div className="mb-5">

          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">{fields.name}</h3>

          <div className="flex items-center gap-2 text-[10px] font-black bg-black/40 w-fit px-3 py-1 rounded-lg border border-white/5 mt-1">

            <Activity className={`w-3 h-3 ${config.color}`} />

            <span className={`${config.color} uppercase tracking-[0.2em]`}>{config.label} CLASS</span>

          </div>

        </div>

        {!hideStats && (

          <div className="space-y-4 animate-fade-in-up">

            <div className="grid grid-cols-2 gap-3">

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">

                <div className="p-2 bg-orange-500/20 rounded-xl"><Zap className="w-5 h-5 text-orange-400" /></div>

                <div>

                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">POWER</p>

                  <p className={`text-2xl font-black transition-colors duration-500 ${totalStrength > baseStrength ? 'text-lime-400' : 'text-white'}`}>{totalStrength || baseStrength}</p>

                </div>

              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">

                <div className="p-2 bg-purple-500/20 rounded-xl"><Shield className="w-5 h-5 text-purple-400" /></div>

                <div>

                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">TOTAL XP</p>

                  <p className="text-2xl font-black text-white">{xp}</p>

                </div>

              </div>

            </div>



            <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">

              <div className="space-y-1.5">

                <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase"><span>PROGRESS</span><span className="text-lime-400">{xp} / {nextLevelXP} XP</span></div>

                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5">

                  <motion.div animate={{ width: `${xpPercentage}%` }} className="h-full bg-lime-500 shadow-[0_0_10px_#a3e635]" />

                </div>

              </div>

              <div className="space-y-1.5 relative">

                <div className="flex justify-between text-[9px] font-black text-gray-300 uppercase relative">

                  <span>STAMINA</span>

                  <AnimatePresence>{showPlusOne && <motion.span initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -15 }} exit={{ opacity: 0 }} className="absolute right-10 text-lime-400 font-black">+1</motion.span>}</AnimatePresence>

                  <span className={stamina < 20 ? 'text-red-500' : 'text-green-400'}>{stamina} / {maxStamina}</span>

                </div>

                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden relative border border-white/5">

                  <motion.div animate={{ width: `${staminaPercentage}%` }} className={`h-full ${stamina > 20 ? 'bg-green-500' : 'bg-red-500'}`} />

                  {stamina < maxStamina && <motion.div className="absolute top-0 left-0 h-full bg-white/10" style={{ width: `${staminaProgress}%` }} />}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </motion.div>

  );

};



export default HeroCard;