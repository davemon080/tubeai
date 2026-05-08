import React, { createContext, useContext, useState, useEffect } from 'react';
import { YouTubeTokens, YouTubeChannel, fetchChannelData } from '../lib/youtube';

interface ActiveUpload {
  id: string;
  title: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  thumbnailUrl?: string;
}

interface YouTubeContextType {
  tokens: YouTubeTokens | null;
  channel: YouTubeChannel | null;
  setTokens: (tokens: YouTubeTokens | null) => void;
  isLoading: boolean;
  error: string | null;
  quotaExceeded: boolean;
  analyticsDisabled: boolean;
  activeUploads: ActiveUpload[];
  addUpload: (upload: Omit<ActiveUpload, 'progress' | 'status'>) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  completeUpload: (id: string) => void;
  failUpload: (id: string) => void;
  setQuotaExceeded: (exceeded: boolean) => void;
  setAnalyticsDisabled: (disabled: boolean) => void;
  login: () => Promise<void>;
  logout: () => void;
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

export const YouTubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokensState] = useState<YouTubeTokens | null>(() => {
    const saved = localStorage.getItem('yt_tokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [analyticsDisabled, setAnalyticsDisabled] = useState(false);
  const [activeUploads, setActiveUploads] = useState<ActiveUpload[]>([]);

  const addUpload = (upload: Omit<ActiveUpload, 'progress' | 'status'>) => {
    setActiveUploads(prev => [...prev, { ...upload, progress: 0, status: 'uploading' }]);
  };

  const updateUploadProgress = (id: string, progress: number) => {
    setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u));
  };

  const completeUpload = (id: string) => {
    setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success', progress: 100 } : u));
    // Optionally remove after some time or keep to show in list
    setTimeout(() => {
      setActiveUploads(prev => prev.filter(u => u.id !== id));
    }, 5000);
  };

  const failUpload = (id: string) => {
    setActiveUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u));
  };

  const setTokens = (newTokens: YouTubeTokens | null) => {
    setTokensState(newTokens);
    if (newTokens) {
      localStorage.setItem('yt_tokens', JSON.stringify(newTokens));
    } else {
      localStorage.removeItem('yt_tokens');
      setChannel(null);
      setError(null);
      setQuotaExceeded(false);
      setAnalyticsDisabled(false);
    }
  };

  useEffect(() => {
    // Check for tokens in localStorage on mount (for mobile redirects)
    const saved = localStorage.getItem('yt_tokens');
    if (saved && !tokens) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.access_token) {
          setTokens(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved tokens:', e);
      }
    }

    // Check for errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError === 'auth_callback_failed') {
      setError('Authentication failed during callback. Please try again.');
      // Clean up URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (tokens?.access_token) {
      loadChannel();
    }
  }, [tokens]);

  const loadChannel = async () => {
    if (!tokens?.access_token) return;
    setIsLoading(true);
    setQuotaExceeded(false);
    setAnalyticsDisabled(false);
    
    let currentTokens = tokens;

    // Check if token is expired or close to expiry (1 minute buffer)
    if (currentTokens.expiry_date && Date.now() > currentTokens.expiry_date - 60000) {
      if (currentTokens.refresh_token) {
        try {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            currentTokens = refreshed;
          } else {
            logout();
            return;
          }
        } catch (err) {
          console.error('Token Refresh Error:', err);
          logout();
          return;
        }
      } else {
        // No refresh token and expired, must logout
        logout();
        return;
      }
    }

    try {
      const data = await fetchChannelData(currentTokens.access_token);
      setChannel(data);
    } catch (err: any) {
      console.error('Channel Load Error:', err);
      
      // If unauthorized, try refreshing once more if we have a refresh token
      if ((err.message?.includes('invalid authentication') || err.message?.includes('401') || err.message?.includes('credentials')) && currentTokens.refresh_token) {
        const refreshed = await refreshAccessToken();
        if (refreshed && refreshed.access_token) {
           try {
             const data = await fetchChannelData(refreshed.access_token);
             setChannel(data);
             setIsLoading(false);
             return;
           } catch (retryErr) {
             console.error('Retry after refresh failed:', retryErr);
           }
        }
      }

      if (err.message?.toLowerCase().includes('quota')) {
        setQuotaExceeded(true);
      }
      if (err.message?.toLowerCase().includes('youtubeanalytics.googleapis.com')) {
        setAnalyticsDisabled(true);
      }
      if (err.message?.includes('401') || err.message?.includes('invalid_grant') || err.message?.includes('credentials')) {
        logout();
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<YouTubeTokens | null> => {
    if (!tokens?.refresh_token) return null;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: tokens.refresh_token })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Refresh request failed');
      }
      
      const newCredentials = await response.json();
      const updatedTokens = {
        ...tokens,
        ...newCredentials,
        // Ensure refresh_token is kept if it's not returned (common in some OAuth flows)
        refresh_token: newCredentials.refresh_token || tokens.refresh_token
      };
      
      setTokens(updatedTokens);
      return updatedTokens;
    } catch (err) {
      console.error('Failed to refresh access token:', err);
      return null;
    }
  };

  const login = async () => {
    setError(null);
    console.log('Starting login flow...');
    
    // Open a blank window immediately while we fetch the URL
    const popup = window.open('', 'youtube_auth', 'width=600,height=700');
    
    if (popup) {
      console.log('Popup opened successfully');
      try {
        popup.document.write(`
          <html>
            <head><title>Loading Studio Auth...</title></head>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #050505; color: white;">
              <div style="width: 30px; height: 30px; border: 3px solid #ff0033; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 20px; font-weight: bold; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6;">Initializing Protocol...</p>
              <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </body>
          </html>
        `);
      } catch (e) {
        console.warn('Could not write to popup document:', e);
      }
    } else {
      console.warn('Popup was blocked or failed to open');
    }

    try {
      console.log('Fetching auth URL from server...');
      const response = await fetch('/api/auth/url');
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const { url } = await response.json();
      console.log('Received auth URL, redirecting...');
      
      if (popup && !popup.closed) {
        popup.location.href = url;
      } else {
        console.log('No popup available, redirecting main window');
        window.location.href = url;
      }
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          console.log('OAuth success message received');
          setTokens(event.data.tokens);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup listener if window is closed without success
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Login initiation failed:', err);
      setError(`Login failed: ${err.message || 'Unknown error'}`);
      if (popup) popup.close();
    }
  };

  const logout = () => {
    setTokens(null);
  };

  return (
    <YouTubeContext.Provider value={{ 
      tokens, 
      channel, 
      setTokens, 
      isLoading, 
      error, 
      quotaExceeded, 
      analyticsDisabled,
      activeUploads,
      addUpload,
      updateUploadProgress,
      completeUpload,
      failUpload,
      setQuotaExceeded, 
      setAnalyticsDisabled,
      login, 
      logout 
    }}>
      {children}
    </YouTubeContext.Provider>
  );
};

export const useYouTube = () => {
  const context = useContext(YouTubeContext);
  if (!context) throw new Error('useYouTube must be used within a YouTubeProvider');
  return context;
};
