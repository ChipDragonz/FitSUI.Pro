import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENT CON: XỬ LÝ LOGIC BAY CHO TỪNG MÓN ĐỒ ---
const AvatarLayer = ({ src, zIndex, layerName, delay = 0, isAnimated = false }) => {
  if (!src || src === 'none' || src === '#') return null;

  // 🚀 Cấu hình hướng bay "Iron Man"
  const directions = {
    // ✅ CHỈNH TẠI ĐÂY: Bỏ scale để Body không "phóng" ra nữa
    body: { opacity: 0 }, 
    cloak: { x: -50, y: -50, opacity: 0 },
    shield: { x: -120, y: 20, opacity: 0 },
    pants: { y: 60, opacity: 0 },
    shirt: { y: 40, opacity: 0 },
    gloves: { y: 30, x: 20, opacity: 0 },
    necklace: { scale: 1.5, opacity: 0 },
    sword: { x: 100, y: -20, opacity: 0 },
    default: { y: 20, opacity: 0 }
  };

  const startPos = isAnimated ? (directions[layerName] || directions.default) : { opacity: 0 };

  return (
    <motion.img
      src={src}
      key={src}
      initial={startPos}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: isAnimated ? "spring" : "tween",
        stiffness: 80,
        damping: 15,
        duration: isAnimated ? 1.2 : 0.1, // Hiện siêu nhanh nếu không animated
        delay: isAnimated ? delay : 0 
      }}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex, objectFit: 'fill' }}
    />
  );
};

const HeroAvatar = ({ equipment, element = 0, isAnimated = false }) => {
  const equip = equipment || {
    body: 'none', shield: 'none', cloak: 'none', pants: 'none', 
    shirt: 'none', gloves: 'none', necklace: 'none', sword: 'none'
  };

  const ELEMENT_HEADS = {
    0: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihnvtqscpeyzqtkkfkfgarohvcb6vsf6eg7krrstvqserrgosrm3u",
    1: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreibptjoyod36of6ec6z6cqjyn242tynzraonz7gmswe2hpcufxqq7a",
    2: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreicpw5hg7mcbdlbjy6mpnpzbrpqygct2f5jqvhu7fgoo7xffiwglqe",
    3: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreie7f5tbixp5qdermdantt5oxbmqedw3763rsgv57nn57mrdee6w7y",
    4: "https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreieygcxplkhnxmccgjvtgfa3dufgaljlia2p4ppabanp43extwcvii"
  };

  return (
    <div className="relative w-full aspect-square max-w-[450px] mx-auto flex items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-lime-500/5 blur-[100px] rounded-full animate-pulse" />

      <div className="relative w-full h-full">
        <AnimatePresence mode="popLayout">
          
          {/* 1. THÂN & ĐẦU: Xuất hiện cố định (chỉ fade-in) */}
          <AvatarLayer key="body" src={equip.body} zIndex={10} layerName="body" delay={0} isAnimated={isAnimated} />
          
          <motion.img
            key="static-head"
            src={ELEMENT_HEADS[element]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 w-full h-full z-[35] pointer-events-none"
            style={{ objectFit: 'fill' }}
            transition={{ duration: 0.1 }} 
          />

          {/* 2. CÁC LỚP GIÁP BAY LẦN LƯỢT */}
          <AvatarLayer key="cloak" src={equip.cloak} zIndex={5} layerName="cloak" delay={0.5} isAnimated={isAnimated} />
          <AvatarLayer key="shield" src={equip.shield} zIndex={7} layerName="shield" delay={1.0} isAnimated={isAnimated} />
          
          <AvatarLayer key="pants" src={equip.pants} zIndex={20} layerName="pants" delay={1.5} isAnimated={isAnimated} />
          <AvatarLayer key="shirt" src={equip.shirt} zIndex={30} layerName="shirt" delay={2.0} isAnimated={isAnimated} />
          
          <AvatarLayer key="gloves" src={equip.gloves} zIndex={40} layerName="gloves" delay={2.5} isAnimated={isAnimated} />

          <AvatarLayer key="necklace" src={equip.necklace} zIndex={30} layerName="necklace" delay={3.0} isAnimated={isAnimated} />
          <AvatarLayer key="sword" src={equip.sword} zIndex={70} layerName="sword" delay={3.5} isAnimated={isAnimated} />

        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeroAvatar;