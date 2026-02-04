import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUsers,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiCalendar
} from 'react-icons/fi';
import { API_CONFIG } from '../config/Apiconfig';
import Pagination from '../components/Pagination';
import { useRealTime } from '../hooks/useRealTime';

const API_URL = API_CONFIG.BASE_URL;

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmpleados: 0,
        asistenciasHoy: 0,
        retardos: 0,
        puntuales: 0
    });
    const [ultimasAsistencias, setUltimasAsistencias] = useState([]);
    const [paginaAsistencias, setPaginaAsistencias] = useState(1);
    const asistenciasPorPagina = 5;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Actualización en tiempo real
    useRealTime({
        'nueva-asistencia': () => {
            fetchDashboardData();
        }
    });

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fecha de hoy para filtrar asistencias (formato local YYYY-MM-DD)
            const hoy = new Date();
            const fechaInicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

            // Cargar empleados y asistencias en paralelo
            const [empleadosRes, asistenciasRes] = await Promise.all([
                fetch(`${API_URL}/api/empleados`, { headers }),
                fetch(`${API_URL}/api/asistencias?fecha_inicio=${fechaInicio}&limit=100`, { headers })
            ]);

            const empleadosData = await empleadosRes.json();
            const asistenciasData = await asistenciasRes.json();

            // Contar estadísticas
            const totalEmpleados = empleadosData.success ? empleadosData.data.length : 0;
            const asistenciasHoy = asistenciasData.success ? asistenciasData.data : [];

            // Contar empleados únicos que registraron asistencia (no registros duplicados)
            const empleadosUnicos = new Set(asistenciasHoy.map(a => a.empleado_id || a.empleado_usuario)).size;

            // Tomar solo la primera entrada de cada empleado (deduplicar)
            const entradasMap = new Map();
            asistenciasHoy
                .filter(a => a.tipo === 'entrada')
                .forEach(a => {
                    const key = a.empleado_id || a.empleado_usuario;
                    if (!entradasMap.has(key)) {
                        entradasMap.set(key, a);
                    }
                });
            const entradasUnicas = Array.from(entradasMap.values());
            const puntuales = entradasUnicas.filter(a => a.estado === 'puntual').length;
            const retardos = entradasUnicas.filter(a => a.estado === 'retardo').length;

            setStats({
                totalEmpleados,
                asistenciasHoy: empleadosUnicos,
                puntuales,
                retardos
            });

            setUltimasAsistencias(asistenciasHoy);

        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formatear hora
    const formatHora = (fecha) => {
        return new Date(fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calcular porcentaje de asistencia
    const porcentajeAsistencia =
        stats.totalEmpleados > 0 && stats.asistenciasHoy > 0
            ? Math.round((stats.asistenciasHoy / stats.totalEmpleados) * 100)
            : 0;

    // Calcular porcentaje de puntualidad
    const porcentajePuntualidad = stats.asistenciasHoy > 0
        ? Math.round((stats.puntuales / stats.asistenciasHoy) * 100)
        : 0;

    // Paginación de asistencias
    const totalPaginasAsistencias = Math.ceil(ultimasAsistencias.length / asistenciasPorPagina);
    const asistenciasPaginadas = ultimasAsistencias.slice(
        (paginaAsistencias - 1) * asistenciasPorPagina,
        paginaAsistencias * asistenciasPorPagina
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Cargando datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="select-none space-y-6 s">
            {/* Fecha actual */}
            <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </p>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Empleados */}
                <div
                    className="card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/empleados')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Empleados</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalEmpleados}</p>
                            <p className="text-xs text-gray-500 mt-2">Empleados activos</p>
                        </div>
                        <div className="p-4 bg-blue-100 rounded-full">
                            <FiUsers className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Asistencias Hoy */}
                <div className="card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/reportes')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Asistencias Hoy</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.asistenciasHoy}</p>
                            <p className="text-xs text-green-600 mt-2">
                                {porcentajeAsistencia}% del total
                            </p>
                        </div>
                        <div className="p-4 bg-green-100 rounded-full">
                            <FiCheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Puntuales */}
                <div className="card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/reportes')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Puntuales</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.puntuales}</p>
                            <p className="text-xs text-green-600 mt-2">
                                {porcentajePuntualidad}% de asistencias
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-100 rounded-full">
                            <FiCheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Retardos */}
                <div className="card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate('/reportes')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Retardos</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.retardos}</p>
                            <p className="text-xs text-yellow-600 mt-2">
                                {stats.asistenciasHoy > 0 ? Math.round((stats.retardos / stats.asistenciasHoy) * 100) : 0}% de asistencias
                            </p>
                        </div>
                        <div className="p-4 bg-yellow-100 rounded-full">
                            <FiClock className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de últimas asistencias */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[420px]">
                {/* Últimas asistencias */}
                <div className="lg:col-span-2 card flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Últimas Asistencias Registradas
                        </h3>
                    </div>

                    <div className="flex-1">
                        {ultimasAsistencias.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay asistencias registradas hoy</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden w-full">
                                <table className="w-full table-fixed divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Empleado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Hora
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dispositivo
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {asistenciasPaginadas.map((asistencia) => (
                                            <tr key={asistencia.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/empleados/usuario/${asistencia.empleado_usuario}`)}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {asistencia.empleado_nombre}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${asistencia.tipo === 'entrada'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {asistencia.tipo === 'entrada' ? '→' : '←'}
                                                        {asistencia.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatHora(asistencia.fecha_registro)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const e = asistencia.estado;
                                                        const map = {
                                                            puntual: { cls: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="w-3 h-3" />, label: 'Puntual' },
                                                            salida_puntual: { cls: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="w-3 h-3" />, label: 'Salida puntual' },
                                                            salida_temprana: { cls: 'bg-blue-100 text-blue-800', icon: <FiClock className="w-3 h-3" />, label: 'Salida temprana' },
                                                            retardo: { cls: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="w-3 h-3" />, label: 'Retardo' },
                                                            falta: { cls: 'bg-red-100 text-red-800', icon: <FiAlertCircle className="w-3 h-3" />, label: 'Falta' },
                                                        };
                                                        const info = map[e] || { cls: 'bg-gray-100 text-gray-800', icon: <FiClock className="w-3 h-3" />, label: e };
                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${info.cls}`}>
                                                                {info.icon} {info.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {asistencia.dispositivo_origen}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <Pagination
                        pagina={paginaAsistencias}
                        totalPaginas={totalPaginasAsistencias}
                        total={ultimasAsistencias.length}
                        porPagina={asistenciasPorPagina}
                        onChange={setPaginaAsistencias}
                    />
                </div>

                {/* Panel lateral */}
                <div className="space-y-6">
                    {/* Acciones rápidas */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Acciones Rápidas
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/empleados')}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <FiUsers className="w-4 h-4" />
                                Ver Empleados
                            </button>
                            <button
                                onClick={() => navigate('/horarios')}
                                className="w-full btn-secondary flex items-center justify-center gap-2"
                            >
                                <FiCalendar className="w-4 h-4" />
                                Gestionar Horarios
                            </button>
                            <button
                                onClick={() => navigate('/incidencias')}
                                className="w-full btn-secondary flex items-center justify-center gap-2"
                            >
                                <FiAlertCircle className="w-4 h-4" />
                                Ver Incidencias
                            </button>
                        </div>
                    </div>

                    {/* Resumen del día */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 w-max-xl">
                            Resumen del Día
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Asistencia</span>
                                    <span className="text-sm font-semibold text-blue-600">{porcentajeAsistencia}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${porcentajeAsistencia}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Puntualidad</span>
                                    <span className="text-sm font-semibold text-green-600">{porcentajePuntualidad}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${porcentajePuntualidad}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
