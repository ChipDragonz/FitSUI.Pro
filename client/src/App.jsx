import { ConnectButton } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useGame } from './hooks/useGame';
import HeroSelector from './components/HeroSelector';
import HeroCard from './components/HeroCard';
import AIWorkout from './components/AIWorkout';
import { Dumbbell, Activity, Trophy, Package, Store } from 'lucide-react';

function App() {
  // 👇 QUAN TRỌNG: Đã lấy nextMintTime ra ở đây để tránh lỗi màn hình trắng
  const { account, heroes, mintHero, workout, nextMintTime } = useGame();
  
  const [activeTab, setActiveTab] = useState('heroes');
  const [selectedHeroId, setSelectedHeroId] = useState('');

  const currentHeroId = selectedHeroId || (heroes.length > 0 ? heroes[0].data.objectId : '');
  const currentHero = heroes.find(h => h.data.objectId === currentHeroId);

  const navItems = [
    { id: 'heroes', label: 'Kho Hero', icon: Trophy },
    { id: 'inventory', label: 'Kho Đồ', icon: Package },
    { id: 'market', label: 'Giao Dịch', icon: Store },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30 text-white">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setActiveTab('heroes')}
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Dumbbell className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight leading-none">
                  FitSui<span className="text-blue-500">.Pro</span>
                </h1>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Move to Earn</p>
              </div>
            </div>

            {/* Menu Giữa */}
            {account && (
              <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Connect Button - NAVBAR */}
            <div className="flex items-center gap-4">
              <ConnectButton 
                connectText="Kết Nối Ví"
                className="!bg-gradient-to-r !from-blue-600 !to-indigo-600 !text-white !font-bold !rounded-xl !px-6 !py-3 !transition-all !duration-300 hover:!shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:!scale-105 !border-none" 
              />
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-32 pb-12 px-4 max-w-7xl mx-auto">
        
        {!account ? (
          // MÀN HÌNH CHÀO (CHƯA LOGIN)
          <div className="text-center mt-20 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm uppercase tracking-wider mb-4">
              <Activity className="w-4 h-4" /> Next Gen Web3 Fitness
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tight">
              Train hard. <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                Get paid.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Biến mồ hôi thành tài sản kỹ thuật số. Sử dụng AI để theo dõi quá trình tập luyện ngay trên trình duyệt.
            </p>
            
            {/* NÚT KẾT NỐI TO */}
            <div className="pt-8 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <ConnectButton 
                    connectText="🚀 KẾT NỐI VÍ ĐỂ BẮT ĐẦU NGAY"
                    className="!bg-slate-900 !text-white !text-xl !font-black !tracking-wide !px-10 !py-6 !rounded-2xl !border !border-white/10 hover:!bg-slate-800 transition-all flex items-center gap-3"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // NỘI DUNG CHÍNH (ĐÃ LOGIN)
          <div className="animate-fade-in">
            {activeTab === 'heroes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                       <Trophy className="w-5 h-5 text-yellow-500" />
                       <h2 className="text-lg font-bold text-white uppercase tracking-wider">Fighter Selection</h2>
                    </div>
                    
                    {/* 👇 Đã truyền nextMintTime vào đây */}
                    <HeroSelector 
                      heroes={heroes} 
                      selectedId={currentHeroId} 
                      onSelect={setSelectedHeroId} 
                      onMint={() => mintHero()} 
                      nextMintTime={nextMintTime} 
                    />
                    
                    <div className="mt-8">
                      {currentHero ? <HeroCard hero={currentHero.data} /> : (
                         <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 bg-black/20">
                           <p>Chưa chọn nhân vật</p>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-1 backdrop-blur-md shadow-2xl h-full flex flex-col">
                    <div className="p-6 pb-4 flex justify-between items-end">
                      <div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter">TRAINING ZONE</h2>
                        <p className="text-gray-400 font-medium flex items-center gap-2 mt-1 text-sm">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          AI Camera System Online
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Daily Mission</p>
                        <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg">
                          <p className="text-xl font-black text-blue-400">3 SQUATS</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-inner border border-white/5 relative group min-h-[500px]">
                        {currentHero ? (
                          <AIWorkout onWorkoutComplete={(count) => { if (count === 3) workout(currentHeroId); }} />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-black/80">
                            <Dumbbell className="w-24 h-24 mb-6 opacity-20" />
                            <p className="text-xl font-bold text-gray-400">Chọn Hero để mở khóa Camera</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CÁC TAB KHÁC */}
            {activeTab === 'inventory' && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 text-center">
                <Package className="w-24 h-24 text-purple-500/20 mb-6" />
                <h2 className="text-3xl font-black text-white mb-2">Kho Vật Phẩm</h2>
                <button className="px-6 py-3 bg-white/10 rounded-xl font-bold text-gray-400 cursor-not-allowed mt-4">🚧 Đang phát triển</button>
              </div>
            )}
            {activeTab === 'market' && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 text-center">
                <Store className="w-24 h-24 text-green-500/20 mb-6" />
                <h2 className="text-3xl font-black text-white mb-2">Chợ Giao Dịch</h2>
                <button className="px-6 py-3 bg-white/10 rounded-xl font-bold text-gray-400 cursor-not-allowed mt-4">Coming Soon</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;