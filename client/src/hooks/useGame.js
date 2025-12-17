import { useSignAndExecuteTransaction, useSuiClientQuery, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, GAME_INFO_ID, CLOCK_ID } from '../utils/constants';
// 👇 Import useToast
import { useToast } from '../context/ToastContext';

export const useGame = () => {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  // 👇 Khởi tạo Toast
  const toast = useToast(); 

  // 1. Tự động lấy danh sách Hero của user
  const { data: heroData, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address,
      filter: { StructType: `${PACKAGE_ID}::game::Hero` },
      options: { showContent: true },
    },
    { 
      enabled: !!account,
      refetchInterval: 5000 
    }
  );

  // 2. Hàm Mint Hero (Có xử lý thông báo đẹp)
  const mintHero = (onSuccess) => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::create_hero`,
      arguments: [
        txb.pure.string('HeroFighter'), // Tên Hero
        txb.pure.u8(0),                // Hệ (0 = Fire)
        txb.object(GAME_INFO_ID),      // Game Info
        txb.object(CLOCK_ID)           // Clock (để check 24h)
      ],
    });

    signAndExecute({ transaction: txb }, {
      onSuccess: (result) => {
        // 👇 Thay alert bằng toast xanh
        toast.success('✅ Đã triệu hồi Chiến binh thành công!');
        setTimeout(refetch, 1000); 
        onSuccess?.(result);
      },
      onError: (err) => {
        console.error("Lỗi Mint:", err);
        
        // 👇 Xử lý lỗi 24h (Mã lỗi 4 hoặc MoveAbort)
        if (err.message.includes("4") || err.message.includes("MoveAbort")) {
           toast.error("⏳ Hôm nay bạn đã nhận Hero rồi! Quay lại sau 24h nhé.");
        } else {
           toast.error('❌ Giao dịch thất bại. Vui lòng thử lại.');
        }
      },
    });
  };

  // 3. Hàm Workout (Có xử lý thông báo đẹp)
  const workout = (heroId, onSuccess) => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::workout`,
      arguments: [
        txb.object(heroId),
        txb.object(GAME_INFO_ID),
        txb.object(CLOCK_ID)
      ],
    });

    signAndExecute({ transaction: txb }, {
      onSuccess: (result) => {
        // 👇 Thay alert bằng toast xanh
        toast.success('💪 Tập luyện thành công! +XP');
        setTimeout(refetch, 1000);
        onSuccess?.(result);
      },
      onError: (err) => {
        console.error("Lỗi Workout:", err);
        
        // 👇 Xử lý lỗi Hết thể lực hoặc Hồi chiêu
        if(err.message.includes("2")) {
           toast.error("😫 Hết thể lực! Hãy nghỉ ngơi chút nhé.");
        } else if (err.message.includes("3")) {
           toast.error("⏳ Đang hồi chiêu! Đừng tập gấp quá.");
        } else {
           toast.error('❌ Lỗi không xác định.');
        }
      }
    });
  };

  return {
    account,
    heroes: heroData?.data || [],
    mintHero,
    workout,
    refetch 
  };
};