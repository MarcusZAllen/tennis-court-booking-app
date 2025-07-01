import * as React from "react";
import { RotateCcw } from "lucide-react";

const RefreshButton: React.FC = () => {
  const [scraping, setScraping] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  React.useEffect(() => {
    if (done) {
      const timeout = setTimeout(() => setDone(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [done]);

  const handleReplay = async () => {
    if (scraping) return;
    setScraping(true);
    setDone(false);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (res.ok) {
        setDone(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setScraping(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <button
        aria-label="Refresh court data"
        onClick={handleReplay}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        disabled={scraping}
        style={{
          background: "transparent",
          border: hovered ? "2px solid #7cb46b" : "2px solid transparent",
          borderRadius: "50%",
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hovered ? "0 2px 8px #7cb46b33" : undefined,
          cursor: scraping ? "wait" : "pointer",
          transition: "box-shadow 0.18s, transform 0.12s, background 0.18s, border 0.18s",
          transform: pressed ? "scale(0.92)" : hovered ? "scale(1.08)" : "scale(1)",
          outline: done ? "2px solid #7cb46b" : "none",
          outlineOffset: done ? "2px" : undefined,
          margin: 0,
          padding: 0,
        }}
      >
        <RotateCcw
          style={{
            color: hovered ? "#222" : "#bcbcbc", // black on hover, grey by default
            width: 18,
            height: 18,
            transition: "color 0.2s",
            animation: scraping
              ? "spin-anticlockwise 1s linear infinite"
              : done
              ? "pop 0.5s cubic-bezier(.68,-0.55,.27,1.55)"
              : undefined,
            opacity: scraping ? 0.7 : 1,
            filter: hovered ? "drop-shadow(0 0 4px #7cb46b88)" : undefined,
          }}
        />
        <style>{`
          @keyframes spin-anticlockwise { 100% { transform: rotate(-360deg); } }
          @keyframes pop {
            0% { transform: scale(1); }
            60% { transform: scale(1.3); }
            100% { transform: scale(1); }
          }
        `}</style>
      </button>
    </div>
  );
};

export default RefreshButton; 