import React from 'react';
import { FiMonitor, FiWifi, FiCpu, FiHardDrive, FiActivity, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useConfig } from '../context/ConfigContext';

const BiometricStatus = ({ label, status, details, icon: Icon }) => {
    // Status visual mapping (Mock)
    const getStatusColor = (s) => {
        switch (s) {
            case 'connected': return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'disconnected': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default: return 'text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const statusConfig = {
        'connected': { text: 'Conectado', icon: FiCheckCircle },
        'disconnected': { text: 'Desconectado', icon: FiXCircle },
        'warning': { text: 'Revisión', icon: FiActivity }
    };

    const StatusIcon = statusConfig[status]?.icon || FiActivity;

    return (
        <div className={`p-4 rounded-xl border ${getStatusColor(status)} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5" />}
                    <h4 className="font-semibold">{label}</h4>
                </div>
                <div className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider">
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig[status]?.text || 'Desconocido'}</span>
                </div>
            </div>
            <p className="text-sm opacity-80">{details}</p>
        </div>
    );
};

const EscritorioProfile = ({ dispositivo }) => {
    const { formatDate, formatTime } = useConfig();
    // Si no hay datos, mostrar placeholder
    if (!dispositivo) return <div className="p-6 text-center text-gray-500">No hay información del dispositivo.</div>;

    // --- MOCK DATA PARA DEMOSTRACIÓN ---
    // En una implementación real, esto vendría del backend o socket
    const biometrics = [
        { id: 'fp', type: 'Huella Digital', status: 'connected', details: 'Sensor óptico 500DPI - Listo', icon: null },
        { id: 'face', type: 'Reconocimiento Facial', status: 'connected', details: 'Cámara detectada - Listo', icon: null },
    ];

    return (
        <div className="space-y-6">
            {/* Header del Dispositivo */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FiMonitor className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                        <FiMonitor className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{dispositivo.nombre_equipo || 'PC Sin Nombre'}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-blue-100 text-sm">
                            <span className="flex items-center gap-1"><FiWifi className="w-4 h-4" /> {dispositivo.ip || '0.0.0.0'}</span>
                            <span className="flex items-center gap-1"><FiCpu className="w-4 h-4" /> {dispositivo.sistema_operativo || 'Desconocido'}</span>
                            <span className="flex items-center gap-1"><FiHardDrive className="w-4 h-4" /> MAC: {dispositivo.mac || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estado de Periféricos Biométricos */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <FiActivity className="w-5 h-5 text-blue-500" />
                    Estado de Biométricos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {biometrics.map((bio, idx) => (
                        <BiometricStatus
                            key={idx}
                            label={bio.type}
                            status={bio.status}
                            details={bio.details}
                        />
                    ))}
                </div>
            </div>

            {/* Información Técnica Adicional (Placeholder) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs">Versión Cliente</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">v1.2.4 (Estable)</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs">Última Conexión</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatDate(new Date())} {formatTime(new Date().toLocaleTimeString())}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs">Memoria Uso</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">45% (4GB / 8GB)</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 dark:text-gray-400 text-xs">Almacenamiento</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">120GB Libres</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EscritorioProfile;
