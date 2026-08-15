'use client';

import React, { useState } from 'react';
import { Article } from '@/types/editorial';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

interface CalendarViewProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  articles,
  onSelectArticle,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date('2026-08-01'));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
      
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date('2026-08-01'))}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          >
            Agosto 2026
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Blank preceding days */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`blank_${i}`} className="h-28 bg-slate-50/40 dark:bg-slate-900/40 rounded-lg border border-transparent" />
        ))}

        {/* Month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayFormatted = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
          const monthFormatted = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
          const dateKey = `${year}-${monthFormatted}-${dayFormatted}`;

          const dayArticles = articles.filter((a) => a.publishDate === dateKey);
          const isToday = dateKey === todayStr;

          return (
            <div
              key={dateKey}
              className={`h-32 p-2 rounded-xl border flex flex-col justify-between transition-all ${
                isToday
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                  {dayNum}
                </span>
                {dayArticles.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {dayArticles.length}
                  </span>
                )}
              </div>

              {/* Day Articles Pills */}
              <div className="flex-1 overflow-y-auto mt-1 space-y-1 pr-0.5">
                {dayArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art)}
                    className={`p-1 rounded text-[10px] font-semibold cursor-pointer truncate transition-all ${
                      art.status === 'publicado'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : art.status === 'revisao'
                        ? 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                        : art.status === 'escrita'
                        ? 'bg-yellow-50 text-yellow-800 dark:bg-amber-950 dark:text-amber-300 border border-yellow-200 dark:border-amber-800'
                        : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }`}
                    title={art.title}
                  >
                    {art.status === 'publicado' ? '✓ ' : ''}{art.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
