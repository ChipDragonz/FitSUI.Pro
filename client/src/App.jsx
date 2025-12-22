import { 
  useDisconnectWallet, 
  useSuiClientQuery, 
  useCurrentAccount,
  useSignAndExecuteTransaction // 👈 THÊM DÒNG NÀY
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState, useEffect, useMemo } from 'react';
import { useGame } from './hooks/useGame';
import { PACKAGE_ID, GAME_INFO_ID, CLOCK_ID } from './utils/constants';

// --- IMPORT COMPONENTS (Đảm bảo ní đã tạo đủ 4 file này) ---
import Background from './components/Background';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Footer from './components/Footer';
import HeroSelector from './components/HeroSelector';
import HeroCard from './components/HeroCard';
import AIWorkout from './components/AIWorkout';
import FusionZone from './components/FusionZone';
import Inventory from './components/Inventory';
import HuntingGrounds from './components/HuntingGrounds';
import { useToast } from './context/ToastContext';

// --- IMPORT ICONS ---
import { Trophy, Package, Store, Sparkles, Play, Activity, Skull } from 'lucide-react';

function App() {

  const { showToast } = useToast();
  // --- 1. ELEMENT CONFIGURATION ---
  const ELEMENT_MAP = {
    0: { label: "METAL", color: "text-yellow-400", border: "border-yellow-500/50", shadow: "shadow-yellow-500/20" },
    1: { label: "WOOD", color: "text-emerald-400", border: "border-emerald-500/50", shadow: "shadow-emerald-500/20" },
    2: { label: "WATER", color: "text-blue-400", border: "border-blue-500/50", shadow: "shadow-blue-500/20" },
    3: { label: "FIRE", color: "text-red-400", border: "border-red-500/50", shadow: "shadow-red-500/20" },
    4: { label: "EARTH", color: "text-orange-700", border: "border-orange-900/50", shadow: "shadow-orange-900/20" }
  };

  // --- 2. LOGIC & STATES ---
  const { account, heroes, mintHero, workout, fuseHeroes, nextMintTime, saveEquipment } = useGame();
  const { mutate: disconnect } = useDisconnectWallet();
const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
const [pendingMonsterHP, setPendingMonsterHP] = useState(0);


  const [activeTab, setActiveTab] = useState('heroes');
  const [selectedHeroId, setSelectedHeroId] = useState('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [accumulatedSets, setAccumulatedSets] = useState(0);
  const [inventoryItems, setInventoryItems] = useState([]); // Chứa danh sách trang bị NFT
const [isProcessing, setIsProcessing] = useState(false); // Trạng thái chờ xử lý
const [tempEquipment, setTempEquipment] = useState({ 
  hat: 'none', shirt: 'none', pants: 'none', shoes: 'none', gloves: 'none', armor: 'none', weapon: 'none' 
});

// Hàm xử lý khi bấm nút Trang bị trong Inventory
const handleEquip = (itemId) => {
  console.log("Đang trang bị vật phẩm ID:", itemId);
  // Sau này mình sẽ viết logic gọi Transaction lên Sui tại đây
};

  // Định nghĩa Hero hiện tại
  const currentHeroId = selectedHeroId || (heroes[0]?.data?.objectId || '');
  const currentHero = heroes.find(h => h.data.objectId === currentHeroId);
  const [displayStamina, setDisplayStamina] = useState(0);
  const nextLevelXP = currentHero 
  ? (Number(currentHero.data.content?.fields?.level || 0) + 1) * (Number(currentHero.data.content?.fields?.level || 0) + 1) * 50 
  : 0;

  // --- 3. VIRTUAL STAMINA REGEN ENGINE ---
 // --- TRONG App.jsx ---
const [staminaProgress, setStaminaProgress] = useState(0); // 👈 THÊM STATE NÀY

// --- TRONG App.jsx ---
useEffect(() => {
  const fields = currentHero?.data?.content?.fields;
  if (!fields) return;

  const updateStamina = () => {
    const now = Date.now();
    const lastUpdate = Number(fields.last_update_timestamp || 0);
    const staminaOnChain = Number(fields.stamina || 0);
    const level = Number(fields.level || 0);
    const maxStamina = 100 + (level * 15); //

    const timePassed = Math.max(0, now - lastUpdate);
    const staminaRegen = Math.floor(timePassed / 60000); //
    const totalStamina = Math.min(maxStamina, staminaOnChain + staminaRegen);
    
    // ✅ Cập nhật State để UI thay đổi, nhưng KHÔNG LOG ra console nữa
    setDisplayStamina(totalStamina);

    const progress = totalStamina >= maxStamina ? 100 : ((timePassed % 60000) / 60000) * 100;
    setStaminaProgress(progress);
    
  };

  updateStamina();
  // Giữ interval 1s để thanh Progress Bar nhích mượt mà
  const interval = setInterval(updateStamina, 1000); 
  return () => clearInterval(interval);
}, [currentHero?.data?.objectId, currentHero?.data?.content?.fields?.stamina]);



const handleClaimFarmRewards = async () => {
  // ✅ 1. HẠ THẤP NGƯỠNG: Cho phép claim từ 1 HP trở lên
  if (pendingMonsterHP < 1 || !currentHero || isProcessing) {
    if (pendingMonsterHP < 1) {
      showToast("Accumulate at least 1 HP to claim rewards!", "error"); // 👈 Hiện ở góc
    }
    return;
  }

  const totalMultiplier = pendingMonsterHP; 
  const requiredStamina = totalMultiplier; 

  if (displayStamina < requiredStamina) {
    showToast(`Insufficient stamina! Need ${requiredStamina} but only have ${displayStamina}.`, "warning");
    return;
  }

  try {
    setIsProcessing(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::workout`,
      arguments: [
        txb.object(currentHero.data.objectId),
        txb.object(GAME_INFO_ID),
        txb.object(CLOCK_ID),
        txb.pure.u64(totalMultiplier),
      ],
    });

    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: () => {
        setPendingMonsterHP(0);
        showToast("Rewards claimed successfully!", "success"); // 👈 Hiện ở góc
        setTimeout(() => window.location.reload(), 1500);
      },
      onError: (err) => {
        console.error("Error:", err);
        showToast("Transaction failed. Please try again.", "error");
      }
    });
  } finally {
    setIsProcessing(false);
  }
};



// Hàm tìm link ảnh từ tên món đồ
const getUrlByName = (name) => {
  if (name === 'none') return 'none';
  return inventoryItems.find(item => item.name === name)?.url || 'none';
};

// Chuyển đổi toàn bộ Tên đồ trong tempEquipment thành URL để Avatar hiển thị được
const previewUrls = useMemo(() => ({
  body: currentHero?.data?.content?.fields?.url || 'none', // Thân mặc định từ NFT
  hat: getUrlByName(tempEquipment.hat),
  shirt: getUrlByName(tempEquipment.shirt),
  pants: getUrlByName(tempEquipment.pants),
  shoes: getUrlByName(tempEquipment.shoes),
  gloves: getUrlByName(tempEquipment.gloves),
  armor: getUrlByName(tempEquipment.armor),
  weapon: getUrlByName(tempEquipment.weapon),
}), [currentHero, tempEquipment, inventoryItems]);





  // --- 4. ACTION HANDLERS ---
  const navItems = [
    { id: 'heroes', label: 'Hero Vault', icon: Trophy }, 
    { id: 'fusion', label: 'Fusion Lab', icon: Sparkles },
    { id: 'inventory', label: 'Inventory', icon: Package }, 
    { id: 'market', label: 'Marketplace', icon: Store }, 
    { id: 'farm', label: 'Farm Zone', icon: Skull },
  ];

  const handleClaim = () => {
    if (accumulatedSets === 0) return;
    setIsProcessing(true);
    workout(currentHeroId, accumulatedSets, () => {
      setAccumulatedSets(0);
      setIsProcessing(false);
      setIsWorkoutStarted(false);
    });
  };

  const handleFuse = async (ids) => {
    setIsProcessing(true);
    try {
      await fuseHeroes(ids[0], ids[1], ids[2]); 
      setActiveTab('heroes');
    } finally {
      setIsProcessing(false);
    }
  };

const handleSlayMonster = (monsterMaxHP) => {
    setPendingMonsterHP(prev => prev + monsterMaxHP);
  };

// --- Inside App.jsx Logic & States section ---

// 1. Fetch Item Objects (Gear/NFTs) from Sui
const { data: itemData } = useSuiClientQuery('getOwnedObjects', {
  owner: account?.address,
  filter: { 
    // Replace with your actual Item Struct type from fitsui.move
    StructType: `${PACKAGE_ID}::game::Item` 
  },
  options: { showContent: true },
}, { enabled: !!account });

// 2. Sync fetched data to inventoryItems state
useEffect(() => {
  if (itemData?.data) {
    const formattedItems = itemData.data.map(obj => ({
      objectId: obj.data.objectId,
      name: obj.data.content.fields.name,
      rarity: Number(obj.data.content.fields.rarity),
      part: Number(obj.data.content.fields.part), // 👈 SỬA: 'part_type' thành 'part' cho khớp với Move
      url: obj.data.content.fields.url
    }));
    setInventoryItems(formattedItems);
  }
}, [itemData]);



    // --- Inside App.jsx Action Handlers ---
const handleSaveEquipment = async (finalPreview) => {
  if (!currentHeroId || isProcessing) return;

  setIsProcessing(true); // Start loading pulse
  
  try {
    // Mapping preview names back to their unique Sui Object IDs
    const itemObjectIdsToEquip = Object.values(finalPreview)
      .filter(itemName => itemName !== 'none')
      .map(itemName => {
        const foundItem = inventoryItems.find(item => item.name === itemName);
        return foundItem ? foundItem.objectId : null;
      })
      .filter(id => id !== null);

    console.log("Submitting Gear Update to Sui Network...");

    // Calls the Move function via signAndExecute
    await saveEquipment(currentHeroId, itemObjectIdsToEquip); 
    
    // Give Sui indexer a moment to catch up before stopping the spinner
    setTimeout(() => setIsProcessing(false), 2000);

  } catch (error) {
    setIsProcessing(false);
    console.error("Blockchain Interaction Error:", error);
  }
};


  const toggleEquip = (slot, itemName) => {
    setTempEquipment(prev => ({ ...prev, [slot]: prev[slot] === itemName ? 'none' : itemName }));
  };

  // --- 5. RENDER UI ---
  return (
    <div className="min-h-screen font-sans selection:bg-lime-500/30 text-white relative overflow-x-hidden">
      <Background />
      
      <Navbar 
        account={account} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        navItems={navItems}
        showWalletMenu={showWalletMenu}
        setShowWalletMenu={setShowWalletMenu}
        disconnect={disconnect}
      />

      <main className="relative z-10 pt-32 pb-32 md:pb-12 px-4 max-w-7xl mx-auto">
        {!account ? (
          <LandingPage />
        ) : (
          <div className="animate-fade-in">
            
            {/* TAB 1: HERO VAULT */}
            {activeTab === 'heroes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-950/60 border border-lime-500/10 rounded-3xl p-6 backdrop-blur-2xl">
                    <HeroSelector heroes={heroes} selectedId={currentHeroId} onSelect={setSelectedHeroId} onMint={mintHero} nextMintTime={nextMintTime} />
                    
                    {currentHero?.data ? (
                      <HeroCard 
                        hero={currentHero.data} 
                        stamina={displayStamina}
                        staminaProgress={staminaProgress}
                        tempEquipment={previewUrls} 
                        elementInfo={ELEMENT_MAP[currentHero.data.content?.fields?.element] || ELEMENT_MAP[0]}
                        nextLevelXP={nextLevelXP} 
                      />
                    ) : (
                      <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl text-gray-500 uppercase font-black text-xs tracking-widest">No Hero Selected</div>
                    )}

                    
                  </div>
                </div>

                {/* --- PHẦN TRAINING ZONE CHUẨN THEO CODE CỦA NÍ --- */}
<div className="lg:col-span-8 space-y-6">
  <div className="bg-slate-950/60 border border-lime-500/10 rounded-3xl p-1 backdrop-blur-2xl flex flex-col relative min-h-[480px]">
    <div className="p-6 flex justify-between items-end border-b border-white/5">
      <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Training <span className="text-lime-400">Zone</span></h2>
      <div className="bg-lime-500/10 border border-lime-500/20 px-4 py-1 rounded-lg">
        <p className="text-xl font-black text-lime-400 uppercase">3 SQUATS / SET</p>
      </div>
    </div>
    
    <div className="p-4 flex-1 flex items-center justify-center">
      {!isWorkoutStarted ? (
        <div className="text-center space-y-6">
          {/* Vòng tròn icon Play ní muốn giữ đây */}
          <div className="w-24 h-24 bg-lime-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-lime-500/30">
            <Play className="w-10 h-10 text-lime-400 fill-lime-400" />
          </div>
          <button 
      disabled={displayStamina < 10 || isProcessing} // ✅ Chỉ cần 10 Stamina là cho START
      onClick={() => setIsWorkoutStarted(true)} 
  className="bg-gradient-to-r from-lime-400 to-emerald-600 px-10 py-5 rounded-2xl text-slate-950 font-black text-xl shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:scale-105 transition-all uppercase disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
>
  {displayStamina < 10 ? "NOT ENOUGH STAMINA (NEED 10)" : "START TRAINING"}
    </button>
        </div>
      ) : (
        <AIWorkout 
    onSessionUpdate={() => setAccumulatedSets(s => s + 1)} 
    onAutoStop={() => setIsWorkoutStarted(false)} // 👈 THÊM DÒNG NÀY: Hàm để tắt Camera
    isProcessing={isProcessing} 
    stamina={displayStamina} // 👈 Truyền stamina hiện tại xuống
    accumulatedSets={accumulatedSets} // 👈 Truyền số Set đã tập xong xuống
  />
      )}
    </div>
  </div>

  {/* PHẦN REWARD CLAIM (ĐÚNG PHONG CÁCH NEON CỦA NÍ) */}
  {accumulatedSets > 0 && (
  <div className="flex flex-col items-center gap-4 md:gap-6 py-6 md:py-10 bg-lime-500/5 rounded-3xl border border-lime-500/20 shadow-2xl animate-fade-in w-full max-w-sm md:max-w-xl mx-auto px-4 md:px-0">
    {/* ✅ Thêm w-full max-w-sm và px-4 để khung không bị tràn viền điện thoại */}
    
    <div className="flex items-center gap-2 md:gap-3">
      <Activity className="text-lime-400 w-4 h-4 md:w-5 md:h-5 animate-bounce" />
      <span className="font-black text-lime-400 uppercase tracking-wider md:tracking-[0.2em] text-[10px] md:text-xs text-center">
        Session complete: {accumulatedSets} Sets Finished! 🔥
      </span>
    </div>

    {/* ✅ Nút bấm: mobile bỏ scale-110, desktop giữ md:scale-110 */}
    <button onClick={handleClaim} disabled={isProcessing} className="relative group active:scale-95 transition-all w-[95%] md:w-auto md:scale-110">
      <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-emerald-600 rounded-2xl blur md:blur-lg opacity-70 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative bg-slate-950 border border-white/20 px-4 py-4 md:px-12 md:py-5 rounded-2xl flex items-center justify-center gap-2 md:gap-4 hover:bg-slate-800 transition-all">
        {/* ✅ Chữ trong nút: mobile text-sm, desktop text-2xl. Thêm whitespace-nowrap để không bị rớt dòng */}
        <span className="text-sm md:text-2xl font-black text-white uppercase tracking-tight md:tracking-tighter whitespace-nowrap">
          {isProcessing ? "Confirming..." : `FINISH & CLAIM ${accumulatedSets * 10} XP`}
        </span>
        <Trophy className="text-lime-400 w-4 h-4 md:w-6 md:h-6" />
      </div>
    </button>

    {/* ✅ Dòng text nhỏ: mobile giảm tracking xuống để không bị vỡ dòng */}
    <p className="text-gray-600 text-[8px] md:text-[9px] font-black uppercase tracking-normal md:tracking-[0.4em] mt-1 md:mt-2 text-center">
      Permanently record results on Sui Blockchain
    </p>
  </div>
)}


</div>
              </div>
            )}

            {/* TAB 2: FUSION LAB */}
            {activeTab === 'fusion' && (
              <FusionZone heroes={heroes} onFuse={handleFuse} isProcessing={isProcessing} />
            )}

            {/* TAB 3: INVENTORY VAULT */}
{activeTab === 'inventory' && (
              <Inventory 
                items={inventoryItems} 
                heroes={heroes}
                currentHero={currentHero}
                onSelectHero={setSelectedHeroId}
                tempEquipment={tempEquipment} 
                previewUrls={previewUrls}
                onToggleEquip={toggleEquip}
                onSave={handleSaveEquipment} 
                isProcessing={isProcessing}
                elementMap={ELEMENT_MAP}
                nextLevelXP={nextLevelXP}
              />
)}


{activeTab === 'farm' && (
      <HuntingGrounds 
        hero={currentHero?.data} 
        previewUrls={previewUrls} 
        onSlay={handleSlayMonster} 
        pendingMonsterHP={pendingMonsterHP} // 👈 TRUYỀN XUỐNG
        onClaim={handleClaimFarmRewards}   // 👈 TRUYỀN XUỐNG
        isProcessing={isProcessing}
        stamina={displayStamina}
  />
)}



            {/* TABS: INVENTORY & MARKETPLACE */}
            {(activeTab === 'market') && (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-950/60 rounded-3xl border border-white/5 text-center">
                <h2 className="text-3xl font-black uppercase mb-2 italic">{activeTab} Vault</h2>
                <p className="text-lime-500/60 font-bold uppercase tracking-widest text-sm">🚧 Feature Under Construction</p>
              </div>
            )}

          </div>
        )}

        
        
      </main>
      <Footer />

        {/* 👇 DÁN ĐOẠN NÀY VÀO ĐÂY (TRƯỚC THẺ </div> CUỐI CÙNG) */}
        {account && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 pb-10 flex justify-between items-center animate-fade-in-up">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-lime-400 scale-110' : 'text-gray-500'}`}
              >
                <div className={`p-2 rounded-xl ${activeTab === item.id ? 'bg-lime-500/20 ring-1 ring-lime-500/50' : ''}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      
    </div>

    
  );
}

export default App;