import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = 'font-meta font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[var(--brand-green)] text-white hover:opacity-90 shadow-lg shadow-brand-green/20',
    secondary: 'bg-[var(--brand-gold)] text-charcoal-dark hover:opacity-90 shadow-md',
    accent: 'bg-[var(--brand-red)] text-white hover:opacity-90 shadow-lg shadow-brand-red/20',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-600 hover:bg-slate-50',
    danger: 'bg-transparent border-2 border-red-100 text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-8 py-4 text-[11px]',
    lg: 'px-12 py-6 text-xs',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export { Button };
