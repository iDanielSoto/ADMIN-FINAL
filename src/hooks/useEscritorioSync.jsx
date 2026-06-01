import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/Apiconfig';

const API_URL = API_CONFIG.BASE_URL;

/**
 * Hook para sincronizar los datos de un escritorio en tiempo real (polling).
 * @param {string} escritorioId - ID del escritorio a sincronizar.
 * @param {number} intervalMs - Intervalo de actualización (default 5000ms).
 * @returns {Object} { escritorio, loadingEsc, errorEsc }
 */
export const useEscritorioSync = (escritorioId, intervalMs = 5000) => {
    const [escritorio, setEscritorio] = useState(null);
    const [loadingEsc, setLoadingEsc] = useState(false);
    const [errorEsc, setErrorEsc] = useState(null);

    const fetchEscritorio = useCallback(async (showLoading = false) => {
        if (!escritorioId) return;

        try {
            if (showLoading) setLoadingEsc(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/escritorio/${escritorioId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setEscritorio(result.data);
            }
        } catch (error) {
            console.error("Error syncing escritorio:", error);
            setErrorEsc(error.message);
        } finally {
            if (showLoading) setLoadingEsc(false);
        }
    }, [escritorioId]);

    useEffect(() => {
        if (!escritorioId) return;

        fetchEscritorio(true);

        const intervalId = setInterval(() => {
            fetchEscritorio(false);
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [escritorioId, intervalMs, fetchEscritorio]);

    return { escritorio, loadingEsc, errorEsc };
};
