import { 
  useDisconnectWallet, 
  useSuiClientQuery, 
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient 
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
import { Trophy, Package, Store, Sparkles, Play, Activity, Skull } from 'lucide-react';
const SLOTS = ["shield", "cloak", "pants", "shirt", "gloves", "necklace", "sword"];

function App() {
  const client = useSuiClient();
  const toast = useToast();
  const { account, heroes, mintHero, workout, fuseHeroes, nextMintTime, refetchHeroes } = useGame();
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // --- 1. ELEMENT CONFIGURATION ---
  const ELEMENT_MAP = {
    0: { label: "METAL", color: "text-yellow-400", border: "border-yellow-500/50", shadow: "shadow-yellow-500/20" },
    1: { label: "WOOD", color: "text-emerald-400", border: "border-emerald-500/50", shadow: "shadow-emerald-500/20" },
    2: { label: "WATER", color: "text-blue-400", border: "border-blue-500/50", shadow: "shadow-blue-400/20" },
    3: { label: "FIRE", color: "text-red-400", border: "border-red-500/50", shadow: "shadow-red-500/20" },
    4: { label: "EARTH", color: "text-orange-700", border: "border-orange-900/50", shadow: "shadow-orange-900/20" }
  };

  // ✅ STATE TRANG BỊ VỚI TÊN MỚI
  const [onChainItemsMetadata, setOnChainItemsMetadata] = useState({});
  const [tempEquipment, setTempEquipment] = useState({ 
    shield: 'none', cloak: 'none', pants: 'none', shirt: 'none', gloves: 'none', necklace: 'none', sword: 'none' 
  });

  const [pendingMonsterHP, setPendingMonsterHP] = useState(0);
  const [inventoryItems, setInventoryItems] = useState([]); 
  const [activeTab, setActiveTab] = useState('heroes');
  const [selectedHeroId, setSelectedHeroId] = useState('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [accumulatedSets, setAccumulatedSets] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [staminaProgress, setStaminaProgress] = useState(0);
  const [displayStamina, setDisplayStamina] = useState(0);
  const [allHeroesGear, setAllHeroesGear] = useState({});

  const currentHeroId = selectedHeroId || (heroes[0]?.data?.objectId || '');
  const currentHero = heroes.find(h => h.data.objectId === currentHeroId);

// ✅ SỬA LẠI: Loại bỏ Shirt (Part 3) ra khỏi tổng Strength
const getHeroTotalStrength = (hero) => {
  const fields = hero?.data?.content?.fields;
  if (!fields) return 1; 

  let totalStrength = Number(fields.strength || 1);

  Object.entries(tempEquipment).forEach(([slot, itemName]) => {
    // 🛑 CHỖ QUAN TRỌNG: Thêm điều kiện slot !== 'shirt'
    if (itemName !== 'none' && slot !== 'shirt') { 
      const meta = onChainItemsMetadata[slot];
      const bonusOnChain = (meta && meta.name === itemName) ? meta.bonus : 0;
      
      const itemInInventory = inventoryItems.find(i => i.name === itemName);
      const bonusInInv = itemInInventory ? Number(itemInInventory.bonus || 0) : 0;

      totalStrength += Math.max(bonusOnChain, bonusInInv);
    }
  });
  return totalStrength;
};
  
 const currentTotalStrength = getHeroTotalStrength(currentHero);
  const nextLevelXP = currentHero ? Math.pow((Number(currentHero.data.content?.fields?.level || 0) + 1), 3) * 100 : 0;



useEffect(() => {
  const syncGearOnReload = async () => {
    if (!currentHeroId || !client) return;
    try {
      const dynamicFields = await client.getDynamicFields({ parentId: currentHeroId });
      
      const onChainGearNames = { 
        shield: 'none', cloak: 'none', pants: 'none', 
        shirt: 'none', gloves: 'none', necklace: 'none', sword: 'none' 
      };
      const onChainMeta = {}
      const promises = dynamicFields.data.map(async (field) => {
        const partId = parseInt(field.name.value);
        if (partId >= 0 && partId < 7) {
          const itemObj = await client.getObject({ id: field.objectId, options: { showContent: true } });
          const f = itemObj.data?.content?.fields;
          if (f) {
            // ✅ Bây giờ SLOTS[3] sẽ trả về đúng "shirt" từ dòng 23 đầu file
            const correctKey = SLOTS[partId]; 
            onChainGearNames[correctKey] = f.name;
            onChainMeta[correctKey] = { 
              name: f.name, 
              url: f.url, 
              rarity: Number(f.rarity || 0), 
              bonus: Number(f.bonus || 0) 
            };
          }
        }
      });

      await Promise.all(promises);
      setOnChainItemsMetadata(onChainMeta);
      if (!isProcessing) setTempEquipment(onChainGearNames);
    } catch (e) { console.error("Sync Error:", e); }
  };
  syncGearOnReload();
}, [currentHeroId, client, account, heroes, isProcessing]);

useEffect(() => {
  const fetchAllHeroesGear = async () => {
    if (!heroes || heroes.length === 0 || !client) return;
    
    const newGearMap = {};
    // ✅ THAY ĐỔI: Phải dùng SLOTS mới theo Part ID 0-6
    const CURRENT_SLOTS = ["shield", "cloak", "pants", "shirt", "gloves", "necklace", "sword"];

    try {
      const gearPromises = heroes.map(async (hero) => {
        const id = hero.data.objectId;
        // Khởi tạo object trang bị với key mới
        const gear = { 
          body: hero.data.content.fields.url, 
          shield: 'none', cloak: 'none', pants: 'none', 
          shirt: 'none', gloves: 'none', necklace: 'none', sword: 'none' 
        };

        const dfs = await client.getDynamicFields({ parentId: id });
        
        for (const field of dfs.data) {
          const partId = parseInt(field.name.value);
          if (partId >= 0 && partId < 7) {
            const itemObj = await client.getObject({ id: field.objectId, options: { showContent: true } });
            const f = itemObj.data?.content?.fields;
            // ✅ QUAN TRỌNG: Gán đúng Key theo Part ID mới
            if (f) gear[CURRENT_SLOTS[partId]] = f.url; 
          }
        }
        return { id, gear };
      });

      const results = await Promise.all(gearPromises);
      results.forEach(res => { newGearMap[res.id] = res.gear; });
      setAllHeroesGear(newGearMap);
    } catch (e) { console.error("Fusion Gear Sync Error:", e); }
  };

  fetchAllHeroesGear();
}, [heroes, client]);


// 3. LOGIC HỒI STAMINA: Gắn vào Shirt (Part 3)
  useEffect(() => {
    const fields = currentHero?.data?.content?.fields;
    if (!fields) return;

// ✅ SỬA LẠI: Kiểm tra bonus từ cả đồ mặc thật lẫn đồ mặc thử
const updateStamina = () => {
  const now = Date.now();
  const fields = currentHero?.data?.content?.fields;
  const lastUpdate = Number(fields.last_update_timestamp || 0);
  const staminaOnChain = Number(fields.stamina || 0);
  const maxStamina = 100 + (Number(fields.level || 0) * 15);

  let amountPerMin = 1; // Stamina gốc
  const shirtName = tempEquipment.shirt; // Món Shirt (Part 3)

  if (shirtName !== 'none') {
    // 1. Kiểm tra bonus từ áo ĐÃ MẶC THẬT (Quét từ blockchain)
    const meta = onChainItemsMetadata.shirt;
    const bonusOnChain = (meta && meta.name === shirtName) ? meta.bonus : 0;
    
    // 2. Kiểm tra bonus từ áo ĐANG MẶC THỬ (Tìm trong kho đồ)
    const itemInInventory = inventoryItems.find(i => i.name === shirtName);
    const bonusInInv = itemInInventory ? Number(itemInInventory.bonus || 0) : 0;

    // Lấy bonus lớn nhất (Đảm bảo dù mặc thật hay đang thử đều được cộng)
    amountPerMin += Math.max(bonusOnChain, bonusInInv); 
  }

  const timePassed = Math.max(0, now - lastUpdate);
  const intervals = Math.floor(timePassed / 60000); // 60 giây hồi 1 lần
  const totalStamina = Math.min(maxStamina, staminaOnChain + (intervals * amountPerMin));

  setDisplayStamina(totalStamina);
  setStaminaProgress(totalStamina >= maxStamina ? 100 : ((timePassed % 60000) / 60000) * 100);
};

    updateStamina();
    const interval = setInterval(updateStamina, 1000);
    return () => clearInterval(interval);
  }, [currentHero, tempEquipment.shirt, inventoryItems, onChainItemsMetadata]);



// 1. TỐI ƯU HÀM SĂN QUÁI (FARM ZONE)
const handleClaimFarmRewards = async () => { 
  const heroStrength = getHeroTotalStrength(currentHero); // Tính sức mạnh tổng
  const staminaNeeded = Math.ceil(pendingMonsterHP / heroStrength); 

  if (pendingMonsterHP < 1 || !currentHero || isProcessing) return;
  if (displayStamina < staminaNeeded) {
    toast.error(`Need ${staminaNeeded} stamina!`); 
    return;
  }

  try {
    setIsProcessing(true);
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::slay_monster`, 
      arguments: [
        txb.object(currentHero.data.objectId),
        txb.object(GAME_INFO_ID),
        txb.object(CLOCK_ID),
        txb.pure.u64(pendingMonsterHP),
      ],
    });

    signAndExecuteTransaction({ transaction: txb }, {
      onSuccess: async (response) => {
        setPendingMonsterHP(0);
        setTimeout(async () => {
          try {
            const txData = await client.getTransactionBlock({ digest: response.digest, options: { showEvents: true } });
            const dropEvent = txData.events?.find(e => e.type.toLowerCase().includes("itemdropped"));
            if (dropEvent && dropEvent.parsedJson) {
              toast.showLoot(Number(dropEvent.parsedJson.rarity), dropEvent.parsedJson.name, dropEvent.parsedJson.url);
            } else {
              toast.success(`Victory! Gained XP.`);
            }
          } catch (err) { console.error(err); }
          finally { 
            if (refetchItems) refetchItems(); 
            if (refetchHeroes) refetchHeroes(); 
            setIsProcessing(false); 
          }
        }, 1200);
      },
      onError: () => { toast.error("Transaction failed!"); setIsProcessing(false); }
    });
  } catch (e) { setIsProcessing(false); }
};


// Hàm tìm link ảnh từ tên món đồ
const getUrlByName = (name) => {
  if (name === 'none') return 'none';
  return inventoryItems.find(item => item.name === name)?.url || 'none';
};

// 4. PREVIEW URLS CHO AVATAR
  const previewUrls = useMemo(() => {
    const getUrl = (slot, name) => {
      if (name === 'none') return 'none';
      if (onChainItemsMetadata[slot]?.name === name) return onChainItemsMetadata[slot].url;
      return inventoryItems.find(item => item.name === name)?.url || 'none';
    };

    return {
      body: currentHero?.data?.content?.fields?.url || 'none',
      shield: getUrl('shield', tempEquipment.shield),
      cloak: getUrl('cloak', tempEquipment.cloak),
      pants: getUrl('pants', tempEquipment.pants),
      shirt: getUrl('shirt', tempEquipment.shirt),
      gloves: getUrl('gloves', tempEquipment.gloves),
      necklace: getUrl('necklace', tempEquipment.necklace),
      sword: getUrl('sword', tempEquipment.sword),
    };
  }, [currentHero, tempEquipment, inventoryItems, onChainItemsMetadata]);




  // --- 4. ACTION HANDLERS ---
  const navItems = [
    { id: 'heroes', label: 'Hero Vault', icon: Trophy }, 
    { id: 'fusion', label: 'Fusion Lab', icon: Sparkles },
    { id: 'inventory', label: 'Inventory', icon: Package }, 
    { id: 'market', label: 'Marketplace', icon: Store }, 
    { id: 'farm', label: 'Farm Zone', icon: Skull },
  ];

// --- TRONG App.jsx: handleClaim cho Squat ---
const handleClaim = () => {
    if (accumulatedSets === 0 || isProcessing) return;
    setIsProcessing(true);
    workout(currentHeroId, accumulatedSets, (response) => {
      setTimeout(async () => {
        try {
          const txData = await client.getTransactionBlock({ digest: response.digest, options: { showEvents: true } });
          const dropEvent = txData.events?.find(e => e.type.toLowerCase().includes("itemdropped"));
          if (dropEvent && dropEvent.parsedJson) {
            toast.showLoot(Number(dropEvent.parsedJson.rarity), dropEvent.parsedJson.name, dropEvent.parsedJson.url);
          } else {
            const xp = (getHeroTotalStrength(currentHero) * 10) * accumulatedSets;
            toast.success(`Training Complete! Gained ${xp} XP.`); 
          }
          await refetchItems(); 
          await refetchHeroes(); 
          setAccumulatedSets(0);
          setIsWorkoutStarted(false);
        } catch (e) { console.error(e); }
        finally { setIsProcessing(false); }
      }, 2000);
    });
  };



const handleFuse = async (ids) => {
    setIsProcessing(true);
    try { await fuseHeroes(ids[0], ids[1], ids[2]); setActiveTab('heroes'); }
    finally { setIsProcessing(false); }
  };

const handleSlayMonster = (monsterMaxHP) => {
    setPendingMonsterHP(prev => prev + monsterMaxHP);
  };

// --- Inside App.jsx Logic & States section ---

// 1. Fetch Item Objects (Gear/NFTs) from Sui
const { data: itemData, refetch: refetchItems } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address,
    filter: { StructType: `${PACKAGE_ID}::game::Item` },
    options: { showContent: true },
  }, { enabled: !!account });

// 2. Sync fetched data to inventoryItems state
useEffect(() => {
    if (itemData?.data) {
      const formattedItems = itemData.data.map(obj => ({
        objectId: obj.data.objectId,
        name: obj.data.content.fields.name,
        rarity: Number(obj.data.content.fields.rarity),
        part: Number(obj.data.content.fields.part),
        url: obj.data.content.fields.url,
        bonus: Number(obj.data.content.fields.bonus || 0) 
      }));
      setInventoryItems(formattedItems);
    }
  }, [itemData]);



// 5. LƯU TRANG BỊ LÊN CHUỖI
  const handleSaveEquipment = async (finalPreview) => {
    if (!currentHeroId || isProcessing) return;
    setIsProcessing(true);
    try {
      const txb = new Transaction();

      SLOTS.forEach((slotName, index) => {
        if (onChainItemsMetadata[slotName] && finalPreview[slotName] === 'none') {
          txb.moveCall({ target: `${PACKAGE_ID}::game::unequip_item`, arguments: [txb.object(currentHeroId), txb.pure.u8(index)] });
        }
      });

      const itemObjectIdsToEquip = Object.entries(finalPreview)
        .filter(([slot, name]) => name !== 'none' && onChainItemsMetadata[slot]?.name !== name)
        .map(([slot, name]) => inventoryItems.find(item => item.name === name)?.objectId)
        .filter(id => !!id);

      if (itemObjectIdsToEquip.length > 0) {
        txb.moveCall({
          target: `${PACKAGE_ID}::game::equip_multiple_items`,
          arguments: [txb.object(currentHeroId), txb.makeMoveVec({ elements: itemObjectIdsToEquip.map(id => txb.object(id)) })],
        });
      }

      signAndExecuteTransaction({ transaction: txb }, {
        onSuccess: () => {
          toast.success("Syncing with Blockchain...");
          setTimeout(async () => {
            try {
              await refetchItems(); 
              if (refetchHeroes) await refetchHeroes(); 
            } catch (err) { console.error(err); }
            finally { setIsProcessing(false); }
          }, 4000); 
        },
        onError: () => { toast.error("Save Failed!"); setIsProcessing(false); }
      });
    } catch (error) { setIsProcessing(false); }
  };


// ✅ SỬA LẠI: Đồng bộ Key trang bị mới cho Hero mới Mint
const allHeroesEquipmentMap = useMemo(() => {
  const map = { ...allHeroesGear };

  heroes?.forEach((hero) => {
    const id = hero.data.objectId;
    if (!map[id]) {
      map[id] = {
        body: hero.data.content.fields.url,
        // ✅ ĐỒNG BỘ KEY MỚI
        shield: 'none', cloak: 'none', pants: 'none', 
        shirt: 'none', gloves: 'none', necklace: 'none', sword: 'none'
      };
    }
  });

  return map;
}, [heroes, allHeroesGear]);


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
  {/* 1. Phần chọn Hero và Mint */}
  <HeroSelector 
    heroes={heroes} 
    selectedId={currentHeroId} 
    onSelect={setSelectedHeroId} 
    onMint={mintHero} 
    nextMintTime={nextMintTime} 
  />
  
  {/* 2. THÊM KHOẢNG CÁCH Ở ĐÂY BẰNG mt-10 (Margin Top) */}
  <div className="mt-10"> 
    {currentHero?.data ? (
      <HeroCard 
        hero={currentHero.data} 
        totalStrength={currentTotalStrength}
        stamina={displayStamina}
        staminaProgress={staminaProgress}
        tempEquipment={previewUrls}
        isAnimated={true}
        onChainItemsMetadata={onChainItemsMetadata}
        inventoryItems={inventoryItems}
        elementInfo={ELEMENT_MAP[currentHero.data.content?.fields?.element] || ELEMENT_MAP[0]}
        nextLevelXP={nextLevelXP} 
      />
    ) : (
      <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-3xl text-gray-500 uppercase font-black text-xs tracking-widest">
        No Hero Selected
      </div>
    )}
  </div>
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
  {isProcessing ? "Confirming..." : (
    <>
      FINISH & CLAIM 
      <span className="text-lime-400 mx-2">
        {/* ✅ Lấy (Tổng Str x 10) x Số Set */}
        {(getHeroTotalStrength(currentHero) * 10) * accumulatedSets}
      </span> 
      XP
    </>
  )}
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
  <FusionZone 
    heroes={heroes} 
    onFuse={handleFuse} 
    isProcessing={isProcessing} 
    allHeroesEquipment={allHeroesEquipmentMap} // ✅ Truyền biến đã định nghĩa ở Bước 1
  />
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
    totalStrength={currentTotalStrength}
    onChainItemsMetadata={onChainItemsMetadata} 
  />
)}


{activeTab === 'farm' && (
  <HuntingGrounds 
    hero={currentHero?.data} 
    previewUrls={previewUrls} 
    onSlay={handleSlayMonster} 
    pendingMonsterHP={pendingMonsterHP}
    onClaim={handleClaimFarmRewards}
    isProcessing={isProcessing}
    stamina={displayStamina}
    strength={currentTotalStrength} 
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