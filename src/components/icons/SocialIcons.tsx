/**
 * SocialIcons Component
 * -------------------------------------------------------------
 * Provides brand-accurate social media icon assets for the platform.
 * Renders consistent SVG icons for Facebook, Instagram, X, TikTok, YouTube, WhatsApp, and LinkedIn.
 */

import React from 'react'

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number | string
}

/**
 * High-fidelity, brand-accurate Social Icons for The Base Movement.
 * Using original file assets for absolute design consistency.
 */

// Facebook branding logo icon component
export const FacebookIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/facebook.svg"
    alt="Facebook"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// Instagram branding logo icon component
export const InstagramIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/instagram.svg"
    alt="Instagram"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// X (formerly Twitter) branding logo icon component
export const XIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/x.svg"
    alt="X"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// TikTok branding logo icon component
export const TikTokIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/tiktok.svg"
    alt="TikTok"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// YouTube branding logo icon component
export const YouTubeIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/youtube.svg"
    alt="YouTube"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// WhatsApp branding logo icon component
export const WhatsAppIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/whatsapp.svg"
    alt="WhatsApp"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)

// LinkedIn branding logo icon component
export const LinkedInIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <img
    src="/social-icons/linkedin.svg"
    alt="LinkedIn"
    width={size}
    height={size}
    className={className}
    {...props}
  />
)
