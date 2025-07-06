import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 API: Testing Supabase connection...');

    // Get the next 7 days
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 7);
    
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📅 API: Fetching data from ${startDateStr} to ${endDateStr}`);

    const { data, error } = await supabase
      .from('tennis_slots')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
      .order('start_minutes', { ascending: true });

    if (error) {
      console.error('❌ API: Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      console.error('❌ API: No data received');
      return res.status(500).json({ error: 'No data received' });
    }

    console.log(`✅ API: Fetched ${data.length} slots`);

    return res.status(200).json({
      success: true,
      count: data.length,
      dateRange: { start: startDateStr, end: endDateStr },
      sampleData: data.slice(0, 2)
    });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 