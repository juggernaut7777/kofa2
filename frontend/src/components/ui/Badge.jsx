import React from 'react';

const variants = {
    success: 'bg-green-500/15 text-green-500 border-green-500/20',
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
    danger: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
    info: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
    neutral: 'bg-slate-500/15 text-slate-500 border-slate-500/20',
    brand: 'bg-brand-primary/15 text-brand-primary border-brand-primary/20',
};

const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
};

export const Badge = ({
    children,
    variant = 'neutral',
    size = 'md',
    className = '',
    dot = false,
    ...props
}) => {
    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full border
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
      `}
            {...props}
        >
            {dot && (
                <span className="mr-1.5 flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                </span>
            )}
            {children}
        </span>
    );
};

export default Badge;
