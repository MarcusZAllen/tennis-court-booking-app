import { createServerClient } from './supabase.js'

// Database service for scrapers (server-side)
export class DatabaseService {
  constructor() {
    console.log('🔧 Initializing DatabaseService...')
    console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing')
    console.log('🔧 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')
    
    try {
      this.supabase = createServerClient()
      console.log('✅ DatabaseService initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize DatabaseService:', error.message)
      throw error
    }
  }

  // Save slots to database (upsert based on slot_key)
  async saveSlots(slots) {
    if (!slots || slots.length === 0) {
      console.log('No slots to save')
      return { success: true, count: 0 }
    }

    try {
      // Transform slots to match database schema
      const transformedSlots = slots.map(slot => ({
        provider: slot.provider,
        location: slot.location,
        court: slot.court || null,
        booking_url: slot.bookingUrl,
        date: slot.date,
        readable_time: slot.readableTime,
        cost: slot.cost,
        start_minutes: slot.startMinutes,
        end_minutes: slot.endMinutes,
        session_id: slot.sessionId || null,
        slot_key: slot.slotKey
      }))

      const { data, error } = await this.supabase
        .from('tennis_slots')
        .upsert(transformedSlots, {
          onConflict: 'slot_key',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error saving slots to database:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Saved ${transformedSlots.length} slots to database`)
      return { success: true, count: transformedSlots.length, data }
    } catch (error) {
      console.error('Error in saveSlots:', error)
      return { success: false, error: error.message }
    }
  }

  // Get slots for a specific date range and location
  async getSlotsByDateRange(startDate, endDate, location = null) {
    try {
      let query = this.supabase
        .from('tennis_slots')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_minutes', { ascending: true })

      if (location) {
        query = query.eq('location', location)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching slots:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in getSlotsByDateRange:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all unique locations
  async getLocations() {
    try {
      const { data, error } = await this.supabase
        .from('tennis_slots')
        .select('location, provider')
        .order('location')

      if (error) {
        console.error('Error fetching locations:', error)
        return { success: false, error: error.message }
      }

      // Get unique locations
      const uniqueLocations = [...new Set(data.map(item => item.location))]
        .map(location => {
          const providers = data
            .filter(item => item.location === location)
            .map(item => item.provider)
          return {
            name: location,
            providers: [...new Set(providers)]
          }
        })

      return { success: true, data: uniqueLocations }
    } catch (error) {
      console.error('Error in getLocations:', error)
      return { success: false, error: error.message }
    }
  }

  // Delete old slots (cleanup function)
  async deleteOldSlots(daysOld = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('tennis_slots')
        .delete()
        .lt('date', cutoffDateStr)

      if (error) {
        console.error('Error deleting old slots:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Deleted slots older than ${cutoffDateStr}`)
      return { success: true, count: data?.length || 0 }
    } catch (error) {
      console.error('Error in deleteOldSlots:', error)
      return { success: false, error: error.message }
    }
  }

  // Clear slots for specific dates (for fresh scraping)
  async clearSlotsForDates(dates) {
    try {
      if (!dates || dates.length === 0) {
        console.log('No dates provided for clearing')
        return { success: true, count: 0 }
      }

      const { data, error } = await this.supabase
        .from('tennis_slots')
        .delete()
        .in('date', dates)

      if (error) {
        console.error('Error clearing slots for dates:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Cleared slots for ${dates.length} dates`)
      return { success: true, count: data?.length || 0 }
    } catch (error) {
      console.error('Error in clearSlotsForDates:', error)
      return { success: false, error: error.message }
    }
  }

  // Clear slots for specific dates and provider (for fresh scraping)
  async clearSlotsForDatesAndProvider(dates, provider) {
    try {
      if (!dates || dates.length === 0) {
        console.log('No dates provided for clearing')
        return { success: true, count: 0 }
      }

      if (!provider) {
        console.error('Provider is required for clearSlotsForDatesAndProvider')
        return { success: false, error: 'Provider is required' }
      }

      const { data, error } = await this.supabase
        .from('tennis_slots')
        .delete()
        .in('date', dates)
        .eq('provider', provider)

      if (error) {
        console.error('Error clearing slots for dates and provider:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Cleared ${provider} slots for ${dates.length} dates`)
      return { success: true, count: data?.length || 0 }
    } catch (error) {
      console.error('Error in clearSlotsForDatesAndProvider:', error)
      return { success: false, error: error.message }
    }
  }

  // Get database stats
  async getStats() {
    try {
      const { count, error } = await this.supabase
        .from('tennis_slots')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error getting stats:', error)
        return { success: false, error: error.message }
      }

      return { success: true, totalSlots: count }
    } catch (error) {
      console.error('Error in getStats:', error)
      return { success: false, error: error.message }
    }
  }
}

// Client-side database service (for frontend)
export class ClientDatabaseService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
  }

  // Get slots for frontend display
  async getSlotsForWeek(startDate, endDate, location = null) {
    try {
      let query = this.supabase
        .from('tennis_slots')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_minutes', { ascending: true })

      if (location) {
        query = query.eq('location', location)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching slots:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error in getSlotsForWeek:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all locations for frontend
  async getLocations() {
    try {
      const { data, error } = await this.supabase
        .from('tennis_slots')
        .select('location, provider')
        .order('location')

      if (error) {
        console.error('Error fetching locations:', error)
        return { success: false, error: error.message }
      }

      // Get unique locations
      const uniqueLocations = [...new Set(data.map(item => item.location))]
        .map(location => {
          const providers = data
            .filter(item => item.location === location)
            .map(item => item.provider)
          return {
            name: location,
            providers: [...new Set(providers)]
          }
        })

      return { success: true, data: uniqueLocations }
    } catch (error) {
      console.error('Error in getLocations:', error)
      return { success: false, error: error.message }
    }
  }
} 