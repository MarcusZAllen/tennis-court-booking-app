// Tennis Court Booking App Homepage

import * as React from "react";
import Navbar from "../components/Navbar";
import WeeklyCalendar from "../components/WeeklyCalendar";
import LocationPills from "../components/LocationPills";
import { useSupabaseData } from '@/hooks/useSupabaseData';

const Index = () => {
  const [location, setLocation] = React.useState("All London");
  const { calendarData, loading, error } = useSupabaseData();

  if (loading) {
    return (
      <div className="bg-offwhite dark:bg-background min-h-screen flex flex-col font-jost">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading tennis court availability...</p>
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
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
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
      <main className="flex-grow flex items-start justify-center px-2">
        <div
          className="w-full min-h-[80vh] bg-[#fcf4ed] flex flex-col items-center justify-center border-0 mx-auto p-0 pt-0 mt-0"
          style={{ marginTop: 0, boxShadow: "none", borderRadius: 0 }}
        >
          {/* Headline + subheader */}
          <section className="w-full text-center px-4 pt-10 md:pt-14">
            <h1 className="text-3xl md:text-3xl font-bold mb-3 md:mb-4 text-black leading-tight font-jost uppercase">
              Find and book tennis courts across London
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-4">
              Check real-time availability. Grab the perfect slot.
            </p>
          </section>
          
          {/* Location Pills Selector - now directly above calendar */}
          <LocationPills selected={location} onSelect={setLocation} />
          {/* Weekly Calendar Booking Grid */}
          <section className="w-full flex-grow flex items-start justify-center px-1 md:px-4 pb-12">
            <WeeklyCalendar calendarData={calendarData} selectedLocation={location} />
          </section>
        </div>
      </main>
      {/* Footer */}
      <footer className="text-sm text-gray-400 opacity-90 py-6 text-center">
        &copy; {new Date().getFullYear()} CourtBook. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;

