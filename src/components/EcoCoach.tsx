import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from './Card';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

const QUICK_ACTIONS = [
  { emoji: '🚲', label: 'Switch to cycling' },
  { emoji: '☀️', label: 'Reduce AC usage' },
  { emoji: '🌱', label: 'Start composting' },
  { emoji: '♻️', label: 'Recycling tips' },
];

export function EcoCoach() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: "Hi! I'm your Gemini-powered Eco-Coach. Ask me about sustainability, local recycling rules, or lifestyle changes." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = useCallback(async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input.trim();
    if (!messageToSend || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }]);
    setLoading(true);

    try {
      const res = await fetch('/api/eco-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || data.error }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Service temporarily unavailable." }]);
    }
    setLoading(false);
  }, [input, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  return (
    <Card 
      title="Smart Coach" 
      icon={Sparkles} 
      delay={0.4}
      subtitle="AI Reasoning"
      subtitleColor="text-accent-darker"
      iconBgClass="bg-primary-bg"
      iconColorClass="text-accent-darker"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden mt-4">
        
        {/* Quick action chips — Fix 28: Simple Actions */}
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Quick sustainability actions">
          {QUICK_ACTIONS.map(({ emoji, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => send(`How can I ${label.toLowerCase()}?`)}
              disabled={loading}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border-light bg-primary-bg hover:border-accent-dark hover:bg-accent-dark/5 transition-all disabled:opacity-50"
              aria-label={`Ask about: ${label}`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2" ref={scrollRef} aria-live="polite" aria-label="Chat messages" role="log">
           <AnimatePresence initial={false}>
             {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[90%] rounded-[24px] px-6 py-5 text-sm ${
                      m.role === 'user' 
                        ? 'bg-accent-dark text-white rounded-br-md italic shadow-sm' 
                        : 'bg-primary-bg text-primary-text rounded-tl-md shadow-inner'
                    }`}
                    aria-label={m.role === 'user' ? 'You said' : 'Eco Coach says'}
                  >
                    {m.role === 'assistant' ? (
                       <div className="markdown-body prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-white prose-pre:text-primary-text text-primary-text italic opacity-90">
                         <ReactMarkdown>{m.text}</ReactMarkdown>
                       </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </motion.div>
             ))}
             {loading && (
               <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
                  <div className="bg-primary-bg text-primary-text/50 rounded-[24px] rounded-tl-md px-6 py-5 shadow-inner" role="status">
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    <span className="sr-only">Eco Coach is thinking...</span>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 mt-2">
          <div className="relative flex items-center">
             <label htmlFor="eco-coach-input" className="sr-only">Message to Eco Coach</label>
             <input
               id="eco-coach-input"
               type="text"
               value={input}
               onChange={e => setInput(e.target.value)}
               placeholder="Ask for eco tips..."
               aria-label="Message to Eco Coach"
               className="w-full bg-primary-bg border border-border-light rounded-full pl-6 pr-12 py-3 text-sm outline-none focus:border-accent-dark focus:ring-1 focus:ring-accent-dark transition-all font-sans placeholder:opacity-40"
             />
             <button
               type="submit"
               disabled={!input.trim() || loading}
               aria-label="Send message to Eco Coach"
               className="absolute right-2 p-2 bg-accent-dark text-white rounded-full hover:bg-accent-darker disabled:opacity-50 transition-colors"
             >
               <Send size={14} className="ml-0.5" aria-hidden="true" />
             </button>
          </div>
          <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-4">
             <span className="opacity-40">Source: Search Grounding</span>
             <span className="opacity-40">Gemini 1.5 Flash</span>
          </div>
        </form>

      </div>
    </Card>
  );
}
