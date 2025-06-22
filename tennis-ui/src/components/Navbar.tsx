import { Share } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import * as React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 bg-offwhite dark:bg-dark z-50 font-jost" style={{ borderBottom: "none", boxShadow: "none" }}>
      {/* Logo */}
      <div className="flex items-center">
        <span
          className="text-black rounded-[14px] px-4 py-2 text-[1.5rem] md:text-[2rem] uppercase font-jost font-normal tracking-widest border-0 select-none"
          style={{
            background: "transparent",
            letterSpacing: "0.19em",
            fontWeight: 400,
          }}
          tabIndex={-1}
        >
          I WANT TO PLAY TENNIS
        </span>
      </div>
      {/* Right: Courts, Share, Profile */}
      <div className="flex items-center gap-3 md:gap-5">
        <Link
          href="/courts"
          className="bg-white text-black rounded-xl px-4 py-2 font-jost font-medium text-base uppercase shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 hover:underline focus:bg-gray-100"
          style={{ letterSpacing: "0.08em" }}
        >
          Courts
        </Link>
        <button
          className="bg-white text-black rounded-full p-2 shadow-sm border-0 flex items-center transition-all duration-150 hover:bg-gray-100 hover:underline focus:bg-gray-100"
          style={{ background: "#fff" }}
        >
          <Share className="w-5 h-5" aria-label="Share" />
        </button>
        <ProfileAvatar />
      </div>
    </nav>
  );
};

export default Navbar;

