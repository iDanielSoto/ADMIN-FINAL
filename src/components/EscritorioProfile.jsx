import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, Cpu, HardDrive, Activity, CheckCircle, XCircle, AlertTriangle, Server, Clock, Settings, Laptop, Fingerprint, ScanFace, Lock, KeyRound, Save } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { API_CONFIG } from '../config/Apiconfig';
import { useBiometricosSync } from '../hooks/useBiometricosSync';

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

    // Usamos el hook de sincronización en tiempo real para biométricos
    const { biometricos, loadingBio, errorBio } = useBiometricosSync(dispositivo?.id, 5000);

    // Estado para la configuración específica
    const [configuracion, setConfiguracion] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [mensaje, setMensaje] = useState({ text: '', type: '' });

    useEffect(() => {
        if (dispositivo?.id) {
            fetchConfiguracion(dispositivo.id);
        }
    }, [dispositivo]);

    const fetchConfiguracion = async (id) => {
        try {
            setLoadingConfig(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/configuraciones-escritorio/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setConfiguracion(result.data);
            }
        } catch (error) {
            console.error("Error fetching configuracion:", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setConfiguracion(prev => {
            if (field.startsWith('metodos_autenticacion.')) {
                const met = field.split('.')[1];
                return {
                    ...prev,
                    metodos_autenticacion: {
                        ...prev.metodos_autenticacion,
                        [met]: value
                    }
                };
            }
            return { ...prev, [field]: value };
        });
    };

    // Helpers para prioridad de biométricos
    const METODO_LABELS = { huella: 'Huella Dactilar', rostro: 'Reconocimiento Facial', codigo: 'Código PIN / Contraseña' };
    const METODO_ICONS = { huella: Fingerprint, rostro: ScanFace, codigo: KeyRound };

    const getPrioridad = () => {
        const defaults = [
            { metodo: 'huella', activo: true, nivel: 1 },
            { metodo: 'rostro', activo: true, nivel: 2 },
            { metodo: 'codigo', activo: true, nivel: 3 }
        ];
        return (configuracion?.prioridad_biometrico || defaults)
            .slice()
            .sort((a, b) => a.nivel - b.nivel);
    };

    const movePrioridad = (index, direction) => {
        const list = getPrioridad();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= list.length) return;
        const updated = [...list];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        const reniveled = updated.map((item, i) => ({ ...item, nivel: i + 1 }));
        setConfiguracion(prev => ({ ...prev, prioridad_biometrico: reniveled }));
    };

    const togglePrioridad = (metodo) => {
        const list = getPrioridad();
        const updated = list.map(item =>
            item.metodo === metodo ? { ...item, activo: !item.activo } : item
        );
        setConfiguracion(prev => ({ ...prev, prioridad_biometrico: updated }));
    };

    const saveConfiguracion = async () => {
        try {
            setSavingConfig(true);
            setMensaje({ text: '', type: '' });
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/configuraciones-escritorio/${dispositivo.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configuracion)
            });
            const result = await response.json();
            if (result.success) {
                setMensaje({ text: 'Configuración de nodo guardada exitosamente.', type: 'success' });
                setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
            } else {
                setMensaje({ text: result.message || 'Error al guardar configuración.', type: 'error' });
            }
        } catch (error) {
            console.error("Error saving configuracion:", error);
            setMensaje({ text: 'Error de red al guardar configuración.', type: 'error' });
        } finally {
            setSavingConfig(false);
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
                ) : errorBio ? (
                    <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900">
                        <p className="text-red-600 dark:text-red-400 font-medium">Error: {errorBio}</p>
                    </div>
                ) : (() => {
                    return biometricos.length > 0 ? (
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
                            <p className="text-gray-500 dark:text-gray-400">No se detectaron lectores biométricos activos en este equipo.</p>
                        </div>
                    );
                })()}
            </div>

            {/* Configuración del Kiosco / Dispositivo */}
            {loadingConfig ? (
                <div className="text-center py-8 text-gray-500 animate-pulse">Cargando configuración local...</div>
            ) : configuracion ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Configuración Local del Nodo</h3>
                        </div>
                        <button
                            onClick={saveConfiguracion}
                            disabled={savingConfig}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-white ${savingConfig ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'}`}
                        >
                            <Save className="w-4 h-4" />
                            {savingConfig ? 'Guardando...' : 'Guardar Ajustes'}
                        </button>
                    </div>

                    {mensaje.text && (
                        <div className={`m-4 p-3 rounded-lg text-sm font-medium ${mensaje.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'}`}>
                            {mensaje.text}
                        </div>
                    )}

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Prioridad de Métodos de Autenticación */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <KeyRound className="w-4 h-4" /> Prioridad de Métodos
                            </h4>
                            <p className="text-xs text-gray-400 mb-4">Activa o desactiva los métodos de validación y define su prioridad para el reloj checador.</p>
                            <div className="space-y-2">
                                {getPrioridad().map((item, index, arr) => {
                                    const Icon = METODO_ICONS[item.metodo] || KeyRound;
                                    return (
                                        <div
                                            key={item.metodo}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.activo
                                                ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
                                                : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 opacity-60'
                                                }`}
                                        >
                                            {/* Badge nivel */}
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${item.activo ? 'bg-indigo-500' : 'bg-gray-400'
                                                }`}>{item.nivel}</div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                                    <Icon className="w-4 h-4 text-gray-400" />
                                                    {METODO_LABELS[item.metodo]}
                                                </div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Prioridad de acceso</p>
                                            </div>

                                            {/* Toggle activo */}
                                            <div className="relative inline-block w-10 flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    id={`bio-toggle-${item.metodo}`}
                                                    checked={item.activo}
                                                    onChange={() => togglePrioridad(item.metodo)}
                                                    className="sr-only peer"
                                                />
                                                <label
                                                    htmlFor={`bio-toggle-${item.metodo}`}
                                                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 cursor-pointer block"
                                                />
                                            </div>

                                            {/* Botones ↑/↓ */}
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button
                                                    onClick={() => movePrioridad(index, -1)}
                                                    disabled={index === 0}
                                                    className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                    title="Subir prioridad"
                                                >
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => movePrioridad(index, 1)}
                                                    disabled={index === arr.length - 1}
                                                    className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                    title="Bajar prioridad"
                                                >
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">Los métodos desactivados no se solicitarán. La prioridad determina el orden de verificación.</p>
                        </div>

                        {/* Modos y Sincronización */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <Laptop className="w-4 h-4" /> Comportamiento ("Kiosco")
                                </h4>
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Iniciar con Windows</span>
                                            <p className="text-xs text-gray-500">La aplicación se abre sola al prender la PC.</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" checked={configuracion.iniciar_con_windows} onChange={(e) => handleConfigChange('iniciar_con_windows', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Bloquear Cierre de App</span>
                                            <p className="text-xs text-gray-500">Pide PIN para minimizar o salir al escritorio.</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" checked={configuracion.bloquear_cierre_app} onChange={(e) => handleConfigChange('bloquear_cierre_app', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>
                                    {configuracion.bloquear_cierre_app && (
                                        <div className="pl-2 border-l-2 border-indigo-200 dark:border-indigo-800 pt-2 pb-1">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">PIN del Administrador Local</label>
                                            <input
                                                type="password"
                                                maxLength="8"
                                                placeholder="Ej. 1234"
                                                value={configuracion.pin_administrador || ''}
                                                onChange={(e) => handleConfigChange('pin_administrador', e.target.value)}
                                                className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    )}

                                    <label className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Modo Mantenimiento</span>
                                            <p className="text-xs text-gray-500">Impide que los empleados registren asistencia en este equipo.</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" checked={configuracion.es_mantenimiento || false} onChange={(e) => handleConfigChange('es_mantenimiento', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                    <Wifi className="w-4 h-4" /> Red y Sincronización
                                </h4>
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Permitir Registro Offline</span>
                                            <p className="text-xs text-gray-500">Guarda asistencias en disco duro si no hay red.</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" checked={configuracion.modo_offline_permitido} onChange={(e) => handleConfigChange('modo_offline_permitido', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>

                                    {configuracion.modo_offline_permitido && (
                                        <div className="pl-2 pt-2">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">Frecuencia de Sincronización (minutos)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={configuracion.frecuencia_sincronizacion_min || 15}
                                                onChange={(e) => handleConfigChange('frecuencia_sincronizacion_min', parseInt(e.target.value) || 15)}
                                                className="w-32 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm p-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            ) : null}

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

