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

  const checkCooldown = async () => {
    if (!account) return;
    try {
      const gameInfoObj = await client.getObject({ id: GAME_INFO_ID, options: { showContent: true } });
      const mintersTableId = gameInfoObj.data?.content?.fields?.minters?.fields?.id?.id;
      if (!mintersTableId) return;
      const result = await client.getDynamicFieldObject({ parentId: mintersTableId, name: { type: 'address', value: account.address } });
      if (result.data?.content?.fields?.value) {
        setNextMintTime(parseInt(result.data.content.fields.value) + 86400000);
      }
    } catch (e) { setNextMintTime(0); }
  };

  useEffect(() => { checkCooldown(); }, [account]);

  const { data: heroData, refetch } = useSuiClientQuery('getOwnedObjects', {
    owner: account?.address,
    filter: { StructType: `${PACKAGE_ID}::game::Hero` },
    options: { showContent: true },
  }, { enabled: !!account, refetchInterval: 5000 });

  const mintHero = () => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::create_hero`,
      arguments: [txb.pure.string('SuiFighter'), txb.pure.u8(0), txb.object(GAME_INFO_ID), txb.object(CLOCK_ID)],
    });
    signAndExecute({ transaction: txb }, {
      onSuccess: () => { toast.success('✅ Triệu hồi thành công!'); setTimeout(() => { refetch(); checkCooldown(); }, 1000); },
      onError: () => toast.error('❌ Lỗi giao dịch hoặc cooldown.'),
    });
  };

  const workout = (heroId, multiplier, onSuccess) => {
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::game::workout`,
      arguments: [txb.object(heroId), txb.object(GAME_INFO_ID), txb.object(CLOCK_ID), txb.pure.u64(multiplier)],
    });
    signAndExecute({ transaction: txb }, {
      onSuccess: () => { toast.success(`💪 Nhận XP thành công cho ${multiplier} hiệp!`); setTimeout(refetch, 1000); onSuccess?.(); },
      onError: (err) => toast.error(err.message.includes("2") ? "😫 Hết thể lực!" : "❌ Lỗi ví."),
    });
  };

  return { account, heroes: heroData?.data || [], mintHero, workout, nextMintTime, refetch };
};