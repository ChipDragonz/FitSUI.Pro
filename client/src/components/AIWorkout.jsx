import React, { useRef, useEffect, useState } from "react";

import Webcam from "react-webcam";

import * as poseDetection from '@tensorflow-models/pose-detection';

import * as tf from '@tensorflow/tfjs-core';

import '@tensorflow/tfjs-backend-webgl';

import { motion } from "framer-motion";

import { Skull } from 'lucide-react';



// ✅ 1. CHUYỂN LOGIC NHẬN DIỆN RA NGOÀI ĐỂ CÁC HẰNG SỐ ĐỌC ĐƯỢC

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const TARGET_REP = 3;



// ✅ 2. CẤU HÌNH FPS RIÊNG BIỆT: Mobile 7 FPS (mát máy) | PC 15 FPS (mượt)

const FPS_LIMIT = isMobile ? (1000 / 7) : (1000 / 15);



function calculateAngle(a, b, c) {

  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);

  let angle = Math.abs((radians * 180) / Math.PI);

  return angle > 180 ? 360 - angle : angle;

}



const AIWorkout = ({ onSessionUpdate, onAutoStop, isProcessing, stamina, accumulatedSets }) => {

  const webcamRef = useRef(null);

  const detectorRef = useRef(null);

  const requestRef = useRef(null);

  const lastTimestampRef = useRef(0);

  const countRef = useRef(0);

  const squatStateRef = useRef("UP");

  const isCooldownRef = useRef(false);



  // Đồng bộ dữ liệu Stamina và Set vào Ref để AI không bị "lag" dữ liệu

  const staminaRef = useRef(stamina);

  const setsRef = useRef(accumulatedSets);



  useEffect(() => {

    staminaRef.current = stamina;

    setsRef.current = accumulatedSets;

  }, [stamina, accumulatedSets]);



  const [displayCount, setDisplayCount] = useState(0);

  const [feedback, setFeedback] = useState("INITIALIZING AI...");

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    let isMounted = true;

    const initAI = async () => {

      try {

        await tf.ready();

        const detector = await poseDetection.createDetector(

          poseDetection.SupportedModels.MoveNet,

          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }

        );

        if (isMounted) {

          detectorRef.current = detector;

          setIsLoading(false);

          setFeedback("READY TO TRAIN...");

          detectPose(performance.now());

        }

      } catch (err) {

        if (isMounted) setFeedback("CAMERA ERROR");

      }

    };

    initAI();

    return () => {

      isMounted = false;

      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      if (detectorRef.current) detectorRef.current.dispose();

    };

  }, []);



  const detectPose = async (timestamp) => {

    // CHỐT CHẶN: Dừng AI ngay nếu hết thể lực

    if (staminaRef.current < 10) {

      setFeedback("OUT OF STAMINA! 🪫");

      return;

    }



    // Giới hạn FPS để bảo vệ CPU/GPU tùy theo thiết bị

    if (timestamp - lastTimestampRef.current < FPS_LIMIT) {

      requestRef.current = requestAnimationFrame(detectPose);

      return;

    }

    lastTimestampRef.current = timestamp;



    if (isProcessing || isCooldownRef.current) {

      requestRef.current = requestAnimationFrame(detectPose);

      return;

    }



    if (webcamRef.current?.video?.readyState === 4 && detectorRef.current) {

      const poses = await detectorRef.current.estimatePoses(webcamRef.current.video);

     

      if (poses && poses.length > 0) {

        const k = poses[0].keypoints;

        // Kiểm tra độ tin cậy của các khớp hông, gối, cổ chân

        if (k[11].score > 0.4 && k[13].score > 0.4 && k[15].score > 0.4) {

          const angle = calculateAngle(k[11], k[13], k[15]);



          if (angle < 100 && squatStateRef.current === "UP") {

            squatStateRef.current = "DOWN";

            setFeedback("HOLD POSITION! ⬇️");

          }

          else if (angle > 160 && squatStateRef.current === "DOWN") {

            squatStateRef.current = "UP";

            countRef.current += 1;

            setDisplayCount(countRef.current);

            setFeedback("GOOD FORM! 🔥");



            if (countRef.current >= TARGET_REP) {

              isCooldownRef.current = true;

              setFeedback("SET COMPLETE! 🔥");

              onSessionUpdate();



              const totalFinished = setsRef.current + 1;

              const nextSetCost = (totalFinished + 1) * 10;



              if (staminaRef.current < nextSetCost) {

                setFeedback("STAMINA DEPLETED! STOPPING...");

                setTimeout(() => onAutoStop(), 1500);

              } else {

                setTimeout(() => {

                  countRef.current = 0;

                  setDisplayCount(0);

                  isCooldownRef.current = false;

                  setFeedback("READY FOR NEXT SET!");

                }, 3000);

              }

            }

          }

        } else {

          setFeedback("STEP BACK 📷");

        }

      }

    }

    requestRef.current = requestAnimationFrame(detectPose);

  };



  return (

    <div className="relative w-full aspect-[3/4] md:aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-lime-500/10">

      <Webcam

        ref={webcamRef}

        className="absolute inset-0 w-full h-full object-cover opacity-60"

        mirrored={true}

        videoConstraints={{

          facingMode: "user",

          // ✅ 3. ĐỘ PHÂN GIẢI LINH HOẠT: Mobile 360p | PC 720p

          width: { ideal: isMobile ? 480 : 1280 },

          height: { ideal: isMobile ? 360 : 720 },

          frameRate: { ideal: isMobile ? 15 : 30 }

        }}

      />

     

      {/* Overlay cảnh báo hết stamina */}

      {stamina < 10 && (

        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">

          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">

            <Skull className="text-red-500 animate-pulse" size={32} />

          </div>

          <p className="text-white font-black uppercase italic">Out of Stamina</p>

        </div>

      )}



      {/* Stats UI Overlay */}

      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">

        <div className="flex justify-between items-start">

          <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">

            <span className="text-4xl font-black text-lime-400">{displayCount}</span>

            <span className="text-gray-500 ml-2 font-bold">/ {TARGET_REP}</span>

          </div>

          <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md text-xl font-black italic text-white uppercase">{feedback}</div>

        </div>

        <div className="w-full bg-white/5 h-3 rounded-full border border-white/5 overflow-hidden backdrop-blur-sm">

          <motion.div className="h-full bg-gradient-to-r from-lime-400 to-emerald-600" animate={{ width: `${(displayCount / TARGET_REP) * 100}%` }} />

        </div>

      </div>



      {isLoading && (

        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">

          <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>

          <p className="text-lime-500 font-black tracking-widest text-xs uppercase animate-pulse">Loading AI Model...</p>

        </div>

      )}

    </div>

  );

};



export default AIWorkout;