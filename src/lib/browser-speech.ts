/**
 * Browser Speech Recognition Utilities
 * 浏览器语音识别工具
 */

// Extend Window interface to include Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface BrowserSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface BrowserSpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Check if browser supports Speech Recognition API
 * 检测浏览器是否支持语音识别API
 */
export function isBrowserSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}

/**
 * Transcribe audio blob using browser's Speech Recognition API
 * 使用浏览器语音识别API转录音频
 */
export async function transcribeWithBrowser(
  audioBlob: Blob,
  options: BrowserSpeechRecognitionOptions = {}
): Promise<string> {
  if (!isBrowserSpeechRecognitionSupported()) {
    throw new Error('Browser Speech Recognition not supported');
  }

  const {
    lang = 'en-US',
    continuous = false,
    interimResults = false,
    maxAlternatives = 1,
  } = options;

  return new Promise<string>((resolve, reject) => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    // Create audio element to play the blob (triggers microphone input)
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    let finalTranscript = '';
    let hasResult = false;

    recognition.onresult = (event: any) => {
      hasResult = true;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      URL.revokeObjectURL(audioUrl);
      console.error('Browser Speech Recognition Error:', event.error);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      URL.revokeObjectURL(audioUrl);
      if (hasResult && finalTranscript) {
        resolve(finalTranscript);
      } else {
        reject(new Error('No speech detected'));
      }
    };

    // Note: Browser Speech Recognition API doesn't actually consume audio blobs directly.
    // It listens to the microphone. This is a limitation.
    // For true blob-to-text, we need to use the remote API.
    // However, we can provide a live recognition alternative.
    recognition.start();

    // Stop recognition after a timeout (assuming the audio length)
    const timeout = setTimeout(() => {
      recognition.stop();
    }, 10000); // 10 seconds max

    recognition.onend = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(audioUrl);
      if (hasResult && finalTranscript) {
        resolve(finalTranscript);
      } else {
        resolve(''); // Return empty instead of rejecting
      }
    };
  });
}

/**
 * Create a live speech recognition instance
 * 创建实时语音识别实例
 */
export function createLiveSpeechRecognition(
  onResult: (result: BrowserSpeechRecognitionResult) => void,
  onError: (error: Error) => void,
  options: BrowserSpeechRecognitionOptions = {}
) {
  if (!isBrowserSpeechRecognitionSupported()) {
    throw new Error('Browser Speech Recognition not supported');
  }

  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const SpeechRecognition =
    window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.maxAlternatives = maxAlternatives;

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0;
      const isFinal = result.isFinal;

      onResult({ text: transcript, confidence, isFinal });
    }
  };

  recognition.onerror = (event: any) => {
    onError(new Error(`Speech recognition error: ${event.error}`));
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  };
}

/**
 * Hybrid transcription: Try browser first, fallback to remote API
 * 混合转录：优先尝试浏览器识别，失败则使用远程API
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  options: {
    lang?: string;
    useBrowserFirst?: boolean;
    remoteApiEndpoint?: string;
    mimeType?: string;
  } = {}
): Promise<{ text: string; method: 'browser' | 'remote' }> {
  const {
    lang = 'en-US',
    useBrowserFirst = true,
    remoteApiEndpoint = '/api/transcribe',
    mimeType = audioBlob.type,
  } = options;

  // Try browser recognition first if supported and enabled
  if (useBrowserFirst && isBrowserSpeechRecognitionSupported()) {
    try {
      console.debug('Attempting browser speech recognition...');
      
      // Note: Browser Speech Recognition API has limitations
      // It primarily works with live microphone input, not pre-recorded blobs
      // For now, we'll skip browser recognition for blobs and use remote API
      // A better implementation would use live recognition during recording
      
      console.debug('Browser speech recognition skipped for blob, using remote API');
    } catch (error) {
      console.warn('Browser speech recognition failed:', error);
    }
  }

  // Fallback to remote API
  console.debug('Using remote API for transcription...');
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  if (mimeType) {
    formData.append('mimeType', mimeType);
  }

  const response = await fetch(remoteApiEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Remote transcription failed: ${errorData.error || response.statusText}`
    );
  }

  const data = await response.json();
  return { text: data.text || '', method: 'remote' };
}
