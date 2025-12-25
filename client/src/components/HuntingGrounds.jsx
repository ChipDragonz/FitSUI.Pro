import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Target } from 'lucide-react';
import HeroAvatar from './HeroAvatar';

const MONSTER_DB = [
  { id: 'slime', name: "Wild Slime", hp: 5, chance: 50, url: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafybeiatkp26opas42qobnsqpxrmvwfyp4dnq2zuhmax3wqt3wta55e5yq", color: "text-red-500", aura: "bg-red-500/40", scale: 1.0 },
  { id: 'bat', name: "Shadow Bat", hp: 12, chance: 25, url: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreifxq5yhq3gdpo6e3p3xmcb27o2dbafbg2ulkzr2ltqggk3h2v45ra", color: "text-purple-500", aura: "bg-purple-500/40", scale: 1.1 },
  { id: 'goblin', name: "Iron Goblin", hp: 30, chance: 15, url: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafybeihby6usuf4tfy7fjjxetgxzpsbn5dzqzih5ddqwefbcwebgseyqpm", color: "text-emerald-500", aura: "bg-emerald-500/40", scale: 1.2 },
  { id: 'orc', name: "Elite Orc", hp: 75, chance: 8, url: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafybeifi77ziy24x4ttmgx222j44te2l5icygkrickknucq3ogoxdyk2xu", color: "text-orange-500", aura: "bg-orange-500/40", scale: 1.3 },
  { id: 'dragon', name: "Sui Dragon", hp: 200, chance: 2, url: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafybeif4yccdffgymda3r4euopnnkkjlxvxnkgj6ayaavmwzasn7uybw44", color: "text-yellow-400", aura: "bg-yellow-400/50", scale: 1.5 }
];

const HuntingGrounds = ({
  hero,
  previewUrls,
  onSlay,
  pendingMonsterHP,
  onClaim,
  isProcessing,
  stamina,
  strength
}) => {
  const heroFields = hero?.content?.fields || {};
  const heroLevel = Number(heroFields.level || 0);
  const maxStamina = 100 + heroLevel * 15;

  const [currentMonster, setCurrentMonster] = useState(MONSTER_DB[0]);
  const [monsterHP, setMonsterHP] = useState(MONSTER_DB[0].hp);
  const [spawnKey, setSpawnKey] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [damagePopup, setDamagePopup] = useState(null);

  const currentMonsterHits = Math.ceil(currentMonster.hp / strength);
  const accumulatedHits = Math.ceil(pendingMonsterHP / strength);

  const isOutOfStamina = stamina < currentMonsterHits;
  const isMonsterTooHeavy = accumulatedHits + currentMonsterHits > maxStamina;

  const getRandomMonster = () => {
    const totalWeight = MONSTER_DB.reduce((sum, m) => sum + m.chance, 0);
    let random = Math.random() * totalWeight;
    for (const monster of MONSTER_DB) {
      if (random < monster.chance) return monster;
      random -= monster.chance;
    }
    return MONSTER_DB[0];
  };

  const handleAttack = () => {
    if (stamina < currentMonsterHits) return;

    setIsAttacking(true);
    setDamagePopup(strength);

    const newHP = Math.max(0, monsterHP - strength);
    setMonsterHP(newHP);

    setTimeout(() => {
      setIsAttacking(false);
      setDamagePopup(null);

      if (newHP === 0) {
        onSlay(currentMonster.hp);

        setTimeout(() => {
          const nextMonster = getRandomMonster();
          setCurrentMonster(nextMonster);
          setMonsterHP(nextMonster.hp);
          setSpawnKey(prev => prev + 1);
        }, 1500);
      }
    }, 300);
  };

  const hpPercentage = (monsterHP / currentMonster.hp) * 100;

  return (
    <div className="flex flex-col gap-6 md:gap-12 py-4 md:py-10 max-w-6xl mx-auto px-2 animate-fade-in">

      {/* CHIẾN TRƯỜNG */}
      <div className="relative h-[320px] md:h-[450px] w-full flex items-center justify-between px-4 md:px-10 bg-slate-950/20 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-inner">

        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-lime-500/20 to-transparent" />
        </div>

        {/* HERO (SAFE FIX MOBILE) */}
        <div className="
          relative w-1/2 md:w-1/3 h-full
          flex items-end md:items-center justify-center
          pb-16 md:pb-0
        ">
          <motion.div
            animate={isAttacking ? { x: [0, 60, 0] } : {}}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex items-end md:items-center justify-center"
          >
            <HeroAvatar equipment={previewUrls} />
          </motion.div>
        </div>

        <div className="z-10 flex flex-col items-center gap-1 scale-75 md:scale-100 opacity-40">
          <Swords size={24} className="text-red-500" />
        </div>

        {/* QUÁI */}
        <div className="relative w-1/2 md:w-1/3 h-full flex flex-col items-center justify-center">
          <div className="absolute top-10 w-32 md:w-48 z-50">
            <div className="flex justify-between items-center mb-1">
              <span className={`font-black text-[8px] md:text-[10px] uppercase truncate ${currentMonster.color}`}>
                {currentMonster.name}
              </span>
              <span className="text-white font-black text-[8px]">
                {monsterHP}/{currentMonster.hp}
              </span>
            </div>

            <div className="relative h-2 w-full bg-black/60 rounded-full border border-white/10">
              <motion.div
                animate={{ width: `${hpPercentage}%` }}
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full"
              />

              <AnimatePresence>
                {damagePopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -25, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-red-500 font-black text-2xl md:text-3xl italic drop-shadow-[0_0_8px_rgba(239,68,68,1)]"
                  >
                    -{damagePopup}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={spawnKey}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                monsterHP <= 0
                  ? { opacity: 0, scale: 0, rotate: 180 }
                  : { opacity: 1, scale: currentMonster.scale, y: [0, -10, 0] }
              }
              transition={
                monsterHP <= 0
                  ? { duration: 0.5 }
                  : { y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
              }
              className="relative flex items-center justify-center"
            >
              <div className={`absolute w-48 h-48 md:w-64 md:h-64 ${currentMonster.aura} blur-[40px] md:blur-[60px] rounded-full animate-pulse opacity-50`} />
              <img
                src={currentMonster.url}
                alt={currentMonster.name}
                className="relative z-10 w-40 h-40 md:w-64 md:h-64 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ĐIỀU KHIỂN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="bg-slate-950/40 border border-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] backdrop-blur-3xl flex items-center justify-center shadow-lg">
            <button 
              disabled={monsterHP <= 0 || isProcessing || isOutOfStamina || isMonsterTooHeavy} 
              onClick={handleAttack}
              className="w-full relative group active:scale-95 transition-all disabled:opacity-50"
            >
              <div className={`absolute -inset-1 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500
                ${(isOutOfStamina || isMonsterTooHeavy) ? 'bg-gray-600' : 'bg-gradient-to-r from-red-500 to-orange-600'}`} 
              />
              <div className={`relative bg-slate-900 border py-5 rounded-2xl flex items-center justify-center gap-4 text-xl font-black text-white uppercase italic tracking-tighter shadow-2xl
                ${(isOutOfStamina || isMonsterTooHeavy) ? 'border-red-500/20' : 'border-white/10'}`}
              >
                <Swords className={monsterHP <= 0 ? 'text-lime-400' : 'text-red-500'} size={24} /> 
                <span>
                  {monsterHP <= 0 ? "SLAYED!" : 
                   isMonsterTooHeavy ? "REACHED LIMIT - CLAIM NOW" : 
                   isOutOfStamina ? "OUT OF STAMINA" : "ATTACK MONSTER"}
                </span>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white/5 border border-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-1 text-center">
                  <Zap className="text-lime-400 w-6 h-6" />
                  <span className="text-[8px] md:text-xs font-bold text-gray-500 uppercase">Your DMG</span>
                  {/* ✅ DÙNG PROP STRENGTH Ở ĐÂY (HIỆN SỐ 4) */}
                  <span className="text-xl md:text-4xl font-black text-white">{strength}</span>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-1 text-center">
                  <Target className="text-blue-400 w-6 h-6" />
                  <span className="text-[8px] md:text-xs font-bold text-gray-500 uppercase">Hits to Kill</span>
                  <span className="text-lg md:text-2xl font-black text-white">
                    {/* ✅ TÍNH DỰA TRÊN SỨC MẠNH TỔNG (4) */}
                    {currentMonsterHits}
                  </span>
              </div>
          </div>
      </div>

      {/* GOM THƯỞNG */}
      <AnimatePresence>
        {pendingMonsterHP > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-4 py-6 bg-lime-500/10 rounded-[2rem] border border-lime-500/20 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-lime-500 rounded-full animate-ping" />
               <p className="text-lime-400 font-black uppercase text-xs tracking-[0.2em]">Unclaimed Rewards: {pendingMonsterHP} EXP ⚔️</p>
            </div>
            <button onClick={onClaim} disabled={isProcessing} className="relative group active:scale-95 transition-all disabled:opacity-50">
              <div className="relative bg-lime-500 text-black px-10 py-4 rounded-xl font-black uppercase italic tracking-tighter shadow-xl">
                {isProcessing ? "RECORDING ON BLOCKCHAIN..." : "CLAIM ALL XP & ITEMS"}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HuntingGrounds;