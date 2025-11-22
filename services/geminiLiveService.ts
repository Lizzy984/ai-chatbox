import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from './audioUtils';
import { ConnectionState, TranscriptItem } from '../types';

interface GeminiLiveConfig {
  onStateChange: (state: ConnectionState) => void;
  onTranscript: (item: TranscriptItem) => void;
  onError: (error: string) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode | null = null;
  
  // Audio playback state
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private session: any = null; // Holds the active session object
  private sessionPromise: Promise<any> | null = null;

  // Transcription state
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor() {
    const apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async connect(config: GeminiLiveConfig) {
    try {
      config.onStateChange(ConnectionState.CONNECTING);

      // 1. Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);
      
      // Ensure contexts are running (needed for some browsers)
      await this.inputAudioContext.resume();
      await this.outputAudioContext.resume();

      // 2. Get Microphone Stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Connect to Gemini Live
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            config.onStateChange(ConnectionState.CONNECTED);
            this.startAudioInput(config.onError);
          },
          onmessage: async (message: LiveServerMessage) => {
            await this.handleMessage(message, config.onTranscript);
          },
          onclose: (e) => {
            console.log('Session closed', e);
            config.onStateChange(ConnectionState.DISCONNECTED);
            this.disconnect();
          },
          onerror: (e) => {
            console.error('Session error', e);
            config.onStateChange(ConnectionState.ERROR);
            config.onError('Connection error occurred.');
            this.disconnect();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { model: "google_search" }, // Using dummy config object to enable, standard is empty object {}
          outputAudioTranscription: { model: "google_search" },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Kore is usually calm/feminine
          },
          systemInstruction: `You are "SafeSpace", a compassionate, trauma-informed digital literacy and support assistant for women. 
          
          Your core mission is to:
          1. Educate women about digital safety (passwords, privacy settings, recognizing harassment).
          2. Provide support for Gender-Based Violence (GBV) by offering digital safety strategies.
          3. Speak clearly, calmly, and empathetically.
          4. Keep responses concise and conversational.
          
          CRITICAL SAFETY PROTOCOL:
          - You are an AI, not a human counselor.
          - If a user expresses immediate physical danger, urge them to contact local emergency services or specialized hotlines immediately.
          - Do not provide legal or medical advice.
          - Be non-judgmental and supportive.`,
        },
      });

    } catch (err: any) {
      console.error('Failed to connect:', err);
      config.onStateChange(ConnectionState.ERROR);
      config.onError(err.message || 'Failed to access microphone or connect.');
      this.disconnect();
    }
  }

  private startAudioInput(onError: (err: string) => void) {
    if (!this.inputAudioContext || !this.mediaStream || !this.sessionPromise) return;

    try {
      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        this.sessionPromise?.then((session: any) => {
          session.sendRealtimeInput({ media: pcmBlob });
        }).catch((err: any) => {
             console.error("Error sending input", err);
        });
      };

      this.sourceNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioContext.destination);
    } catch (e) {
      onError('Error processing audio input.');
    }
  }

  private async handleMessage(message: LiveServerMessage, onTranscript: (item: TranscriptItem) => void) {
    // 1. Handle Transcriptions
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      if (this.currentInputTranscription.trim()) {
        onTranscript({
          text: this.currentInputTranscription,
          sender: 'user',
          timestamp: Date.now(),
        });
      }
      if (this.currentOutputTranscription.trim()) {
        onTranscript({
          text: this.currentOutputTranscription,
          sender: 'model',
          timestamp: Date.now(),
        });
      }
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
    }

    // 2. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      try {
        // Sync start time
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const audioBuffer = await decodeAudioData(
          base64ToUint8Array(base64Audio),
          this.outputAudioContext,
          24000,
          1
        );

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        
        source.addEventListener('ended', () => {
          this.sources.delete(source);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
      } catch (e) {
        console.error('Error decoding/playing audio', e);
      }
    }

    // 3. Handle Interruption
    if (message.serverContent?.interrupted) {
      this.stopAllSources();
      this.nextStartTime = 0;
      // Clear pending transcripts on interrupt if desired, or keep them. 
      // Usually good to clear partials, but here we keep it simple.
    }
  }

  private stopAllSources() {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch (e) { /* ignore */ }
    });
    this.sources.clear();
  }

  public disconnect() {
    // Stop audio processing
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // Close tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close contexts
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    // Close Session (if specific close method exists on session object, otherwise we just nullify)
    // The live client doesn't expose an explicit 'close' on the session promise result easily 
    // other than expecting the server to handle disconnects or just dropping the reference.
    // However, for cleanup we rely on browser GC and track stopping.
    this.sessionPromise = null;
  }
}
