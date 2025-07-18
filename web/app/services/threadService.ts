const API_BASE = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_BACKEND_URL || 'https://your-backend-url.com'
  : 'http://127.0.0.1:8000';

console.log('import.env.mode', import.meta.env.MODE);
console.log('import.env.PROD', import.meta.env.PROD);
console.log("API_BASE", API_BASE)

export interface CreateThreadResponse {
  thread_id: string;
}

export class ThreadService {
  /**
   * Create a new thread
   */
  static async createThread(): Promise<CreateThreadResponse> {
    const response = await fetch(`${API_BASE}/threads/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update URL with thread ID
   */
  static updateUrlWithThreadId(threadId: string, replace: boolean = false): void {
    if (typeof window === 'undefined') return;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('thread_id', threadId);
    
    if (replace) {
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      window.history.pushState({}, '', newUrl.toString());
    }
  }

  /**
   * Get thread ID from URL
   */
  static getThreadIdFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('thread_id');
  }
}

export default ThreadService;