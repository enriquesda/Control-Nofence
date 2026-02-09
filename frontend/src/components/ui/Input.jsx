import React from 'react';

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    disabled = false,
    className = '',
    onBlur
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
            />
        </div>
    );
};

export default Input;
