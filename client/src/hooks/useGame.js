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
  const [nextMintTime, setNextMintTime] = useState(0);

  // 1. Query lấy danh sách Hero
  const { data: heroesData, refetch: refetchHeroes } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address,
      filter: { StructType: `${PACKAGE_ID}::game::Hero` },
      options: { showContent: true },
    },
    { enabled: !!account }
  );

  const checkCooldown = async () => {
    if (!account) return;
    try {
      const gameInfoObj = await client.getObject({ id: GAME_INFO_ID, options: { showContent: true } });
      const mintersTableId = gameInfoObj.data?.content?.fields?.minters?.fields?.id?.id;
      if (!mintersTableId) return;
      const result = await client.getDynamicFieldObject({ parentId: mintersTableId, name: { type: 'address', value: account.address } });
      if (result.data?.content?.fields?.value) {
        // Cooldown 1 phút (60000ms)
        setNextMintTime(parseInt(result.data.content.fields.value) + 60000);
      }
    } catch (e) { setNextMintTime(0); }
  };

  useEffect(() => { checkCooldown(); }, [account]);

  // ✅ MINT HERO: Không được dùng 'callback' ở đây
  const mintHero = () => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::create_hero`,
      arguments: [txb.object(GAME_INFO_ID), txb.object(CLOCK_ID)],
    });
    
    signAndExecute({ transaction: txb }, {
      onSuccess: () => { 
        toast.success('✅ A new SuiHero has been Summoned!'); 
        // ✅ SỬA LỖI: Gọi đúng refetchHeroes()
        setTimeout(() => { 
          refetchHeroes(); 
          checkCooldown(); 
        }, 1500); 
      },
      onError: (err) => {
        console.error("Mint Error:", err);
        toast.error('❌ Transaction failed or Cooldown active.');
      },
    });
  };

  // ✅ WORKOUT: Có dùng callback để App.jsx hiện thông báo rơi đồ
  const workout = (heroId, multiplier, callback) => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::workout`,
      arguments: [txb.object(heroId), txb.object(GAME_INFO_ID), txb.object(CLOCK_ID), txb.pure.u64(multiplier)],
    });
    
    signAndExecute({ transaction: txb }, {
      onSuccess: (response) => { 
        // Gọi callback để trả kết quả về App.jsx
        callback?.(response); 
        setTimeout(() => refetchHeroes(), 1500); 
      },
      onError: (err) => {
        console.error("Workout Error:", err);
        toast.error("❌ Training failed.");
      }
    });
  };

  const fuseHeroes = async (id1, id2, id3) => {
    const txb = new Transaction(); 
    txb.moveCall({
      target: `${PACKAGE_ID}::game::fuse_heroes`,
      arguments: [txb.object(id1), txb.object(id2), txb.object(id3), txb.object(GAME_INFO_ID), txb.object(CLOCK_ID)],
    });

    signAndExecute({ transaction: txb }, {
      onSuccess: () => {
        toast.success('⚡ Evolution successful!');
        setTimeout(() => refetchHeroes(), 1500); 
      },
      onError: (err) => toast.error("❌ Evolution failed."),
    });
  };

  return { 
    account, 
    heroes: heroesData?.data || [], 
    mintHero, 
    workout, 
    fuseHeroes, 
    nextMintTime, 
    refetchHeroes, // ✅ Trả về đúng tên biến cho App.jsx
  };
};