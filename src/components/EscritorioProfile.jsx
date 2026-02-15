import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, Cpu, HardDrive, Activity, CheckCircle, XCircle, AlertTriangle, Server, Clock } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { API_CONFIG } from '../config/Apiconfig';

const API_URL = API_CONFIG.BASE_URL;

const BiometricStatus = ({ label, status, details, ip }) => {
    // Status visual mapping
    const getStatusStyles = (s) => {
        switch (s) {
            case 'conectado': return {
                bg: 'bg-green-50 dark:bg-green-900/20',
                border: 'border-green-200 dark:border-green-800',
                text: 'text-green-700 dark:text-green-400',
                icon: CheckCircle,
                label: 'Conectado'
            };
            case 'desconectado': return {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                text: 'text-red-700 dark:text-red-400',
                icon: XCircle,
                label: 'Desconectado'
            };
            case 'error': return {
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                border: 'border-orange-200 dark:border-orange-800',
                text: 'text-orange-700 dark:text-orange-400',
                icon: AlertTriangle,
                label: 'Error'
            };
            default: return {
                bg: 'bg-gray-50 dark:bg-gray-800',
                border: 'border-gray-200 dark:border-gray-700',
                text: 'text-gray-500 dark:text-gray-400',
                icon: Activity,
                label: 'Desconocido'
            };
        }
    };

    const styles = getStatusStyles(status);
    const StatusIcon = styles.icon;

    return (
        <div className={`p-4 rounded-xl border ${styles.border} ${styles.bg} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${styles.text}`} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
                </div>
                <div className={`flex items-center gap-1 text-xs uppercase font-bold tracking-wider ${styles.text}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{styles.label}</span>
                </div>
            </div>
            {details && <p className="text-sm opacity-80 text-gray-600 dark:text-gray-300 mb-1">{details}</p>}
            {ip && <p className="text-xs font-mono text-gray-500 dark:text-gray-400">IP: {ip}</p>}
        </div>
    );
};

const EscritorioProfile = ({ dispositivo }) => {
    const { formatDate, formatTime } = useConfig();
    const [biometricos, setBiometricos] = useState([]);
    const [loadingBio, setLoadingBio] = useState(false);

    useEffect(() => {
        if (dispositivo?.id) {
            fetchBiometricos(dispositivo.id);
        }
    }, [dispositivo]);

    const fetchBiometricos = async (id) => {
        try {
            setLoadingBio(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/biometrico/escritorio/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setBiometricos(result.data);
            }
        } catch (error) {
            console.error("Error fetching biometricos:", error);
        } finally {
            setLoadingBio(false);
        }
    };

    // Si no hay datos, mostrar placeholder
    if (!dispositivo) return <div className="p-6 text-center text-gray-500">No hay información del dispositivo.</div>;

    return (
        <div className="space-y-6">
            {/* Header del Dispositivo - Estandarizado */}
            <div className="flex items-start gap-5">
                <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                    <Monitor className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dispositivo.nombre_equipo || dispositivo.nombre || 'PC Sin Nombre'}</h3>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${dispositivo.es_activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {dispositivo.es_activo !== false ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {dispositivo.es_activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            Escritorio
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conectividad */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Conectividad</h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-300"><Wifi className="w-4 h-4" /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección IP</span>
                            </div>
                            <span className="block text-sm font-mono text-gray-900 dark:text-white break-all whitespace-pre-wrap pl-11">{dispositivo.ip || 'N/A'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-300"><Cpu className="w-4 h-4" /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección MAC</span>
                            </div>
                            <span className="block text-sm font-mono text-gray-900 dark:text-white break-all whitespace-pre-wrap pl-11">{dispositivo.mac || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Sistema Operativo e Info */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Sistema</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-300"><Server className="w-4 h-4" /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OS</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{dispositivo.sistema_operativo || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-300"><Clock className="w-4 h-4" /></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registrado</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{dispositivo.fecha_registro ? new Date(dispositivo.fecha_registro).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estado de Periféricos Biométricos */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Biométricos Conectados
                </h3>

                {loadingBio ? (
                    <div className="text-center py-8 text-gray-500 animate-pulse">Cargando estado de biométricos...</div>
                ) : biometricos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {biometricos.map((bio) => (
                            <BiometricStatus
                                key={bio.id}
                                label={bio.nombre}
                                status={bio.estado}
                                details={bio.tipo + ' - ' + (bio.puerto || 'USB')}
                                ip={bio.ip}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No se detectaron lectores biométricos conectados a este equipo.</p>
                    </div>
                )}
            </div>

            {/* Información Técnica Adicional */}
            {dispositivo.descripcion && (
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">Información Adicional</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="mb-1">
                            <p className="text-xs text-gray-500 uppercase mb-1">Descripción</p>
                            <p className="text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-700 p-3 rounded border border-gray-100 dark:border-gray-600">{dispositivo.descripcion}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EscritorioProfile;

