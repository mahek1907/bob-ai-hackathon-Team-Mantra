import React from 'react';
import loginBg from '../assets/login_bg.jpg';
import signupBg from '../assets/signup_bg.jpg';

/**
 * ElectricalBackground
 * Renders the reference visual background for Login or Signup:
 * - variant="login": Photorealistic substation transformer scene with glowing cybernetic grid and Asset Health HUD (media_1789715447884.jpg)
 * - variant="signup": Futuristic electric-energy canvas with smooth translucent sweeps and glowing nodes (media_1789715447830.jpg)
 * - Layered with subtle, elegant glowing energy node pulses and tiny realistic electrical energy spark bursts
 */
export default function ElectricalBackground({ variant = 'login', showUpperRightSpark = false }) {
  const isSignup = variant === 'signup';
  const bgImage = isSignup ? signupBg : loginBg;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Pristine high-resolution background artwork */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle atmospheric gradient overlay for smooth depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isSignup 
            ? 'radial-gradient(ellipse at 50% 40%, rgba(255, 255, 255, 0.1) 0%, rgba(245, 249, 255, 0.02) 70%, rgba(235, 245, 255, 0.15) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(245,249,255,0.02) 100%)'
        }}
      />
    </div>
  );
}
