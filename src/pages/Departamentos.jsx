import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import ConfirmBox from '../components/ConfirmBox';
import DepartamentsCard from '../components/cards/DepartamentsCard';
import DepartamentsModal from '../components/modals/DepartamentsModal';
import MapaDepartamentos from '../components/DepartamentsMap';
import DynamicLoader from '../components/common/DynamicLoader';

import { API_CONFIG } from '../config/Apiconfig';
const API_URL = API_CONFIG.BASE_URL;

const Departamentos = () => {
    const [departamentos, setDepartamentos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('activo');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    // Estado para controlar el foco del mapa
    const [focusedDepto, setFocusedDepto] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [deptosRes, usuariosRes] = await Promise.all([
                fetch(`${API_URL}/api/departamentos`, { headers }),
                fetch(`${API_URL}/api/usuarios`, { headers })
            ]);

            const deptosData = await deptosRes.json();
            const usuariosData = await usuariosRes.json();

            if (deptosData.success) setDepartamentos(deptosData.data);
            if (usuariosData.success) setUsuarios(usuariosData.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleEdit = async (depto) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/departamentos/${depto.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setEditingId(depto.id);
                setModalMode('edit');
                setEditingData(result.data);
                setModalOpen(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (data) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            const url = modalMode === 'create'
                ? `${API_URL}/api/departamentos`
                : `${API_URL}/api/departamentos/${editingId}`;

            const response = await fetch(url, {
                method: modalMode === 'create' ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                setModalOpen(false);
                fetchData();
            } else {
                setAlertMsg(result.message || 'Error al guardar');
            }
        } catch (error) {
            console.error(error);
            setAlertMsg('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (depto) => {
        setConfirmAction({
            message: `¿Desactivar el departamento "${depto.nombre}" ? `,
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/departamentos/${depto.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (result.success) fetchData();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleReactivar = (depto) => {
        setConfirmAction({
            message: `¿Reactivar el departamento "${depto.nombre}" ? `,
            onConfirm: async () => {
                setConfirmAction(null);
                try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`${API_URL}/api/departamentos/${depto.id}/reactivar`, {
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

    // Handler para cuando se hace click en una card
    const handleFocusMap = (depto) => {
        if (depto.ubicacion && depto.ubicacion.zonas && depto.ubicacion.zonas.length > 0) {
            setFocusedDepto(depto);
        } else {
            // Opcional: Avisar que no tiene ubicación
            // console.log("El departamento no tiene zonas geográficas");
        }
    };

    const filteredDepartamentos = departamentos.filter(d => {
        const matchesBusqueda = d.nombre.toLowerCase().includes(busqueda.toLowerCase());

        if (!matchesBusqueda) return false;

        if (filtroEstado === 'activo') return d.es_activo !== false;
        if (filtroEstado === 'inactivo') return d.es_activo === false;
        return true;
    });

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4 flex-shrink-0">
                <div className="flex flex-1 gap-3">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar departamentos..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
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
                <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                    <FiPlus /> Nuevo Departamento
                </button>
            </div>

            {/* Content Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Listado de Tarjetas Scrollable */}
                <div className="overflow-y-auto pr-2 pb-4">
                    {loading ? (
                        <DynamicLoader text="Cargando departamentos..." />
                    ) : filteredDepartamentos.length === 0 ? (
                        <div className="text-center p-10 text-gray-500 dark:text-gray-400">No se encontraron departamentos</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDepartamentos.map(depto => (
                                <DepartamentsCard
                                    key={depto.id}
                                    onReactivar={handleReactivar}
                                    depto={depto}
                                    onEdit={() => handleEdit(depto)}
                                    onDelete={() => handleDelete(depto)}
                                    onFocus={handleFocusMap} // Pasamos la función de foco
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Mapa General Fijo */}
                <div className="h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 relative">
                    <MapaDepartamentos
                        departamentos={filteredDepartamentos}
                        focusedDepto={focusedDepto} // Pasamos el departamento seleccionado
                    />
                </div>
            </div>

            {alertMsg && <ConfirmBox message={alertMsg} onConfirm={() => setAlertMsg(null)} />}
            {confirmAction && <ConfirmBox message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}

            {/* Modal */}
            <DepartamentsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                initialData={editingData}
                usuarios={usuarios}
                onSave={handleSave}
                saving={saving}
            />
        </div>
    );
};

export default Departamentos;