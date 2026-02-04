import { useEffect, useRef } from 'react';

const API_URL = 'https://9dm7dqf9-3002.usw3.devtunnels.ms';

/**
 * Hook para escuchar eventos SSE de solicitudes en tiempo real.
 * @param {Object} callbacks
 * @param {Function} callbacks.onNuevaSolicitud - Se ejecuta al recibir una nueva solicitud
 * @param {Function} callbacks.onSolicitudActualizada - Se ejecuta al aceptar/rechazar una solicitud
 */
export function useSolicitudesSSE({ onNuevaSolicitud, onSolicitudActualizada }) {
    const eventSourceRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const url = `${API_URL}/api/solicitudes/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('nueva-solicitud', (e) => {
            try {
                const data = JSON.parse(e.data);
                onNuevaSolicitud?.(data);
            } catch (err) {
                console.error('Error parsing SSE nueva-solicitud:', err);
            }
        });

        es.addEventListener('solicitud-actualizada', (e) => {
            try {
                const data = JSON.parse(e.data);
                onSolicitudActualizada?.(data);
            } catch (err) {
                console.error('Error parsing SSE solicitud-actualizada:', err);
            }
        });

        es.onerror = () => {
            // EventSource se reconecta automáticamente
            console.warn('SSE conexión perdida, reconectando...');
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, []);
}
