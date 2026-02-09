import React from 'react';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    className = '',
    disabled = false,
    title = ''
}) => {
    const baseStyles = "px-4 py-2 rounded-lg transition-colors shadow-sm font-medium flex items-center justify-center space-x-2";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300",
        secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        success: "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200",
        ghost: "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-none shadow-none"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
            title={title}
        >
            {children}
        </button>
    );
};

export default Button;
