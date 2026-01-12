import React from 'react';

export const Card = ({
    children,
    className = '',
    hover = false,
    glass = false,
    glassDark = false,
    noPadding = false,
    ...props
}) => {
    const baseClasses = 'relative rounded-xl border border-border-subtle overflow-hidden';
    const bgClasses = glass
        ? 'glass-panel'
        : glassDark
            ? 'glass-dark'
            : 'bg-surface-1';

    const hoverClasses = hover
        ? 'transition-all duration-300 hover:border-border-strong hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20'
        : '';

    const paddingClasses = noPadding ? '' : 'p-6';

    return (
        <div
            className={`
        ${baseClasses} 
        ${bgClasses} 
        ${hoverClasses} 
        ${paddingClasses} 
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-main ${className}`}>
        {children}
    </h3>
);

export const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

export default Card;
