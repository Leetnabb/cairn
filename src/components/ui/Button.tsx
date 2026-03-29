import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'secondary', size = 'sm', className = '', children, ...props }: ButtonProps) {
  const base = 'font-medium rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-[11px]',
  };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-card border border-border text-text-secondary hover:bg-[var(--bg-hover)]',
    danger: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
    ghost: 'text-text-secondary hover:bg-[var(--bg-hover)]',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
