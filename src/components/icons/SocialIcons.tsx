import React from 'react';

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number | string;
}

/**
 * High-fidelity, brand-accurate Social Icons for The Base Movement.
 * Using original file assets for absolute design consistency.
 */

export const FacebookIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/facebook.svg" 
    alt="Facebook" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const InstagramIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/instagram.svg" 
    alt="Instagram" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const XIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/x.svg" 
    alt="X" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const TikTokIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/tiktok.svg" 
    alt="TikTok" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const YouTubeIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/youtube.svg" 
    alt="YouTube" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/whatsapp.svg" 
    alt="WhatsApp" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);

export const LinkedInIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img 
    src="/social-icons/linkedin.svg" 
    alt="LinkedIn" 
    width={size} 
    height={size} 
    className={className}
    {...props} 
  />
);
