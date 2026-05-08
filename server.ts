import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV, 
    vercel: !!process.env.VERCEL,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    appUrl: process.env.APP_URL || 'Not Set (using dynamic detection)'
  });
});

// Database setup
let pool: Pool | null = null;
function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL not found. Database features will be disabled.');
    return null;
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return pool;
}

let oauth2ClientInstance: any = null;
function getOAuth2Client(req?: express.Request) {
  // Always recreate or update the redirect URI based on the current request if on Vercel/Production
  // to ensure the callback URL matches the environment (prod vs preview)
  const forwardedProto = req?.headers['x-forwarded-proto'];
  const protocol = (typeof forwardedProto === 'string' ? forwardedProto : req?.protocol) || 'https';
  const host = req?.headers.host || 'localhost:3000';
  
  // Force https unless we are explicitly on localhost
  const finalProtocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
  
  const baseUrl = process.env.APP_URL || `${finalProtocol}://${host}`;
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/auth/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
    process.env.GOOGLE_CLIENT_SECRET || 'MISSING_CLIENT_SECRET',
    redirectUri
  );
}

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// OAUTH ROUTES
app.get('/api/auth/url', (req, res) => {
  const client = getOAuth2Client(req);
  const url = client.generateAuthUrl({
    access_type: 'offline', // Critical for refresh tokens
    scope: SCOPES,
    prompt: 'consent' // Ensure we get a refresh token every time during testing if needed
  });
  // Note: we can't access client.redirectUri directly as it's private, 
  // but we logged the setup in getOAuth2Client if needed or we can re-calculate
  res.json({ url });
});

app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  const client = getOAuth2Client(req);
  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    // Get user info to store in DB
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    console.log('Fetching user info for session...');
    const userInfo = await oauth2.userinfo.get().catch(err => {
      console.error('Failed to get user info:', err.message);
      return { data: { email: null, id: null } };
    });
    const email = userInfo.data.email;
    const googleId = userInfo.data.id;

    const currentPool = getPool();
    if (email && googleId && currentPool) {
      try {
        await currentPool.query(
          `INSERT INTO users (email, google_id) 
           VALUES ($1, $2) 
           ON CONFLICT (google_id) 
           DO UPDATE SET email = $1, last_login = CURRENT_TIMESTAMP`,
          [email, googleId]
        );
        console.log(`User ${email} signed in and saved to DB.`);
      } catch (dbError) {
        console.error('Database insertion error:', dbError);
      }
    }

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <p>Authentication successful! Redirecting...</p>
          <script>
            try {
                const tokens = ${JSON.stringify(tokens)};
                console.log('Auth success, sending message to opener...');
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    tokens: tokens 
                  }, '*');
                  // Give it a tiny moment to send before closing
                  setTimeout(() => window.close(), 500);
                } else {
                // If no opener, we might be in the same window (common on mobile)
                localStorage.setItem('yt_tokens', JSON.stringify(tokens));
                window.location.href = '/';
              }
            } catch (err) {
              console.error('Callback error:', err);
              window.location.href = '/?error=auth_callback_failed';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.status(500).send('Authentication failed');
  }
});

// YOUTUBE API PROXIES
// These avoid exposing the full access token to the browser if we want, 
// though for this app we'll let the client handle it for simplicity in the demo.
// But we'll provide an endpoint to refresh if needed.

app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'No refresh token' });
  
  try {
    const client = getOAuth2Client(req);
    client.setCredentials({ refresh_token });
    const { credentials } = await client.refreshAccessToken();
    res.json(credentials);
  } catch (error: any) {
    console.error('Server Token Refresh Error:', error.message || error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      details: error.message || 'Unknown error'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      // Isolate Vite to avoid crashes in production/serverless environments
      const { setupVite } = await import('./vite-server');
      await setupVite(app);
    } catch (err) {
      console.error('Failed to load Vite server helper:', err);
    }
  } else if (!process.env.VERCEL) {
    // In other production environments (like Cloud Run), serve static files from dist
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not on Vercel and not in a test/import context
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Global server initialization - only run if this file is the main module
// Or always run if NOT on Vercel (as Vercel will import it)
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to initialize server:', err);
  });
}

export default app;
