import { useEffect, useRef } from 'react';
import { API_CONFIG } from '../config/Apiconfig';

const API_URL = API_CONFIG.BASE_URL;

/**
 * Generic hook for global real-time events
 * @param {Object} handlers - Map of event names to callback functions
 * @example
 * useRealTime({
 *   'nueva-asistencia': (data) => refreshDashboard(data),
 *   'empleado-actualizado': (data) => updateList(data)
 * })
 */
export function useRealTime(handlers = {}) {
    const eventSourceRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Connect to the centralized stream endpoint
        const url = `${API_URL}/api/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        // Register handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            es.addEventListener(event, (e) => {
                try {
                    const data = JSON.parse(e.data);
                    handler(data);
                } catch (err) {
                    console.error(`Error parsing SSE event ${event}:`, err);
                }
            });
        });

        es.onerror = (e) => {
            // EventSource auto-reconnects, but nice to log
            // console.warn('SSE connection lost, reconnecting...', e);
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [handlers]); // Re-connect if handlers change (usually memoized in parent)
}
