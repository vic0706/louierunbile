
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Races from './pages/Races';
import Training from './pages/Training';
import Settings from './pages/Settings';
import { api } from './services/api';
import { DataRecord, LookupItem } from './types';

const DEFAULT_NAME = '睿睿';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [data, setData] = useState<DataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  
  const [trainingTypes, setTrainingTypes] = useState<LookupItem[]>([]);
  const [raceGroups, setRaceGroups] = useState<LookupItem[]>([]);
  
  const [defaultTrainingType, setDefaultTrainingType] = useState<string>('');
  const [personName, setPersonName] = useState<string>(() => {
    return localStorage.getItem('louie_person_name') || DEFAULT_NAME;
  });

  const fetchData = useCallback(async () => {
    if (!hasInitialized.current) setIsLoading(true);
    
    const { records, trainingTypes: tTypes, races: rGroups } = await api.fetchAppData();
    
    setData(records);
    setTrainingTypes(tTypes);
    setRaceGroups(rGroups);
    
    // Priority: 1. Server is_default, 2. LocalStorage, 3. First item
    const serverDefault = tTypes.find(t => t.is_default)?.name;
    if (serverDefault) {
      setDefaultTrainingType(serverDefault);
    } else if (tTypes.length > 0) {
      const savedDefault = localStorage.getItem('louie_default_type');
      if (savedDefault && tTypes.some(t => t.name === savedDefault)) {
        setDefaultTrainingType(savedDefault);
      } else {
        setDefaultTrainingType(tTypes[0].name);
      }
    }

    hasInitialized.current = true;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!hasInitialized.current || currentPage === 'dashboard' || currentPage === 'races') {
      fetchData();
    }
  }, [currentPage, fetchData]);

  const handleUpdateName = (name: string) => {
    setPersonName(name);
    localStorage.setItem('louie_person_name', name);
  };

  const renderPage = () => {
    if (isLoading && !hasInitialized.current) {
       return (
        <div className="h-full flex flex-col items-center justify-center space-y-6 bg-[#0a0508]">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 bg-rose-600/20 blur-xl rounded-full animate-pulse"></div>
            <div className="relative z-10 w-full h-full border-4 border-white/5 rounded-full"></div>
            <div className="absolute inset-0 z-10 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 z-10 flex items-center justify-center">
               <span className="text-sm font-black text-rose-500 tracking-tighter animate-pulse">L.R</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-sm font-black italic tracking-[0.25em] text-white uppercase mb-2 drop-shadow-lg">LOUIE RACING</div>
             <div className="text-[9px] text-zinc-500 font-mono tracking-widest border border-white/5 px-2 py-1 rounded-md bg-white/5">INITIALIZING D1 CORE...</div>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data} 
            refreshData={fetchData}
            onNavigateToRaces={() => setCurrentPage('races')} 
            defaultTrainingType={defaultTrainingType}
          />
        );
      case 'races':
        return (
          <Races 
            data={data} 
            refreshData={fetchData} 
            personName={personName} 
            raceGroups={raceGroups} 
          />
        );
      case 'training':
        return (
          <Training 
            trainingTypes={trainingTypes} 
            defaultType={defaultTrainingType}
            refreshData={fetchData} 
            data={data}
            personName={personName}
          />
        );
      case 'settings':
        return (
          <Settings 
            trainingTypes={trainingTypes} 
            raceGroups={raceGroups}
            defaultType={defaultTrainingType}
            personName={personName}
            refreshData={fetchData}
            onUpdateDefault={(val) => {
              setDefaultTrainingType(val);
              localStorage.setItem('louie_default_type', val);
            }}
            onUpdateName={handleUpdateName}
          />
        );
      default:
        return <Dashboard data={data} refreshData={fetchData} onNavigateToRaces={() => setCurrentPage('races')} defaultTrainingType={defaultTrainingType} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
