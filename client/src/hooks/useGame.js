import { useSignAndExecuteTransaction, useSuiClientQuery, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, GAME_INFO_ID, CLOCK_ID } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { useState, useEffect } from 'react';

export const useGame = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const toast = useToast();
  
  // State lưu thời gian được phép mint tiếp theo
  const [nextMintTime, setNextMintTime] = useState(0);

  // 👇 HÀM CHECK COOLDOWN (ĐÃ SỬA LOGIC LẤY TABLE ID)
  const checkCooldown = async () => {
    if (!account) return;
    try {
      // BƯỚC 1: Lấy thông tin GameInfo để tìm ID của bảng 'minters'
      const gameInfoObj = await client.getObject({
        id: GAME_INFO_ID,
        options: { showContent: true }
      });

      // Lấy ID của bảng (Table ID) nằm trong field 'minters'
      const mintersTableId = gameInfoObj.data?.content?.fields?.minters?.fields?.id?.id;
      
      if (!mintersTableId) {
        console.warn("Không tìm thấy bảng Minters!");
        return;
      }

      // BƯỚC 2: Query vào bảng 'minters' bằng ID vừa lấy
      const result = await client.getDynamicFieldObject({
        parentId: mintersTableId, // Dùng Table ID (Chuẩn)
        name: { type: 'address', value: account.address }
      });
      
      // Nếu tìm thấy, lấy timestamp cũ + 24h (86400000ms)
      if (result.data?.content?.fields?.value) {
        const lastMintTime = parseInt(result.data.content.fields.value);
        const unlockTime = lastMintTime + 86400000;
        
        console.log("⏳ Tìm thấy lịch sử Mint:", new Date(lastMintTime).toLocaleString());
        console.log("🔓 Mở khóa lúc:", new Date(unlockTime).toLocaleString());
        
        setNextMintTime(unlockTime);
      }
    } catch (e) {
      // Nếu lỗi (do chưa mint bao giờ) -> Cho phép mint (Time = 0)
      console.log("✨ Chưa từng mint Hero nào (hoặc chưa tìm thấy trong bảng)");
      setNextMintTime(0);
    }
  };

  // Tự động check khi login hoặc khi reload
  useEffect(() => {
    checkCooldown();
  }, [account]);

  // Lấy danh sách Hero
  const { data: heroData, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address,
      filter: { StructType: `${PACKAGE_ID}::game::Hero` },
      options: { showContent: true },
    },
    { enabled: !!account, refetchInterval: 5000 }
  );

  // Hàm Mint Hero
  const mintHero = (onSuccess) => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::create_hero`,
      arguments: [
        txb.pure.string('SuiFighter'), 
        txb.pure.u8(0), 
        txb.object(GAME_INFO_ID),
        txb.object(CLOCK_ID)
      ],
    });

    signAndExecute({ transaction: txb }, {
      onSuccess: (result) => {
        toast.success('✅ Triệu hồi thành công!');
        setTimeout(() => {
          refetch();
          checkCooldown(); // Update lại đồng hồ ngay
        }, 1000);
        onSuccess?.(result);
      },
      onError: (err) => {
        console.error("Lỗi:", err);
        if (err.message.includes("4") || err.message.includes("MoveAbort")) {
           toast.error("⏳ Vẫn đang trong thời gian hồi chiêu!");
           checkCooldown(); // Check lại cho chắc
        } else {
           toast.error('❌ Giao dịch thất bại.');
        }
      },
    });
  };

  // Hàm Workout
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
        toast.success('💪 Tập luyện thành công! +XP');
        setTimeout(refetch, 1000);
        onSuccess?.(result);
      },
      onError: (err) => {
        if(err.message.includes("2")) toast.error("😫 Hết thể lực!");
        else if (err.message.includes("3")) toast.error("⏳ Đang hồi thể lực!");
        else toast.error('❌ Lỗi không xác định.');
      }
    });
  };

  return {
    account,
    heroes: heroData?.data || [],
    mintHero,
    workout,
    nextMintTime, // Xuất biến này ra để UI dùng
    refetch 
  };
};