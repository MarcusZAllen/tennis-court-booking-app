
// Tennis Court Booking App Homepage

import * as React from "react";
import Navbar from "../components/Navbar";
import WeeklyCalendar from "../components/WeeklyCalendar";
import LocationPills from "../components/LocationPills";
import { useCalendarData } from '@/hooks/useCalendarData';


const Index = () => {
  const [location, setLocation] = React.useState("All London");
  const { calendarData } = useCalendarData();

  return (
    <div className="bg-offwhite dark:bg-background min-h-screen flex flex-col font-jost">
      <Navbar />
      <main className="flex-grow flex items-start justify-center px-2">
        <div
          className="w-full max-w-4xl min-h-[80vh] bg-[#fcf4ed] flex flex-col items-center justify-center border-0 mx-auto p-0 pt-0 mt-0"
          style={{ marginTop: 0, boxShadow: "none", borderRadius: 0 }}
        >
          {/* Headline + subheader */}
          <section className="w-full text-center px-4 pt-10 md:pt-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-black leading-tight font-jost uppercase">
              Find and book tennis courts across London
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-4">
              Check real-time availability. Grab the perfect slot—no hassle.
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

