import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

const API_URL = 'https://9dm7dqf9-3002.usw3.devtunnels.ms';

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
    const [tabActiva, setTabActiva] = useState('escritorio');

    // Estado para controlar el desplegable del historial
    const [historialOpen, setHistorialOpen] = useState(false);

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
    const activosList = tabActiva === 'movil'
        ? filtrarLista(movilesActivos, true)
        : filtrarLista(escritoriosActivos, false);

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
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
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Smartphone className="w-4 h-4" />
                        Móviles
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={tabActiva === 'movil' ? "Buscar por nombre, correo..." : "Buscar por nombre, IP, MAC..."}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* === COLUMNA 1: SOLICITUDES === */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    Solicitudes Pendientes
                                </h2>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${pendientesList.length > 0 ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                                    {pendientesList.length}
                                </span>
                            </div>

                            {pendientesList.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No hay solicitudes pendientes</p>
                                </div>
                            ) : (
                                pendientesList.map((solicitud) => {
                                    const IconoTipo = solicitud.tipo === 'movil' ? Smartphone : Monitor;
                                    return (
                                        <div key={solicitud.id} className="bg-white rounded-lg shadow-sm border border-orange-200 p-4 hover:shadow-md transition-shadow relative">
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full"></div>
                                            <div className="flex items-start justify-between mb-3 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-orange-50">
                                                        <IconoTipo className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 text-sm">{solicitud.nombre}</h3>
                                                        <p className="text-xs text-gray-500">{solicitud.correo}</p>
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
                                                <button onClick={() => openDetallesModal(solicitud, true)} className="flex-1 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 border border-gray-200">
                                                    Revisar Ficha
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
                                })
                            )}
                        </div>

                        {/* Historial Desplegable */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => setHistorialOpen(!historialOpen)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <h2 className="text-sm font-bold text-gray-700">Historial de Solicitudes</h2>
                                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                        {historialList.length}
                                    </span>
                                </div>
                                {historialOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>

                            {historialOpen && (
                                <div className="p-4 bg-gray-50/50 border-t border-gray-200 max-h-[400px] overflow-y-auto space-y-3">
                                    {historialList.length === 0 ? (
                                        <p className="text-center text-xs text-gray-500 py-4">No hay historial disponible.</p>
                                    ) : (
                                        historialList.map(solicitud => (
                                            <div key={solicitud.id} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded ${solicitud.estado === 'aceptado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {solicitud.estado === 'aceptado' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-800">{solicitud.nombre}</p>
                                                        <p className="text-[10px] text-gray-500">{new Date(solicitud.fecha_registro).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => openDetallesModal(solicitud, true)} className="text-xs text-blue-600 hover:underline">
                                                    Ver ficha
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* === COLUMNA 2: ACTIVOS === */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                {tabActiva === 'movil' ? 'Móviles Asignados' : 'Escritorios Activos'}
                            </h2>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                                {activosList.length}
                            </span>
                        </div>

                        {activosList.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500">No hay dispositivos activos</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activosList.map((dispositivo) => {
                                    if (tabActiva === 'movil') {
                                        return (
                                            <div key={dispositivo.id} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow relative overflow-hidden ${dispositivo.es_activo === false ? 'bg-gray-50 border-red-200 opacity-75' : 'bg-white border-green-100'}`}>
                                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${dispositivo.es_activo === false ? 'from-red-50' : 'from-green-50'} to-transparent -mr-8 -mt-8 rounded-full pointer-events-none`}></div>
                                                <div className="flex items-start justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dispositivo.es_activo === false ? 'bg-red-50' : 'bg-green-50'}`}>
                                                            <Smartphone className={`w-5 h-5 ${dispositivo.es_activo === false ? 'text-red-400' : 'text-green-600'}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-semibold text-sm ${dispositivo.es_activo === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{dispositivo.empleado_nombre}</h3>
                                                            <p className="text-xs text-gray-500">{dispositivo.empleado_correo}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {dispositivo.es_activo === false && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">Desactivado</span>}
                                                        {dispositivo.es_root && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700 border border-red-200">ROOT</span>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                                                    <div className="bg-gray-50 px-2 py-1 rounded"><span className="font-medium text-gray-500">OS:</span> {dispositivo.sistema_operativo}</div>
                                                    <div className="bg-gray-50 px-2 py-1 rounded"><span className="font-medium text-gray-500">Reg:</span> {new Date(dispositivo.fecha_registro).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetallesModal(dispositivo, false)} className="flex-1 py-1.5 text-xs bg-white text-green-700 border border-green-200 rounded hover:bg-green-50 transition-colors">Ver Ficha Técnica</button>
                                                    {dispositivo.es_activo === false ? (
                                                        <button onClick={() => handleReactivarDispositivo(dispositivo)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors">
                                                            <RefreshCw className="w-3.5 h-3.5" /> Reactivar
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
                                            <div key={dispositivo.id} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow relative overflow-hidden ${dispositivo.es_activo === false ? 'bg-gray-50 border-red-200 opacity-75' : 'bg-white border-blue-100'}`}>
                                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${dispositivo.es_activo === false ? 'from-red-50' : 'from-blue-50'} to-transparent -mr-8 -mt-8 rounded-full pointer-events-none`}></div>
                                                <div className="flex items-start justify-between mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dispositivo.es_activo === false ? 'bg-red-50' : 'bg-blue-50'}`}>
                                                            <Laptop className={`w-5 h-5 ${dispositivo.es_activo === false ? 'text-red-400' : 'text-blue-600'}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-semibold text-sm ${dispositivo.es_activo === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{dispositivo.nombre}</h3>
                                                            <p className="text-xs text-gray-500 font-mono">{dispositivo.ip}</p>
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
                                                    <div className="flex justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                        <span className="font-medium text-gray-500">MAC:</span>
                                                        <span className="font-mono text-[10px]">{dispositivo.mac}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                        <span className="font-medium text-gray-500">OS:</span>
                                                        <span>{dispositivo.sistema_operativo}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetallesModal(dispositivo, false)} className="flex-1 py-1.5 text-xs bg-white text-blue-700 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                                                        Ver Ficha Técnica
                                                    </button>
                                                    {dispositivo.es_activo === false ? (
                                                        <button onClick={() => handleReactivarDispositivo(dispositivo)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors">
                                                            <RefreshCw className="w-3.5 h-3.5" /> Reactivar
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
                </div>
            )}

            {/* MODAL DETALLES ACTUALIZADO */}
            {modalDetalles && dispositivoDetalles && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Ficha Técnica del Dispositivo
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">ID Ref: {dispositivoDetalles.id}</p>
                            </div>
                            <button onClick={() => setModalDetalles(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="flex items-start gap-5">
                                <div className={`p-5 rounded-2xl ${dispositivoDetalles.tipo === 'movil' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                                    {dispositivoDetalles.tipo === 'movil' ? (
                                        <Smartphone className="w-10 h-10 text-purple-600" />
                                    ) : (
                                        <Monitor className="w-10 h-10 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900">{dispositivoDetalles.nombre}</h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${ESTADOS[dispositivoDetalles.estado]?.color}`}>
                                            {ESTADOS[dispositivoDetalles.estado]?.icon && React.createElement(ESTADOS[dispositivoDetalles.estado].icon, { className: "w-3 h-3" })}
                                            {ESTADOS[dispositivoDetalles.estado]?.label || dispositivoDetalles.estado}
                                        </span>
                                        <span className="text-sm text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded border border-gray-200">
                                            {dispositivoDetalles.tipo}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Conectividad</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Wifi className="w-4 h-4" /></div>
                                                <span className="text-sm font-medium text-gray-700">Dirección IP</span>
                                            </div>
                                            <span className="text-sm font-mono text-gray-900">{dispositivoDetalles.ip || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Cpu className="w-4 h-4" /></div>
                                                <span className="text-sm font-medium text-gray-700">Dirección MAC</span>
                                            </div>
                                            <span className="text-sm font-mono text-gray-900">{dispositivoDetalles.mac || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Sistema Operativo</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Server className="w-4 h-4" /></div>
                                                <span className="text-sm font-medium text-gray-700">OS</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">{dispositivoDetalles.sistema_operativo || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* SECCIÓN BIOMÉTRICOS AÑADIDA */}
                                    {dispositivoDetalles.tipo === 'escritorio' && (
                                        <>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 pt-2">Periféricos y Biométricos</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-md shadow-sm text-purple-500"><Fingerprint className="w-4 h-4" /></div>
                                                        <span className="text-sm font-medium text-gray-700">Lectores Conectados</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-purple-700 bg-white px-3 py-0.5 rounded border border-purple-200 shadow-sm">
                                                        {dispositivoDetalles.biometricos_count || 0}
                                                    </span>
                                                </div>

                                                {/* Si el backend envía el detalle de los biométricos (array), los listamos */}
                                                {dispositivoDetalles.biometricos && dispositivoDetalles.biometricos.length > 0 && (
                                                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-2 space-y-2">
                                                        {dispositivoDetalles.biometricos.map((bio, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-gray-200">
                                                                <span className="font-medium text-gray-700">{bio.nombre}</span>
                                                                <span className="text-gray-500">{bio.tipo}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Información Adicional</h4>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {dispositivoDetalles.descripcion && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 uppercase mb-1">Descripción</p>
                                            <p className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-100">{dispositivoDetalles.descripcion}</p>
                                        </div>
                                    )}
                                    {dispositivoDetalles.correo && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" /> {dispositivoDetalles.correo}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <button onClick={() => setModalDetalles(false)} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-all font-medium shadow-sm">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE ACEPTAR/RECHAZAR */}
            {modalOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {modalAction === 'aceptar' ? 'Aceptar Solicitud' : 'Rechazar Solicitud'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {mensaje && (
                                <div className={`p-4 rounded-lg flex items-start gap-3 ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{mensaje.texto}</span>
                                </div>
                            )}
                            {selectedSolicitud && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">{selectedSolicitud.nombre}</h3>
                                    <p className="text-sm text-gray-600 capitalize">Tipo: {selectedSolicitud.tipo}</p>
                                    <p className="text-xs text-gray-500 mt-1">{selectedSolicitud.correo}</p>
                                </div>
                            )}
                            {modalAction === 'aceptar' && selectedSolicitud?.tipo === 'movil' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Asignar a empleado * {empleadoSeleccionado && <span className="text-green-600 text-xs ml-2 font-normal">(Reconocido por correo)</span>}
                                    </label>
                                    <select
                                        value={empleadoSeleccionado}
                                        onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${empleadoSeleccionado ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones *</label>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="4"
                                        placeholder="Explica el motivo del rechazo..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
                            <button
                                onClick={modalAction === 'aceptar' ? handleAceptar : handleRechazar}
                                disabled={procesando}
                                className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${modalAction === 'aceptar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {procesando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (modalAction === 'aceptar' ? 'Aceptar' : 'Rechazar')}
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