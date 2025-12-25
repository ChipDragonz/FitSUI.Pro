import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';



// --- COMPONENT CON: HIỂN THỊ TỪNG LỚP ẢNH ---

const AvatarLayer = ({ src, zIndex, layerName }) => {

  if (!src || src === 'none') return null;



  return (

    <motion.img

      src={src}

      alt={layerName}

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

      exit={{ opacity: 0 }}

      transition={{ duration: 0.3 }}

      /* ✅ THAY ĐỔI CỐT LÕI:

         Bỏ hoàn toàn 'object-contain'.

         Dùng 'w-full h-full' kết hợp với khung 'aspect-square' bên ngoài

         để ép mọi ảnh 500x500 đè khít lên nhau theo tọa độ tuyệt đối.

      */

      className="absolute inset-0 w-full h-full pointer-events-none"

      style={{ zIndex, objectFit: 'fill' }} // 'fill' đảm bảo ảnh chiếm trọn 100% diện tích khung vuông

    />

  );

};



const HeroAvatar = ({ equipment }) => {

  const equip = equipment || {

    body: 'none', pants: 'none', shirt: 'none', shoes: 'none',

    gloves: 'none', armor: 'none', hat: 'none', weapon: 'none'

  };



  return (

    /* ✅ THAY ĐỔI QUAN TRỌNG:

       Container này PHẢI là hình vuông (aspect-square) để khớp với file 500x500.

       Ní chỉnh max-width ở đây để Hero to hay nhỏ lại trên màn hình.

    */

    <div className="relative w-full aspect-square max-w-[450px] mx-auto flex items-center justify-center">

     

      {/* Hiệu ứng hào quang phía sau Hero */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-lime-500/5 blur-[100px] rounded-full animate-pulse" />



      {/* Container chứa các Layer xếp chồng tuyệt đối */}

      <div className="relative w-full h-full">

        <AnimatePresence mode="popLayout">

          <AvatarLayer key="layer-body" src={equip.body} zIndex={10} layerName="body" />

          <AvatarLayer key="layer-pants" src={equip.pants} zIndex={20} layerName="pants" />

          <AvatarLayer key="layer-shirt" src={equip.shirt} zIndex={30} layerName="shirt" />

          <AvatarLayer key="layer-shoes" src={equip.shoes} zIndex={40} layerName="shoes" />

          <AvatarLayer key="layer-gloves" src={equip.gloves} zIndex={50} layerName="gloves" />

          <AvatarLayer key="layer-armor" src={equip.armor} zIndex={60} layerName="armor" />

          <AvatarLayer key="layer-hat" src={equip.hat} zIndex={70} layerName="hat" />

          <AvatarLayer key="layer-weapon" src={equip.weapon} zIndex={80} layerName="weapon" />

        </AnimatePresence>

      </div>

    </div>

  );

};



export default HeroAvatar;