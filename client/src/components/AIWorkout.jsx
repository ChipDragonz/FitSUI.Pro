import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl'; 
import { motion } from "framer-motion";

const TARGET_REP = 3; // Target per set

// --- CALCULATE ANGLE (Hip - Knee - Ankle) ---
function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

const AIWorkout = ({ onSessionUpdate, isProcessing }) => {
  // --- 1. REFS (Non-rendering state management) ---
  const webcamRef = useRef(null);
  const detectorRef = useRef(null);
  const requestRef = useRef(null);
  const countRef = useRef(0); 
  const squatStateRef = useRef("UP"); 
  const isCooldownRef = useRef(false); 

  // --- 2. UI STATES ---
  const [displayCount, setDisplayCount] = useState(0);
  const [feedback, setFeedback] = useState("INITIALIZING AI..."); // Changed from ĐANG KHỞI TẠO AI...
  const [isLoading, setIsLoading] = useState(true);

  // --- 3. INITIALIZE AI ON MOUNT ---
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
          setFeedback("READY TO TRAIN..."); // Changed from SẴN SÀNG...
          detectPose();
        }
      } catch (err) {
        if (isMounted) setFeedback("CAMERA ERROR"); // Changed from LỖI CAMERA
      }
    };
    initAI();
    return () => { 
      isMounted = false; 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, []);

  // --- 4. POSE DETECTION LOOP ---
  const detectPose = async () => {
    if (isProcessing || isCooldownRef.current) {
      requestRef.current = requestAnimationFrame(detectPose);
      return;
    }

    if (webcamRef.current?.video?.readyState === 4 && detectorRef.current) {
      const poses = await detectorRef.current.estimatePoses(webcamRef.current.video);
      
      if (poses.length > 0) {
        const k = poses[0].keypoints;
        // Joint confidence check (Score > 0.4)
        if (k[11].score > 0.4 && k[13].score > 0.4 && k[15].score > 0.4) {
          const angle = calculateAngle(k[11], k[13], k[15]);

          // Downward movement detected
          if (angle < 100 && squatStateRef.current === "UP") {
            squatStateRef.current = "DOWN";
            setFeedback("HOLD POSITION! ⬇️"); // Changed from GIỮ NGUYÊN!
          } 
          // Upward movement detected
          else if (angle > 160 && squatStateRef.current === "DOWN") {
            squatStateRef.current = "UP";
            countRef.current += 1;
            setDisplayCount(countRef.current);
            setFeedback("GOOD FORM! 🔥"); // Changed from LÊN TỐT!

            // Set completion logic
            if (countRef.current >= TARGET_REP) {
              isCooldownRef.current = true;
              setFeedback("SET COMPLETE! 🔥"); // Changed from XONG HIỆP!
              onSessionUpdate(); 

              // Reset for next set after 3 seconds
              setTimeout(() => {
                countRef.current = 0;
                setDisplayCount(0);
                isCooldownRef.current = false;
                setFeedback("READY FOR NEXT SET!"); // Changed from SẴN SÀNG HIỆP TIẾP THEO!
              }, 3000);
            }
          }
        } else {
          setFeedback("STEP BACK 📷"); // Changed from HÃY LÙI RA XA
        }
      }
    }
    requestRef.current = requestAnimationFrame(detectPose);
  };

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-lime-500/10">
      <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full object-cover opacity-60" mirrored={true} />
      
      {/* AI OVERLAY */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="bg-black/80 px-4 py-2 rounded-xl border border-white/5">
            <span className="text-4xl font-black text-lime-400">{displayCount}</span>
            <span className="text-gray-500 ml-2 font-bold">/ {TARGET_REP}</span>
          </div>
          <div className="text-xl font-black italic text-white uppercase drop-shadow-lg">{feedback}</div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-white/5 h-3 rounded-full border border-white/5 overflow-hidden backdrop-blur-sm">
          <motion.div 
            className="h-full bg-gradient-to-r from-lime-400 to-emerald-600 shadow-[0_0_15px_rgba(163,230,53,0.5)]" 
            animate={{ width: `${(displayCount / TARGET_REP) * 100}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default AIWorkout;