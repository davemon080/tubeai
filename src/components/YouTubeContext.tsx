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
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      const popup = window.open(url, 'youtube_auth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setTokens(event.data.tokens);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      setError('Failed to initiate login');
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
