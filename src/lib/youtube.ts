/**
 * YouTube API Service Layer (Frontend)
 */

export interface YouTubeTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string };
    };
  };
  status?: {
    privacyStatus: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export const fetchChannelData = async (accessToken: string): Promise<YouTubeChannel> => {
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.items[0];
};

export const fetchUserVideos = async (accessToken: string): Promise<YouTubeVideo[]> => {
  const response = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  const videoIds = data.items.map((v: any) => v.id.videoId).join(',');
  const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoIds}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const statsData = await statsResponse.json();
  return statsData.items;
};

export const fetchAnalytics = async (accessToken: string, startDate: string, endDate: string) => {
  // Use YouTube Analytics API
  const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views,likes,comments,estimatedMinutesWatched,subscribersGained,subscribersLost&dimensions=day&sort=day`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
};

export const uploadVideo = async (
  accessToken: string,
  file: File,
  metadata: { title: string; description: string; privacyStatus?: string },
  onProgress?: (progress: number) => void
): Promise<any> => {
  // 1. Initial request to get upload URL
  const uploadInitUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
  
  const initResponse = await fetch(uploadInitUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': file.size.toString(),
      'X-Upload-Content-Type': file.type,
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
      },
      status: {
        privacyStatus: metadata.privacyStatus || 'unlisted',
      }
    })
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.json();
    throw new Error(errorData.error?.message || 'Failed to initialize upload');
  }

  const uploadUrl = initResponse.headers.get('Location');
  if (!uploadUrl) throw new Error('Upload URL not received');

  // 2. Upload the file
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
};
