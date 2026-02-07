import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import ConfirmBox from '../components/ConfirmBox';
import Pagination from '../components/Pagination';
import ScheduleCard from '../components/cards/ScheduleCard';
import ScheduleModal from '../components/modals/ScheduleModal';
import HolidaysCalendar from '../components/schedules/HolidaysCalendar';

import { API_CONFIG } from '../config/Apiconfig';
const API_URL = API_CONFIG.BASE_URL;

const Horarios = () => {
    const [horarios, setHorarios] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('activo');
    const [vista, setVista] = useState('cards'); // 'cards' | 'festivos'

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [saving, setSaving] = useState(false);
    const [editingHorario, setEditingHorario] = useState(null);
    const [alertMsg, setAlertMsg] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    // Paginación
    const [pagina, setPagina] = useState(1);
    const porPagina = 9;

    useEffect(() => {
        fetchData();
    }, [busqueda]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const params = new URLSearchParams();
            if (busqueda) params.append('buscar', busqueda);

            const [horariosRes, empleadosRes] = await Promise.all([
                fetch(`${API_URL}/api/horarios?${params}`, { headers }),
                fetch(`${API_URL}/api/empleados`, { headers })
            ]);

            const horariosData = await horariosRes.json();
            const empleadosData = await empleadosRes.json();

            if (horariosData.success) {
                setHorarios(horariosData.data);
                setPagina(1); // Reset pagination on new search
            }
            if (empleadosData.success) {
                const empleadosConId = empleadosData.data.filter(emp => emp.id);
                setEmpleados(empleadosConId);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingHorario(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = async (horario) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/horarios/${horario.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setEditingHorario(result.data);
                setModalMode('edit');
                setModalOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (formData) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');

            const body = {
                empleado_id: formData.empleado_id,
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: formData.fecha_fin || null,
                configuracion: {
                    configuracion_semanal: formData.configuracion_semanal,
                    excepciones: {}
                }
            };

            const url = modalMode === 'create'
                ? `${API_URL}/api/horarios`
                : `${API_URL}/api/horarios/${editingHorario.id}`;

            const response = await fetch(url, {
                method: modalMode === 'create' ? 'POST' : 'PUT',
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
            } else {
                setAlertMsg(result.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            setAlertMsg('Error al guardar horario');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (horario) => {
        setConfirmAction({
            message: '¿Estás seguro de desactivar este horario?',
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/horarios/${horario.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) fetchData();
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        });
    };

    const handleReactivar = (horario) => {
        setConfirmAction({
            message: `¿Reactivar este horario?`,
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/horarios/${horario.id}/reactivar`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) fetchData();
                    else setAlertMsg(result.message || 'Error al reactivar');
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        });
    };

    const getEmpleadoNombre = (horario) => {
        if (horario.empleado_nombre) return horario.empleado_nombre;
        if (horario.empleado_id) {
            const empleado = empleados.find(e => e.id === horario.empleado_id);
            return empleado?.nombre || 'Desconocido';
        }
        return 'Sin asignar';
    };

    const filteredHorarios = horarios.filter(h => {
        const empleadoNombre = getEmpleadoNombre(h);
        const matchesBusqueda = empleadoNombre.toLowerCase().includes(busqueda.toLowerCase());

        if (!matchesBusqueda) return false;

        if (filtroEstado === 'activo') return h.es_activo !== false;
        if (filtroEstado === 'inactivo') return h.es_activo === false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por empleado..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    {/* Toggle de vista */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setVista('cards')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${vista === 'cards'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Horarios
                        </button>
                        <button
                            onClick={() => setVista('festivos')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${vista === 'festivos'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Días Festivos
                        </button>
                    </div>
                    {vista !== 'festivos' && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                            Nuevo Horario
                        </button>
                    )}
                </div>
            </div>

            {vista === 'festivos' ? (
                <HolidaysCalendar />
            ) : loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredHorarios.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron horarios</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {filteredHorarios.slice((pagina - 1) * porPagina, pagina * porPagina).map((horario) => (
                            <ScheduleCard
                                key={horario.id}
                                horario={horario}
                                empleadoNombre={getEmpleadoNombre(horario)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onReactivar={handleReactivar}
                            />
                        ))}
                    </div>
                    <Pagination
                        pagina={pagina}
                        totalPaginas={Math.ceil(filteredHorarios.length / porPagina)}
                        total={filteredHorarios.length}
                        porPagina={porPagina}
                        onChange={setPagina}
                    />
                </>
            )}

            {alertMsg && <ConfirmBox message={alertMsg} onConfirm={() => setAlertMsg(null)} />}
            {confirmAction && <ConfirmBox message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}

            <ScheduleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                empleados={empleados}
                initialData={editingHorario}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    );
};

export default Horarios;
