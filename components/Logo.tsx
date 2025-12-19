import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 64, showText = true, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGrad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e3a8a" />
            <stop offset="1" stopColor="#172554" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shield Outline */}
        <path d="M50 98C20 88 5 65 5 35V15L50 5L95 15V35C95 65 80 88 50 98Z" fill="url(#shieldGrad)" stroke="#eab308" strokeWidth="3"/>
        
        {/* Retro Monitor Shape */}
        <rect x="20" y="25" width="60" height="45" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
        <path d="M25 70L20 80H80L75 70" fill="#334155" />
        <rect x="30" y="80" width="40" height="5" fill="#1e293b" />

        {/* Screen (Pitch) */}
        <rect x="25" y="30" width="50" height="35" fill="#10b981" />
        <path d="M50 30V65" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="50" cy="47.5" r="6" stroke="white" strokeWidth="1" />
        
        {/* Pixel Ball */}
        <g transform="translate(45, 42.5)">
           <rect x="2" y="0" width="6" height="10" fill="white"/>
           <rect x="0" y="2" width="10" height="6" fill="white"/>
           <rect x="3" y="3" width="4" height="4" fill="#1e293b"/>
        </g>

        {/* Glare on screen */}
        <path d="M70 32L65 45L73 32H70Z" fill="white" opacity="0.3" />

        {/* "2.0" Badge */}
        <rect x="65" y="75" width="25" height="12" rx="2" fill="#dc2626" stroke="white" strokeWidth="1"/>
        <text x="77.5" y="84" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="white" textAnchor="middle">2.0</text>
      </svg>
      
      {showText && (
        <div className="mt-2 text-center">
            <h1 className="font-['Press_Start_2P'] text-yellow-500 text-xl tracking-tighter drop-shadow-md" style={{ textShadow: '2px 2px 0px #000' }}>
                PC LIGA
            </h1>
            <div className="text-[10px] tracking-[0.3em] text-blue-300 font-bold uppercase mt-1">
                Football Manager
            </div>
        </div>
      )}
    </div>
  );
};

export default Logo;