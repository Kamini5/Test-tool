
import React from 'react';
import { 
  FileText, 
  Settings, 
  ClipboardList, 
  Layout, 
  Terminal,
  ChevronRight,
  BookOpen,
  LogOut,
  LogIn,
  User as UserIcon
} from 'lucide-react';
import { DocType } from '../types';
import { motion } from 'motion/react';
import { User, signOut } from 'firebase/auth';
import { auth, signIn } from '../lib/firebase';

const DOC_TYPES: { type: DocType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'SRS', 
    label: 'SRS', 
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Software Requirements Specification'
  },
  { 
    type: 'FRS', 
    label: 'FRS', 
    icon: <Layout className="w-4 h-4" />,
    description: 'Functional Requirements Specification'
  },
  { 
    type: 'TestPlan', 
    label: 'Test Plan', 
    icon: <ClipboardList className="w-4 h-4" />,
    description: 'Strategic QA Planning'
  },
  { 
    type: 'TestCases', 
    label: 'Test Cases', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Detailed Step-by-Step Tests'
  },
  { 
    type: 'Environment', 
    label: 'Environment', 
    icon: <Terminal className="w-4 h-4" />,
    description: 'Setup and Infrastructure Guide'
  },
  { 
    type: 'Automation', 
    label: 'Automation', 
    icon: <Settings className="w-4 h-4" />,
    description: 'Automated Test Scripts'
  },
  { 
    type: 'History' as DocType, 
    label: 'History', 
    icon: <ClipboardList className="w-4 h-4" />,
    description: 'View saved documents'
  },
];

interface SidebarProps {
  activeType: DocType;
  onTypeChange: (type: DocType) => void;
  user: User | null;
}

export default function Sidebar({ activeType, onTypeChange, user }: SidebarProps) {
  return (
    <div className="w-64 border-r border-white/5 bg-[#111112] h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-6 h-6 bg-blue-500 rounded shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <span className="font-bold text-white tracking-tight">TESTFORGE AI</span>
        </div>
        
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3 px-2">Workspaces</p>
        <nav className="space-y-1">
          {DOC_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => onTypeChange(item.type)}
              className={`w-full flex items-center group relative px-3 py-2.5 rounded-lg transition-all duration-200 ${
                activeType === item.type 
                  ? 'bg-blue-500/10 text-blue-400 border-r-2 border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className={`p-1.5 rounded mr-3 transition-colors ${
                activeType === item.type ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
              }`}>
                {item.icon}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className={`font-medium text-sm leading-none ${activeType === item.type ? 'text-blue-400' : ''}`}>{item.label}</span>
              </div>
              {activeType === item.type && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute right-3"
                >
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 space-y-3">
        {user ? (
          <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.displayName || 'Developer'}</p>
              <button 
                onClick={() => signOut(auth)}
                className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors mt-0.5"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => signIn()}
            className="w-full p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <LogIn className="w-4 h-4" />
            Sign in to Save
          </button>
        )}

        <div className="bg-gradient-to-br from-[#1E1E20] to-[#141416] p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-tighter">AI Core Engine</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] text-emerald-400 font-mono tracking-tighter uppercase whitespace-nowrap">Gemini-3_Pro_Active</span>
          </div>
          <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="bg-blue-500 h-full rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
