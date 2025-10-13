// Tennis Court Booking App Homepage
// Updated to use Supabase environment variables

import * as React from "react";
import Navbar from "../components/Navbar";
import WeeklyCalendar from "../components/WeeklyCalendar";
import LocationPills from "../components/LocationPills";
import FeedbackButton from "../components/FeedbackButton";
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { textStyles } from '../../branding/typography';

const Index = () => {
  const [selectedLocations, setSelectedLocations] = React.useState(["All London"]);
  const { calendarData, loading, error } = useSupabaseData();

  if (loading) {
    return (
      <div className="bg-offwhite dark:bg-background min-h-screen flex flex-col font-jost">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className={textStyles.loadingText}>Loading tennis court availability...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-offwhite dark:bg-background min-h-screen flex flex-col font-jost">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className={textStyles.errorText}>Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-offwhite dark:bg-background min-h-screen flex flex-col font-jost">
      <Navbar />
      <main className="flex-grow flex items-start justify-center px-1 sm:px-2">
        <div
          className="w-full min-h-[80vh] bg-[#fcf4ed] flex flex-col items-center justify-center border-0 mx-auto p-0 pt-0 mt-0"
          style={{ marginTop: 0, boxShadow: "none", borderRadius: 0 }}
        >
          {/* Headline + subheader */}
          <section className="w-full text-center px-2 sm:px-4 pt-6 sm:pt-10 md:pt-14">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-black leading-tight font-jost uppercase">
              Find and book tennis courts across London
            </h1>
            <p className={`${textStyles.pageDescription} text-sm sm:text-base`}>
              Check real-time availability. Grab the perfect slot.
            </p>
          </section>
          
          {/* Location Pills Selector - now directly above calendar */}
          <div className="w-full px-2 sm:px-4">
            <LocationPills selected={selectedLocations} onSelect={setSelectedLocations} />
          </div>
          {/* Weekly Calendar Booking Grid */}
          <section className="w-full flex-grow flex items-start justify-center px-1 sm:px-2 md:px-4 pb-8 sm:pb-12">
            <div className="w-full flex justify-center">
              <WeeklyCalendar calendarData={calendarData} selectedLocations={selectedLocations} />
            </div>
          </section>
        </div>
      </main>
      {/* Footer */}
      <footer className={`${textStyles.footerText} py-4 sm:py-6 text-center text-xs sm:text-sm`}>
        &copy; {new Date().getFullYear()} CourtBook. All rights reserved.
      </footer>
      
      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Index;

