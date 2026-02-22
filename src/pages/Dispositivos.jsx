import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import ConfirmBox from '../components/ConfirmBox';
import { useSolicitudesSSE } from '../hooks/useSolicitudesSSE';
import {
    Monitor,
    Smartphone,
    Search,
    X,
    AlertCircle,
    Check,
    XCircle,
    Clock,
    Wifi,
    Cpu,
    Calendar,
    Mail,
    Shield,
    FileText,
    Server,
    Info,
    ChevronDown,
    ChevronUp,
    Fingerprint,
    Laptop,
    Trash2,
    RefreshCw
} from 'lucide-react';

import EscritorioProfile from '../components/EscritorioProfile';
import DynamicLoader from '../components/common/DynamicLoader';

import { API_CONFIG } from '../config/Apiconfig';
const API_URL = API_CONFIG.BASE_URL;

const ESTADOS = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    aceptado: { label: 'Aceptado', color: 'bg-green-100 text-green-800', icon: Check },
    rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const Dispositivos = () => {
    // Estado para Solicitudes
    const [solicitudes, setSolicitudes] = useState([]);

    // Estados para Dispositivos Activos
    const [movilesActivos, setMovilesActivos] = useState([]);
    const [escritoriosActivos, setEscritoriosActivos] = useState([]);

    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('activo');
    const [tabActiva, setTabActiva] = useState('escritorio');

    // Estado para controlar el desplegable del historial y solicitudes
    const [historialOpen, setHistorialOpen] = useState(false);
    const [pendientesOpen, setPendientesOpen] = useState(false); // Por defecto cerrado para priorizar los activos

    // Modal de aceptar/rechazar
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('');
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    // Modal de detalles
    const [modalDetalles, setModalDetalles] = useState(false);
    const [dispositivoDetalles, setDispositivoDetalles] = useState(null);

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [alertMsg, setAlertMsg] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const params = new URLSearchParams();
            params.append('tipo', tabActiva);

            const promises = [
                fetch(`${API_URL}/api/solicitudes?${params}`, { headers }),
                fetch(`${API_URL}/api/empleados`, { headers })
            ];

            if (tabActiva === 'movil') {
                promises.push(fetch(`${API_URL}/api/movil`, { headers }));
            } else if (tabActiva === 'escritorio') {
                promises.push(fetch(`${API_URL}/api/escritorio`, { headers }));
            }

            const responses = await Promise.all(promises);

            const solicitudesData = await responses[0].json();
            const empleadosData = await responses[1].json();

            let activosData = { success: false, data: [] };
            if (responses[2]) {
                activosData = await responses[2].json();
            }

            if (solicitudesData.success) setSolicitudes(solicitudesData.data);
            if (empleadosData.success) setEmpleados(empleadosData.data.filter(emp => emp.id));

            if (activosData.success) {
                if (tabActiva === 'movil') {
                    setMovilesActivos(activosData.data);
                } else {
                    setEscritoriosActivos(activosData.data);
                }
            }

        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [tabActiva]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Notificaciones en tiempo real via SSE (reemplaza polling)
    useSolicitudesSSE({
        onNuevaSolicitud: () => fetchData(true),
        onSolicitudActualizada: () => fetchData(true)
    });

    // --- Lógica de Enrutado (Deep Linking) ---
    const [searchParams, setSearchParams] = useSearchParams();
    const solicitudIdParam = searchParams.get('solicitudId');
    const tipoParam = searchParams.get('tipo');

    useEffect(() => {
        if (solicitudIdParam && tipoParam) {
            // Cambiar de tab si es necesario
            if (tipoParam !== tabActiva) {
                setTabActiva(tipoParam);
                return; // Esperar a que cambie el tab y se recarguen los datos
            }

            // Buscar la solicitud en la lista cargada
            if (!loading && solicitudes.length > 0) {
                const solicitud = solicitudes.find(s => s.id.toString() === solicitudIdParam);
                if (solicitud) {
                    // Abrir modal de detalles automáticamente
                    openDetallesModal(solicitud, true);
                    // Limpiar URL para no reabrir al recargar
                    setSearchParams({});
                }
            }
        }
    }, [solicitudIdParam, tipoParam, tabActiva, loading, solicitudes, setSearchParams]);

    // --- Lógica Modales ---
    const openAceptarModal = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setModalAction('aceptar');
        setObservaciones('');
        setModalOpen(true);
        setMensaje(null);

        const empleadoCoincidente = empleados.find(emp =>
            emp.correo && solicitud.correo &&
            emp.correo.toLowerCase().trim() === solicitud.correo.toLowerCase().trim()
        );

        if (empleadoCoincidente) {
            setEmpleadoSeleccionado(empleadoCoincidente.id);
        } else {
            setEmpleadoSeleccionado('');
        }
    };

    const openRechazarModal = (solicitud) => {
        setSelectedSolicitud(solicitud);
        setModalAction('rechazar');
        setEmpleadoSeleccionado('');
        setObservaciones('');
        setModalOpen(true);
        setMensaje(null);
    };

    const openDetallesModal = (item, esSolicitud = true) => {
        let detalles = { ...item };

        if (!esSolicitud) {
            detalles.tipo = tabActiva;
            detalles.estado = 'aceptado';
            if (tabActiva === 'escritorio') {
                detalles.correo = 'Dispositivo de Planta';
            } else {
                detalles.nombre = item.empleado_nombre;
                detalles.correo = item.empleado_correo;
            }
        }

        setDispositivoDetalles(detalles);
        setModalDetalles(true);
    };

    const handleAceptar = async () => {
        if (selectedSolicitud.tipo === 'movil' && !empleadoSeleccionado) {
            setMensaje({ tipo: 'error', texto: 'Debes seleccionar un empleado para dispositivos móviles' });
            return;
        }

        try {
            setProcesando(true);
            const token = localStorage.getItem('auth_token');

            const body = selectedSolicitud.tipo === 'movil'
                ? { empleado_id: empleadoSeleccionado }
                : {};

            const response = await fetch(`${API_URL}/api/solicitudes/${selectedSolicitud.id}/aceptar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.success) {
                setModalOpen(false);
                fetchData();
                setMensaje(null);
            } else {
                setMensaje({ tipo: 'error', texto: result.message || 'Error al aceptar solicitud' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje({ tipo: 'error', texto: 'Error al procesar la solicitud' });
        } finally {
            setProcesando(false);
        }
    };

    const handleRechazar = async () => {
        if (!observaciones.trim()) {
            setMensaje({ tipo: 'error', texto: 'Debes proporcionar observaciones para rechazar' });
            return;
        }

        try {
            setProcesando(true);
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`${API_URL}/api/solicitudes/${selectedSolicitud.id}/rechazar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ observaciones })
            });

            const result = await response.json();

            if (result.success) {
                setModalOpen(false);
                fetchData();
                setMensaje(null);
            } else {
                setMensaje({ tipo: 'error', texto: result.message || 'Error al rechazar solicitud' });
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje({ tipo: 'error', texto: 'Error al procesar la solicitud' });
        } finally {
            setProcesando(false);
        }
    };

    // --- Filtros ---
    const filtrarLista = (lista, usarCamposControllerMovil = false) => {
        return lista.filter(item => {
            if (!busqueda) return true;
            const searchLower = busqueda.toLowerCase();

            const nombre = usarCamposControllerMovil ? item.empleado_nombre : item.nombre;
            const correo = usarCamposControllerMovil ? item.empleado_correo : (item.correo || '');
            const ip = item.ip || '';
            const mac = item.mac || '';

            return (
                nombre?.toLowerCase().includes(searchLower) ||
                correo?.toLowerCase().includes(searchLower) ||
                item.sistema_operativo?.toLowerCase().includes(searchLower) ||
                ip.includes(searchLower) ||
                mac.toLowerCase().includes(searchLower)
            );
        });
    };

    const handleDesactivarDispositivo = (dispositivo) => {
        const tipo = tabActiva;
        setConfirmAction({
            message: '¿Desactivar este dispositivo?',
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/${tipo}/${dispositivo.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) fetchData();
                    else setAlertMsg(result.message || 'Error al desactivar');
                } catch (error) { console.error(error); }
            }
        });
    };

    const handleReactivarDispositivo = (dispositivo) => {
        const tipo = tabActiva;
        setConfirmAction({
            message: '¿Reactivar este dispositivo?',
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/${tipo}/${dispositivo.id}/reactivar`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) fetchData();
                    else setAlertMsg(result.message || 'Error al reactivar');
                } catch (error) { console.error(error); }
            }
        });
    };

    const solicitudesFiltradas = filtrarLista(solicitudes);
    const pendientesList = solicitudesFiltradas.filter(s => s.estado === 'pendiente');
    const historialList = solicitudesFiltradas.filter(s => s.estado !== 'pendiente');

    let activosList = tabActiva === 'movil'
        ? filtrarLista(movilesActivos, true)
        : filtrarLista(escritoriosActivos, false);

    // Aplicar filtro de estado
    if (filtroEstado === 'activo') {
        activosList = activosList.filter(d => d.es_activo !== false);
    } else if (filtroEstado === 'inactivo') {
        activosList = activosList.filter(d => d.es_activo === false);
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    <button
                        onClick={() => setTabActiva('escritorio')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${tabActiva === 'escritorio'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Monitor className="w-4 h-4" />
                        Escritorio
                    </button>
                    <button
                        onClick={() => setTabActiva('movil')}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${tabActiva === 'movil'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <Smartphone className="w-4 h-4" />
                        Móviles
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={tabActiva === 'movil' ? "Buscar por nombre, correo..." : "Buscar por nombre, IP, MAC..."}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <DynamicLoader text="Cargando dispositivos..." />
            ) : (
                <div className="space-y-8">

                    {/* === SECCIÓN PRINCIPAL: LISTADO DE DISPOSITIVOS === */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                {tabActiva === 'movil' ? 'Móviles Asignados' : 'Escritorios Activos'}
                            </h2>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-bold">
                                {activosList.length}
                            </span>
                        </div>

                        {activosList.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500">No hay dispositivos activos</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {activosList.map((dispositivo) => {
                                    if (tabActiva === 'movil') {
                                        return (
                                            <div key={dispositivo.id} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow relative overflow-hidden ${dispositivo.es_activo === false ? 'bg-gray-50 dark:bg-gray-900 border-red-200 dark:border-red-900/50 opacity-75' : 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900/50'}`}>
                                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${dispositivo.es_activo === false ? 'from-red-50' : 'from-green-50'} to-transparent -mr-8 -mt-8 rounded-full pointer-events-none`}></div>
                                                <div className="flex items-start justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dispositivo.es_activo === false ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                                                            <Smartphone className={`w-5 h-5 ${dispositivo.es_activo === false ? 'text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-semibold text-sm ${dispositivo.es_activo === false ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{dispositivo.empleado_nombre}</h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{dispositivo.empleado_correo}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {dispositivo.es_activo === false && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">Desactivado</span>}
                                                        {dispositivo.es_root && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">ROOT</span>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded"><span className="font-medium text-gray-500 dark:text-gray-300">OS:</span> {dispositivo.sistema_operativo}</div>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded"><span className="font-medium text-gray-500 dark:text-gray-300">Reg:</span> {new Date(dispositivo.fecha_registro).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetallesModal(dispositivo, false)} className="flex-1 py-1.5 text-xs bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">Ver Ficha</button>
                                                    {dispositivo.es_activo === false ? (
                                                        <button onClick={() => handleReactivarDispositivo(dispositivo)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors">
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleDesactivarDispositivo(dispositivo)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors" title="Desactivar">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={dispositivo.id} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow relative overflow-hidden ${dispositivo.es_activo === false ? 'bg-gray-50 dark:bg-gray-900 border-red-200 dark:border-red-900/50 opacity-75' : 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/50'}`}>
                                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${dispositivo.es_activo === false ? 'from-red-50' : 'from-blue-50'} to-transparent -mr-8 -mt-8 rounded-full pointer-events-none`}></div>
                                                <div className="flex items-start justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dispositivo.es_activo === false ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                                            <Laptop className={`w-5 h-5 ${dispositivo.es_activo === false ? 'text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-semibold text-sm ${dispositivo.es_activo === false ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{dispositivo.nombre}</h3>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">{dispositivo.ip}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {dispositivo.es_activo === false && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">Desactivado</span>}
                                                        {parseInt(dispositivo.biometricos_count) > 0 && (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200" title="Biométricos conectados">
                                                                <Fingerprint className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">{dispositivo.biometricos_count}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                                        <span className="font-medium text-gray-500 dark:text-gray-300">MAC:</span>
                                                        <span className="font-mono text-[10px] break-all">{dispositivo.mac}</span>
                                                    </div>
                                                    <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                                        <span className="font-medium text-gray-500 dark:text-gray-300">OS:</span>
                                                        <span>{dispositivo.sistema_operativo}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetallesModal(dispositivo, false)} className="flex-1 py-1.5 text-xs bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                        Ver Ficha
                                                    </button>
                                                    {dispositivo.es_activo === false ? (
                                                        <button onClick={() => handleReactivarDispositivo(dispositivo)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors">
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleDesactivarDispositivo(dispositivo)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors" title="Desactivar">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>

                    {/* === SECCIÓN SUPERIOR: GESTIÓN DE SOLICITUDES === */}
                    <div className="space-y-4">

                        {/* 1. Solicitudes Pendientes (Colapsible) */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-900/50 overflow-hidden">
                            <button
                                onClick={() => setPendientesOpen(!pendientesOpen)}
                                className="w-full flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Solicitudes Pendientes</h2>
                                    {pendientesList.length > 0 && (
                                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">
                                            {pendientesList.length}
                                        </span>
                                    )}
                                </div>
                                {pendientesOpen ? <ChevronUp className="w-5 h-5 text-orange-400" /> : <ChevronDown className="w-5 h-5 text-orange-400" />}
                            </button>

                            {pendientesOpen && (
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-orange-100 dark:border-orange-900/30">
                                    {pendientesList.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-gray-500">No hay solicitudes pendientes</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendientesList.map((solicitud) => {
                                                const IconoTipo = solicitud.tipo === 'movil' ? Smartphone : Monitor;
                                                return (
                                                    <div key={solicitud.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-900/50 p-4 hover:shadow-md transition-shadow relative">
                                                        <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        <div className="flex items-start justify-between mb-3 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                                                    <IconoTipo className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{solicitud.nombre}</h3>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{solicitud.correo}</p>
                                                                </div>
                                                            </div>
                                                            {/* Badge de Biométricos en Solicitud */}
                                                            {(solicitud.biometricos_count > 0) && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 absolute top-4 right-8" title="Incluye biométricos">
                                                                    <Fingerprint className="w-3 h-3" />
                                                                    <span className="text-[10px] font-bold">{solicitud.biometricos_count}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => openDetallesModal(solicitud, true)} className="flex-1 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600">
                                                                Revisar
                                                            </button>
                                                            <button onClick={() => openAceptarModal(solicitud)} className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-200 transition-colors">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => openRechazarModal(solicitud)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Historial de Solicitudes (Colapsible) */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setHistorialOpen(!historialOpen)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Historial de Solicitudes</h2>
                                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                        {historialList.length}
                                    </span>
                                </div>
                                {historialOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>

                            {historialOpen && (
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 max-h-[400px] overflow-y-auto">
                                    {historialList.length === 0 ? (
                                        <p className="text-center text-xs text-gray-500 py-4">No hay historial disponible.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {historialList.map(solicitud => (
                                                <div key={solicitud.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded ${solicitud.estado === 'aceptado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {solicitud.estado === 'aceptado' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{solicitud.nombre}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(solicitud.fecha_registro).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => openDetallesModal(solicitud, true)} className="text-xs text-blue-600 hover:underline">
                                                        Ver ficha
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLES ACTUALIZADO */}
            {modalDetalles && dispositivoDetalles && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Ficha Técnica del Dispositivo
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID Ref: {dispositivoDetalles.id}</p>
                            </div>
                            <button onClick={() => setModalDetalles(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* FICHA TÉCNICA - RENDERIZADO CONDICIONAL */}
                            {dispositivoDetalles.tipo === 'escritorio' ? (
                                <EscritorioProfile dispositivo={dispositivoDetalles} />
                            ) : (
                                <>
                                    <div className="flex items-start gap-5">
                                        <div className={`p-5 rounded-2xl ${dispositivoDetalles.tipo === 'movil' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                            <Smartphone className={`w-10 h-10 ${dispositivoDetalles.tipo === 'movil' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dispositivoDetalles.nombre}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${ESTADOS[dispositivoDetalles.estado]?.color}`}>
                                                    {ESTADOS[dispositivoDetalles.estado]?.icon && React.createElement(ESTADOS[dispositivoDetalles.estado].icon, { className: "w-3 h-3" })}
                                                    {ESTADOS[dispositivoDetalles.estado]?.label || dispositivoDetalles.estado}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                                    {dispositivoDetalles.tipo}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Conectividad</h4>
                                            <div className="space-y-3">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-400"><Wifi className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección IP</span>
                                                    </div>
                                                    <span className="block text-sm font-mono text-gray-900 dark:text-white break-all whitespace-pre-wrap pl-11">{dispositivoDetalles.ip || 'N/A'}</span>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-400"><Cpu className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección MAC</span>
                                                    </div>
                                                    <span className="block text-sm font-mono text-gray-900 dark:text-white break-all whitespace-pre-wrap pl-11">{dispositivoDetalles.mac || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2">Sistema Operativo</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 dark:text-gray-400"><Server className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">OS</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{dispositivoDetalles.sistema_operativo || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">Información Adicional</h4>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            {dispositivoDetalles.descripcion && (
                                                <div className="mb-3">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Descripción</p>
                                                    <p className="text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-700 p-3 rounded border border-gray-100 dark:border-gray-600">{dispositivoDetalles.descripcion}</p>
                                                </div>
                                            )}
                                            {dispositivoDetalles.correo && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Mail className="w-4 h-4" /> {dispositivoDetalles.correo}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 sticky bottom-0">
                            <button onClick={() => setModalDetalles(false)} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all font-medium shadow-sm">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE ACEPTAR/RECHAZAR */}
            {modalOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {modalAction === 'aceptar' ? 'Aceptar Solicitud' : 'Rechazar Solicitud'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {mensaje && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50' : 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50'}`}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{mensaje.texto}</span>
                                </div>
                            )}
                            {selectedSolicitud && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">{selectedSolicitud.nombre}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">Tipo: {selectedSolicitud.tipo}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedSolicitud.correo}</p>
                                </div>
                            )}
                            {modalAction === 'aceptar' && selectedSolicitud?.tipo === 'movil' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Asignar a empleado * {empleadoSeleccionado && <span className="text-green-600 dark:text-green-400 text-xs ml-2 font-normal">(Reconocido por correo)</span>}
                                    </label>
                                    <select
                                        value={empleadoSeleccionado}
                                        onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${empleadoSeleccionado ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                                    >
                                        <option value="">Seleccionar empleado</option>
                                        {empleados.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombre} {emp.rfc ? `(${emp.rfc})` : ''} - {emp.correo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {modalAction === 'rechazar' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones *</label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="4"
                                        placeholder="Explica el motivo del rechazo..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={modalAction === 'aceptar' ? handleAceptar : handleRechazar}
                                disabled={procesando}
                                className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${modalAction === 'aceptar' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'bg-red-600 hover:bg-red-700 shadow-md'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {procesando ? <DynamicLoader size="tiny" layout="row" /> : (modalAction === 'aceptar' ? 'Aceptar' : 'Rechazar')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {alertMsg && <ConfirmBox message={alertMsg} onConfirm={() => setAlertMsg(null)} />}
            {confirmAction && <ConfirmBox message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
        </div>
    );
};

export default Dispositivos;