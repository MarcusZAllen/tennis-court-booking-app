import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { transformSlotData } from '@/utils/transformSlotData';

export type TransformedData = {
  [date: string]: {
    [timeInMinutes: number]: {
      totalCourts: number;
      slots: Array<{
        provider: string;
        location: string;
        bookingUrl: string;
        cost: string;
        sessionId: string;
        slotKey: string;
      }>;
    };
  };
};

export function useSupabaseData() {
  const [calendarData, setCalendarData] = useState<TransformedData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line prefer-const
    let timeoutId: NodeJS.Timeout;

    async function fetchData() {
      try {
        console.log('🔄 Starting data fetch...');
        console.log('🔧 ENV check:', {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
        
        setLoading(true);
        setError(null);

        // Check if Supabase client is available
        if (!supabase) {
          throw new Error('Supabase client not available - environment variables may be missing');
        }

        // Get the next 7 days
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7);
        
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`📅 Fetching data from ${startDateStr} to ${endDateStr}`);
        console.log('🔧 About to make Supabase query...');

        // Try a different query approach
        const { data, error } = await supabase
          .from('tennis_slots')
          .select('*')
          .filter('date', 'gte', startDateStr)
          .filter('date', 'lte', endDateStr)
          .order('date', { ascending: true })
          .order('start_minutes', { ascending: true })
          .limit(2000); // Limit set to 2000

        console.log('🔧 Supabase query completed');

        if (!isMounted) return;

        if (error) {
          console.error('❌ Supabase error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
          console.error('❌ No data received from database');
          throw new Error('No data received from database');
        }

        console.log(`✅ Fetched ${data.length} slots from Supabase`);
        console.log('Raw data from Supabase:', data);

        // Clear the timeout since we succeeded
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Transform the data to match the expected format
        const transformedData = transformSlotData(data);
        setCalendarData(transformedData);
        console.log('Transformed calendarData:', transformedData);

      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Error fetching data from Supabase:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        if (isMounted) {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      }
    }

    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error('❌ Data fetch timed out');
        setError('Data fetch timed out');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    fetchData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { calendarData, loading, error };
} 