import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { motion, AnimatePresence } from "framer-motion"; // Đã import thì phải dùng

function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

const TARGET_REP = 3;

const AIWorkout = ({ onWorkoutComplete }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const countRef = useRef(0);
  const isSquattingRef = useRef(false);
  const squatStartTimeRef = useRef(0);
  const isFinishedRef = useRef(false);

  const [displayCount, setDisplayCount] = useState(0);
  const [feedback, setFeedback] = useState("Sẵn sàng...");

  const cleanup = () => {
    isFinishedRef.current = true;
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
  };

  const onResults = (results) => {
    if (isFinishedRef.current || !canvasRef.current || !webcamRef.current) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    const ctx = canvasRef.current.getContext("2d");
    
    ctx.save();
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (results.poseLandmarks) {
      const hip = results.poseLandmarks[23];
      const knee = results.poseLandmarks[25];
      const ankle = results.poseLandmarks[27];

      if (hip.visibility > 0.5 && knee.visibility > 0.5 && ankle.visibility > 0.5) {
        const drawPoint = (p, color) => {
           ctx.beginPath();
           ctx.arc(p.x * videoWidth, p.y * videoHeight, 8, 0, 2 * Math.PI);
           ctx.fillStyle = color;
           ctx.fill();
           ctx.strokeStyle = "white";
           ctx.lineWidth = 2;
           ctx.stroke();
        };

        drawPoint(hip, "#448aff");
        drawPoint(knee, isSquattingRef.current ? "#00ff41" : "#ff5252");
        drawPoint(ankle, "#448aff");

        ctx.beginPath();
        ctx.moveTo(hip.x * videoWidth, hip.y * videoHeight);
        ctx.lineTo(knee.x * videoWidth, knee.y * videoHeight);
        ctx.lineTo(ankle.x * videoWidth, ankle.y * videoHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.stroke();

        const angle = calculateAngle(hip, knee, ankle);

        if (angle < 100) { 
          if (!isSquattingRef.current) {
            if (squatStartTimeRef.current === 0) {
              squatStartTimeRef.current = performance.now();
            } else if (performance.now() - squatStartTimeRef.current > 300) {
              isSquattingRef.current = true;
              setFeedback("GIỮ NGUYÊN! ⬇️");
            }
          }
        } else if (angle > 160) {
          squatStartTimeRef.current = 0;
          if (isSquattingRef.current) {
            isSquattingRef.current = false;
            countRef.current += 1;
            setDisplayCount(countRef.current);
            setFeedback("LÊN TỐT! 🔥");

            if (countRef.current >= TARGET_REP) {
              cleanup();
              onWorkoutComplete(TARGET_REP);
            }
          } else {
             setFeedback("SẴN SÀNG...");
          }
        }
      } else {
        setFeedback("ĐỨNG XA RA CHÚT 📷");
      }
    }
    ctx.restore();
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    pose.onResults(onResults);
    poseRef.current = pose;

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (poseRef.current) await poseRef.current.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
    }
    return () => cleanup();
  }, []);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black group">
      <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full object-cover opacity-60" mirrored />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-white font-mono text-xs font-bold">AI TRACKING</span>
          </div>
          <div className="text-right">
             <div className={`text-2xl font-display font-black italic uppercase ${feedback.includes("TỐT") ? 'text-neon-green' : 'text-white'}`}>
                {feedback}
             </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-full">
           <AnimatePresence mode='wait'>
             {/* 👇 SỬA Ở ĐÂY: Dùng motion.div */}
             <motion.div 
               key={displayCount}
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 1.2, opacity: 0 }}
               className="text-[120px] leading-none font-black text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] stroke-text"
             >
               {displayCount}
             </motion.div>
           </AnimatePresence>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400 font-mono">
            <span>PROGRESS</span>
            <span>{Math.round((displayCount / TARGET_REP) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800/50 backdrop-blur rounded-full h-3 border border-white/10 overflow-hidden">
             {/* 👇 SỬA Ở ĐÂY: Dùng motion.div */}
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${(displayCount / TARGET_REP) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkout;