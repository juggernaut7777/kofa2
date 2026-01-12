import React, { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    icon,
    className = '',
    containerClassName = '',
    type = 'text',
    ...props
}, ref) => {
    return (
        <div className={`space-y-1.5 ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-main">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={`
            premium-input
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>

            {error && (
                <p className="text-xs text-red-500 animate-fadeIn">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
