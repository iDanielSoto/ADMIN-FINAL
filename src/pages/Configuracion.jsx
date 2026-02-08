import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useConfig } from '../context/ConfigContext';
import DynamicLoader from '../components/common/DynamicLoader';
import { compressImage } from '../utils/imageUtils';
import {
    FiSave, FiUpload, FiTrash2, FiImage, FiGlobe, FiClock,
    FiAlertCircle, FiSettings, FiPhone, FiMail, FiShield,
    FiArrowUp, FiArrowDown, FiLock, FiLayout, FiChevronRight,
    FiWifi
} from 'react-icons/fi';

import { API_CONFIG } from '../config/Apiconfig';
const API_URL = API_CONFIG.BASE_URL;

// Catálogo de métodos para mapear los códigos de la BD a nombres legibles
const METODOS_AUTH = [
    { id: 'huella', label: 'Huella Digital', icon: '' },
    { id: 'rostro', label: 'Reconocimiento Facial', icon: '' },
    { id: 'codigo', label: 'Código PIN / Contraseña', icon: '' }
];

// Configuración del menú lateral (Incluye la nueva sección "Red")
const SECCIONES = [
    { id: 'general', label: 'General', icon: FiSettings, description: 'Región, idioma y preferencias' },
    { id: 'empresa', label: 'Empresa', icon: FiLayout, description: 'Identidad y contacto de la organización' },
    { id: 'seguridad', label: 'Seguridad', icon: FiShield, description: 'Accesos, bloqueos y autenticación' },
    { id: 'tolerancia', label: 'Tolerancia', icon: FiClock, description: 'Reglas de asistencia y retardos' },
    { id: 'red', label: 'Red', icon: FiWifi, description: 'Puntos de acceso y segmentación IP' },
];


const Configuracion = () => {
    const { theme, toggleTheme } = useTheme();
    const { config, updateConfig } = useConfig(); // Consumir contexto
    // Estado para la navegación interna
    const [activeTab, setActiveTab] = useState('general');

    // Estados de datos principales
    const [empresa, setEmpresa] = useState(null);
    const [configuracion, setConfiguracion] = useState(null);
    const [tolerancia, setTolerancia] = useState(null);
    const [tolerancias, setTolerancias] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null); // null = General

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const fileInputRef = useRef(null);

    // --- ESTADOS PARA SECCIÓN RED (NUEVO) ---
    const [listaRedes, setListaRedes] = useState([]);
    const [nuevaIP, setNuevaIP] = useState('');
    const [errorIP, setErrorIP] = useState(null);

    // Formularios
    const [formEmpresa, setFormEmpresa] = useState({
        nombre: '',
        logo: '',
        telefono: '',
        correo: ''
    });

    // Inicializar formConfig con valores del contexto
    const [formConfig, setFormConfig] = useState({
        idioma: config.idioma || 'es',
        es_mantenimiento: config.es_mantenimiento || false,
        formato_fecha: config.formato_fecha || 'DD/MM/YYYY',
        formato_hora: config.formato_hora || '24',
        zona_horaria: config.zona_horaria || 'America/Mexico_City',
        intentos_maximos: 3,
        orden_credenciales: {
            huella: { prioridad: 1, activo: true },
            rostro: { prioridad: 2, activo: true },
            tarjeta: { prioridad: 3, activo: true },
            codigo: { prioridad: 4, activo: true }
        }
    });

    // Sincronizar formulario cuando el contexto cambie (carga inicial)
    useEffect(() => {
        setFormConfig(prev => ({
            ...prev,
            idioma: config.idioma,
            formato_fecha: config.formato_fecha,
            formato_hora: config.formato_hora,
            zona_horaria: config.zona_horaria,
            es_mantenimiento: config.es_mantenimiento
        }));
    }, [config]);

    const [formTolerancia, setFormTolerancia] = useState({
        nombre: 'Tolerancia General',
        minutos_retardo: 10,
        minutos_falta: 30,
        permite_registro_anticipado: true,
        minutos_anticipado_max: 60,
        aplica_tolerancia_entrada: true,
        aplica_tolerancia_salida: false,
        dias_aplica: {
            lunes: true, martes: true, miercoles: true,
            jueves: true, viernes: true, sabado: false, domingo: false
        }
    });

    const cargarFormTolerancia = (tol) => {
        setFormTolerancia({
            nombre: tol.nombre || 'Tolerancia General',
            minutos_retardo: tol.minutos_retardo || 10,
            minutos_falta: tol.minutos_falta || 30,
            permite_registro_anticipado: tol.permite_registro_anticipado ?? true,
            minutos_anticipado_max: tol.minutos_anticipado_max || 60,
            aplica_tolerancia_entrada: tol.aplica_tolerancia_entrada ?? true,
            aplica_tolerancia_salida: tol.aplica_tolerancia_salida ?? false,
            dias_aplica: tol.dias_aplica || {
                lunes: true, martes: true, miercoles: true,
                jueves: true, viernes: true, sabado: false, domingo: false
            },
            rol_id: tol.rol_id || null
        });
    };

    const handleSeleccionarRol = (rolId) => {
        setSelectedRoleId(rolId);

        // Buscar si ya existe tolerancia para este rol
        // rolId null es "General" (buscamos tolerancia con rol_id === null)
        const existingTol = tolerancias.find(t => t.rol_id === rolId);

        if (existingTol) {
            setTolerancia(existingTol);
            cargarFormTolerancia(existingTol);
        } else {
            // Inicializar nueva configuración para este rol
            const rolNombre = rolId ? roles.find(r => r.id === rolId)?.nombre : 'General';
            setTolerancia(null); // No ID yet
            setFormTolerancia({
                nombre: rolNombre,
                minutos_retardo: 10,
                minutos_falta: 30,
                permite_registro_anticipado: true,
                minutos_anticipado_max: 60,
                aplica_tolerancia_entrada: true,
                aplica_tolerancia_salida: false,
                dias_aplica: {
                    lunes: true, martes: true, miercoles: true,
                    jueves: true, viernes: true, sabado: false, domingo: false
                },
                rol_id: rolId
            });
        }
    };



    const handleEliminarTolerancia = async (tolId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/api/tolerancias/${tolId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const nuevas = tolerancias.filter(t => t.id !== tolId);
                setTolerancias(nuevas);
                if (nuevas.length >= 0) {
                    handleSeleccionarRol(null);
                }
            } else {
                setMensaje({ tipo: 'error', texto: data.message || 'No se pudo eliminar' });
            }
        } catch (err) {
            console.error('Error al eliminar tolerancia:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const resEmpresa = await fetch(`${API_URL}/api/empresas?es_activo=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataEmpresa = await resEmpresa.json();

            if (dataEmpresa.success && dataEmpresa.data?.length > 0) {
                const emp = dataEmpresa.data[0];
                setEmpresa(emp);

                setFormEmpresa({
                    nombre: emp.nombre || '',
                    logo: emp.logo || '',
                    telefono: emp.telefono || '',
                    correo: emp.correo || ''
                });

                if (emp.configuracion_id) {
                    const resConfig = await fetch(`${API_URL}/api/configuracion/${emp.configuracion_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const dataConfig = await resConfig.json();

                    if (dataConfig.success) {
                        const cfg = dataConfig.data;
                        setConfiguracion(cfg);

                        // Estructura por defecto para orden_credenciales
                        let ordenCredenciales = {
                            huella: { prioridad: 1, activo: true },
                            rostro: { prioridad: 2, activo: true },
                            tarjeta: { prioridad: 3, activo: true },
                            codigo: { prioridad: 4, activo: true }
                        };

                        if (cfg.orden_credenciales) {
                            try {
                                const parsed = typeof cfg.orden_credenciales === 'string'
                                    ? JSON.parse(cfg.orden_credenciales)
                                    : cfg.orden_credenciales;

                                // Si es array (formato antiguo), convertir a objeto
                                if (Array.isArray(parsed)) {
                                    ordenCredenciales = {};
                                    parsed.forEach((metodo, index) => {
                                        ordenCredenciales[metodo] = { prioridad: index + 1, activo: true };
                                    });
                                } else {
                                    // Ya es objeto con la nueva estructura
                                    ordenCredenciales = parsed;
                                }
                            } catch (e) {
                                console.error("Error parseando orden_credenciales", e);
                            }
                        }

                        setFormConfig({
                            idioma: cfg.idioma || 'es',
                            es_mantenimiento: cfg.es_mantenimiento || false,
                            formato_fecha: cfg.formato_fecha || 'DD/MM/YYYY',
                            formato_hora: cfg.formato_hora || '24',
                            zona_horaria: cfg.zona_horaria || 'America/Mexico_City',
                            intentos_maximos: cfg.intentos_maximos || 3,
                            orden_credenciales: ordenCredenciales
                        });
                    }
                }
            }

            // Cargar roles y tolerancias en paralelo
            const [resTolerancia, resRoles] = await Promise.all([
                fetch(`${API_URL}/api/tolerancias`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const dataTol = await resTolerancia.json();
            const dataRoles = await resRoles.json();

            if (dataRoles.success) {
                setRoles(dataRoles.data || []);
            }

            if (dataTol.success && dataTol.data?.length > 0) {
                setTolerancias(dataTol.data);
                // Cargar General por defecto
                const general = dataTol.data.find(t => !t.rol_id);
                if (general) {
                    setTolerancia(general);
                    cargarFormTolerancia(general);
                } else {
                    // Si no existe general, inicializar defaults
                    handleSeleccionarRol(null);
                }
            } else {
                handleSeleccionarRol(null);
            }

        } catch (err) {
            console.error('Error al cargar datos:', err);
            setMensaje({ tipo: 'error', texto: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    // --- FUNCIONES DE UTILIDAD ---

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMensaje({ tipo: 'error', texto: 'Por favor selecciona una imagen válida' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMensaje({ tipo: 'error', texto: 'La imagen no debe superar los 5MB' });
            return;
        }

        try {
            const compressed = await compressImage(file, { maxWidth: 200, maxHeight: 200, quality: 0.7 });
            setFormEmpresa(prev => ({ ...prev, logo: compressed }));
        } catch {
            setMensaje({ tipo: 'error', texto: 'Error al procesar la imagen' });
        }
    };

    const handleRemoveLogo = () => {
        setFormEmpresa(prev => ({ ...prev, logo: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- FUNCIONES PARA MÉTODOS DE AUTENTICACIÓN ---

    // Obtener métodos ordenados por prioridad
    const getMetodosOrdenados = () => {
        return Object.entries(formConfig.orden_credenciales)
            .map(([id, config]) => ({ id, ...config }))
            .sort((a, b) => a.prioridad - b.prioridad);
    };

    // Toggle activar/desactivar método
    const toggleMetodo = (metodoId) => {
        setFormConfig(prev => ({
            ...prev,
            orden_credenciales: {
                ...prev.orden_credenciales,
                [metodoId]: {
                    ...prev.orden_credenciales[metodoId],
                    activo: !prev.orden_credenciales[metodoId].activo
                }
            }
        }));
    };

    // Mover prioridad de método
    const moveMetodo = (metodoId, direction) => {
        const ordenados = getMetodosOrdenados();
        const index = ordenados.findIndex(m => m.id === metodoId);

        if (direction === 'up' && index > 0) {
            const anterior = ordenados[index - 1];
            setFormConfig(prev => ({
                ...prev,
                orden_credenciales: {
                    ...prev.orden_credenciales,
                    [metodoId]: { ...prev.orden_credenciales[metodoId], prioridad: anterior.prioridad },
                    [anterior.id]: { ...prev.orden_credenciales[anterior.id], prioridad: prev.orden_credenciales[metodoId].prioridad }
                }
            }));
        } else if (direction === 'down' && index < ordenados.length - 1) {
            const siguiente = ordenados[index + 1];
            setFormConfig(prev => ({
                ...prev,
                orden_credenciales: {
                    ...prev.orden_credenciales,
                    [metodoId]: { ...prev.orden_credenciales[metodoId], prioridad: siguiente.prioridad },
                    [siguiente.id]: { ...prev.orden_credenciales[siguiente.id], prioridad: prev.orden_credenciales[metodoId].prioridad }
                }
            }));
        }
    };

    // --- NUEVAS FUNCIONES PARA SECCIÓN RED ---

    const validarFormatoIP = (ip) => {
        // Regex para validar IPv4 con sufijo CIDR (ej: 192.168.1.5/24)
        const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;
        return regex.test(ip);
    };

    const handleAgregarRed = () => {
        setErrorIP(null);

        if (!nuevaIP.trim()) return;

        if (!validarFormatoIP(nuevaIP)) {
            setErrorIP('Formato inválido. Ejemplo requerido: 192.168.1.1/24');
            return;
        }

        if (listaRedes.includes(nuevaIP)) {
            setErrorIP('Esta dirección IP ya ha sido agregada.');
            return;
        }

        setListaRedes([...listaRedes, nuevaIP]);
        setNuevaIP(''); // Limpiar input
    };

    const handleEliminarRed = (ipToDelete) => {
        setListaRedes(prev => prev.filter(ip => ip !== ipToDelete));
    };

    // --- GUARDADO ---

    const handleSaveAll = async () => {
        if (!formEmpresa.nombre.trim()) {
            setMensaje({ tipo: 'error', texto: 'El nombre de la empresa es requerido' });
            return;
        }

        try {
            setSaving(true);
            setMensaje(null);
            const token = localStorage.getItem('auth_token');

            // Guardar Empresa
            const resEmpresa = await fetch(`${API_URL}/api/empresas/${empresa.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre: formEmpresa.nombre,
                    logo: formEmpresa.logo || null,
                    telefono: formEmpresa.telefono,
                    correo: formEmpresa.correo
                })
            });
            const dataEmpresa = await resEmpresa.json();
            if (!dataEmpresa.success) throw new Error('Error al actualizar empresa');

            // Guardar Configuración
            if (configuracion?.id) {
                const resConfig = await fetch(`${API_URL}/api/configuracion/${configuracion.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formConfig)
                });
                const dataConfig = await resConfig.json();
                if (!dataConfig.success) throw new Error('Error al actualizar configuración');

                // Actualizar contexto global
                updateConfig({
                    idioma: formConfig.idioma,
                    formato_fecha: formConfig.formato_fecha,
                    formato_hora: formConfig.formato_hora,
                    zona_horaria: formConfig.zona_horaria,
                    es_mantenimiento: formConfig.es_mantenimiento
                });
            }

            // Guardar Tolerancia actual
            const tokenTol = localStorage.getItem('auth_token');

            // Determinar si es crear o actualizar
            if (tolerancia?.id) {
                // UPDATE
                const resTol = await fetch(`${API_URL}/api/tolerancias/${tolerancia.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTol}` },
                    body: JSON.stringify(formTolerancia)
                });
                const dataTol = await resTol.json();
                if (!dataTol.success) throw new Error('Error al actualizar tolerancia');

                // Actualizar local
                setTolerancias(prev => prev.map(t => t.id === tolerancia.id ? dataTol.data : t));
                setTolerancia(dataTol.data);
            } else {
                // CREATE (si no existe ID para este rol)
                // Asegurarse que el rol_id y nombre sean correctos
                const payload = {
                    ...formTolerancia,
                    rol_id: selectedRoleId,
                    nombre: selectedRoleId ? roles.find(r => r.id === selectedRoleId)?.nombre : 'Tolerancia General'
                };

                const resTol = await fetch(`${API_URL}/api/tolerancias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTol}` },
                    body: JSON.stringify(payload)
                });
                const dataTol = await resTol.json();
                if (!dataTol.success) throw new Error('Error al crear tolerancia');

                // Agregar a local
                setTolerancias(prev => [...prev, dataTol.data]);
                setTolerancia(dataTol.data);
            }

            // NOTA: No se guarda 'listaRedes' porque solo es plantilla por ahora.

            setMensaje({ tipo: 'success', texto: 'Configuración guardada correctamente' });
            setTimeout(() => setMensaje(null), 3000);

        } catch (err) {
            console.error('Error al guardar:', err);
            setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <DynamicLoader text="Cargando configuración..." />;
    }

    const currentSection = SECCIONES.find(s => s.id === activeTab);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            {/* Contenedor Principal Flex */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR DE CONFIGURACIÓN --- */}
                <aside className="lg:w-72 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6 transition-colors duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h2 className="font-bold text-gray-700 dark:text-gray-200">Ajustes</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Configuración del sistema</p>
                        </div>
                        <nav className="p-2 space-y-1">
                            {SECCIONES.map((seccion) => {
                                const Icon = seccion.icon;
                                const isActive = activeTab === seccion.id;
                                return (
                                    <button
                                        key={seccion.id}
                                        onClick={() => setActiveTab(seccion.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <span>{seccion.label}</span>
                                        </div>
                                        {isActive && <FiChevronRight className="w-4 h-4 text-blue-500" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
                <main className="flex-1 min-w-0">
                    {/* Header de la sección */}
                    <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm border border-gray-200 dark:border-gray-700 border-b-0 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-200">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {currentSection.icon && <currentSection.icon className="w-6 h-6 text-gray-400" />}
                                {currentSection.label}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{currentSection.description}</p>
                        </div>

                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <DynamicLoader size="tiny" layout="row" />
                            ) : (
                                <FiSave className="w-4 h-4" />
                            )}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    {/* Mensajes de Feedback */}
                    {mensaje && (
                        <div className={`px-6 py-3 border-x border-gray-200 ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <FiAlertCircle className="w-4 h-4" />
                                {mensaje.texto}
                            </div>
                        </div>
                    )}

                    {/* Contenido del Formulario */}
                    <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">

                        {/* SECCIÓN: EMPRESA */}
                        {activeTab === 'empresa' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo de la empresa</label>
                                    <div className="flex items-start gap-6">
                                        <div className="flex-shrink-0">
                                            {formEmpresa.logo ? (
                                                <div className="relative group">
                                                    <img src={formEmpresa.logo} alt="Logo" className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200 shadow-sm" />
                                                    <button type="button" onClick={handleRemoveLogo}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm">
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                                                    <FiImage className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="logo-upload" />
                                            <label htmlFor="logo-upload"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                                                <FiUpload className="w-4 h-4" />
                                                Subir imagen
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                Se recomienda una imagen cuadrada (PNG, JPG).<br />
                                                Tamaño máximo: 2MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la organización</label>
                                        <input type="text" id="nombre" value={formEmpresa.nombre}
                                            onChange={(e) => setFormEmpresa(prev => ({ ...prev, nombre: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                            placeholder="Ingresa el nombre oficial" />
                                    </div>

                                    <div>
                                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                                            <span className="flex items-center gap-2"><FiPhone className="w-4 h-4" /> Teléfono de contacto</span>
                                        </label>
                                        <input type="tel" id="telefono" value={formEmpresa.telefono}
                                            onChange={(e) => setFormEmpresa(prev => ({ ...prev, telefono: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                            placeholder="+52 55 1234 5678" />
                                    </div>

                                    <div>
                                        <label htmlFor="correo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <span className="flex items-center gap-2"><FiMail className="w-4 h-4" /> Correo electrónico</span>
                                        </label>
                                        <input type="email" id="correo" value={formEmpresa.correo}
                                            onChange={(e) => setFormEmpresa(prev => ({ ...prev, correo: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                            placeholder="contacto@empresa.com" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN: SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Políticas de Acceso</h3>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <span className="flex items-center gap-2"><FiLock className="w-4 h-4" /> Intentos máximos de inicio de sesión</span>
                                            </label>
                                            <input type="number" min="1" max="10" value={formConfig.intentos_maximos}
                                                onChange={(e) => setFormConfig(prev => ({ ...prev, intentos_maximos: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ej. 3" />
                                            <p className="text-xs text-gray-500 mt-1">Bloquea temporalmente la cuenta tras fallos consecutivos.</p>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="pt-0.5">
                                                    <input type="checkbox" id="mantenimiento" checked={formConfig.es_mantenimiento}
                                                        onChange={(e) => setFormConfig(prev => ({ ...prev, es_mantenimiento: e.target.checked }))}
                                                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor="mantenimiento" className="block text-sm font-medium text-gray-900 mb-1">
                                                        Modo Mantenimiento
                                                    </label>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        Al activar esta opción, <strong>solo los administradores</strong> podrán acceder al sistema. Los empleados verán una pantalla de "En Mantenimiento".
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Prioridad de Autenticación</h3>
                                        <p className="text-sm text-gray-500">
                                            Activa o desactiva los métodos de validación y define su prioridad para el reloj checador.
                                        </p>

                                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            {getMetodosOrdenados().map((metodo, index) => {
                                                const metodoInfo = METODOS_AUTH.find(m => m.id === metodo.id) || { label: metodo.id, icon: '' };
                                                const ordenados = getMetodosOrdenados();

                                                return (
                                                    <div
                                                        key={metodo.id}
                                                        className={`flex items-center justify-between p-4 rounded-lg border shadow-sm transition-all ${metodo.activo
                                                            ? 'bg-white border-gray-200 hover:border-blue-300'
                                                            : 'bg-gray-100 border-gray-300 opacity-60'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {/* Número de prioridad */}
                                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${metodo.activo
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                {index + 1}
                                                            </span>

                                                            {/* Icono y nombre */}
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl">{metodoInfo.icon}</span>
                                                                <span className={`text-sm font-medium ${metodo.activo ? 'text-gray-700' : 'text-gray-500 line-through'}`}>
                                                                    {metodoInfo.label}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {/* Toggle activar/desactivar */}
                                                            <button
                                                                onClick={() => toggleMetodo(metodo.id)}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${metodo.activo ? 'bg-blue-600' : 'bg-gray-300'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${metodo.activo ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>

                                                            {/* Botones de prioridad */}
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => moveMetodo(metodo.id, 'up')}
                                                                    disabled={index === 0}
                                                                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600"
                                                                    title="Subir prioridad"
                                                                >
                                                                    <FiArrowUp className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveMetodo(metodo.id, 'down')}
                                                                    disabled={index === ordenados.length - 1}
                                                                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600"
                                                                    title="Bajar prioridad"
                                                                >
                                                                    <FiArrowDown className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            Los métodos desactivados no se solicitarán. La prioridad determina el orden de verificación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Apariencia</h3>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Modo Oscuro</h4>
                                                <p className="text-xs text-gray-500 mt-1">Cambia la apariencia de la interfaz a colores oscuros.</p>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider pt-4">Regionalización</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <span className="flex items-center gap-2"><FiGlobe className="w-4 h-4" /> Idioma del Sistema</span>
                                        </label>
                                        <select value={formConfig.idioma}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, idioma: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="es">Español</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                                        <select value={formConfig.zona_horaria}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, zona_horaria: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                                            <option value="America/Cancun">Cancún (GMT-5)</option>
                                            <option value="America/Tijuana">Tijuana (GMT-8)</option>
                                            <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                                            <option value="America/New_York">Nueva York (GMT-5)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Formatos</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Fecha</label>
                                        <select value={formConfig.formato_fecha}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, formato_fecha: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 31/12/2023)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (Ej: 12/31/2023)</option>
                                            <option value="YYYY/MM/DD">YYYY/MM/DD (Ej: 2023/12/31)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <span className="flex items-center gap-2"><FiClock className="w-4 h-4" /> Formato de Hora</span>
                                        </label>
                                        <select value={formConfig.formato_hora}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, formato_hora: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="12">12 horas (AM/PM)</option>
                                            <option value="24">24 horas (Militar)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN: TOLERANCIA */}
                        {activeTab === 'tolerancia' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                {/* Selector de Roles */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Roles Configurados:</h3>
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {/* Opción General (Siempre visible) */}
                                        <button
                                            onClick={() => handleSeleccionarRol(null)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedRoleId === null
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            General (Todos)
                                            {tolerancias.some(t => t.rol_id === null) && <span className="ml-2 text-xs opacity-70">●</span>}
                                        </button>

                                        {/* Lista de Roles con Configuración Activa */}
                                        {roles.filter(r => tolerancias.some(t => t.rol_id === r.id)).map(rol => (
                                            <button
                                                key={rol.id}
                                                onClick={() => handleSeleccionarRol(rol.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedRoleId === rol.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {rol.nombre}
                                            </button>
                                        ))}

                                        {/* Botón temporal si estamos editando uno nuevo (no guardado aún) */}
                                        {selectedRoleId && !tolerancias.some(t => t.rol_id === selectedRoleId) && (
                                            <button
                                                className="px-4 py-2 rounded-lg text-sm font-medium border bg-blue-600 text-white border-blue-600 shadow-sm animate-pulse"
                                            >
                                                {roles.find(r => r.id === selectedRoleId)?.nombre} (Nuevo)
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown para agregar nuevo rol */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 max-w-md">
                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Agregar regla para:</label>
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) handleSeleccionarRol(e.target.value);
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">-- Seleccionar Rol --</option>
                                                {roles.filter(r => !tolerancias.some(t => t.rol_id === r.id)).map(rol => (
                                                    <option key={rol.id} value={rol.id}>
                                                        {rol.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2">
                                            <FiAlertCircle className="text-blue-500" />
                                            <span className="text-sm text-gray-700">
                                                {selectedRoleId === null
                                                    ? "Editando configuración general / por defecto."
                                                    : `Configurando reglas específicas para: ${roles.find(r => r.id === selectedRoleId)?.nombre}`
                                                }
                                            </span>
                                        </div>
                                        {/* Botón de eliminar solo si existe configuración específica (y no es la vista de creación) */}
                                        {tolerancia?.id && selectedRoleId !== null && (
                                            <button
                                                onClick={() => handleEliminarTolerancia(tolerancia.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium underline flex items-center gap-1"
                                            >
                                                <FiTrash2 className="w-4 h-4" /> Eliminar Regla
                                            </button>
                                        )}
                                    </div>
                                </div>



                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Reglas de Tiempo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Retardo (min)</label>
                                            <input type="number" min="0" max="60" value={formTolerancia.minutos_retardo}
                                                onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_retardo: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                            <p className="text-xs text-gray-500 mt-2">Margen permitido después de la hora de entrada.</p>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Falta (min)</label>
                                            <input type="number" min="0" max="120" value={formTolerancia.minutos_falta}
                                                onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_falta: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                            <p className="text-xs text-gray-500 mt-2">Tiempo límite para considerar ausencia.</p>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Anticipación (min)</label>
                                            <input type="number" min="0" max="180" value={formTolerancia.minutos_anticipado_max}
                                                onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_anticipado_max: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                disabled={!formTolerancia.permite_registro_anticipado} />
                                            <p className="text-xs text-gray-500 mt-2">Tiempo máximo para checar antes de hora.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Comportamiento</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <input type="checkbox" id="anticipado" checked={formTolerancia.permite_registro_anticipado}
                                                    onChange={(e) => setFormTolerancia(prev => ({ ...prev, permite_registro_anticipado: e.target.checked }))}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                <label htmlFor="anticipado" className="text-sm font-medium text-gray-700 cursor-pointer w-full">Permitir registro anticipado</label>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <input type="checkbox" id="entrada" checked={formTolerancia.aplica_tolerancia_entrada}
                                                    onChange={(e) => setFormTolerancia(prev => ({ ...prev, aplica_tolerancia_entrada: e.target.checked }))}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                <label htmlFor="entrada" className="text-sm font-medium text-gray-700 cursor-pointer w-full">Aplicar tolerancia en entrada</label>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                <input type="checkbox" id="salida" checked={formTolerancia.aplica_tolerancia_salida}
                                                    onChange={(e) => setFormTolerancia(prev => ({ ...prev, aplica_tolerancia_salida: e.target.checked }))}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                <label htmlFor="salida" className="text-sm font-medium text-gray-700 cursor-pointer w-full">Aplicar tolerancia en salida</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Días de Aplicación</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map(dia => (
                                                <div key={dia} className="flex items-center gap-2">
                                                    <input type="checkbox" id={dia} checked={formTolerancia.dias_aplica[dia]}
                                                        onChange={(e) => setFormTolerancia(prev => ({
                                                            ...prev,
                                                            dias_aplica: { ...prev.dias_aplica, [dia]: e.target.checked }
                                                        }))}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                    <label htmlFor={dia} className="text-sm text-gray-700 capitalize cursor-pointer">{dia}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECCIÓN: RED / MALLA (NUEVO) */}
                        {activeTab === 'red' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Configuración de Nodos</h3>

                                    {/* Input de IP */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Agregar nuevo punto de acceso (CIDR)
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={nuevaIP}
                                                    onChange={(e) => setNuevaIP(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAgregarRed()}
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all font-mono text-sm ${errorIP ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-500 bg-white'
                                                        }`}
                                                    placeholder="Ej: 192.168.10.5/24"
                                                />
                                                {errorIP && (
                                                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                                        <FiAlertCircle className="w-3 h-3" /> {errorIP}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleAgregarRed}
                                                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm flex-shrink-0"
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">
                                            El sistema validará que la IP tenga el formato correcto y su máscara de subred (0-32).
                                        </p>
                                    </div>

                                    {/* Lista de IPs */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                                            <span>Nodos activos en la malla</span>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                {listaRedes.length} Total
                                            </span>
                                        </h4>

                                        {listaRedes.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                                <FiWifi className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">No hay puntos de red configurados aún.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {listaRedes.map((ip, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-blue-300 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                                <FiGlobe className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="font-mono text-sm text-gray-700">{ip}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEliminarRed(ip)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Eliminar nodo"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Configuracion;