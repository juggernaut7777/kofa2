import React from 'react';

const variants = {
    primary: 'bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-glow hover:-translate-y-0.5',
    secondary: 'bg-surface-3 text-main hover:bg-surface-3/80 hover:-translate-y-0.5',
    outline: 'border border-border-strong text-main hover:border-brand-primary hover:text-brand-primary bg-transparent',
    ghost: 'text-muted hover:text-main hover:bg-surface-2',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base font-medium'
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    icon,
    ...props
}) => {
    return (
        <button
            className={`
        relative inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
      `}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 opacity-75" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && <span className="mr-1">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
