import React from 'react';

export default function Logo({ className = '', style = {}, width = '48px', height = 'auto' }) {
  return (
    <svg 
      viewBox="0 0 200 260" 
      width={width} 
      height={height} 
      className={className} 
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer White Flag with Black Border */}
      <path 
        d="M 20 20 L 180 20 L 180 175 L 140 210 L 95 165 L 20 240 Z" 
        fill="white" 
        stroke="black" 
        strokeWidth="10" 
        strokeLinejoin="miter" 
      />
      
      {/* Black Base for bottom stripes */}
      <path 
        d="M 20 195 L 95 120 L 140 165 L 180 125 L 180 175 L 140 210 L 95 165 L 20 240 Z" 
        fill="black" 
      />
      
      {/* Red Stripe 1 */}
      <path 
        d="M 20 205 L 95 130 L 140 175 L 180 135" 
        fill="none" 
        stroke="#dc2626" 
        strokeWidth="12" 
        strokeLinecap="square" 
      />
      
      {/* Red Stripe 2 */}
      <path 
        d="M 20 227 L 95 152 L 140 197 L 180 157" 
        fill="none" 
        stroke="#dc2626" 
        strokeWidth="12" 
        strokeLinecap="square" 
      />

      {/* Typography: KENYAK */}
      <text 
        x="42" 
        y="92" 
        fontFamily="'Bricolage Grotesque', sans-serif" 
        fontWeight="900" 
        fontSize="44px" 
        fill="black" 
        letterSpacing="-0.03em"
      >
        KEN
      </text>
      <text 
        x="42" 
        y="136" 
        fontFamily="'Bricolage Grotesque', sans-serif" 
        fontWeight="900" 
        fontSize="44px" 
        fill="black" 
        letterSpacing="-0.03em"
      >
        YAK
      </text>

      {/* Sub-label: CND */}
      <text 
        x="122" 
        y="148" 
        fontFamily="'Bricolage Grotesque', sans-serif" 
        fontWeight="900" 
        fontSize="17px" 
        fill="#dc2626"
        letterSpacing="0.02em"
      >
        CND
      </text>

      {/* Orange Splatter in top-right corner */}
      <path 
        d="M 152 45 C 147 40, 137 47, 145 52 C 149 54, 151 57, 150 61 C 148 67, 158 67, 158 61 C 158 57, 161 55, 165 57 C 171 60, 173 50, 166 48 C 162 47, 160 43, 161 39 C 163 33, 153 33, 154 39 C 155 43, 156 45, 152 45 Z" 
        fill="#ff7a00" 
      />
    </svg>
  );
}
