import React, { createContext, useContext, useState, useEffect } from 'react';

const ClientFilterContext = createContext();

export const useClientFilter = () => useContext(ClientFilterContext);

export const ClientFilterProvider = ({ children }) => {
    // 'all', 'nofence', 'normal'
    const [filterMode, setFilterMode] = useState(() => {
        return localStorage.getItem('clientFilterMode') || 'nofence'; // Default to nofence as per user preference (or all? user said "Todos los clientes... perteneceran a nofence", let's default to all or nofence. User said "si yo tengo selecionado a los de nofence solo". Let's default to 'all' or 'nofence'. Let's default to 'all' for visibility, or 'nofence' if they only want to see that. User said "Todos... perteneceran a nofence", so 'all' and 'nofence' are same for now. Let's default to 'all' to avoid confusion.)
    });

    useEffect(() => {
        localStorage.setItem('clientFilterMode', filterMode);
    }, [filterMode]);

    return (
        <ClientFilterContext.Provider value={{ filterMode, setFilterMode }}>
            {children}
        </ClientFilterContext.Provider>
    );
};
