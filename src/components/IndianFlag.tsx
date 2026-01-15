/**
 * Indian Flag Component
 * Displays the Indian tricolor with Ashoka Chakra
 */
export function IndianFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flag of India"
    >
      {/* Saffron (Top) */}
      <rect x="0" y="0" width="120" height="26.67" fill="#FF9933" />
      
      {/* White (Middle) with Ashoka Chakra */}
      <rect x="0" y="26.67" width="120" height="26.66" fill="#FFFFFF" />
      
      {/* Ashoka Chakra - Navy Blue Circle */}
      <circle
        cx="60"
        cy="40"
        r="9"
        fill="#000080"
        stroke="#000080"
        strokeWidth="0.5"
      />
      
      {/* Ashoka Chakra - 24 Spokes */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 - 90) * (Math.PI / 180);
        const x1 = 60 + Math.cos(angle) * 9;
        const y1 = 40 + Math.sin(angle) * 9;
        const x2 = 60 + Math.cos(angle) * 13.33;
        const y2 = 40 + Math.sin(angle) * 13.33;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#000080"
            strokeWidth="0.75"
          />
        );
      })}
      
      {/* Green (Bottom) */}
      <rect x="0" y="53.33" width="120" height="26.67" fill="#138808" />
    </svg>
  );
}

