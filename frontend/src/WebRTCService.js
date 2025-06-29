// WebRTCService.js - Real-time audio streaming with WebRTC
class WebRTCService {
  constructor() {
    this.listeners = new Set();
    this.isStreaming = false;
    this.mediaStream = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.currentLanguage = 'en'; // Default language
  }

  setLanguage(language) {
    this.currentLanguage = language;
    console.log(`WebRTCService: Language set to ${this.currentLanguage}`);
  }

  addListener(callback) {
    this.listeners.add(callback);
    
    // Start streaming when first listener is added
    if (this.listeners.size === 1 && !this.isStreaming) {
      this.startAudioStreaming();
    }
  }

  removeListener(callback) {
    this.listeners.delete(callback);
    
    // Stop streaming when no listeners remain
    if (this.listeners.size === 0) {
      this.stopAudioStreaming();
    }
  }

  notifyListeners(message) {
    this.listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebRTC listener:', error);
      }
    });
  }

  async startAudioStreaming() {
    if (this.isStreaming) return;

    try {
      console.log('🎙️ Starting WebRTC audio streaming...');
      this.notifyListeners({ type: 'status', data: 'Starting audio...' });

      // Get microphone access with specific constraints for better compatibility
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1  // Mono audio
        }
      });

      console.log('🎤 Microphone access granted');
      this.notifyListeners({ type: 'status', data: 'Microphone ready ✅' });

      // Create WebSocket connection for signaling
      await this.createWebSocketConnection();

      // Set up audio processing with Web Audio API for better control
      await this.setupWebAudioProcessing();

      this.isStreaming = true;
      console.log('🚀 WebRTC audio streaming started');

    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error);
      this.notifyListeners({ type: 'status', data: `Error: ${error.message} ❌` });
    }
  }

  async createWebSocketConnection(retryCount = 0) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:8000/webrtc');
      this.signalingSocket = ws;

      ws.onopen = () => {
        console.log('📡 WebSocket connected');
        this.notifyListeners({ type: 'status', data: 'Connected ✅' });

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'transcription') {
              console.log('📥 Received transcription:', data.text);
              this.notifyListeners({ type: 'transcription', data: data.text });
            } else if (data.type === 'status') {
              console.log('📊 Status update:', data.message);
              this.notifyListeners({ type: 'status', data: data.message });
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        resolve();
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.notifyListeners({ type: 'status', data: 'Connection error ❌' });
        ws.close();
      };

      ws.onclose = (event) => {
        console.log('📡 WebSocket disconnected:', event.code, event.reason);
        this.signalingSocket = null;
        this.notifyListeners({ type: 'status', data: 'Disconnected ❌' });

        // Reconnect after 2 seconds
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          this.createWebSocketConnection(retryCount + 1);
        }, 2000);
      };
    });
  }

  async setupWebAudioProcessing() {
    try {
      // Create AudioContext for raw audio processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      // Load the AudioWorklet processor with cache busting
      const processorUrl = `/audio-processor.js?v=${Date.now()}`;
      await this.audioContext.audioWorklet.addModule(processorUrl);
      
      // Create source node from microphone stream
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create AudioWorkletNode for raw audio data processing
      this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      // Listen for processed audio data from the worklet
      this.processor.port.onmessage = (event) => {
        // Only send raw PCM audio buffers, not metadata
        if (
          (event.data.type === 'audioData' || event.data.type === 'transcriptionChunk') &&
          this.signalingSocket?.readyState === WebSocket.OPEN
        ) {
          const pcmBuffer = event.data.data;
          this.signalingSocket.send(pcmBuffer);
        }
      };
      
      // Connect the audio processing chain
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      console.log('🔴 AudioWorklet processing started');
      this.notifyListeners({ type: 'status', data: 'Recording with AudioWorklet... 🔴' });
      
    } catch (error) {
      console.error('❌ Failed to setup AudioWorklet:', error);
      // Fallback to ScriptProcessorNode if AudioWorklet fails
      this.setupFallbackAudioProcessing();
    }
  }

  setupFallbackAudioProcessing() {
    console.log('⚠️ Falling back to ScriptProcessorNode (deprecated)');
    
    // Create source node from microphone stream
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create ScriptProcessorNode for raw audio data
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    this.processor.onaudioprocess = (event) => {
      if (this.signalingSocket?.readyState === WebSocket.OPEN) {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Get mono channel
        
        // Convert Float32Array to Int16Array (PCM 16-bit)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Convert from -1.0 to 1.0 range to -32768 to 32767 range
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        
        // Send raw PCM data
        console.log('🎵 Sending PCM audio chunk (fallback):', pcmData.length, 'samples');
        this.signalingSocket.send(pcmData.buffer);
      }
    };
    
    // Connect the audio processing chain
    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    console.log('🔴 Fallback audio processing started');
    this.notifyListeners({ type: 'status', data: 'Recording (fallback mode)... 🔴' });
  }

  stopAudioStreaming() {
    console.log('🛑 Stopping WebRTC audio streaming...');
    this.isStreaming = false;

    // Stop audio processing
    if (this.processor) {
      this.processor.disconnect();
      
      // Clean up AudioWorkletNode port if it exists
      if (this.processor.port) {
        this.processor.port.onmessage = null;
      }
      
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Close WebSocket
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.notifyListeners({ type: 'status', data: 'Stopped ⏹️' });
    console.log('✅ WebRTC audio streaming stopped');
  }

  // Force cleanup - useful for debugging
  forceCleanup() {
    console.log('🔥 Force cleanup: clearing all listeners and stopping streaming');
    this.listeners.clear();
    this.stopAudioStreaming();
  }
}

// Create singleton instance
const webRTCService = new WebRTCService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.webRTCService = webRTCService;
  console.log('🔧 WebRTCService available globally as window.webRTCService');
}

export default webRTCService;
