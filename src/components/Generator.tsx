
import React, { useState } from 'react';
import { DocType, GenerationConfig } from '../types';
import { generateDocument } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Download,
  AlertCircle,
  Loader2,
  FileText,
  Save,
  Clipboard,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';

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
import { User } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const REASSURING_MESSAGES = [
  "Analyzing project requirements...",
  "Synthesizing architectural patterns...",
  "Structuring functional flows...",
  "Applying industry-standard QA frameworks...",
  "Generating exhaustive test vectors...",
  "Drafting final documentation...",
  "Polishing technical details..."
];

interface GeneratorProps {
  type: DocType;
  user: User | null;
}

export default function Generator({ type, user }: GeneratorProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [additional, setAdditional] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const split = base64String.split(',');
      const mimeType = file.type;
      const data = split[1];
      setImage({ data, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    }
  };

  const saveToFirestore = async (content: string, finalProjName: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const docId = `${type}_${Date.now()}`;
      await setDoc(doc(db, 'documents', docId), {
        userId: user.uid,
        type,
        projectName: finalProjName,
        description,
        referenceUrl,
        additionalDetails: additional,
        imageUrl: image ? `data:${image.mimeType};base64,${image.data}` : null,
        content,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Firestore Save Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    let finalProjectName = projectName.trim();
    if (!finalProjectName && referenceUrl.trim()) {
      try {
        const urlObj = new URL(referenceUrl.trim());
        const hostname = urlObj.hostname.replace('www.', '');
        const domainParts = hostname.split('.');
        const inferred = domainParts[0];
        finalProjectName = inferred.charAt(0).toUpperCase() + inferred.slice(1);
        setProjectName(finalProjectName);
      } catch (e) {
        finalProjectName = "Web Application";
        setProjectName(finalProjectName);
      }
    }

    if (!finalProjectName && !description.trim() && !image) {
      return;
    }

    setLoading(true);
    setResult(null);
    
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % REASSURING_MESSAGES.length);
    }, 2500);

    try {
      const config: GenerationConfig = {
        type,
        projectName: finalProjectName || (image ? "Visual Interface Spec" : "Automated App Spec"),
        description: description.trim(),
        additionalDetails: additional,
        referenceUrl: referenceUrl.trim(),
        image: image || undefined
      };
      
      const content = await generateDocument(config);
      setResult(content || "Failed to generate content.");
      
      if (content && user) {
        await saveToFirestore(content, finalProjectName || "Automated App Spec");
      }
    } catch (error) {
      console.error(error);
      setResult("### Error\nAn error occurred while generating the document. Please ensure your API key is configured and try again.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_${type}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0B]">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0C0C0D] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-medium tracking-tight"> {projectName || "New Workspace"} / {type}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded border ${result ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {result ? 'Completed' : 'Drafting'}
          </span>
        </div>
        
        {result && !loading && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied Document' : 'Copy Document'}
            </button>
            <button 
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-medium shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto w-full">
        {/* Input Section */}
        <section className="space-y-6">
          <div className="bg-[#111112] p-8 rounded-xl border border-white/5 space-y-6 shadow-xl">
            {/* Quick Preset Options */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Quick App presets & Links</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Want to write testcases or docs for a popular service? Click a preset below to instantly populate the App Name or Link.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { name: "Spotify Music", desc: "A music streaming application", url: "https://spotify.com" },
                  { name: "Netflix Stream", desc: "Video streaming platform", url: "https://netflix.com" },
                  { name: "Slack", desc: "Business messenger platform with workspace chats", url: "https://slack.com" },
                  { name: "", desc: "", url: "https://instagram.com", label: "Instagram Link only" },
                  { name: "", desc: "", url: "https://github.com", label: "GitHub Link only" }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setProjectName(preset.name);
                      setDescription(preset.desc);
                      setReferenceUrl(preset.url);
                    }}
                    className="px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-white/10 rounded transition-all text-slate-400"
                  >
                    + {preset.label || preset.name || preset.url.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Project Name / App Name</label>
                <span className="text-[9px] text-slate-600 uppercase font-mono">Required if no link provided</span>
              </div>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Spotify, Slack, or Instagram..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Detailed Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="What exactly are we building? (Optional if App Name or Link is provided - Gemini will use its internal knowledge of the app)"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Reference URL / App Link (Optional)</label>
                <span className="text-[9px] text-slate-600 uppercase font-mono">Required if no name provided</span>
              </div>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://slack.com or https://docs.example.com..."
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all"
              />
              {referenceUrl.trim() && (
                <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-2.5 mt-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Thorough Web Grounding Active</p>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      The AI will analyze the live structure, user flows, and elements of this application to generate highly comprehensive, realistic, and detailed test specs and automation scripts.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image / Photo Upload Option */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Screenshot / Photo of Interface (Optional)</span>
              </label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center transition-all ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : image 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
                }`}
              >
                {image ? (
                  <div className="relative w-full max-w-xs group">
                    <img 
                      src={`data:${image.mimeType};base64,${image.data}`} 
                      alt="Uploaded Screenshot" 
                      className="rounded-lg max-h-40 mx-auto object-contain border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">
                      Image attached ({image.mimeType.split('/')[1].toUpperCase()})
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-2.5 bg-white/5 rounded-full text-slate-400">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-xs text-slate-300">
                      <label className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors">
                        Upload a photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </label>
                      {' '}or drag & drop here
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Or copy & paste (Ctrl+V) a screenshot directly
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Technical Stack & Constraints</label>
              <textarea
                value={additional}
                onChange={(e) => setAdditional(e.target.value)}
                rows={4}
                placeholder={type === 'Automation' ? "Specify framework (e.g., Selenium + TestNG, Cypress) or 'Simple implementation'..." : "React, Node.js, HIPAA Compliance required..."}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-all resize-none"
              />
              {type === 'Automation' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mt-2">
                    <p className="w-full text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Options & Frameworks</p>
                    {['Simple script', 'Selenium + TestNG', 'Cypress', 'Playwright', 'XPath Locators', 'Eclipse IDE', 'Maven Project'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAdditional(prev => prev ? `${prev}, using ${opt}` : `Using ${opt}`)}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] text-slate-500 hover:text-blue-400 font-mono transition-all"
                      >
                        + {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Languages</p>
                    {['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setAdditional(prev => prev ? `${prev}, in ${lang}` : `In ${lang}`)}
                        className="px-2 py-1 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded text-[9px] text-blue-400 font-mono transition-all"
                      >
                        + {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || (!projectName.trim() && !referenceUrl.trim() && !image)}
              className={`w-full py-4 rounded-lg flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
                loading || (!projectName.trim() && !referenceUrl.trim() && !image)
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.01] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              {loading ? 'Synthesizing...' : image ? `Draft ${type} from Image` : (!projectName.trim() && referenceUrl.trim()) ? `Analyze URL & Draft ${type}` : `Draft ${type} Blueprint`}
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-12 h-12 text-blue-500" />
            </div>
            <h4 className="text-white text-xs font-bold flex items-center gap-2 mb-2 uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              AI Studio Suggestion
            </h4>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              I can help you detail FR-01 logically if you specify whether it requires biometric MFA or standard TOTP.
            </p>
          </div>
        </section>

        {/* Output Section */}
        <section className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-[#141416] border border-white/5 rounded-xl"
              >
                <div className="relative">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                </div>
                <h3 className="text-lg font-semibold text-white mt-8 mb-2">Google AI is Drafting...</h3>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
                  {REASSURING_MESSAGES[messageIndex]}
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full bg-[#141416] border border-white/5 rounded-xl shadow-2xl flex flex-col"
              >
                <div className="bg-[#111112]/50 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document Workspace</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                   <div className="max-w-2xl mx-auto markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: CodeBlock
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]"
              >
                <div className="p-4 bg-white/5 rounded-full mb-6">
                  <FileText className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Ready for Generation</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                  Provide your project context on the left, and TestForge AI will architect your documentation right here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
