import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, Calendar, FileText, ExternalLink, Trash2, Clock, Inbox, Download, Copy, Check, Clipboard } from 'lucide-react';

// Custom Code component with Copy button
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const content = String(children).replace(/\n$/, '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-white/5 border border-white/10 px-1 rounded text-blue-400 text-[0.9em]" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 backdrop-blur-sm"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 rounded-xl bg-[#080809] border border-white/5 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};
import { motion, AnimatePresence } from 'motion/react';

interface SavedDoc {
  id: string;
  type: string;
  projectName: string;
  content: string;
  createdAt: Timestamp;
  referenceUrl?: string;
  description?: string;
  imageUrl?: string;
}

interface HistoryProps {
  user: User | null;
}

export default function History({ user }: HistoryProps) {
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SavedDoc | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!user) {
      setDocs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const d = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedDoc[];
      setDocs(d);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredDocs = docs.filter(doc => 
    doc.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#0A0A0B]">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-slate-700" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view history</h2>
        <p className="text-slate-500 max-w-sm">Your generated documents are securely stored in the cloud once you sign in.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0A0A0B] overflow-hidden">
      {/* List Area */}
      <div className="w-96 border-r border-white/5 flex flex-col bg-[#111112]">
        <header className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">Saved Documents</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
            <input
              type="text"
              placeholder="Filter by project or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-10 pr-3 text-xs focus:outline-none focus:border-blue-500/50 text-slate-200"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <Clock className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center p-8 opacity-40">
              <Inbox className="w-10 h-10 mx-auto mb-4" />
              <p className="text-xs uppercase tracking-widest">No documents found</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedDoc?.id === doc.id 
                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDoc?.id === doc.id ? 'text-blue-100' : 'text-blue-400'}`}>
                    {doc.type}
                  </span>
                  <span className={`text-[9px] font-mono ${selectedDoc?.id === doc.id ? 'text-blue-200' : 'text-slate-600'}`}>
                    {doc.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <h3 className={`font-semibold text-sm truncate ${selectedDoc?.id === doc.id ? 'text-white' : 'text-slate-300'}`}>
                  {doc.projectName}
                </h3>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0A0A0B]">
        <AnimatePresence mode="wait">
          {selectedDoc ? (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col"
            >
              <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0C0C0D]">
                <div className="flex items-center gap-4">
                  <h1 className="text-white font-medium">{selectedDoc.projectName} / {selectedDoc.type}</h1>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Saved</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => handleCopy(selectedDoc.content)}
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Document'}
                  </button>
                   <button 
                    onClick={() => {
                      const blob = new Blob([selectedDoc.content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedDoc.projectName}_${selectedDoc.type}.md`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                   {selectedDoc.referenceUrl && (
                     <a 
                      href={selectedDoc.referenceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                   )}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                   <div className="mb-8 pb-8 border-b border-white/5 space-y-4">
                     <div>
                       <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Original Prompt</p>
                       <p className="text-sm text-slate-400 italic leading-relaxed">
                         {selectedDoc.description || "No description provided."}
                       </p>
                     </div>
                     {selectedDoc.imageUrl && (
                       <div>
                         <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Analyzed Image</p>
                         <img 
                           src={selectedDoc.imageUrl} 
                           alt="Analyzed Screenshot" 
                           className="rounded-lg max-h-60 object-contain border border-white/10"
                         />
                       </div>
                     )}
                   </div>
                   <div className="markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {selectedDoc.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
              <FileText className="w-12 h-12 mb-4" />
              <p className="text-xs uppercase tracking-widest">Select a document to preview</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
