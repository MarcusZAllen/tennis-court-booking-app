import { Share } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { textStyles } from '../../branding/typography';
import { useToast } from "../hooks/use-toast";
import AddressLocationPopover, { UserLocation } from "./AddressLocationPopover";

interface NavbarProps {
  onLocationChange?: (location: UserLocation | null) => void;
  currentLocation?: UserLocation | null;
}

const Navbar = ({ onLocationChange, currentLocation }: NavbarProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      // Copy current URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      
      // Show success toast
      toast({
        title: "Link copied!",
        description: "The page URL has been copied to your clipboard.",
        duration: 3000,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.error('Failed to copy to clipboard:', error);
      
      // Show fallback toast with URL
      toast({
        title: "Share this link:",
        description: window.location.href,
        duration: 5000,
      });
    }
  };

  return (
    <nav className="w-full flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-offwhite dark:bg-dark z-50 font-jost" style={{ borderBottom: "none", boxShadow: "none" }}>
      {/* Logo and Location */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="text-black rounded-[14px] px-2 sm:px-4 py-1 sm:py-2 text-[0.8rem] sm:text-[1rem] md:text-[1.2rem] uppercase font-jost font-normal tracking-widest border-0 select-none"
          style={{
            background: "transparent",
            letterSpacing: "0.15em",
            fontWeight: 100,
          }}
          tabIndex={-1}
        >
          BOOK A COURT
        </span>
        {onLocationChange && (
          <AddressLocationPopover 
            onLocationChange={onLocationChange}
            currentLocation={currentLocation || null}
          />
        )}
      </div>
      {/* Right: Tennis, Padel, Share */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 ml-auto">
        <Link
          href="/"
          className={`bg-white text-black rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 text-xs sm:text-sm`}
          style={{ letterSpacing: "0.05em" }}
        >
          Tennis
        </Link>
        <Link
          href="/padel"
          className={`bg-white text-black rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 text-xs sm:text-sm`}
          style={{ letterSpacing: "0.05em" }}
        >
          Padel
        </Link>
        <button
          onClick={handleShare}
          className={`bg-white text-black rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 flex items-center text-xs sm:text-sm`}
          style={{ letterSpacing: "0.05em" }}
        >
          <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1" aria-label="Share" />
          Share
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

