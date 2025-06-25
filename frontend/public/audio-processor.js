// audio-processor.js - Simple Continuous Recording with Periodic Transcription
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Simple continuous recording
    this.recordingBuffer = [];
    this.chunkId = 0;
    this.sampleCount = 0;
    this.processCallCount = 0;
    
    // Send chunks every ~3 seconds for transcription
    this.samplesPerChunk = 44100 * 3; // 3 seconds at 44.1kHz
    
    console.log('🎤 Simple AudioProcessor initialized');
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input.length > 0) {
      const inputChannel = input[0];
      this.processCallCount++;
      
      // Add samples to recording buffer
      this.recordingBuffer.push(...inputChannel);
      this.sampleCount += inputChannel.length;
      
      // Every 3 seconds worth of samples, send for transcription
      if (this.sampleCount >= this.samplesPerChunk) {
        this.sendChunkForTranscription();
      }
      
      // Also send real-time chunks for streaming (optional)
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        if (this.bufferIndex >= this.bufferSize) {
          // Convert to PCM and send
          const pcmData = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            const sample = Math.max(-1, Math.min(1, this.buffer[j]));
            pcmData[j] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          this.port.postMessage({
            type: 'audioData',
            data: pcmData.buffer,
            sampleCount: this.bufferSize,
            realtime: true
          });
          
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
  
  sendChunkForTranscription() {
    if (this.recordingBuffer.length === 0) return;

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < this.recordingBuffer.length; i++) {
      sum += this.recordingBuffer[i] * this.recordingBuffer[i];
    }
    const rms = Math.sqrt(sum / this.recordingBuffer.length);
    const threshold = 0.01; // Adjust as needed
    console.log(`🔎 Calculated RMS for chunk ${this.chunkId + 1}:`, rms.toFixed(5));
    if (rms < threshold) {
      console.log(`⏩ Skipping chunk ${this.chunkId + 1} (RMS below threshold)`);
      // Clear buffer and start fresh for next chunk
      this.recordingBuffer = [];
      this.sampleCount = 0;
      return;
    }

    this.chunkId++;
    const duration = this.sampleCount / 44100;

    console.log(`🎤 Sending chunk ${this.chunkId} for transcription: ${duration.toFixed(2)}s, ${this.sampleCount} samples`);

    // Convert to PCM
    const pcmData = new Int16Array(this.recordingBuffer.length);
    for (let i = 0; i < this.recordingBuffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, this.recordingBuffer[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    // Send chunk for transcription
    this.port.postMessage({
      type: 'transcriptionChunk',
      chunkId: this.chunkId,
      data: pcmData.buffer,
      sampleCount: this.sampleCount,
      duration: duration,
      rms: rms
    });

    // Clear buffer and start fresh for next chunk (no overlap)
    this.recordingBuffer = [];
    this.sampleCount = 0;

    console.log(`✅ Chunk ${this.chunkId} sent, buffer cleared for next chunk`);
  }
}

registerProcessor('audio-processor', AudioProcessor);
