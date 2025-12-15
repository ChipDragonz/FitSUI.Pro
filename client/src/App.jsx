import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';
import AIWorkout from './AIWorkout';

const PACKAGE_ID = "0xbc9781277e12207959d452f2fcf412dc7cdba9717ea215f97cca72d0dba3de06";

function App() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [digest, setDigest] = useState('');
  
  // State lưu lựa chọn của người dùng (ban đầu để rỗng)
  const [manualSelection, setManualSelection] = useState(''); 

  // 🔥 TỰ ĐỘNG TÌM HERO TRONG VÍ
  const { data: userObjects, refetch: refetchHeroes } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address,
      filter: { StructType: `${PACKAGE_ID}::game::Hero` },
      options: { showContent: true },
    },
    { enabled: !!account }
  );

  // 🔥 LOGIC THÔNG MINH (Thay thế cho useEffect gây lỗi):
  // Nếu người dùng đã chọn (manualSelection) -> Dùng cái đó.
  // Nếu chưa chọn -> Tự động lấy con đầu tiên trong danh sách (nếu có).
  const currentHeroId = manualSelection || (userObjects?.data?.[0]?.data?.objectId) || '';

  const mintHero = () => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::create_hero`,
      arguments: [txb.pure.string('SuiFighter')],
    });

    signAndExecute(
      { transaction: txb },
      {
        onSuccess: (result) => {
          alert('✅ Đã tạo Hero mới!');
          setDigest(result.digest);
          setTimeout(() => refetchHeroes(), 2000); 
        },
        onError: (err) => alert('Lỗi: ' + err.message),
      },
    );
  };

  const submitWorkout = () => {
    if (!currentHeroId) return alert("Không tìm thấy Hero nào để tập!");
    
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::workout`,
      arguments: [txb.object(currentHeroId)],
    });

    signAndExecute(
      { transaction: txb },
      {
        onSuccess: (result) => {
          console.log('Workout xong:', result);
          setDigest(result.digest);
          alert('💪 CHÚC MỪNG! Đã cộng điểm thành công!');
        },
        onError: (err) => alert('Lỗi: ' + err.message),
      },
    );
  };

  return (
    <div style={{ padding: 20, textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>🏋️‍♂️ FitSui - AI Gym</h1>
      <div style={{ marginBottom: 20 }}> <ConnectButton /> </div>

      {!account ? (
        <p>Kết nối ví để bắt đầu tập!</p>
      ) : (
        <div>
           {/* KHU VỰC CHỌN HERO */}
           <div style={{ padding: 15, background: '#e3f2fd', borderRadius: 10, margin: '20px auto', maxWidth: 500 }}>
              <h3>1. Chọn Nhân vật</h3>
              
              {userObjects?.data?.length > 0 ? (
                <select 
                  style={{ padding: 10, fontSize: 16, width: '100%' }}
                  onChange={(e) => setManualSelection(e.target.value)}
                  value={currentHeroId} // Luôn hiển thị ID đang được dùng
                >
                  {userObjects.data.map((obj, index) => (
                    <option key={obj.data.objectId} value={obj.data.objectId}>
                      🦸‍♂️ Hero #{index + 1} ({obj.data.objectId.slice(0, 5)}...{obj.data.objectId.slice(-4)})
                    </option>
                  ))}
                </select>
              ) : (
                <p>Chưa có nhân vật nào. Hãy Mint ngay!</p>
              )}

              <button 
                onClick={mintHero}
                style={{ marginTop: 10, padding: '5px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}
              >
                + Mint thêm Hero mới
              </button>
           </div>

           {/* KHU VỰC TẬP LUYỆN */}
           {currentHeroId && (
             <div style={{ marginBottom: 30 }}>
                <h2>2. Nhiệm vụ: Squat 3 cái</h2>
                <AIWorkout onWorkoutComplete={(count) => {
                   if(count === 3) {
                      alert("🎉 HOÀN THÀNH! Đang gửi lên Blockchain...");
                      submitWorkout();
                   }
                }} />
             </div>
           )}

           <div style={{ marginTop: 20, fontSize: 12, color: 'gray' }}>
              {digest && <p>Last Tx: {digest}</p>}
           </div>
        </div>
      )}
    </div>
  );
}

export default App;