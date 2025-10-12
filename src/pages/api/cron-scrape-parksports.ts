import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Vercel Serverless Function to scrape ParkSports
 * Triggered by Vercel Cron
 * Uses different IP pool than GitHub Actions
 */

const LOCATIONS = [
  {
    name: "Hyde Park",
    subdomain: "hyde",
    url: "https://hyde.parksports.co.uk"
  },
  {
    name: "Regents Park", 
    subdomain: "regents",
    url: "https://regents.parksports.co.uk"
  }
];

// Helper functions
function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

async function scrapeLocation(location: any, date: string) {
  try {
    const apiUrl = `${location.url}/v0/VenueBooking/${location.subdomain}_parksports_co_uk/GetVenueSessions`;
    const params = new URLSearchParams({
      resourceID: '',
      startDate: date,
      endDate: date,
      roleId: '',
      _: Date.now().toString()
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Referer': `${location.url}/Booking/BookByDate`,
        'Origin': location.url
      }
    });
    
    if (!response.ok) {
      console.error(`API error (${response.status}) for ${location.name}`);
      return [];
    }
    
    const data = await response.json();
    const slots: any[] = [];
    
    // Extract court data
    if (data.Resources && Array.isArray(data.Resources)) {
      data.Resources.forEach((resource: any) => {
        const courtName = resource.Name;
        let sportType = "tennis";
        
        if (courtName.toLowerCase().includes('padel')) {
          sportType = "padel";
        } else if (data.ResourceGroups) {
          const resourceGroup = data.ResourceGroups.find((g: any) => g.ID === resource.ResourceGroupID);
          if (resourceGroup && resourceGroup.Name.toLowerCase().includes('padel')) {
            sportType = "padel";
          }
        }
        
        if (resource.Days && Array.isArray(resource.Days)) {
          resource.Days.forEach((day: any) => {
            if (day.Sessions && Array.isArray(day.Sessions)) {
              day.Sessions.forEach((session: any) => {
                const startTime = minutesToTime(session.StartTime);
                const endTime = minutesToTime(session.EndTime);
                const isAvailable = session.Category === 0 && session.Capacity > 0;
                
                if (session.Category === 8000 || session.Category === 1000) {
                  return;
                }
                
                const bookingUrl = `${location.url}/Booking/BookByDate#?date=${date}&resourceId=${resource.ID}`;
                const price = session.Cost ? session.Cost.toFixed(2) : (session.CourtCost ? session.CourtCost.toFixed(2) : "N/A");
                const slotKey = `${location.name.toLowerCase().replace(/\s+/g, '-')}-${date}-${courtName.toLowerCase().replace(/\s+/g, '-')}-${startTime.replace(':', '')}`;
                
                slots.push({
                  provider: "parksports",
                  location: location.name,
                  court: courtName,
                  date: date,
                  startTime: startTime,
                  endTime: endTime,
                  startMinutes: session.StartTime,
                  endMinutes: session.EndTime,
                  isAvailable: isAvailable,
                  price: price,
                  bookingUrl: bookingUrl,
                  slotKey: slotKey,
                  sportType: sportType
                });
              });
            }
          });
        }
      });
    }
    
    return slots;
  } catch (error: any) {
    console.error(`Error scraping ${location.name}:`, error.message);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a cron job (check authorization header from Vercel Cron)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 Starting ParkSports scraping from Vercel...');
    
    // Get next 7 days
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    const allSlots: any[] = [];
    
    // Scrape each date
    for (const date of dates) {
      for (const location of LOCATIONS) {
        const slots = await scrapeLocation(location, date);
        allSlots.push(...slots);
        
        // Small delay between locations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Scraped ${allSlots.length} slots`);
    
    // Save to Supabase
    if (allSlots.length > 0 && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const transformedSlots = allSlots.map(slot => ({
        provider: slot.provider,
        location: slot.location,
        court: slot.court || null,
        booking_url: slot.bookingUrl || 'https://parksports.co.uk',
        date: slot.date,
        readable_time: `${slot.startTime}-${slot.endTime}`,
        cost: slot.price || 'N/A',
        start_minutes: slot.startMinutes,
        end_minutes: slot.endMinutes,
        session_id: null,
        slot_key: slot.slotKey,
        sport_type: slot.sportType || 'tennis'
      }));

      const { error } = await supabase
        .from('tennis_slots')
        .upsert(transformedSlots, {
          onConflict: 'slot_key',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
      }
      
      console.log(`💾 Saved ${transformedSlots.length} slots to database`);
    }
    
    return res.status(200).json({ 
      success: true, 
      slotsScraped: allSlots.length,
      dates: dates.length,
      message: 'ParkSports scraping completed successfully from Vercel'
    });
    
  } catch (error: any) {
    console.error('Scraping error:', error);
    return res.status(500).json({ error: 'Scraping failed', details: error.message });
  }
}

