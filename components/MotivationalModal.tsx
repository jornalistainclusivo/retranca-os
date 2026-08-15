'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, CheckCircle2, Heart, X } from 'lucide-react';

interface MotivationalModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishedCount: number;
}

export const MotivationalModal: React.FC<MotivationalModalProps> = ({
  isOpen,
  onClose,
  publishedCount,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden space-y-6"
          >
            {/* Background Decorative Sparkles */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-900 shadow-xl shadow-amber-400/30 text-4xl mx-auto">
              🎉
            </div>

            {/* Main Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Excelente!
              </h2>
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                Mais um conteúdo publicado!
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed px-2">
                &quot;Seu conhecimento e dedicação em acessibilidade podem mudar a vida de milhares de pessoas.&quot;
              </p>
            </div>

            {/* Milestone Badge */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                🏆 {publishedCount} {publishedCount === 1 ? 'artigo concluído' : 'artigos concluídos'}
              </span>
            </div>

            {/* CTA Button */}
            <button
              onClick={onClose}
              className="w-full py-3 text-xs font-bold rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-lg shadow-sky-600/25 transition-all active:scale-95"
            >
              Continuar Produzindo 🚀
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
