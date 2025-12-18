import { ConnectButton } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useGame } from './hooks/useGame';
import HeroSelector from './components/HeroSelector';
import HeroCard from './components/HeroCard';
import AIWorkout from './components/AIWorkout';
import { Dumbbell, Activity, Trophy, Package, Store, Shirt, HardHat, Play } from 'lucide-react';

function App() {
  // --- [PART 1: LOGIC & STATE] ---
  const { account, heroes, mintHero, workout, nextMintTime } = useGame();
  const [activeTab, setActiveTab] = useState('heroes'); 
  const [selectedHeroId, setSelectedHeroId] = useState('');
  
  // Workout & Session Control
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false); 
  const [accumulatedSets, setAccumulatedSets] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tempEquipment, setTempEquipment] = useState({ outfit: 'none', hat: 'none', weapon: 'none' });

  // English Navigation Items
  const navItems = [
    { id: 'heroes', label: 'Hero Vault', icon: Trophy }, 
    { id: 'inventory', label: 'Inventory', icon: Package }, 
    { id: 'market', label: 'Marketplace', icon: Store }, 
  ];

  const currentHeroId = selectedHeroId || (heroes.length > 0 ? heroes[0].data.objectId : '');
  const currentHero = heroes.find(h => h.data.objectId === currentHeroId);

  const toggleEquip = (slot, itemName) => {
    setTempEquipment(prev => ({ ...prev, [slot]: prev[slot] === itemName ? 'none' : itemName }));
  };

  const handleClaim = () => {
    setIsProcessing(true);
    workout(currentHeroId, accumulatedSets, () => {
      setAccumulatedSets(0);
      setIsProcessing(false);
      setIsWorkoutStarted(false); 
    });
  };

  return (
    <div className="min-h-screen font-sans selection:bg-lime-500/30 text-white bg-[#0a0c10] relative overflow-x-hidden">
      
      {/* --- [PART 2: TOXIC SHOOTING STARS BACKGROUND] --- */}
<div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0c10]">
  {/* Giữ lại quầng sáng mờ cho có chiều sâu nhưng giảm độ đậm */}
  <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-lime-500/5 blur-[120px]"></div>
  <div className="absolute bottom-[10%] right-[0%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[100px]"></div>

  {/* Lớp Mưa Sao Băng phủ kín màn hình */}
  <div className="night">
    {[...Array(15)].map((_, i) => (
      <div key={i} className="shooting_star"></div>
    ))}
  </div>

  {/* Carbon Texture phủ nhẹ */}
  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
</div>

      {/* --- [PART 3: GLASSMORPHISM NAVBAR] --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/20 backdrop-blur-xl border-b border-white/5 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('heroes')}>
            <div className="bg-gradient-to-br from-lime-400 to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-lime-500/20 group-hover:scale-110 transition-transform">
              <Dumbbell className="text-slate-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-none">
                FitSui<span className="text-lime-400">.Pro</span>
              </h1>
              <p className="text-[10px] text-lime-500/60 font-bold tracking-widest uppercase">Move to Earn</p>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          {account && (
            <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              {navItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === item.id ? 'bg-lime-500 text-slate-950 shadow-lg shadow-lime-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-slate-950' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* DARK NEON CONNECT BUTTON */}
          <div className="flex items-center gap-4">
            <div className="relative group transition-all duration-300 hover:scale-105">
              <div className="absolute -inset-1 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative p-[1.5px] rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500">
                <div className="relative rounded-[10px] bg-[#0a0c10] hover:bg-slate-950 transition-colors">
                  <ConnectButton 
                    connectText="Connect Wallet" 
                    className="!bg-transparent !text-white !font-black !text-sm !px-8 !py-3 rounded-xl flex items-center justify-center" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- [PART 4: MAIN CONTENT] --- */}
      <main className="relative z-10 pt-32 pb-12 px-4 max-w-7xl mx-auto">
        {!account ? (
  /* LANDING PAGE CẢI TIẾN */
  <div className="space-y-32 mt-10 mb-20">
    
    {/* --- 1. HERO SECTION (Cái cũ của ní nhưng thêm Stats) --- */}
    <div className="text-center space-y-8 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 font-bold text-sm uppercase tracking-wider mb-4">
        <Activity className="w-4 h-4 animate-pulse" /> Next Gen Web3 Fitness
      </div>
      <h1 className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tight">
        Train hard. <br/> 
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 italic">Get paid.</span>
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
        Turn sweat into digital assets. Use <span className="text-lime-400 font-bold">AI Pose Estimation</span> to track your workout directly on-browser.
      </p>
      
      <div className="pt-8 flex justify-center">
        <div className="relative group transition-all duration-700 ease-in-out hover:scale-110"> 
          <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 via-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-700 ease-in-out animate-pulse"></div>
          <div className="relative">
            <ConnectButton 
              connectText="🚀 CONNECT WALLET TO START" 
              className="!bg-slate-950 !text-white !text-xl !font-black !px-10 !py-6 !rounded-2xl !border !border-lime-500/20 hover:!border-lime-400 transition-all duration-700 ease-in-out flex items-center gap-3 active:scale-95" 
            />
          </div>
        </div>
      </div>
          
      {/* --- STATS RIBBON (Thêm mới) --- */}
      <div className="flex flex-wrap justify-center gap-12 pt-16 opacity-50 group-hover:opacity-100 transition-opacity">
        <div className="text-center">
          <p className="text-2xl font-black text-white">1.2M+</p>
          <p className="text-[10px] text-lime-500 font-bold uppercase tracking-widest">XP Earned</p>
        </div>
        <div className="text-center border-x border-white/10 px-12">
          <p className="text-2xl font-black text-white">3.4K+</p>
          <p className="text-[10px] text-lime-500 font-bold uppercase tracking-widest">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-white">90K+</p>
          <p className="text-[10px] text-lime-500 font-bold uppercase tracking-widest">Sui Transactions</p>
        </div>
      </div>
    </div>

    {/* --- 2. GAME MECHANICS (Dán dưới Hero Section) --- */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 py-20">
  {[
    { title: "zkLogin Access", desc: "Log in instantly with Google. No seed phrases, pure Web3 power.", icon: Activity },
    { title: "Daily Hero Mint", desc: "Mint 1 Hero daily. Attributes and Rarity define your Hero's market value.", icon: Trophy },
    { title: "AI Evolution", desc: "Burn stamina to train. Gain XP to boost stats and level up your Hero.", icon: Dumbbell },
    { title: "Market & Loot", desc: "Trade rare loot or leveled-up Heroes in our player-driven economy.", icon: Store }
  ].map((step, idx) => (
    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-lime-500/30 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <step.icon className="text-lime-400 w-6 h-6" />
      </div>
      <h3 className="text-lg font-black text-white mb-2 italic uppercase tracking-tighter">0{idx + 1}. {step.title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
    </div>
  ))}
</div>
{/*--- satmina & mana ---*/}
<div className="space-y-8 px-4 pb-20">
  <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[40px] text-center">
    <h2 className="text-2xl font-black text-white uppercase italic mb-4">Stamina & Mana System</h2>
    <p className="text-gray-500 text-sm max-w-2xl mx-auto">
      Each training session consumes stamina. Use <span className="text-white font-bold">Mana Potions</span> to recharge and train more. 
      Higher levels increase the chance of **Rare Loot Drops** in your inventory!
    </p>
  </div>
</div>





    {/* --- 3. TECH STACK BANNER (Thêm mới) --- */}
    <div className="bg-gradient-to-r from-lime-500/10 to-transparent border-l-4 border-lime-500 p-12 rounded-r-3xl mx-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-left space-y-2">
          <h2 className="text-3xl font-black text-white uppercase italic">Powered by <span className="text-lime-400">AI Vision</span></h2>
          <p className="text-gray-400 max-w-md">No extra hardware needed. Our MoveNet AI model processes 30+ frames per second directly in your browser for perfect tracking.</p>
        </div>
        <div className="flex gap-6 items-center">
          <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-400">TensorFlow.js</div>
          <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-xs font-bold text-gray-400">Sui Network</div>
        </div>
      </div>  
    </div>

  {/* --- Future Roadmap --- */}
    <div className="py-20 px-4">
  <h2 className="text-4xl font-black text-white text-center mb-16 italic uppercase tracking-tighter">
    Future <span className="text-lime-400">Roadmap</span>
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
    {[
      { 
    phase: "Phase 1", 
    title: "Genesis Launch", 
    date: "Q4 2025", 
    tasks: ["zkLogin Secure Onboarding", "Daily Hero Mint (DNA & Rarity)", "AI Squat Tracking Engine", "On-chain XP Records"] 
  },
  { 
    phase: "Phase 2", 
    title: "RPG & Economy", 
    date: "Q1 2026", 
    tasks: ["Hero Leveling & Stat Boosts", "Inventory System & Rare Loot", "Mana & Stamina Mechanics", "Mana Potion Store"] 
  },
  { 
    phase: "Phase 3", 
    title: "Open Marketplace", 
    date: "Q2 2026", 
    tasks: ["P2P Hero & Item Trading", "New AI Workout Models", "Guilds & Team Training", "Mobile App Integration"] 
  }
    ].map((item, i) => (
      <div key={i} className="relative p-8 border-l border-lime-500/30 hover:bg-lime-500/5 transition-all group">
        <div className="absolute top-0 left-[-5px] w-2 h-2 bg-lime-500 rounded-full shadow-[0_0_10px_#a3e635]"></div>
        <span className="text-lime-500 font-bold text-xs tracking-widest uppercase">{item.phase} - {item.date}</span>
        <h3 className="text-xl font-black text-white mt-2 mb-4 italic">{item.title}</h3>
        <ul className="space-y-2">
          {item.tasks.map((task, j) => (
            <li key={j} className="text-gray-500 text-sm flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-700 rounded-full"></div> {task}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</div>

  </div>
) : (
          <div className="animate-fade-in">
            {/* TAB 1: HERO VAULT */}
            {activeTab === 'heroes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-950/60 border border-lime-500/10 rounded-3xl p-6 backdrop-blur-2xl">
                    <HeroSelector heroes={heroes} selectedId={currentHeroId} onSelect={setSelectedHeroId} onMint={mintHero} nextMintTime={nextMintTime} />
                    <div className="mt-8">{currentHero && <HeroCard hero={currentHero.data} tempEquipment={tempEquipment} />}</div>
                    
                    {currentHero && (
                      <div className="mt-6 bg-slate-900/60 p-4 rounded-2xl border border-lime-500/10">
                        <h3 className="text-xs font-black text-lime-500/60 uppercase mb-3 tracking-widest">Gear Demo</h3>
                        <div className="flex gap-2">
                          <button onClick={() => toggleEquip('outfit', 'warrior')} className={`flex-1 p-3 rounded-xl border font-bold text-[10px] ${tempEquipment.outfit === 'warrior' ? 'bg-lime-500 border-lime-400 text-slate-950' : 'bg-white/5 border-white/5 text-gray-500'}`}>ARMOR</button>
                          <button onClick={() => toggleEquip('hat', 'helmet')} className={`flex-1 p-3 rounded-xl border font-bold text-[10px] ${tempEquipment.hat === 'helmet' ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-white/5 border-white/5 text-gray-500'}`}>HELMET</button>
                          <button onClick={() => toggleEquip('weapon', 'fireSword')} className={`flex-1 p-3 rounded-xl border font-bold text-[10px] ${tempEquipment.weapon === 'fireSword' ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'bg-white/5 border-white/5 text-gray-500'}`}>SWORD</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-slate-950/60 border border-lime-500/10 rounded-3xl p-1 backdrop-blur-2xl flex flex-col relative min-h-[480px]">
                    <div className="p-6 flex justify-between items-end border-b border-white/5">
                      <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Training <span className="text-lime-400">Zone</span></h2>
                      <div className="bg-lime-500/10 border border-lime-500/20 px-4 py-1 rounded-lg"><p className="text-xl font-black text-lime-400 uppercase">3 SQUATS / SET</p></div>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center">
                      {!isWorkoutStarted ? (
                        <div className="text-center space-y-6">
                          <div className="w-24 h-24 bg-lime-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-lime-500/30"><Play className="w-10 h-10 text-lime-400 fill-lime-400" /></div>
                          <button onClick={() => setIsWorkoutStarted(true)} className="bg-gradient-to-r from-lime-400 to-emerald-600 px-10 py-5 rounded-2xl text-slate-950 font-black text-xl shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:scale-105 transition-all uppercase">START TRAINING</button>
                        </div>
                      ) : (
                        <AIWorkout onSessionUpdate={() => setAccumulatedSets(s => s + 1)} isProcessing={isProcessing} />
                      )}
                    </div>
                  </div>

                  {/* REWARD CLAIM SECTION (NEW ENGLISH VERSION) */}
                  {accumulatedSets > 0 && (
                    <div className="flex flex-col items-center gap-6 py-10 bg-lime-500/5 rounded-3xl border border-lime-500/20 shadow-2xl animate-fade-in">
                      <div className="flex items-center gap-3">
                        <Activity className="text-lime-400 w-5 h-5 animate-bounce" />
                        <span className="font-black text-lime-400 uppercase tracking-[0.2em] text-xs text-center">
                          Session complete: {accumulatedSets} Sets Finished! 🔥
                        </span>
                      </div>

                      <button onClick={handleClaim} disabled={isProcessing} className="relative group scale-110 active:scale-95 transition-all">
                        <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative bg-slate-950 border border-white/20 px-12 py-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-all">
                          <span className="text-2xl font-black text-white uppercase tracking-tighter">
                            {isProcessing ? "Confirming..." : `FINISH & CLAIM ${accumulatedSets * 10} XP`}
                          </span>
                          <Trophy className="text-lime-400 w-6 h-6" />
                        </div>
                      </button>

                      <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.4em] mt-2">
                        Permanently record results on Sui Blockchain
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY VAULT */}
            {activeTab === 'inventory' && (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-950/60 rounded-3xl border border-lime-500/10 text-center backdrop-blur-xl animate-fade-in">
                <Package className="w-24 h-24 text-lime-500/20 mb-6" />
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Inventory Vault</h2>
                <p className="text-lime-500/60 font-bold uppercase tracking-widest text-sm">🚧 Under Development</p>
              </div>
            )}

            {/* TAB 3: MARKETPLACE */}
            {activeTab === 'market' && (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-950/60 rounded-3xl border border-lime-500/10 text-center backdrop-blur-xl animate-fade-in">
                <Store className="w-24 h-24 text-emerald-500/20 mb-6" />
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Trading Marketplace</h2>
                <p className="text-emerald-500/60 font-bold uppercase tracking-widest text-sm">Coming Soon on SUI Network</p>
              </div>
            )}
          </div>
        )}
        {/* --- 5. FOOTER (Chốt hạ sự chuyên nghiệp) --- */}
<footer className="border-t border-white/5 pt-16 pb-8 text-center space-y-6">
  <div className="flex justify-center gap-8 text-gray-500">
    <a href="#" className="hover:text-lime-400 transition-colors font-bold text-sm uppercase tracking-widest">Documentation</a>
    <a href="https://github.com/ChipDragonz" className="hover:text-lime-400 transition-colors font-bold text-sm uppercase tracking-widest">Github</a>
    <a href="#" className="hover:text-lime-400 transition-colors font-bold text-sm uppercase tracking-widest">Whitepaper</a>
  </div>
  <p className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.5em]">
    © 2025 FitSui.Pro | Built for SUI Global Hackathon
  </p>
</footer>
      </main>
      
    </div>
  );
}

export default App;