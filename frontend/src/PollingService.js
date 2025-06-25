// PollingService.js - Alternative to WebSocket using HTTP polling
class PollingService {
  constructor() {
    this.listeners = new Set();
    this.polling = false;
    this.pollInterval = null;
    this.consecutiveErrors = 0;
    this.lastSuccessTime = null;
  }

  addListener(callback) {
    this.listeners.add(callback);
    
    // Start polling when first listener is added
    if (this.listeners.size === 1 && !this.polling) {
      this.startPolling();
    }
  }

  removeListener(callback) {
    this.listeners.delete(callback);
    
    // Stop polling when no listeners remain
    if (this.listeners.size === 0) {
      this.stopPolling();
    }
  }

  notifyListeners(message) {
    this.listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in polling listener:', error);
      }
    });
  }

  async startPolling() {
    if (this.polling) return;
    
    console.log('🔄 Starting transcription polling...');
    this.polling = true;
    
    this.notifyListeners({ type: 'status', data: 'Connecting...' });
    
    const poll = async () => {
      if (!this.polling) return;
      
      try {
        const response = await fetch('http://localhost:8000/');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Reset error counter and update last success time
        this.consecutiveErrors = 0;
        this.lastSuccessTime = new Date().toLocaleTimeString();
        
        // Update status to show successful connection with timestamp
        this.notifyListeners({ type: 'status', data: `Connected ✅ (${this.lastSuccessTime})` });
        
        // Only process non-empty transcriptions
        if (data.text && data.text.trim()) {
          console.log('📥 Received new transcription:', data.text);
          this.notifyListeners({ type: 'transcription', data: data.text });
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        this.consecutiveErrors++;
        
        // Show more detailed error status
        const errorTime = new Date().toLocaleTimeString();
        this.notifyListeners({ type: 'status', data: `Error (${this.consecutiveErrors}x): ${error.message} ❌ (${errorTime})` });
      }
      
      // Poll every 50ms for faster real-time updates
      if (this.polling) {
        setTimeout(poll, 50);
      }
    };
    
    poll();
  }

  stopPolling() {
    console.log('🛑 Stopping transcription polling...');
    this.polling = false;
    
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }
    
    // Reset error tracking
    this.consecutiveErrors = 0;
    this.lastSuccessTime = null;
    
    this.notifyListeners({ type: 'status', data: 'Disconnected ❌' });
  }

  // Force cleanup - useful for debugging
  forceCleanup() {
    console.log('🔥 Force cleanup: clearing all listeners and stopping polling');
    this.listeners.clear();
    this.stopPolling();
  }
}

// Create singleton instance
const pollingService = new PollingService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.pollingService = pollingService;
  console.log('🔧 PollingService available globally as window.pollingService');
}

export default pollingService;
