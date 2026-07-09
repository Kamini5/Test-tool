import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Generator from './components/Generator';
import History from './components/History';
import { DocType } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [activeType, setActiveType] = useState<DocType>('SRS');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0A0A0B] text-slate-300 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar activeType={activeType} onTypeChange={setActiveType} user={user} />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            {activeType === 'History' ? (
              <History user={user} />
            ) : (
              <Generator type={activeType} user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
