import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/Apiconfig';

const ConfigContext = createContext();

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    // Estado inicial por defecto
    const [config, setConfig] = useState({
        idioma: 'es',
        formato_fecha: 'DD/MM/YYYY',
        formato_hora: '24',
        zona_horaria: 'America/Mexico_City',
        es_mantenimiento: false
    });

    // Cargar configuración inicial
    useEffect(() => {
        // 1. Cargar desde localStorage
        const savedConfig = localStorage.getItem('app_config');
        if (savedConfig) {
            try {
                setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
            } catch (e) {
                console.error("Error parsing saved config", e);
            }
        }

        // 2. Verificar estado de mantenimiento desde API
        fetch(`${API_CONFIG.BASE_URL}/api/configuracion/public/status`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConfig(prev => ({
                        ...prev,
                        es_mantenimiento: data.maintenance
                    }));
                }
            })
            .catch(err => console.error("Error checking maintenance mod", err));

    }, []);

    // Función para actualizar la configuración
    const updateConfig = (newConfig) => {
        setConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem('app_config', JSON.stringify(updated));
            return updated;
        });
    };

    // Helpers para formateo (ejemplos simples, podrían usar librerías como date-fns)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);

        // Soporte básico para DD/MM/YYYY y YYYY-MM-DD
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        if (config.formato_fecha === 'MM/DD/YYYY') {
            return `${month}/${day}/${year}`;
        }
        return `${day}/${month}/${year}`; // Default DD/MM/YYYY
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // Asumiendo timeString en formato HH:mm o HH:mm:ss
        if (config.formato_hora === '12') {
            const [hours, minutes] = timeString.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        }
        return timeString; // Default 24h
    };

    return (
        <ConfigContext.Provider value={{ config, updateConfig, formatDate, formatTime }}>
            {children}
        </ConfigContext.Provider>
    );
};
