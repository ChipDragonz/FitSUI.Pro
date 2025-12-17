import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Tự động tắt sau 4 giây
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Helper functions cho gọn
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Container chứa các thông báo - Góc trên bên phải */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ message, type, onClose }) => {
  const configs = {
    success: { icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/50', bg: 'from-green-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', border: 'border-red-500/50', bg: 'from-red-500/10' },
    info: { icon: Info, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'from-blue-500/10' },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      layout
      className={`
        pointer-events-auto w-80 p-4 rounded-xl border ${config.border} 
        bg-gradient-to-r ${config.bg} to-slate-900/90 backdrop-blur-xl shadow-2xl 
        flex items-start gap-3 relative overflow-hidden group
      `}
    >
      <div className={`mt-0.5 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium font-sans leading-relaxed">
          {message}
        </p>
      </div>
      <button 
        onClick={onClose} 
        className="text-gray-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Thanh thời gian chạy bên dưới */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-0.5 ${config.color.replace('text-', 'bg-')}`}
      />
    </motion.div>
  );
};