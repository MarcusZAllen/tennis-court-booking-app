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

        // Use pagination to fetch all data
        let allData: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore && isMounted) {
          const { data, error } = await supabase
            .from('tennis_slots')
            .select('*')
            .filter('date', 'gte', startDateStr)
            .filter('date', 'lte', endDateStr)
            .order('date', { ascending: true })
            .order('start_minutes', { ascending: true })
            .range(from, from + pageSize - 1);

          if (!isMounted) return;

          if (error) {
            console.error('❌ Supabase error:', error);
            throw new Error(`Database error: ${error.message}`);
          }

          if (!data) {
            console.error('❌ No data received from database');
            throw new Error('No data received from database');
          }

          allData = [...allData, ...data];
          console.log(`📊 Fetched page ${Math.floor(from / pageSize) + 1}: ${data.length} rows`);

          // Check if we have more data
          hasMore = data.length === pageSize;
          from += pageSize;

          // Safety check to prevent infinite loops
          if (allData.length > 10000) {
            console.warn('⚠️ Stopping pagination at 10,000 rows for safety');
            break;
          }
        }

        console.log(`✅ Total fetched: ${allData.length} slots from Supabase`);
        console.log('Raw data from Supabase:', allData);

        // Clear the timeout since we succeeded
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Transform the data to match the expected format
        const transformedData = transformSlotData(allData);
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
    }, 30000); // Increased timeout to 30 seconds for pagination

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