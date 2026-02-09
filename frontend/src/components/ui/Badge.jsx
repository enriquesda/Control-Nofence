import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: "bg-slate-100 text-slate-700",
        primary: "bg-blue-100 text-blue-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-orange-100 text-orange-700",
        danger: "bg-red-100 text-red-700",
        purple: "bg-purple-100 text-purple-700",
        info: "bg-cyan-100 text-cyan-700"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
