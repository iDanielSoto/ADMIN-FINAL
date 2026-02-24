import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/Apiconfig';
import { FiHome, FiUsers, FiMonitor, FiActivity, FiGlobe } from 'react-icons/fi';
import DynamicLoader from '../components/common/DynamicLoader';
import { useNavigate } from 'react-router-dom';

const API_URL = API_CONFIG.BASE_URL;

const SaasDashboard = () => {
    const [metricas, setMetricas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetricas = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_URL}/api/saas/metricas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();

                if (data.success) {
                    setMetricas(data.data);
                } else {
                    setError('Error al obtener métricas: ' + data.message);
                }
            } catch (err) {
                console.error(err);
                setError('Error de conexión con el servidor central');
            } finally {
                setLoading(false);
            }
        };

        fetchMetricas();
    }, []);

    if (loading) return <DynamicLoader text="Obteniendo métricas globales..." />;
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>;

    const stats = [
        {
            title: 'Empresas Registradas',
            value: metricas?.empresas?.total || 0,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            icon: FiGlobe,
            details: `${metricas?.empresas?.activas || 0} activas, ${metricas?.empresas?.inactivas || 0} suspendidas`
        },
        {
            title: 'Trabajadores Globales',
            value: metricas?.empleados || 0,
            color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
            icon: FiUsers,
            details: 'En todos los tenants'
        },
        {
            title: 'Dispositivos Conectados',
            value: metricas?.dispositivos || 0,
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            icon: FiMonitor,
            details: 'Móviles y Escritorio'
        },
        {
            title: 'Usuarios del Sistema',
            value: metricas?.usuarios || 0,
            color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
            icon: FiActivity,
            details: 'Administradores y Empleados'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control SaaS</h2>
                    <p className="text-gray-500 dark:text-gray-400">Visión global de todo el ecosistema multi-tenant.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/saas-logs')}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
                    >
                        <FiActivity className="w-5 h-5 text-gray-500" /> System Logs
                    </button>
                    <button
                        onClick={() => navigate('/empresas')}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <FiGlobe className="w-5 h-5" /> Gestionar Entidades (Tenants)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                            <div className={`p-4 rounded-full mb-4 ${stat.color}`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full w-full">{stat.details}</p>
                        </div>
                    );
                })}
            </div>

            {/* Espacio para futuras graficas SaaS (por ejemplo crecimiento mensual de empresas) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm min-h-[300px] flex items-center justify-center">
                <p className="text-gray-400 flex flex-col items-center gap-2">
                    <FiActivity className="w-8 h-8 opacity-50" />
                    Gráficos de crecimiento en desarrollo...
                </p>
            </div>
        </div>
    );
};

export default SaasDashboard;
