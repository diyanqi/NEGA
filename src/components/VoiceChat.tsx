"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Tooltip,
} from "@heroui/react";
import {
  X,
  Settings,
  Captions,
  Languages,
  Moon,
  Sun,
  Mic,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { useI18n } from "@/i18n/context";
import { useTheme } from "next-themes";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar } from "@heroui/react";
import { LogOut, LogIn } from "lucide-react";
import { isBrowserSpeechRecognitionSupported, createLiveSpeechRecognition } from "@/lib/browser-speech";

export default function VoiceChat() {
  const { dict, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { 
    isOpen: isAgreementOpen, 
    onOpen: onAgreementOpen, 
    onOpenChange: onAgreementOpenChange 
  } = useDisclosure();
  const [mounted, setMounted] = useState(false);

  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [mode, setMode] = useState<"listening" | "processing" | "speaking">(
    "listening",
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("en-US-AndrewMultilingualNeural");
  const [selectedCourse, setSelectedCourse] = useState("street");

  useEffect(() => {
    if (session) {
      setIsLimitReached(false);
    }
  }, [session]);

  const springLevels = [
    useSpring(0, { stiffness: 200, damping: 20 }),
    useSpring(0, { stiffness: 200, damping: 20 }),
    useSpring(0, { stiffness: 200, damping: 20 }),
    useSpring(0, { stiffness: 200, damping: 20 }),
  ];
  const [smoothedFrequencies, setSmoothedFrequencies] = useState([0, 0, 0, 0]);
  const aiSpringLevels = [
    useSpring(0, { stiffness: 180, damping: 18 }),
    useSpring(0, { stiffness: 180, damping: 18 }),
    useSpring(0, { stiffness: 180, damping: 18 }),
  ];
  const [smoothedAiBands, setSmoothedAiBands] = useState([0, 0, 0]);
  const springLevel = useSpring(0, { stiffness: 100, damping: 20 });
  const [smoothedLevel, setSmoothedLevel] = useState(0);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [useBrowserRecognition, setUseBrowserRecognition] = useState(false);
  const browserRecognitionRef = useRef<any>(null);
  const browserTranscriptRef = useRef<string>('');

  useEffect(() => {
    const unsubscribes = springLevels.map((spring, i) =>
      spring.on("change", (latest) => {
        setSmoothedFrequencies((prev) => {
          const next = [...prev];
          next[i] = latest;
          return next;
        });
      }),
    );
    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    const unsubscribes = aiSpringLevels.map((spring, i) =>
      spring.on("change", (latest) => {
        setSmoothedAiBands((prev) => {
          const next = [...prev];
          next[i] = latest;
          return next;
        });
      }),
    );
    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    springLevel.set(audioLevel);
  }, [audioLevel, springLevel]);

  useEffect(() => {
    return springLevel.on("change", (latest) => {
      setSmoothedLevel(latest);
    });
  }, [springLevel]);
  const lastActivityRef = useRef(Date.now());
  const modeRef = useRef(mode);
  const messagesRef = useRef(messages);

  useEffect(() => {
    setMounted(true);
    // Check if browser supports speech recognition
    if (isBrowserSpeechRecognitionSupported()) {
      console.debug('Browser Speech Recognition is supported');
      setUseBrowserRecognition(true);
    } else {
      console.debug('Browser Speech Recognition not supported, will use remote API');
    }
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const aiAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const aiAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputLevelRef = useRef(0);
  const isRecordingRef = useRef(false);
  const vadStateRef = useRef({
    startCandidateMs: 0,
    silenceStartMs: 0,
    recordStartMs: 0,
    isSpeaking: false,
  });

  const audioBufferRef = useRef<Float32Array[]>([]);
  const circularBufferRef = useRef<Float32Array[]>([]); // 500ms buffer
  const MAX_CIRCULAR_SIZE = 10; // Approximately 500ms at 16k context blocks

  const ttsQueueRef = useRef<string[]>([]);
  const ttsAudioQueueRef = useRef<{ text: string; url: string }[]>([]);
  const ttsPlayingRef = useRef(false);
  const ttsFetchingRef = useRef(false);

  const VAD_START_THRESHOLD = 0.02;
  const VAD_END_THRESHOLD = 0.02;
  const VAD_START_MS = 100;
  const VAD_END_MS = 1000;
  const VAD_MAX_RECORD_MS = 15000;
  const STALE_TIMEOUT_MS = 30000; // 30 seconds of silence

  const computeBandAverage = (
    dataArray: Uint8Array,
    start: number,
    end: number,
  ) => {
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
      sum += dataArray[i] || 0;
      count += 1;
    }
    return count > 0 ? sum / count / 255 : 0;
  };

  useEffect(() => {
    modeRef.current = mode;
    if (mode === "listening") {
      lastActivityRef.current = Date.now();
    }
  }, [mode]);

  // Check for stale conversation
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        hasStarted &&
        mode === "listening" &&
        !vadStateRef.current.isSpeaking
      ) {
        const now = Date.now();
        if (now - lastActivityRef.current > STALE_TIMEOUT_MS) {
          console.debug("Conversation stale, AI guiding...");
          lastActivityRef.current = now; // Reset to avoid double trigger
          void streamChatAndSpeak(
            "The user has been quiet for a while. Reach out to them in your authentic style, maybe drop a hot slang or ask them a question about their day to keep the vibe alive.",
            messagesRef.current,
          );
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [hasStarted, mode]);

  // Initialize audio context for visualization and VAD
  const setupAudioAnalysis = (stream: MediaStream) => {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);

    // Setup browser speech recognition if supported
    if (useBrowserRecognition && !browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current = createLiveSpeechRecognition(
          (result) => {
            if (result.isFinal) {
              browserTranscriptRef.current += result.text + ' ';
              console.debug('Browser recognition (final):', result.text);
            }
          },
          (error) => {
            console.warn('Browser recognition error:', error);
            // Don't disable it entirely, just log the error
          },
          {
            lang: 'en-US',
            continuous: true,
            interimResults: true,
          }
        );
        // Start browser recognition
        browserRecognitionRef.current.start();
        console.debug('Browser speech recognition started');
      } catch (err) {
        console.error('Failed to setup browser recognition:', err);
        setUseBrowserRecognition(false);
      }
    }

    // Use a ScriptProcessor or AudioWorklet for raw data analysis
    // For wider compatibility in this demo, we'll stick to Analyser + local sampling
    const analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateFrequencies = () => {
      if (analyserRef.current && modeRef.current === "listening") {
        analyserRef.current.getByteFrequencyData(dataArray);
        const bands = [
          [0.0, 0.12],
          [0.12, 0.28],
          [0.28, 0.5],
          [0.5, 0.8],
        ];
        const bandAverages = bands.map((range) => {
          const start = Math.floor(dataArray.length * range[0]);
          const end = Math.max(
            start + 1,
            Math.floor(dataArray.length * range[1]),
          );
          return computeBandAverage(dataArray, start, end);
        });

        const overall =
          bandAverages.reduce((acc, val) => acc + val, 0) / bandAverages.length;
        const isSilent =
          !vadStateRef.current.isSpeaking &&
          overall < 0.025 &&
          inputLevelRef.current < 0.02;

        if (isSilent) {
          // Force immediate reset on silence
          springLevels.forEach((spring) => spring.set(0));
          setSmoothedFrequencies([0, 0, 0, 0]);
        } else {
          bandAverages.forEach((avg, i) => springLevels[i].set(avg));
        }
      }
      requestAnimationFrame(updateFrequencies);
    };
    updateFrequencies();

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm = new Float32Array(inputData);

      // Calculate RMS Level
      let sum = 0;
      for (let i = 0; i < pcm.length; i++) sum += pcm[i] * pcm[i];
      const level = Math.sqrt(sum / pcm.length);
      setAudioLevel(level);
      inputLevelRef.current = level;

      const now = performance.now();
      const vad = vadStateRef.current;

      // Circular buffer management (always keep last 500ms)
      circularBufferRef.current.push(pcm);
      if (circularBufferRef.current.length > MAX_CIRCULAR_SIZE) {
        circularBufferRef.current.shift();
      }

      if (modeRef.current === "listening") {
        if (level >= VAD_START_THRESHOLD) {
          vad.silenceStartMs = 0;
          if (!vad.isSpeaking) {
            if (vad.startCandidateMs === 0) vad.startCandidateMs = now;
            if (now - vad.startCandidateMs >= VAD_START_MS) {
              console.debug("VAD: Speech Started");
              vad.isSpeaking = true;
              vad.recordStartMs = now;
              lastActivityRef.current = now; // Reset activity timer
              // Pre-fill with circular buffer
              audioBufferRef.current = [...circularBufferRef.current];
            }
          }
        } else {
          vad.startCandidateMs = 0;
          if (vad.isSpeaking) {
            if (vad.silenceStartMs === 0) vad.silenceStartMs = now;
            if (now - vad.silenceStartMs >= VAD_END_MS) {
              console.debug("VAD: Speech Ended");
              handleVADRecordingComplete();
              // Force reset visualization on speech end
              setTimeout(() => {
                springLevels.forEach((s) => s.set(0));
                setSmoothedFrequencies([0, 0, 0, 0]);
              }, 100);
            }
          }
        }

        if (vad.isSpeaking) {
          audioBufferRef.current.push(pcm);
          if (now - vad.recordStartMs >= VAD_MAX_RECORD_MS) {
            handleVADRecordingComplete();
          }
        }
      }
    };
  };

  const handleVADRecordingComplete = async () => {
    const vad = vadStateRef.current;
    vad.isSpeaking = false;
    vad.silenceStartMs = 0;

    const buffers = audioBufferRef.current;
    audioBufferRef.current = [];

    if (buffers.length < 5) return; // Too short

    // Flatten buffers
    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      result.set(b, offset);
      offset += b.length;
    }

    // Convert to WAV/PCM and send
    const wavBuffer = encodeWAV(result, 16000);
    const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });
    await processVoiceInput(audioBlob);
  };

  const startSession = async () => {
    try {
      setIsTransitioning(true);

      // Artificial delay for the cool animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      setHasStarted(true);
      setIsTransitioning(false);
      setMode("listening");
      await initAudioStream();
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsTransitioning(false);
    }
  };

  const endSession = () => {
    stopRecording();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
    // Cleanup browser recognition
    if (browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current.abort();
      } catch (e) {
        // Ignore errors on abort
      }
      browserRecognitionRef.current = null;
    }
    browserTranscriptRef.current = '';
    // Cleanup queues and revoke URLs
    ttsAudioQueueRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    ttsAudioQueueRef.current = [];
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    ttsFetchingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioSourceRef.current = null;
    aiAudioSourceRef.current = null;
    aiAnalyserRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setMessages([]);
    setCurrentSubtitle("");
    setAudioLevel(0);
    setSmoothedFrequencies([0, 0, 0, 0]);
    setSmoothedAiBands([0, 0, 0]);
    springLevels.forEach((s) => s.set(0));
    aiSpringLevels.forEach((s) => s.set(0));
    setHasStarted(false);
    setMode("listening");
  };

  const initAudioStream = async () => {
    if (mediaStreamRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    mediaStreamRef.current = stream;
    setupAudioAnalysis(stream);
  };

  const startRecording = () => {
    // Legacy startRecording replaced by VAD logic inside onaudioprocess
  };

  const stopRecording = () => {
    // Legacy stopRecording replaced by VAD logic inside onaudioprocess
    isRecordingRef.current = false;
  };

  const processVoiceInput = async (audioBlob: Blob, browserText?: string) => {
    if (isLimitReached) return;
    if (audioBlob.size === 0 && !browserText) {
      console.warn("Empty audio blob received");
      return;
    }

    console.debug(
      `Processing voice input: size=${audioBlob.size}, type=${audioBlob.type}, browserText=${browserText}`,
    );
    setMode("processing");
    setCurrentSubtitle("");

    try {
      let text = browserText || '';
      
      // If browser recognition was used and provided text, use it directly
      if (!text && useBrowserRecognition && browserTranscriptRef.current) {
        text = browserTranscriptRef.current;
        console.debug("Using browser recognition result:", text);
        browserTranscriptRef.current = ''; // Reset
      }
      
      // Otherwise, fall back to remote API
      if (!text) {
        // audioBlob is already 16kHz WAV from handleVADRecordingComplete
        const formData = new FormData();
        formData.append("file", audioBlob, "rec.wav");
        formData.append("mimeType", "audio/wav");

        // 1. Transcribe
        console.debug("Browser recognition not available/failed, using remote API...");
        const transRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        if (!transRes.ok) {
          const errData = await transRes.json();
          console.error("Transcription API error:", errData);
          throw new Error(
            `Transcription failed: ${errData.error || transRes.statusText}`,
          );
        }
        const result = await transRes.json();
        text = result.text;
        console.debug("Remote transcription result:", text);
      }
      
      setCurrentSubtitle(text);

      if (!text || text.trim().length === 0) {
        console.debug("No speech detected, restarting loop...");
        // If no speech detected, go back to listening
        setMode("listening");
        startRecording(); // Restart loop
        return;
      }

      // 2. Chat (stream) + 3. TTS (sentence chunks)
      const userMsg = { role: "user" as const, content: text };
      const newMsgs = [...messagesRef.current, userMsg];
      setMessages(newMsgs);
      await streamChatAndSpeak(text, newMsgs);
    } catch (e) {
      console.error("Processing error:", e);
      setMode("listening");
    }
  };

  // WAV Encoder Helper
  const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 32 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  };

  // Raw PCM Encoder Helper (No Header)
  const encodeRawPCM = (samples: Float32Array) => {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const extractSentenceChunks = (text: string) => {
    const parts = text.split(/(?<=[.!?。！？])\s+/);
    const endsWithPunct = /[.!?。！？]\s*$/.test(text);
    const remainder = endsWithPunct ? "" : parts.pop() || "";
    const chunks = parts.filter((part) => part.trim().length > 0);
    return { chunks, remainder };
  };

  const enqueueTTS = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    ttsQueueRef.current.push(trimmed);

    // Trigger pre-fetching
    void startFetchingTts();
    // Trigger playback
    if (!ttsPlayingRef.current) {
      void startPlaybackLoop();
    }
  };

  const startFetchingTts = async () => {
    if (ttsFetchingRef.current) return;
    // Allow at most 2 pre-fetched items to balance memory and latency
    if (ttsAudioQueueRef.current.length >= 2) return;
    if (ttsQueueRef.current.length === 0) return;

    ttsFetchingRef.current = true;
    try {
      while (
        ttsQueueRef.current.length > 0 &&
        ttsAudioQueueRef.current.length < 2
      ) {
        const text = ttsQueueRef.current.shift();
        if (!text) continue;

        try {
          console.debug("Pre-fetching TTS for:", text.slice(0, 30));
          const url = await fetchTtsUrl(text);
          ttsAudioQueueRef.current.push({ text, url });

          // If we were waiting for audio to start playback
          if (!ttsPlayingRef.current) {
            void startPlaybackLoop();
          }
        } catch (e) {
          console.error("Pre-fetch failed:", e);
        }
      }
    } finally {
      ttsFetchingRef.current = false;
      // If someone added more to queue while we were exiting, re-trigger
      if (
        ttsQueueRef.current.length > 0 &&
        ttsAudioQueueRef.current.length < 2
      ) {
        void startFetchingTts();
      }
    }
  };

  const startPlaybackLoop = async () => {
    if (ttsPlayingRef.current) return;
    if (ttsAudioQueueRef.current.length === 0) return;

    ttsPlayingRef.current = true;
    setMode("speaking");

    try {
      while (ttsAudioQueueRef.current.length > 0) {
        const item = ttsAudioQueueRef.current.shift();
        if (!item) continue;

        // Start pre-fetching the next one immediately as a slot just opened
        void startFetchingTts();

        await playAudioUrl(item.url);
        URL.revokeObjectURL(item.url);
      }
    } finally {
      ttsPlayingRef.current = false;
      // Check if more text arrived or audio was pre-fetched in the meantime
      if (ttsAudioQueueRef.current.length > 0) {
        void startPlaybackLoop();
      } else if (ttsQueueRef.current.length === 0) {
        setMode("listening");
      }
    }
  };

  const fetchTtsUrl = async (text: string): Promise<string> => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: selectedVoice }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`TTS failed: ${err || res.statusText}`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

  const playAudioUrl = async (url: string) => {
    if (!audioPlayerRef.current) return;

    return new Promise<void>((resolve, reject) => {
      const player = audioPlayerRef.current;
      if (!player) return resolve();

      // Setup analyser for AI playback visualization
      try {
        if (audioContextRef.current) {
          const ctx = audioContextRef.current;
          if (!aiAnalyserRef.current) {
            const analyser = ctx.createAnalyser();
            analyser.smoothingTimeConstant = 0.8;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -10;
            analyser.fftSize = 2048;
            aiAnalyserRef.current = analyser;
          }

          if (!aiAudioSourceRef.current) {
            const source = ctx.createMediaElementSource(player);
            source.connect(aiAnalyserRef.current);
            aiAnalyserRef.current?.connect(ctx.destination);
            aiAudioSourceRef.current = source;
          }
        }
      } catch (e) {
        console.warn("Could not setup AI audio analysis:", e);
      }

      player.src = url;

      const dataArray = new Uint8Array(
        aiAnalyserRef.current?.frequencyBinCount || 0,
      );
      const interval = setInterval(() => {
        if (
          modeRef.current === "speaking" &&
          !player.paused &&
          aiAnalyserRef.current
        ) {
          aiAnalyserRef.current.getByteFrequencyData(dataArray);
          const overall = computeBandAverage(dataArray, 0, dataArray.length);
          setAudioLevel(Math.min(overall * 2.2, 1));

          const bands = [
            [0.0, 0.18],
            [0.18, 0.45],
            [0.45, 0.85],
          ];
          bands.forEach((range, i) => {
            const start = Math.floor(dataArray.length * range[0]);
            const end = Math.max(
              start + 1,
              Math.floor(dataArray.length * range[1]),
            );
            const avg = computeBandAverage(dataArray, start, end);
            aiSpringLevels[i].set(avg);
          });
        }
      }, 50);

      const cleanup = () => {
        clearInterval(interval);
        setAudioLevel(0);
      };

      player.onended = () => {
        cleanup();
        resolve();
      };
      player.onerror = () => {
        cleanup();
        reject(new Error("Audio playback failed"));
      };

      player.play().catch((err) => {
        cleanup();
        reject(err);
      });
    });
  };

  const streamChatAndSpeak = async (
    text: string,
    currentMessages: { role: "user" | "assistant"; content: string }[],
  ) => {
    console.debug("Streaming /api/chat:", text);
    const chatRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: currentMessages,
        stream: true,
        course: selectedCourse,
      }),
    });

    if (!chatRes.ok || !chatRes.body) {
      const errorData = await chatRes.json().catch(() => ({}));
      if (errorData.error === "LIMIT_REACHED") {
        setIsLimitReached(true);
        const limitMsg = dict.common.limitReached;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: limitMsg },
        ]);
        setCurrentSubtitle(limitMsg);
        // Play the limit reached message via TTS if possible, or just show it
        void fetchTtsUrl(limitMsg).then(url => playAudioUrl(url));
        return;
      }
      console.error("Chat API error:", chatRes.statusText);
      throw new Error("Chat failed");
    }

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pending = "";
    let fullAssistantResponse = "";
    let isDone = false;

    while (!isDone) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      while (buffer.includes("\n\n")) {
        const splitIndex = buffer.indexOf("\n\n");
        const packet = buffer.slice(0, splitIndex);
        buffer = buffer.slice(splitIndex + 2);

        for (const line of packet.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.replace(/^data:\s*/, "").trim();
          if (data === "[DONE]") {
            isDone = true;
            break;
          }

          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content || "";
            if (delta) {
              pending += delta;
              fullAssistantResponse += delta;
              setCurrentSubtitle(fullAssistantResponse);
              const { chunks, remainder } = extractSentenceChunks(pending);
              chunks.forEach(enqueueTTS);
              pending = remainder;
            }
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
        if (isDone) break;
      }
    }

    if (pending.trim()) {
      enqueueTTS(pending);
      fullAssistantResponse += pending;
    }

    if (fullAssistantResponse.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullAssistantResponse },
      ]);
    }
  };

  // Helper for interrupting AI
  const handleInterrupt = () => {
    if (mode === "speaking" && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      ttsAudioQueueRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      ttsAudioQueueRef.current = [];
      ttsQueueRef.current = [];
      ttsPlayingRef.current = false;
      ttsFetchingRef.current = false;
      setMode("listening");
    } else if (mode === "listening") {
      // Manual stop of current VAD segment
      if (vadStateRef.current.isSpeaking) {
        handleVADRecordingComplete();
      }
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-hidden font-sans transition-colors duration-500">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 2.5, 100], opacity: [1, 1, 0] }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-12 h-12 rounded-full bg-foreground shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 80], opacity: [0, 0.3, 0] }}
              transition={{
                duration: 1.2,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute w-12 h-12 rounded-full border-[8px] border-foreground"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-0 bg-white dark:bg-black"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasStarted ? (
        <div className="h-full w-full bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-500 mesh-gradient relative">
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center z-20 gap-4">
            <motion.a
              href="https://www.inkcraft.cn"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group relative flex items-center gap-3 bg-foreground/5 hover:bg-foreground/10 px-4 py-3 rounded-2xl backdrop-blur-xl border border-foreground/5 transition-all hover:scale-[1.05] shadow-sm overflow-hidden"
            >
              {/* Shiny animated border/background */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-blue-400/20 to-transparent -skew-x-12"
                animate={{
                  left: ["-100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1,
                }}
              />
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
                animate={{
                  backgroundPosition: ["0% 0%", "200% 0%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              <div className="relative w-10 h-10 rounded-xl bg-foreground flex items-center justify-center transition-transform group-hover:rotate-12 shadow-lg z-10">
                <span className="text-background font-black text-lg">I</span>
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 rounded-full"
                  animate={{ scaleX: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex flex-col relative z-10">
                <span className="font-black text-sm tracking-tight text-foreground/90 group-hover:text-blue-500 transition-colors">
                  {dict.common.adText}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  {dict.common.visitInkCraft} <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>🚀</motion.span>
                </span>
              </div>
            </motion.a>
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                x: [0, 50, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.15, 0.1],
                x: [0, -40, 0],
                y: [0, 60, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[120px]"
            />
          </div>

          <div className="w-full max-w-4xl space-y-8 md:space-y-16 text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 md:space-y-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-block px-3 py-1 mb-1 md:mb-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] md:text-sm font-bold tracking-wide uppercase"
              >
                v1.0 is here
              </motion.div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-linear-to-b from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent leading-[0.9]">
                {dict.common.title}
              </h1>
              <p className="text-lg md:text-2xl text-foreground/60 font-medium max-w-xl mx-auto leading-relaxed px-4 md:px-0">
                {dict.common.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0"
            >
              {[
                {
                  icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
                  text: dict.home.feature1,
                  desc: "Corrections in real-time",
                },
                {
                  icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
                  text: dict.home.feature2,
                  desc: "Natural flow assistant",
                },
                {
                  icon: <Mic className="w-6 h-6 text-purple-500" />,
                  text: dict.home.feature3,
                  desc: "Premium TTS & ASR",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="bg-foreground/5 hover:bg-foreground/[0.08] border-none transition-colors backdrop-blur-sm"
                  shadow="none"
                >
                  <CardBody className="flex flex-col items-center p-6 md:p-8 space-y-3 md:space-y-4">
                    <div className="p-2 md:p-3 rounded-2xl bg-background/50 shadow-sm">
                      {item.icon}
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <h3 className="text-sm md:text-base font-bold">{item.text}</h3>
                      <p className="text-[10px] md:text-xs text-foreground/40 font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col items-center space-y-6 md:space-y-8 px-4 w-full max-w-lg mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <Dropdown 
                  className="bg-background/90 backdrop-blur-3xl border border-foreground/10 rounded-[1.5rem] shadow-2xl p-2 min-w-[240px]"
                >
                  <DropdownTrigger>
                    <Button 
                      variant="flat" 
                      className="h-16 bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 rounded-2xl font-bold flex justify-between px-6 transition-all hover:scale-[1.02]"
                      startContent={<GraduationCap size={24} className="text-blue-500 mr-1" />}
                      endContent={<ChevronDown size={16} className="opacity-30" />}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-black">{dict.common.course}</span>
                        <span className="text-sm tracking-tight">{(dict.courses as any)[selectedCourse]}</span>
                      </div>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Course selection"
                    onAction={(key) => setSelectedCourse(key as string)}
                    selectedKeys={[selectedCourse]}
                    selectionMode="single"
                    className="p-1"
                    itemClasses={{
                      base: "rounded-xl py-3 px-4 gap-3 data-[hover=true]:bg-foreground/5 transition-all",
                      title: "font-bold text-sm",
                      description: "text-[11px] opacity-50 font-medium",
                      selectedIcon: "text-blue-500",
                    }}
                  >
                    <DropdownItem key="street" description={dict.courses.streetDesc}>{dict.courses.street}</DropdownItem>
                    <DropdownItem key="interview" description={dict.courses.interviewDesc}>{dict.courses.interview}</DropdownItem>
                    <DropdownItem key="travel" description={dict.courses.travelDesc}>{dict.courses.travel}</DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                <Dropdown 
                  className="bg-background/90 backdrop-blur-3xl border border-foreground/10 rounded-[1.5rem] shadow-2xl p-2 min-w-[240px]"
                >
                  <DropdownTrigger>
                    <Button 
                      variant="flat" 
                      className="h-16 bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 rounded-2xl font-bold flex justify-between px-6 transition-all hover:scale-[1.02]"
                      startContent={<Volume2 size={24} className="text-purple-500 mr-1" />}
                      endContent={<ChevronDown size={16} className="opacity-30" />}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-black">{dict.common.voice}</span>
                        <span className="text-sm tracking-tight text-left">
                          {selectedVoice === "en-US-AndrewMultilingualNeural" ? dict.voices.andrew : 
                           selectedVoice === "en-US-AvaNeural" ? dict.voices.emma : dict.voices.brian}
                        </span>
                      </div>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Voice selection"
                    onAction={(key) => setSelectedVoice(key as string)}
                    selectedKeys={[selectedVoice]}
                    selectionMode="single"
                    className="p-1"
                    itemClasses={{
                      base: "rounded-xl py-3 px-4 data-[hover=true]:bg-foreground/5 transition-all",
                      title: "font-bold text-sm",
                      selectedIcon: "text-purple-500",
                    }}
                  >
                    <DropdownItem key="en-US-AndrewMultilingualNeural">{dict.voices.andrew}</DropdownItem>
                    <DropdownItem key="en-US-AvaNeural">{dict.voices.emma}</DropdownItem>
                    <DropdownItem key="en-GB-SoniaNeural">{dict.voices.brian}</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <Button
                size="lg"
                radius="full"
                className="group relative w-full h-16 md:h-20 bg-foreground text-background text-xl md:text-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(255,255,255,0.05)]"
                onPress={startSession}
              >
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-[length:200%_100%]"
                  animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative z-10 flex items-center gap-3 md:gap-4">
                  {dict.common.startSession}
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    →
                  </motion.div>
                </span>
              </Button>

              <div className="flex flex-col items-center space-y-4 md:space-y-6">
                {!session && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] md:text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] bg-foreground/5 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-foreground/5"
                  >
                    🚀 {dict.common.limitNote}
                  </motion.p>
                )}
                <div className="flex items-center gap-2 md:gap-4 p-1.5 md:p-2 bg-foreground/5 rounded-full backdrop-blur-md border border-foreground/5 shadow-inner">
                {session ? (
                  <Dropdown placement="top" offset={12} className="bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-2xl">
                    <DropdownTrigger>
                      <button className="outline-none">
                        <Avatar
                          isBordered
                          as="div"
                          className="w-10 h-10 transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-foreground"
                          classNames={{
                            base: "bg-foreground text-background font-black text-sm",
                            name: "font-black"
                          }}
                          src={session.user?.image || undefined}
                          name={session.user?.name || "User"}
                        />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Profile Actions" variant="flat" className="p-2">
                      <DropdownItem key="profile" className="h-14 gap-2 opacity-100 cursor-default hover:bg-transparent">
                        <p className="font-black text-[10px] text-foreground/30 uppercase tracking-widest">Logged in as</p>
                        <p className="font-bold text-sm truncate">{session.user?.email}</p>
                      </DropdownItem>
                      <DropdownItem 
                        key="logout" 
                        color="danger" 
                        onPress={() => signOut()} 
                        startContent={<LogOut size={16} />}
                        className="rounded-xl font-bold transition-colors"
                      >
                        {dict.common.signOut}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                ) : (
                  <Tooltip 
                    content={dict.common.signIn} 
                    showArrow 
                    placement="top" 
                    delay={0}
                    closeDelay={0}
                    classNames={{
                      content: "bg-foreground text-background font-bold text-xs py-2 px-3 rounded-xl shadow-xl",
                      arrow: "bg-foreground"
                    }}
                  >
                    <Button
                      isIconOnly
                      variant="light"
                      radius="full"
                      className="h-12 w-12 flex items-center justify-center bg-background/50 hover:bg-background shadow-sm transition-all"
                      onPress={() => signIn('casdoor')}
                    >
                      <LogIn size={20} className="text-foreground" />
                    </Button>
                  </Tooltip>
                )}
                <div className="w-px h-6 bg-foreground/10 mx-1" />
                <Tooltip
                  content={
                    language === "zh" ? "Switch to English" : "切换到中文"
                  }
                  showArrow
                  placement="top"
                  delay={0}
                  classNames={{
                    content: "bg-foreground text-background font-bold text-xs py-2 px-3 rounded-xl shadow-xl",
                    arrow: "bg-foreground"
                  }}
                >
                  <Button
                    variant="light"
                    radius="full"
                    className="font-bold h-10 md:h-12 px-4 md:px-6 hover:bg-background/50 transition-colors"
                    onPress={() => setLanguage(language === "zh" ? "en" : "zh")}
                    startContent={
                      <Languages size={18} className="opacity-60" />
                    }
                  >
                    {language === "zh" ? "English" : "中文"}
                  </Button>
                </Tooltip>
                <div className="w-px h-6 bg-foreground/10 mx-1" />
                <Tooltip
                  content={
                    theme === "dark" ? "Switch to Light" : "Switch to Dark"
                  }
                  showArrow
                  placement="top"
                  delay={0}
                  classNames={{
                    content: "bg-foreground text-background font-bold text-xs py-2 px-3 rounded-xl shadow-xl",
                    arrow: "bg-foreground"
                  }}
                >
                  <Button
                    isIconOnly
                    variant="light"
                    radius="full"
                    className="h-12 w-12 hover:bg-background/50 transition-colors"
                    onPress={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {mounted &&
                      (theme === "dark" ? (
                        <Sun size={20} className="opacity-60" />
                      ) : (
                        <Moon size={20} className="opacity-60" />
                      ))}
                  </Button>
                </Tooltip>
              </div>

              <button 
                className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em] hover:text-foreground/40 transition-colors"
                onClick={onAgreementOpen}
              >
                {dict.common.userAgreement}
              </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative font-sans">
          {/* Top Area */}
          <div className="h-14 w-full" />

          {/* Main Visualizer Area */}
          <div
            className="flex-1 flex flex-col items-center justify-center relative cursor-pointer"
            onClick={handleInterrupt}
          >
            <AnimatePresence mode="wait">
              {mode === "listening" ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-6"
                >
                  {/* 4 Circles Visualizer */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-full bg-foreground/90"
                      animate={{
                        height:
                          44 + Math.pow(smoothedFrequencies[i], 0.6) * 170,
                        scale: 1 + Math.pow(smoothedFrequencies[i], 0.6) * 0.65,
                        opacity:
                          0.5 + Math.min(smoothedFrequencies[i] * 2, 0.5),
                        y: -4 - smoothedFrequencies[i] * 16,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 26,
                        mass: 0.6,
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center justify-center"
                >
                  {/* Core Circle */}
                  <motion.div
                    className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-foreground relative z-10 shadow-2xl flex items-center justify-center overflow-hidden"
                    animate={{
                      scale:
                        1 + smoothedLevel * 0.35 + smoothedAiBands[1] * 0.15,
                      boxShadow: `0 0 ${30 + smoothedLevel * 120}px rgba(59,130,246,${0.15 + smoothedLevel * 0.35})`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-linear-to-tr from-blue-500/30 to-purple-500/30"
                      animate={{
                        rotate: [0, 360],
                        opacity: [
                          0.2 + smoothedAiBands[0] * 0.4,
                          0.6 + smoothedAiBands[2] * 0.4,
                          0.2 + smoothedAiBands[0] * 0.4,
                        ],
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </motion.div>

                  {/* Pulsing Outer Rings */}
                  {[1, 1.4, 1.8].map((s, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-48 h-48 md:w-64 md:h-64 rounded-full bg-foreground/10"
                      animate={{
                        scale:
                          s +
                          smoothedLevel * (i + 1) * 0.45 +
                          smoothedAiBands[i] * 0.8,
                        opacity: [0.2 + smoothedAiBands[i] * 0.5, 0],
                      }}
                      transition={{
                        duration: 1.8 + i * 0.3,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.25,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-20 md:bottom-24 flex flex-col items-center space-y-4 md:space-y-6">
              <p className="text-foreground/30 font-black text-xs md:text-sm tracking-[0.3em] uppercase">
                {mode === "listening"
                  ? vadStateRef.current.isSpeaking
                    ? dict.common.listening
                    : dict.common.waiting
                  : mode === "speaking"
                    ? dict.common.interrupting
                    : dict.common.thinking}
              </p>
              {vadStateRef.current.isSpeaking && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                />
              )}
            </div>
          </div>

          {/* Subtitles Overlay */}
          <AnimatePresence>
            {showSubtitles && currentSubtitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-40 md:bottom-48 left-0 right-0 px-6 md:px-8 flex justify-center pointer-events-none z-20"
              >
                <div className="max-w-xl bg-background/40 backdrop-blur-3xl border border-foreground/5 px-6 md:px-10 py-4 md:py-6 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                  <p className="text-lg md:text-2xl font-bold text-center leading-relaxed tracking-tight text-foreground/90">
                    {currentSubtitle}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-32 md:h-40 w-full px-6 md:px-12 pb-8 md:pb-16 flex items-center justify-center gap-4 md:gap-8 z-10">
            <Tooltip content={dict.common.settings}>
              <Button
                isIconOnly
                variant="flat"
                radius="full"
                className="bg-foreground/5 hover:bg-foreground/10 text-foreground w-14 h-14 md:w-16 md:h-16 flex items-center justify-center p-0 min-w-0 transition-all hover:scale-110 active:scale-90"
                onPress={onOpen}
              >
                <Settings size={22} className="md:size-[26px]" />
              </Button>
            </Tooltip>

            <Tooltip content={dict.common.endSession}>
              <Button
                isIconOnly
                radius="full"
                variant="solid"
                className="w-16 h-16 md:w-20 md:h-20 p-0 min-w-0 flex items-center justify-center text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 hover:scale-110 active:scale-95 transition-all "
                onPress={endSession}
              >
                <X size={28} className="md:size-8" color="white" strokeWidth={3} />
              </Button>
            </Tooltip>

            <Tooltip content={dict.common.subtitles}>
              <Button
                isIconOnly
                variant={showSubtitles ? "solid" : "flat"}
                radius="full"
                className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center p-0 min-w-0 transition-all hover:scale-110 active:scale-90 ${showSubtitles ? "bg-foreground text-background" : "bg-foreground/5 text-foreground hover:bg-foreground/10"}`}
                onPress={() => setShowSubtitles(!showSubtitles)}
              >
                <Captions size={22} className="md:size-[26px]" />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        size="md"
        classNames={{
          wrapper: "z-[1000] items-center",
          base: "w-[92vw] max-w-[720px] bg-background/85 backdrop-blur-2xl border border-foreground/10 shadow-2xl rounded-[2.5rem]",
          header: "border-none text-2xl font-black px-6 pt-6",
          body: "px-6 pb-6",
          footer: "border-none",
          closeButton: "top-4 right-4 text-foreground/60 hover:text-foreground",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {dict.common.settings}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] ml-4">
                      {dict.common.theme}
                    </label>
                    <div className="p-1 bg-foreground/5 rounded-2xl flex gap-1">
                      <Button
                        fullWidth
                        variant={
                          mounted && theme === "light" ? "solid" : "light"
                        }
                        onPress={() => setTheme("light")}
                        className={
                          mounted && theme === "light"
                            ? "bg-foreground text-background shadow-sm font-bold rounded-xl"
                            : "hover:bg-foreground/5 font-bold rounded-xl"
                        }
                        startContent={<Sun size={18} />}
                      >
                        {dict.common.light}
                      </Button>
                      <Button
                        fullWidth
                        variant={
                          mounted && theme === "dark" ? "solid" : "light"
                        }
                        onPress={() => setTheme("dark")}
                        className={
                          mounted && theme === "dark"
                            ? "bg-foreground text-background shadow-sm font-bold rounded-xl"
                            : "hover:bg-foreground/5 font-bold rounded-xl"
                        }
                        startContent={<Moon size={18} />}
                      >
                        {dict.common.dark}
                      </Button>
                      <Button
                        fullWidth
                        variant={
                          mounted && theme === "system" ? "solid" : "light"
                        }
                        onPress={() => setTheme("system")}
                        className={
                          mounted && theme === "system"
                            ? "bg-foreground text-background shadow-sm font-bold rounded-xl"
                            : "hover:bg-foreground/5 font-bold rounded-xl"
                        }
                        startContent={<Settings size={18} />}
                      >
                        {dict.common.system}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] ml-4">
                      {dict.common.language}
                    </label>
                    <div className="p-1 bg-foreground/5 rounded-2xl flex gap-1">
                      <Button
                        fullWidth
                        variant={language === "zh" ? "solid" : "light"}
                        className={
                          language === "zh"
                            ? "bg-foreground text-background shadow-sm font-bold rounded-xl"
                            : "hover:bg-foreground/5 font-bold rounded-xl"
                        }
                        onPress={() => setLanguage("zh")}
                      >
                        中文
                      </Button>
                      <Button
                        fullWidth
                        variant={language === "en" ? "solid" : "light"}
                        className={
                          language === "en"
                            ? "bg-foreground text-background shadow-sm font-bold rounded-xl"
                            : "hover:bg-foreground/5 font-bold rounded-xl"
                        }
                        onPress={() => setLanguage("en")}
                      >
                        English
                      </Button>
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isLimitReached}
        onOpenChange={(open) => !open && setIsLimitReached(false)}
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          base: "bg-background/80 backdrop-blur-2xl border border-foreground/10 rounded-[2.5rem] p-4",
          header: "font-black text-2xl",
        }}
      >
        <ModalContent>
          <ModalHeader>Daily Limit Reached</ModalHeader>
          <ModalBody className="pb-8">
            <p className="text-lg font-medium opacity-60 mb-6">{dict.common.limitReached}</p>
            <Button 
              fullWidth 
              size="lg" 
              className="bg-foreground text-background font-black rounded-2xl h-16 text-xl shadow-xl shadow-foreground/10"
              onPress={() => signIn('casdoor')}
            >
              {dict.common.signIn}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* User Agreement Modal */}
      <Modal
        isOpen={isAgreementOpen}
        onOpenChange={onAgreementOpenChange}
        backdrop="blur"
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[1000]",
          base: "bg-background/85 backdrop-blur-2xl border border-foreground/10 rounded-[2.5rem]",
          header: "border-none text-2xl font-black px-8 pt-8",
          body: "px-8 pb-8",
        }}
      >
        <ModalContent>
          <ModalHeader>{dict.common.userAgreement}</ModalHeader>
          <ModalBody className="text-sm leading-relaxed space-y-4">
            <p className="font-bold text-lg">1. Introduction</p>
            <p className="opacity-70">Welcome to NEGA. By using our service, you agree to these terms. Please read them carefully. NEGA provides AI-powered English learning assistance through voice and text interaction.</p>
            
            <p className="font-bold text-lg">2. Usage Limits</p>
            <p className="opacity-70">To ensure service quality for everyone, guest users are limited to 3 conversation rounds per session. Registered users enjoy unlimited access. We reserve the right to modify these limits to protect our infrastructure.</p>
            
            <p className="font-bold text-lg">3. Privacy & Data</p>
            <p className="opacity-70">Your voice and text inputs are processed to provide corrections and improvements. We use industry-standard encryption to protect your data. By using the service, you consent to the processing of your data for educational purposes.</p>
            
            <p className="font-bold text-lg">4. Intelligent Agent Persona</p>
            <p className="opacity-70">NEGA's "Native English Grammar Assistant" persona uses informal language, slang, and authentic expressions to simulate real-world conversations. User discretion is advised.</p>
            
            <div className="pt-4 border-t border-foreground/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-center">Last Updated: February 2026 • NEGA Team</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
}
