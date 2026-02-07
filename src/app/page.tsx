'use client';

import { useState } from "react";
import VoiceChat from "@/components/VoiceChat";
import ChatInterface from "@/components/ChatInterface";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [view, setView] = useState<'voice' | 'chat'>('voice');

  return (
    <main className="h-screen w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {view === 'voice' ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <VoiceChat onSwitchToChat={() => setView('chat')} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <ChatInterface onSwitchToVoice={() => setView('voice')} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

