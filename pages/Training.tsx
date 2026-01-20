
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { DataRecord, LookupItem } from '../types';
import { RotateCcw, CheckCircle, History, Delete, Activity, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface TrainingProps {
  trainingTypes: LookupItem[];
  defaultType: string;
  refreshData: () => Promise<void>;
  data: DataRecord[];
  personName: string;
}

const Training: React.FC<TrainingProps> = ({ trainingTypes, defaultType, refreshData, data, personName }) => {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastRecord, setLastRecord] = useState<string | null>(null);

  useEffect(() => {
    if (defaultType && trainingTypes.length > 0) {
        const found = trainingTypes.find(t => t.name === defaultType);
        if (found) setSelectedTypeId(String(found.id));
    } else if (trainingTypes.length > 0 && !selectedTypeId) {
        setSelectedTypeId(String(trainingTypes[0].id));
    }
  }, [defaultType, trainingTypes]);

  const selectedTypeName = useMemo(() => {
    return trainingTypes.find(t => String(t.id) === selectedTypeId)?.name || '';
  }, [selectedTypeId, trainingTypes]);

  const handleNumberClick = (num: string) => {
    if (inputValue.length > 10) return;
    if (num === '.' && inputValue.includes('.')) return;
    
    // 限制小數點後最多 4 位 (.xxxx)
    if (inputValue.includes('.')) {
        const parts = inputValue.split('.');
        if (parts[1].length >= 4) return;
    }
    
    setInputValue(prev => prev + num);
  };

  const handleBackspace = () => setInputValue(prev => prev.slice(0, -1));
  const handleClear = () => setInputValue('');

  const handleSubmit = async () => {
    if (!selectedTypeId) {
        alert('請先在設定中新增訓練項目');
        return;
    }

    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0 || val > 500) {
      alert('請輸入有效秒數 (0.0001 - 500.0000)');
      return;
    }

    setStatus('saving');
    
    const record: Partial<DataRecord> = {
      date: format(new Date(), 'yyyy-MM-dd'),
      item: 'training',
      training_type_id: selectedTypeId,
      people_id: 1, 
      value: val.toFixed(4) 
    };

    const success = await api.submitRecord(record);
    if (success) {
      setLastRecord(`${val.toFixed(4)}s`);
      setInputValue('');
      setStatus('success');
      await refreshData();
      setTimeout(() => setStatus('idle'), 1500);
    } else {
      setStatus('error');
      alert('上傳失敗');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  const todayHistory = data
    .filter(d => d.item === 'training' && d.date === format(new Date(), 'yyyy-MM-dd') && d.name === selectedTypeName)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full px-3 pt-2 pb-0 relative animate-fade-in overflow-y-auto no-scrollbar">
      <div className="flex-none mb-3">
        <label className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase flex items-center gap-1.5 mb-2">
          <Activity size={12} className="text-amber-500"/> 訓練項目
        </label>
        
        {trainingTypes.length > 0 ? (
          <div className="relative">
            <select 
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-white/10 text-white rounded-xl py-3.5 px-4 text-sm font-bold shadow-sm focus:border-amber-500/50 outline-none transition-all"
            >
              {trainingTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <ChevronDown size={16} />
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl py-3 px-4 text-zinc-500 text-sm font-bold">同步中...</div>
        )}
      </div>

      <div className="flex-none mb-3">
        <div className="glass-card rounded-3xl p-5 text-right relative overflow-hidden border-t border-t-white/10 shadow-lg">
          <div className="flex justify-between items-start relative z-10 h-6">
             <div className="flex items-center gap-2">
                {status === 'saving' && <span className="text-rose-500 text-[9px] font-bold flex items-center animate-pulse"><RotateCcw size={9} className="mr-1 animate-spin" /> ...</span>}
                {status === 'success' && <span className="text-green-500 text-[9px] font-bold flex items-center"><CheckCircle size={9} className="mr-1" /> SAVED</span>}
             </div>
             {lastRecord && (
                <div className="text-[10px] text-zinc-400 font-mono font-bold tracking-wide bg-white/5 px-2 py-0.5 rounded border border-white/5">上筆: {lastRecord}</div>
             )}
          </div>
          <span className={`text-[3.5rem] font-black leading-none font-mono tracking-tighter block mt-1 relative z-10 ${inputValue ? 'text-white' : 'text-zinc-800'}`}>
            {inputValue || '0.0000'}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-end pb-2">
        <div className="grid grid-cols-3 gap-2 mb-2 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(val => (
            <button key={val} onClick={() => typeof val === 'number' || val === '.' ? handleNumberClick(String(val)) : null} 
              className="glass-card bg-[#111]/80 hover:bg-[#161616] text-zinc-200 text-2xl font-medium rounded-xl flex items-center justify-center active:scale-95 h-full max-h-16 border border-white/5">
              {val}
            </button>
          ))}
          <button onClick={handleBackspace} className="glass-card bg-[#111]/80 text-rose-500 flex items-center justify-center active:scale-95 h-full max-h-16 border border-white/5"><Delete size={22} /></button>
        </div>

        <div className="grid grid-cols-4 gap-2 h-14">
           <button onClick={handleClear} className="bg-zinc-900/80 text-zinc-500 font-bold rounded-xl active:scale-95 border border-white/5 text-sm">C</button>
           <button onClick={handleSubmit} disabled={!inputValue || status === 'saving'}
             className={`col-span-3 font-bold rounded-xl text-sm tracking-[0.2em] transition-all active:scale-95 shadow-lg ${!inputValue || status === 'saving' ? 'bg-zinc-900 text-zinc-700' : 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-glow'}`}>
             {status === 'saving' ? '上傳中' : '紀錄數據'}
           </button>
        </div>

        {todayHistory.length > 0 && (
           <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
             <div className="text-[9px] text-zinc-600 font-bold tracking-wider uppercase">今日紀錄</div>
             <div className="flex space-x-1.5 overflow-x-auto no-scrollbar max-w-[70%]">
               {todayHistory.map((h, i) => (
                 <span key={i} className="bg-zinc-900 text-zinc-400 text-[9px] px-2 py-0.5 rounded-md font-mono border border-white/5">{parseFloat(h.value).toFixed(4)}</span>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Training;
