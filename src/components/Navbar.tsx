import { Share } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { textStyles } from '../../branding/typography';
import { useToast } from "../hooks/use-toast";

const Navbar = () => {
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
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-offwhite dark:bg-dark z-50 font-jost" style={{ borderBottom: "none", boxShadow: "none" }}>
      {/* Logo */}
      <div className="flex items-center">
        <span
          className="text-black rounded-[14px] px-4 py-2 text-[1.5rem] md:text-[1rem] uppercase font-jost font-normal tracking-widest border-0 select-none"
          style={{
            background: "transparent",
            letterSpacing: "0.19em",
            fontWeight: 100,
          }}
          tabIndex={-1}
        >
          BOOK A COURT
        </span>
      </div>
      {/* Right: Courts, Share */}
      <div className="flex items-center gap-3 md:gap-5 ml-auto">
        <Link
          href="/courts"
          className={`bg-white text-black rounded-xl px-4 py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 ${textStyles.buttonTextSmall}`}
          style={{ letterSpacing: "0.08em" }}
        >
          Courts
        </Link>
        <button
          onClick={handleShare}
          className={`bg-white text-black rounded-xl px-4 py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 flex items-center ${textStyles.buttonTextSmall}`}
          style={{ letterSpacing: "0.08em" }}
        >
          <Share className="w-4 h-4 mr-1" aria-label="Share" />
          Share
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

