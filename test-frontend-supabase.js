import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Environment check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the transform function (simplified version)
function transformSlotData(data) {
  const transformed = {};

  // Group slots by date and time
  data.forEach(slot => {
    // Handle both camelCase (JSON files) and snake_case (database) property names
    const date = slot.date || slot.date;
    const startMinutes = slot.startMinutes || slot.start_minutes;
    const provider = slot.provider;
    const location = slot.location;
    const bookingUrl = slot.bookingUrl || slot.booking_url;
    const cost = slot.cost;
    const sessionId = slot.sessionId || slot.session_id;
    const slotKey = slot.slotKey || slot.slot_key;

    if (!date || typeof startMinutes !== 'number') return;

    if (!transformed[date]) {
      transformed[date] = {};
    }

    if (!transformed[date][startMinutes]) {
      transformed[date][startMinutes] = {
        totalCourts: 0,
        slots: []
      };
    }

    // Add the slot to the array
    transformed[date][startMinutes].slots.push({
      provider,
      location,
      bookingUrl,
      cost,
      sessionId,
      slotKey
    });
  });

  // After adding all slots, count unique courts for each time slot
  Object.keys(transformed).forEach(date => {
    Object.keys(transformed[date]).forEach(timeInMinutes => {
      const timeSlot = transformed[date][parseInt(timeInMinutes)];
      const uniqueSlotKeys = new Set(timeSlot.slots.map(slot => slot.slotKey));
      timeSlot.totalCourts = uniqueSlotKeys.size;
    });
  });

  return transformed;
}

async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Get the next 7 days
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 7);
    
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📅 Fetching data from ${startDateStr} to ${endDateStr}`);

    // Test both query approaches
    console.log('\n🔧 Testing .filter() approach...');
    const { data: filterData, error: filterError } = await supabase
      .from('tennis_slots')
      .select('*')
      .filter('date', 'gte', startDateStr)
      .filter('date', 'lte', endDateStr)
      .order('date', { ascending: true })
      .order('start_minutes', { ascending: true });

    if (filterError) {
      console.error('❌ Filter query error:', filterError);
    } else {
      console.log(`✅ Filter query: Fetched ${filterData.length} slots`);
    }

    console.log('\n🔧 Testing .gte()/.lte() approach...');
    const { data: gteData, error: gteError } = await supabase
      .from('tennis_slots')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
      .order('start_minutes', { ascending: true });

    if (gteError) {
      console.error('❌ GTE/LTE query error:', gteError);
    } else {
      console.log(`✅ GTE/LTE query: Fetched ${gteData.length} slots`);
    }

    // Use whichever approach worked
    const data = filterData || gteData;
    const error = filterError || gteError;

    if (error) {
      console.error('❌ All query approaches failed');
      return;
    }

    console.log(`\n✅ Final result: Fetched ${data.length} slots from Supabase`);
    
    // Test transformation
    const transformedData = transformSlotData(data);
    console.log('📊 Transformed data keys:', Object.keys(transformedData));
    
    // Show sample of transformed data
    const sampleDate = Object.keys(transformedData)[0];
    if (sampleDate) {
      console.log(`📅 Sample data for ${sampleDate}:`, transformedData[sampleDate]);
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testSupabaseConnection(); 