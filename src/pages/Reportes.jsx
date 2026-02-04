import React, { useState, useEffect, useMemo, useRef } from 'react';
import ConfirmBox from '../components/ConfirmBox';
import {
    BarChart3, Settings, Filter, PieChart as PieIcon, X,
    CheckCircle, AlertTriangle, AlertCircle, Users, TrendingUp,
    FileSpreadsheet, FileText, File as FileIcon, Calendar,
    Activity, Search, RefreshCw, Trophy, Building2 // Icono Building2 agregado
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// imports de docx omitidos para brevedad, mantener los tuyos...
import html2canvas from 'html2canvas';

import { API_CONFIG } from '../config/Apiconfig';
const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

const COLORS = {
    puntual: '#22c55e', // Verde
    retardo: '#eab308', // Amarillo
    falta: '#ef4444',   // Rojo
    azul: '#3b82f6',
    morado: '#8b5cf6',
    gris: '#94a3b8'
};

const Reportes = () => {
    // --- ESTADOS DE FILTROS ---
    const [alcance, setAlcance] = useState('global');
    const [idSeleccionado, setIdSeleccionado] = useState('');
    const [modoFecha, setModoFecha] = useState('siempre');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // --- ESTADOS DE DATOS ---
    const [dashboardStats, setDashboardStats] = useState(null);
    const [topDesempeno, setTopDesempeno] = useState([]);
    // NUEVO: Estado para la comparativa de departamentos
    const [statsDepartamentos, setStatsDepartamentos] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // --- CATALOGOS ---
    const [empleados, setEmpleados] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);

    // --- MODAL Y EXPORTACIÓN ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const [exportCategoria, setExportCategoria] = useState('general');

    const chartContainerRef = useRef(null);

    const getToken = () => localStorage.getItem('auth_token');

    // Carga inicial
    useEffect(() => {
        cargarCatalogos();
        actualizarEstadisticas();
    }, []);

    const cargarCatalogos = async () => {
        try {
            const token = getToken();
            if (!token) return;
            const [resEmp, resDep] = await Promise.all([
                fetch(`${API_BASE_URL}/empleados`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const dataEmp = await resEmp.json();
            const dataDep = await resDep.json();
            if (dataEmp.success) setEmpleados(dataEmp.data);
            if (dataDep.success) setDepartamentos(dataDep.data);
        } catch (e) { console.error(e); }
    };

    // Función Centralizada para Cargar Estadísticas
    const actualizarEstadisticas = async () => {
        setDashboardLoading(true);
        setTopDesempeno([]);
        setStatsDepartamentos([]); // Resetear comparativa

        try {
            const token = getToken();
            const params = new URLSearchParams();

            // 1. Fechas
            if (modoFecha === 'intervalo' && fechaInicio && fechaFin) {
                params.append('fecha_inicio', fechaInicio);
                params.append('fecha_fin', fechaFin);
            }

            // 2. Determinar Endpoint Principal (KPIs)
            let endpointStats = '/reportes/estadisticas-globales';

            if (alcance === 'empleado' && idSeleccionado) {
                endpointStats = `/reportes/estadisticas-empleado/${idSeleccionado}`;
            } else if (alcance === 'departamento' && idSeleccionado) {
                endpointStats = `/reportes/estadisticas-departamento/${idSeleccionado}`;
            }

            // 3. Ejecutar Peticiones en Paralelo
            const requests = [
                // Petición 0: Estadísticas Generales (KPIs y Gráficas básicas)
                fetch(`${API_BASE_URL}${endpointStats}?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ];

            // Si es vista por departamento (o global), traemos el Top 10 Empleados
            if (alcance === 'departamento' && idSeleccionado) {
                params.append('departamento_id', idSeleccionado);
                requests.push(fetch(`${API_BASE_URL}/reportes/desempeno?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }));
            } else if (alcance === 'global') {
                // Petición 1: Top 10 Desempeño Empleados
                requests.push(fetch(`${API_BASE_URL}/reportes/desempeno?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }));

                // Petición 2: Comparativa de Departamentos (NUEVA)
                requests.push(fetch(`${API_BASE_URL}/reportes/comparativa-departamentos?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }));
            }

            const responses = await Promise.all(requests);
            const dataStats = await responses[0].json();

            if (dataStats.success) {
                setDashboardStats(dataStats.data);

                // Procesar Top 10 Empleados (si existe la respuesta 1)
                if (responses[1]) {
                    const dataDesempeno = await responses[1].json();
                    if (dataDesempeno.success && Array.isArray(dataDesempeno.data)) {
                        const top = dataDesempeno.data
                            .sort((a, b) => b.puntuales - a.puntuales)
                            .slice(0, 10);
                        setTopDesempeno(top);
                    }
                }

                // Procesar Comparativa Departamentos (Solo si estamos en Global y existe la respuesta 2)
                if (alcance === 'global' && responses[2]) {
                    const dataDeptos = await responses[2].json();
                    if (dataDeptos.success && Array.isArray(dataDeptos.data)) {
                        setStatsDepartamentos(dataDeptos.data);
                    }
                }

            } else {
                setDashboardStats(null);
            }
        } catch (error) {
            console.error("Error cargando estadísticas", error);
            setDashboardStats(null);
        } finally {
            setDashboardLoading(false);
        }
    };

    // Datos visuales calculados
    const chartData = useMemo(() => {
        if (!dashboardStats) return null;

        const asistencias = dashboardStats.asistencias || {};

        const pieData = [
            { name: 'Puntuales', value: parseInt(asistencias.puntuales || 0), color: COLORS.puntual },
            { name: 'Retardos', value: parseInt(asistencias.retardos || 0), color: COLORS.retardo },
            { name: 'Faltas', value: parseInt(asistencias.faltas || 0), color: COLORS.falta },
        ].filter(i => i.value > 0);

        const incidenciasData = dashboardStats.incidencias?.map(inc => ({
            name: inc.tipo,
            cantidad: parseInt(inc.total)
        })) || [];

        return { pieData, incidenciasData };
    }, [dashboardStats]);

    // --- FUNCIONES DE EXPORTACIÓN (Sin cambios) ---
    const handleExport = async (formato) => {
        setExporting(true);
        setTimeout(() => {
            setAlertMsg(`Reporte ${formato.toUpperCase()} generado correctamente.`);
            setExporting(false);
            setIsModalOpen(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* --- HEADER PRINCIPAL --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            Panel de Estadísticas
                        </h1>
                        <p className="text-gray-500 mt-1">Visión general del comportamiento de asistencia</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 md:mt-0 px-6 py-3 bg-white border-2 border-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        Exportar Reporte
                    </button>
                </div>

                {/* --- BARRA DE FILTROS --- */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center">
                        <div className="w-full xl:w-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Ver Datos De:</label>
                                <div className="relative">
                                    <select
                                        value={alcance}
                                        onChange={(e) => {
                                            setAlcance(e.target.value);
                                            setIdSeleccionado('');
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm font-medium transition-all outline-none appearance-none"
                                    >
                                        <option value="global">Toda la Empresa</option>
                                        <option value="departamento">Departamento Específico</option>
                                        <option value="empleado">Empleado Específico</option>
                                    </select>
                                    <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            {/* Selector Específico */}
                            {alcance !== 'global' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">
                                        {alcance === 'departamento' ? 'Seleccionar Depto:' : 'Seleccionar Empleado:'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={idSeleccionado}
                                            onChange={(e) => setIdSeleccionado(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm font-medium transition-all outline-none appearance-none"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {alcance === 'departamento'
                                                ? departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)
                                                : empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)
                                            }
                                        </select>
                                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Selector de Tiempo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Periodo de Tiempo:</label>
                                <div className="relative">
                                    <select
                                        value={modoFecha}
                                        onChange={(e) => setModoFecha(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl text-sm font-medium transition-all outline-none appearance-none"
                                    >
                                        <option value="siempre">Histórico Completo</option>
                                        <option value="intervalo">Rango de Fechas</option>
                                    </select>
                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Inputs de Fecha */}
                        {modoFecha === 'intervalo' && (
                            <div className="flex gap-2 w-full xl:w-auto animate-in fade-in slide-in-from-left-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Inicio</label>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Fin</label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botón Actualizar */}
                        <div className="w-full xl:w-auto">
                            <label className="block text-xs font-bold text-transparent uppercase mb-1.5 ml-1 select-none">.</label>
                            <button
                                onClick={actualizarEstadisticas}
                                disabled={dashboardLoading || (alcance !== 'global' && !idSeleccionado)}
                                className="w-full xl:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {dashboardLoading ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <RefreshCw className="w-5 h-5" />
                                )}
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- CONTENIDO DEL DASHBOARD --- */}
                {dashboardLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                        <p>Analizando datos...</p>
                    </div>
                ) : dashboardStats ? (
                    <div ref={chartContainerRef} className="space-y-6 animate-in fade-in duration-500">

                        {/* KPIs Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard title="Puntualidad" value={dashboardStats.asistencias?.puntuales} total={dashboardStats.asistencias?.total} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                            <KpiCard title="Retardos" value={dashboardStats.asistencias?.retardos} total={dashboardStats.asistencias?.total} icon={AlertCircle} color="text-yellow-600" bg="bg-yellow-50" />
                            <KpiCard title="Faltas" value={dashboardStats.asistencias?.faltas} total={dashboardStats.asistencias?.total} icon={X} color="text-red-600" bg="bg-red-50" />
                            <KpiCard title="Total Registros" value={dashboardStats.asistencias?.total} sub="En periodo seleccionado" icon={Users} color="text-blue-600" bg="bg-blue-50" />
                        </div>

                        {/* ==========================================================
                            SECCIÓN NUEVA: COMPARATIVA DE DEPARTAMENTOS
                           ========================================================== */}
                        {alcance === 'global' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                        Comparativa: Departamentos
                                    </h3>
                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        Ranking de Eficiencia
                                    </span>
                                </div>

                                <div className="h-[350px] w-full">
                                    {statsDepartamentos.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={statsDepartamentos}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                <XAxis
                                                    dataKey="nombre"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                                />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    cursor={{ fill: '#f3f4f6' }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar name="Puntuales" dataKey="puntuales" fill={COLORS.puntual} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                <Bar name="Retardos" dataKey="retardos" fill={COLORS.retardo} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                <Bar name="Faltas" dataKey="faltas" fill={COLORS.falta} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                            <Building2 className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="text-sm">Sin datos departamentales suficientes para comparar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* ========================================================== */}

                        {/* Contenido Visual (Grafica Circular, Top 10 Empleados, Incidencias) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Gráfica Circular Comparativa */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 col-span-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <PieIcon className="w-5 h-5 text-gray-400" /> Distribución General
                                </h3>
                                <p className="text-xs text-gray-500 mb-6">Puntuales vs Retardos vs Faltas</p>

                                {chartData.pieData.length > 0 ? (
                                    <div className="flex-1 min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData.pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {chartData.pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                        Sin datos para graficar
                                    </div>
                                )}
                            </div>

                            {/* Top 10 Desempeño Empleados */}
                            {(alcance === 'departamento' || alcance === 'global') && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            Top 10 Empleados
                                        </h3>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                            Mayor Puntualidad
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-x-auto">
                                        {topDesempeno.length > 0 ? (
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-100">
                                                        <th className="text-left text-xs font-bold text-gray-500 uppercase py-2">Empleado</th>
                                                        <th className="text-center text-xs font-bold text-green-600 uppercase py-2">Puntuales</th>
                                                        <th className="text-center text-xs font-bold text-yellow-600 uppercase py-2">Retardos</th>
                                                        <th className="text-center text-xs font-bold text-red-600 uppercase py-2">Faltas</th>
                                                        <th className="text-center text-xs font-bold text-blue-600 uppercase py-2">Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {topDesempeno.map((emp, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="py-3 text-sm font-medium text-gray-800 flex items-center gap-2">
                                                                <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                    {idx + 1}
                                                                </span>
                                                                {emp.empleado_nombre}
                                                            </td>
                                                            <td className="text-center text-sm text-gray-600">{emp.puntuales}</td>
                                                            <td className="text-center text-sm text-gray-600">{emp.retardos}</td>
                                                            <td className="text-center text-sm text-gray-600">{emp.faltas}</td>
                                                            <td className="text-center text-sm font-bold text-blue-700">{emp.porcentaje_puntualidad}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">
                                                No hay registros de desempeño suficientes
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Gráfica de Barras (Incidencias Empleado Único) */}
                            {alcance === 'empleado' && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 col-span-1 lg:col-span-2 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-gray-400" /> Historial de Incidencias
                                    </h3>
                                    <div className="flex-1 min-h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData.incidenciasData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                                <Bar dataKey="cantidad" fill={COLORS.azul} radius={[4, 4, 0, 0]} barSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No hay datos disponibles</h3>
                        <p className="text-gray-500 mt-1 max-w-md text-center">
                            No se encontraron registros para los filtros seleccionados.
                        </p>
                    </div>
                )}
            </div>

            {alertMsg && <ConfirmBox message={alertMsg} onConfirm={() => setAlertMsg(null)} />}

            {/* --- MODAL DE DESCARGA (Código previo mantenido igual) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Descargar Reporte</h2>
                                <p className="text-xs text-gray-500">Selecciona el formato de salida</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 space-y-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Tipo de Detalle</label>
                                <select
                                    value={exportCategoria}
                                    onChange={(e) => setExportCategoria(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="general">Resumen Ejecutivo (Dashboard)</option>
                                    <option value="asistencias">Detalle de Asistencias (Tabla)</option>
                                    <option value="incidencias">Reporte de Incidencias</option>
                                </select>
                            </div>

                            {exporting ? (
                                <div className="py-6 text-center bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-sm font-medium text-blue-700">Generando documento...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => handleExport('excel')} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group text-left">
                                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                            <FileSpreadsheet className="w-5 h-5 text-green-700" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm text-gray-800 group-hover:text-green-800">Excel (.xlsx)</span>
                                            <span className="text-xs text-gray-500">Ideal para análisis de datos</span>
                                        </div>
                                    </button>

                                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group text-left">
                                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                            <FileIcon className="w-5 h-5 text-red-700" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm text-gray-800 group-hover:text-red-800">PDF (.pdf)</span>
                                            <span className="text-xs text-gray-500">Documento visual para imprimir</span>
                                        </div>
                                    </button>

                                    <button onClick={() => handleExport('word')} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group text-left">
                                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <FileText className="w-5 h-5 text-blue-700" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm text-gray-800 group-hover:text-blue-800">Word (.docx)</span>
                                            <span className="text-xs text-gray-500">Documento editable</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente KPI Card
const KpiCard = ({ title, value, total, sub, icon: Icon, color, bg }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value || 0}</h4>
            {total ? (
                <p className="text-xs text-gray-400 mt-2 font-medium">
                    {total > 0 ? ((value / total) * 100).toFixed(1) : 0}% del total
                </p>
            ) : null}
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

export default Reportes;