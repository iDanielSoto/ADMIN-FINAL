import { useState, useEffect } from 'react';
import {
    FiActivity, FiFilter, FiRefreshCw, FiClock, FiUser, FiUserCheck,
    FiShield, FiKey, FiCalendar, FiAlertCircle, FiUsers, FiGrid,
    FiMonitor, FiFileText, FiSettings, FiChevronDown, FiChevronRight,
    FiList, FiArrowLeft, FiArrowRight, FiSearch
} from 'react-icons/fi';

const API_URL = 'https://9dm7dqf9-3002.usw3.devtunnels.ms';

// --- CONFIGURACIÓN DE CONSTANTES (Igual que antes) ---
const CATEGORIAS = {
    sistema: { label: 'Sistema', icon: FiSettings, color: 'text-gray-700 bg-gray-100', border: 'border-gray-200' },
    usuario: { label: 'Usuarios', icon: FiUser, color: 'text-blue-700 bg-blue-100', border: 'border-blue-200' },
    rol: { label: 'Roles', icon: FiShield, color: 'text-purple-700 bg-purple-100', border: 'border-purple-200' },
    autenticacion: { label: 'Autenticación', icon: FiKey, color: 'text-indigo-700 bg-indigo-100', border: 'border-indigo-200' },
    asistencia: { label: 'Asistencias', icon: FiUserCheck, color: 'text-green-700 bg-green-100', border: 'border-green-200' },
    incidencia: { label: 'Incidencias', icon: FiAlertCircle, color: 'text-yellow-700 bg-yellow-100', border: 'border-yellow-200' },
    empleado: { label: 'Empleados', icon: FiUsers, color: 'text-teal-700 bg-teal-100', border: 'border-teal-200' },
    departamento: { label: 'Departamentos', icon: FiGrid, color: 'text-cyan-700 bg-cyan-100', border: 'border-cyan-200' },
    horario: { label: 'Horarios', icon: FiCalendar, color: 'text-orange-700 bg-orange-100', border: 'border-orange-200' },
    dispositivo: { label: 'Dispositivos', icon: FiMonitor, color: 'text-pink-700 bg-pink-100', border: 'border-pink-200' },
    solicitud: { label: 'Solicitudes', icon: FiFileText, color: 'text-rose-700 bg-rose-100', border: 'border-rose-200' },
    credencial: { label: 'Credenciales', icon: FiKey, color: 'text-amber-700 bg-amber-100', border: 'border-amber-200' }
};

const CATEGORIA_DEFAULT = { label: 'Otro', icon: FiActivity, color: 'text-gray-600 bg-gray-50', border: 'border-gray-200' };

const PRIORIDADES = {
    critica: { label: 'Crítica', color: 'text-red-700 bg-red-50 border-red-200 ring-red-600/20' },
    alta: { label: 'Alta', color: 'text-orange-700 bg-orange-50 border-orange-200 ring-orange-600/20' },
    media: { label: 'Media', color: 'text-yellow-700 bg-yellow-50 border-yellow-200 ring-yellow-600/20' },
    baja: { label: 'Baja', color: 'text-green-700 bg-green-50 border-green-200 ring-green-600/20' }
};

const Registros = () => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ por_tipo: [], por_prioridad: [] });

    // Paginación
    const [pagina, setPagina] = useState(1);
    const ITEMS_POR_PAGINA = 50;

    // Filtros
    const [filtros, setFiltros] = useState({
        tipo_evento: '',
        prioridad: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    const [vistaAgrupada, setVistaAgrupada] = useState(false); // Cambiado default a false (Tabla)
    const [categoriasExpandidas, setCategoriasExpandidas] = useState({});

    useEffect(() => {
        fetchEventos();
        fetchStats();
    }, [pagina]); // Recargar cuando cambia la página

    const fetchEventos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const params = new URLSearchParams();
            if (filtros.tipo_evento) params.append('tipo_evento', filtros.tipo_evento);
            if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
            if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
            if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);

            // Paginación para el backend
            const offset = (pagina - 1) * ITEMS_POR_PAGINA;
            params.append('limit', ITEMS_POR_PAGINA);
            params.append('offset', offset);

            const response = await fetch(`${API_URL}/api/eventos?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setEventos(data.data);
            }
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/eventos/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setStats(data.data);
        } catch (error) { console.error(error); }
    };

    const handleFiltrar = () => {
        setPagina(1); // Reset a primera página al filtrar
        fetchEventos();
        fetchStats();
    };

    const handleLimpiar = () => {
        setFiltros({ tipo_evento: '', prioridad: '', fecha_inicio: '', fecha_fin: '' });
        setPagina(1);
        // Usamos setTimeout para asegurar que el estado se actualice antes de llamar a fetch
        setTimeout(() => { fetchEventos(); fetchStats(); }, 0);
    };

    const toggleCategoria = (tipo) => {
        setCategoriasExpandidas(prev => ({ ...prev, [tipo]: !prev[tipo] }));
    };

    // Agrupar eventos para vista agrupada
    const eventosAgrupados = eventos.reduce((acc, evento) => {
        const tipo = evento.tipo_evento || 'sistema';
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(evento);
        return acc;
    }, {});

    const getCategoriaConfig = (tipo) => CATEGORIAS[tipo] || CATEGORIA_DEFAULT;

    // --- RENDERIZADO ---

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">

            {/* Encabezado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bitácora del Sistema</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitoreo de actividad, seguridad y operaciones.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setVistaAgrupada(false)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!vistaAgrupada ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2"><FiList /> Tabla</div>
                    </button>
                    <button
                        onClick={() => setVistaAgrupada(true)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${vistaAgrupada ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2"><FiGrid /> Agrupada</div>
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <button onClick={fetchEventos} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Actualizar">
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-medium text-sm">
                    <FiSearch className="w-4 h-4" /> Búsqueda Avanzada
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <select
                        value={filtros.tipo_evento}
                        onChange={(e) => setFiltros({ ...filtros, tipo_evento: e.target.value })}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    >
                        <option value="">Todas las Categorías</option>
                        {Object.entries(CATEGORIAS).map(([key, conf]) => <option key={key} value={key}>{conf.label}</option>)}
                    </select>

                    <select
                        value={filtros.prioridad}
                        onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value })}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    >
                        <option value="">Cualquier Prioridad</option>
                        {Object.entries(PRIORIDADES).map(([key, conf]) => <option key={key} value={key}>{conf.label}</option>)}
                    </select>

                    <input
                        type="date"
                        value={filtros.fecha_inicio}
                        onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <input
                        type="date"
                        value={filtros.fecha_fin}
                        onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />

                    <div className="flex gap-2">
                        <button onClick={handleFiltrar} className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                            Filtrar
                        </button>
                        <button onClick={handleLimpiar} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            {loading && eventos.length === 0 ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : eventos.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiActivity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Sin resultados</h3>
                    <p className="text-gray-500">No se encontraron eventos con los filtros actuales.</p>
                </div>
            ) : (
                <>
                    {vistaAgrupada ? (
                        /* VISTA AGRUPADA (Acordeón mejorado) */
                        <div className="space-y-4">
                            {Object.entries(eventosAgrupados).map(([tipo, listaEventos]) => {
                                const config = getCategoriaConfig(tipo);
                                const Icon = config.icon;
                                const expandido = categoriasExpandidas[tipo];

                                return (
                                    <div key={tipo} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <button
                                            onClick={() => toggleCategoria(tipo)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-lg ${config.color} ${config.border} border`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-semibold text-gray-900">{config.label}</h3>
                                                    <p className="text-xs text-gray-500">{listaEventos.length} registros</p>
                                                </div>
                                            </div>
                                            {expandido ? <FiChevronDown className="text-gray-400" /> : <FiChevronRight className="text-gray-400" />}
                                        </button>

                                        {expandido && (
                                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                                                {listaEventos.map(evento => (
                                                    <div key={evento.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <EventoRowContent evento={evento} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* VISTA DE TABLA (Nueva implementación) */
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {eventos.map((evento) => {
                                            const catConfig = getCategoriaConfig(evento.tipo_evento);
                                            const priConfig = PRIORIDADES[evento.prioridad] || PRIORIDADES.media;
                                            const Icon = catConfig.icon;

                                            return (
                                                <tr key={evento.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-900">{evento.titulo}</span>
                                                            <span className="text-xs text-gray-500 truncate max-w-xs">{evento.descripcion}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`w-4 h-4 ${catConfig.color.split(' ')[0]}`} />
                                                            <span className="text-sm text-gray-700">{catConfig.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {evento.empleado_nombre ? (
                                                                <>
                                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                                                                        {evento.empleado_nombre.charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm text-gray-600">{evento.empleado_nombre}</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Sistema</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priConfig.color}`}>
                                                            {priConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                        <div className="flex flex-col items-end">
                                                            <span>{new Date(evento.fecha_registro).toLocaleDateString()}</span>
                                                            <span className="text-xs text-gray-400">{new Date(evento.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Paginación Simple */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                            Mostrando página <span className="font-medium text-gray-900">{pagina}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagina(prev => Math.max(prev - 1, 1))}
                                disabled={pagina === 1 || loading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FiArrowLeft className="w-4 h-4" /> Anterior
                            </button>
                            <button
                                onClick={() => setPagina(prev => prev + 1)}
                                disabled={eventos.length < ITEMS_POR_PAGINA || loading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Siguiente <FiArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Componente auxiliar para el contenido de una fila (reusado en acordeón)
const EventoRowContent = ({ evento }) => {
    const priConfig = PRIORIDADES[evento.prioridad] || PRIORIDADES.media;

    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{evento.titulo}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${priConfig.color}`}>
                        {priConfig.label}
                    </span>
                </div>
                <p className="text-sm text-gray-600">{evento.descripcion}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {new Date(evento.fecha_registro).toLocaleString()}</span>
                    {evento.empleado_nombre && (
                        <span className="flex items-center gap-1"><FiUser className="w-3 h-3" /> {evento.empleado_nombre}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Registros;