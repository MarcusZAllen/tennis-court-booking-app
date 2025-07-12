import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDebug() {
      const info: any = {};

      // Check environment variables
      info.env = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        keyValue: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      };

      // Check Supabase client
      info.supabaseClient = {
        url: supabase.supabaseUrl,
        key: supabase.supabaseKey ? 'Set' : 'Missing'
      };

      // Test query
      try {
        const today = new Date();
        const startDateStr = today.toISOString().split('T')[0];
        
        console.log('🔧 Testing query with date:', startDateStr);
        
        const { data, error } = await supabase
          .from('tennis_slots')
          .select('*')
          .filter('date', 'gte', startDateStr)
          .limit(5);

        info.query = {
          success: !error,
          error: error?.message,
          count: data?.length || 0,
          sampleData: data?.slice(0, 2) || []
        };

        console.log('🔧 Query result:', { data, error });
      } catch (err) {
        info.query = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      setDebugInfo(info);
      setLoading(false);
    }

    runDebug();
  }, []);

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Supabase Debug Info</h1>
      
      <h2>Environment Variables</h2>
      <pre>{JSON.stringify(debugInfo.env, null, 2)}</pre>
      
      <h2>Supabase Client</h2>
      <pre>{JSON.stringify(debugInfo.supabaseClient, null, 2)}</pre>
      
      <h2>Query Test</h2>
      <pre>{JSON.stringify(debugInfo.query, null, 2)}</pre>
    </div>
  );
} 