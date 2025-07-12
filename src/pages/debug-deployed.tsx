import { useEffect, useState } from 'react';

export default function DebugDeployed() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info: any = {};

    // Check environment variables
    info.env = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
      keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'NOT_SET',
      timestamp: new Date().toISOString() // Force fresh deployment
    };

    // Test direct fetch to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tennis_slots?select=*&limit=1`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      .then(response => response.json())
      .then(data => {
        info.directFetch = {
          success: true,
          count: Array.isArray(data) ? data.length : 'Not array',
          data: data
        };
        setDebugInfo(info);
      })
      .catch(error => {
        info.directFetch = {
          success: false,
          error: error.message
        };
        setDebugInfo(info);
      });
    } else {
      info.directFetch = {
        success: false,
        error: 'Missing environment variables'
      };
      setDebugInfo(info);
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px' }}>
      <h1>Deployed Version Debug</h1>
      
      <h2>Environment Variables</h2>
      <pre>{JSON.stringify(debugInfo.env, null, 2)}</pre>
      
      <h2>Direct Supabase Fetch Test</h2>
      <pre>{JSON.stringify(debugInfo.directFetch, null, 2)}</pre>
      
      <h2>Current URL</h2>
      <p>{typeof window !== 'undefined' ? window.location.href : 'Server side'}</p>
    </div>
  );
} 