import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRealTime } from '../hooks/useRealTime';
import { API_CONFIG } from '../config/Apiconfig';

const CompanyContext = createContext();

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};

export const CompanyProvider = ({ children }) => {
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = API_CONFIG.BASE_URL;

    const fetchEmpresa = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            // Si no hay token, no podemos cargar la empresa (asumiendo que requiere auth)
            // Si es endpoint público, quitar el check del token.
            // Asumiré que requiere Auth por consistencia con Sidebar.jsx

            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_URL}/api/empresas?es_activo=true`, {
                headers
            });
            const result = await response.json();
            if (result.success && result.data?.length > 0) {
                setEmpresa(result.data[0]);
            } else {
                setEmpresa(null);
            }
        } catch (err) {
            console.error('Error al cargar empresa:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresa();
    }, []);

    // Escuchar cambios en tiempo real
    useRealTime({
        'empresa-actualizada': (data) => {
            if (data && data.es_activo) {
                setEmpresa(prev => ({ ...prev, ...data }));
            } else if (data && !data.es_activo) {
                // Si la empresa activa se desactiva, podríamos querer recargar
                fetchEmpresa();
            }
        }
    });

    return (
        <CompanyContext.Provider value={{ empresa, loading, error, refreshCompany: fetchEmpresa }}>
            {children}
        </CompanyContext.Provider>
    );
};
