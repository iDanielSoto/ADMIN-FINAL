import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useConfig } from '../context/ConfigContext';
import DynamicLoader from '../components/common/DynamicLoader';
import { compressImage } from '../utils/imageUtils';
import {
    FiSave, FiUpload, FiTrash2, FiImage, FiGlobe, FiClock,
    FiAlertCircle, FiSettings, FiPhone, FiMail, FiShield,
    FiArrowUp, FiArrowDown, FiArrowRight, FiLock, FiLayout, FiChevronRight,
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
    { id: 'general', label: 'General', icon: FiSettings, description: 'Región, idioma y preferencias globales' },
    { id: 'empresa', label: 'Empresa', icon: FiLayout, description: 'Identidad corporativa y contacto' },
    { id: 'seguridad', label: 'Seguridad', icon: FiShield, description: 'Accesos y métodos de verificación' },
    { id: 'tolerancia', label: 'Asistencia', icon: FiClock, description: 'Reglas, márgenes y tipos de salida' },
    { id: 'red', label: 'Red', icon: FiWifi, description: 'Seguridad IP y perímetros digitales' },
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
            codigo: { prioridad: 3, activo: true }
        },
        requiere_salida: true
    });

    // Sincronizar formulario cuando el contexto cambie (carga inicial)
    useEffect(() => {
        setFormConfig(prev => ({
            ...prev,
            idioma: config.idioma,
            formato_fecha: config.formato_fecha,
            formato_hora: config.formato_hora,
            zona_horaria: config.zona_horaria,
            es_mantenimiento: config.es_mantenimiento,
            requiere_salida: config.requiere_salida ?? true
        }));
    }, [config]);

    const [formTolerancia, setFormTolerancia] = useState({
        nombre: 'Tolerancia General',
        reglas: [],
        permite_registro_anticipado: true,
        minutos_anticipado_max: 60,
        minutos_anticipo_salida: 0,
        minutos_posterior_salida: 60,
        aplica_tolerancia_entrada: true,
        aplica_tolerancia_salida: false,
        dias_aplica: {
            lunes: true, martes: true, miercoles: true,
            jueves: true, viernes: true, sabado: false, domingo: false
        }
    });

    const [formIntervaloBloques, setFormIntervaloBloques] = useState(60);

    const cargarFormTolerancia = (tol) => {
        let parsedReglas = [];
        if (tol.reglas) {
            try {
                parsedReglas = typeof tol.reglas === 'string' ? JSON.parse(tol.reglas) : tol.reglas;
            } catch (e) {
                console.error("Error parseando reglas", e);
            }
        }

        setFormTolerancia({
            nombre: tol.nombre || 'Tolerancia General',
            reglas: parsedReglas || [],
            permite_registro_anticipado: tol.permite_registro_anticipado ?? true,
            minutos_anticipado_max: tol.minutos_anticipado_max || 60,
            minutos_anticipo_salida: tol.minutos_anticipo_salida ?? 0,
            minutos_posterior_salida: tol.minutos_posterior_salida ?? 60,
            aplica_tolerancia_entrada: tol.aplica_tolerancia_entrada ?? true,
            aplica_tolerancia_salida: tol.aplica_tolerancia_salida ?? false,
            dias_aplica: tol.dias_aplica || {
                lunes: true, martes: true, miercoles: true,
                jueves: true, viernes: true, sabado: false, domingo: false
            }
        });
        setFormIntervaloBloques(tol.intervalo_bloques_minutos || 60);
    };

    const handleAddRegla = () => {
        setFormTolerancia(prev => ({
            ...prev,
            reglas: [...prev.reglas, {
                id: `regla_${Date.now()}`,
                limite_minutos: 15,
                penalizacion_tipo: 'nada',
                penalizacion_valor: 0,
                aplica_acumulacion: false
            }]
        }));
    };

    const handleUpdateRegla = (index, field, value) => {
        setFormTolerancia(prev => {
            const nuevas = [...prev.reglas];
            nuevas[index] = { ...nuevas[index], [field]: value };
            return { ...prev, reglas: nuevas };
        });
    };

    const handleRemoveRegla = (index) => {
        setFormTolerancia(prev => {
            const nuevas = [...prev.reglas];
            nuevas.splice(index, 1);
            return { ...prev, reglas: nuevas };
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const resEmpresa = await fetch(`${API_URL}/api/empresas/mi-empresa`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataEmpresa = await resEmpresa.json();

            if (dataEmpresa.success && dataEmpresa.data) {
                const emp = dataEmpresa.data;
                setEmpresa(emp);

                setFormEmpresa({
                    nombre: emp.nombre || '',
                    logo: emp.logo || '',
                    telefono: emp.telefono || '',
                    correo: emp.correo || ''
                });

                // La configuración ya viene incluida en la respuesta de /mi-empresa
                const cfg = emp;
                if (cfg.idioma || cfg.zona_horaria || cfg.formato_fecha) {
                    // Cuidado: cfg (emp) tiene su propio campo 'id' de empresa, 
                    // se debe poner al final para que no sea sobrescrito!
                    setConfiguracion({ ...cfg, id: emp.configuracion_id });

                    // Estructura por defecto para orden_credenciales
                    let ordenCredenciales = {
                        huella: { prioridad: 1, activo: true },
                        rostro: { prioridad: 2, activo: true },
                        codigo: { prioridad: 3, activo: true }
                    };

                    setFormConfig({
                        idioma: cfg.idioma || 'es',
                        es_mantenimiento: cfg.es_mantenimiento || false,
                        formato_fecha: cfg.formato_fecha || 'DD/MM/YYYY',
                        formato_hora: cfg.formato_hora || '24',
                        zona_horaria: cfg.zona_horaria || 'America/Mexico_City',
                        intentos_maximos: cfg.intentos_maximos || 3,
                        orden_credenciales: ordenCredenciales,
                        requiere_salida: cfg.requiere_salida ?? true
                    });

                    // Cargar segmentos de red
                    if (cfg.segmentos_red) {
                        try {
                            const parsed = typeof cfg.segmentos_red === 'string' ? JSON.parse(cfg.segmentos_red) : cfg.segmentos_red;
                            setListaRedes(Array.isArray(parsed) ? parsed : []);
                        } catch (e) { console.error(e); }
                    }
                } else if (emp.configuracion_id) {
                    // Fallback: cargar config por separado si no viene incluida
                    const resConfig = await fetch(`${API_URL}/api/configuracion/${emp.configuracion_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const dataConfig = await resConfig.json();

                    if (dataConfig.success) {
                        const cfg2 = dataConfig.data;
                        setConfiguracion(cfg2);

                        let ordenCredenciales = {
                            huella: { prioridad: 1, activo: true },
                            rostro: { prioridad: 2, activo: true },
                            codigo: { prioridad: 3, activo: true }
                        };

                        if (cfg2.orden_credenciales) {
                            try {
                                const parsed = typeof cfg2.orden_credenciales === 'string'
                                    ? JSON.parse(cfg2.orden_credenciales)
                                    : cfg2.orden_credenciales;
                                if (Array.isArray(parsed)) {
                                    ordenCredenciales = {};
                                    parsed.forEach((metodo, index) => {
                                        ordenCredenciales[metodo] = { prioridad: index + 1, activo: true };
                                    });
                                } else {
                                    ordenCredenciales = parsed;
                                }
                                delete ordenCredenciales.tarjeta;
                            } catch (e) {
                                console.error("Error parseando orden_credenciales", e);
                            }
                        }

                        setFormConfig({
                            idioma: cfg2.idioma || 'es',
                            es_mantenimiento: cfg2.es_mantenimiento || false,
                            formato_fecha: cfg2.formato_fecha || 'DD/MM/YYYY',
                            formato_hora: cfg2.formato_hora || '24',
                            zona_horaria: cfg2.zona_horaria || 'America/Mexico_City',
                            intentos_maximos: cfg2.intentos_maximos || 3,
                            orden_credenciales: ordenCredenciales,
                            requiere_salida: cfg2.requiere_salida ?? true
                        });

                        // Cargar segmentos de red
                        if (cfg2.segmentos_red) {
                            try {
                                const parsed = typeof cfg2.segmentos_red === 'string' ? JSON.parse(cfg2.segmentos_red) : cfg2.segmentos_red;
                                setListaRedes(Array.isArray(parsed) ? parsed : []);
                            } catch (e) { console.error(e); }
                        }
                    }
                }
            }

            // Cargar la tolerancia global
            const resTolerancia = await fetch(`${API_URL}/api/tolerancias`, { headers: { 'Authorization': `Bearer ${token}` } });
            const dataTol = await resTolerancia.json();

            if (dataTol.success && dataTol.data?.length > 0) {
                // Tomar la primera global configurada
                const general = dataTol.data[0];
                setTolerancia(general);
                cargarFormTolerancia(general);
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

            // Guardar Empresa (usando endpoint de tenant, no SaaS Owner)
            const resEmpresa = await fetch(`${API_URL}/api/empresas/mi-empresa`, {
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
                    body: JSON.stringify({ ...formConfig, segmentos_red: listaRedes, intervalo_bloques_minutos: formIntervaloBloques, requiere_salida: formConfig.requiere_salida })
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
                if (!dataTol.success) throw new Error('Error al actualizar opciones de tolerancia');

                // Actualizar local
                setTolerancia(dataTol.data);
            } else {
                // CREATE (si no existiera ninguna configurada)
                const payload = {
                    ...formTolerancia,
                    nombre: 'Tolerancia Global'
                };

                const resTol = await fetch(`${API_URL}/api/tolerancias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTol}` },
                    body: JSON.stringify(payload)
                });
                const dataTol = await resTol.json();
                if (!dataTol.success) throw new Error('Error al crear tolerancia');

                // Asignar local
                setTolerancia(dataTol.data);
            }

            // Se eliminó la nota de 'no se guarda listaRedes' porque ya se añadió al payload formConfig arriba
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
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors shadow-sm">
                                                <FiUpload className="w-4 h-4" />
                                                Subir imagen
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <span className="flex items-center gap-2"><FiPhone className="w-4 h-4" /> Teléfono de contacto</span>
                                        </label>
                                        <input type="tel" id="telefono" value={formEmpresa.telefono}
                                            onChange={(e) => setFormEmpresa(prev => ({ ...prev, telefono: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
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
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                <span className="flex items-center gap-2"><FiLock className="w-4 h-4" /> Intentos máximos de inicio de sesión</span>
                                            </label>
                                            <input type="number" min="1" max="10" value={formConfig.intentos_maximos}
                                                onChange={(e) => setFormConfig(prev => ({ ...prev, intentos_maximos: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ej. 3" />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bloquea temporalmente la cuenta tras fallos consecutivos.</p>
                                        </div>

                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="pt-0.5">
                                                    <input type="checkbox" id="mantenimiento" checked={formConfig.es_mantenimiento}
                                                        onChange={(e) => setFormConfig(prev => ({ ...prev, es_mantenimiento: e.target.checked }))}
                                                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor="mantenimiento" className="block text-sm font-medium text-gray-900 dark:text-yellow-100 mb-1">
                                                        Modo Mantenimiento
                                                    </label>
                                                    <p className="text-xs text-gray-600 dark:text-yellow-200/70 leading-relaxed">
                                                        Al activar esta opción, <strong>solo los administradores</strong> podrán acceder al sistema. Los empleados verán una pantalla de "En Mantenimiento".
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Prioridad de Autenticación</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Activa o desactiva los métodos de validación y define su prioridad para el reloj checador.
                                        </p>

                                        <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                            {getMetodosOrdenados().map((metodo, index) => {
                                                const metodoInfo = METODOS_AUTH.find(m => m.id === metodo.id) || { label: metodo.id, icon: '' };
                                                const ordenados = getMetodosOrdenados();

                                                return (
                                                    <div
                                                        key={metodo.id}
                                                        className={`flex items-center justify-between p-5 rounded-2xl border shadow-lg transition-all transform hover:scale-[1.01] ${metodo.activo
                                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            {/* Número de prioridad con gradiente */}
                                                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black shadow-inner ${metodo.activo
                                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                                                : 'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                {index + 1}
                                                            </span>

                                                            {/* Icono y nombre */}
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-bold ${metodo.activo ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 line-through'}`}>
                                                                    {metodoInfo.label}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Prioridad de acceso</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            {/* Toggle con estilo moderno */}
                                                            <button
                                                                onClick={() => toggleMetodo(metodo.id)}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${metodo.activo ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition-all duration-300 ${metodo.activo ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>

                                                            {/* Botones de prioridad estilizados */}
                                                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                                                <button
                                                                    onClick={() => moveMetodo(metodo.id, 'up')}
                                                                    disabled={index === 0}
                                                                    className="p-1.5 text-gray-500 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-20 transition-all"
                                                                >
                                                                    <FiArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveMetodo(metodo.id, 'down')}
                                                                    disabled={index === ordenados.length - 1}
                                                                    className="p-1.5 text-gray-500 hover:bg-white dark:hover:bg-gray-600 rounded-md disabled:opacity-20 transition-all"
                                                                >
                                                                    <FiArrowDown className="w-3.5 h-3.5" />
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

                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Modo Oscuro</h4>
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <span className="flex items-center gap-2"><FiGlobe className="w-4 h-4" /> Idioma del Sistema</span>
                                        </label>
                                        <select value={formConfig.idioma}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, idioma: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="es">Español</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zona Horaria</label>
                                        <select value={formConfig.zona_horaria}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, zona_horaria: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato de Fecha</label>
                                        <select value={formConfig.formato_fecha}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, formato_fecha: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 31/12/2023)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (Ej: 12/31/2023)</option>
                                            <option value="YYYY/MM/DD">YYYY/MM/DD (Ej: 2023/12/31)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <span className="flex items-center gap-2"><FiClock className="w-4 h-4" /> Formato de Hora</span>
                                        </label>
                                        <select value={formConfig.formato_hora}
                                            onChange={(e) => setFormConfig(prev => ({ ...prev, formato_hora: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
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

                                <div className="flex justify-between items-center mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                                            <FiClock className="text-blue-600 dark:text-blue-300 w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Reglas de Tolerancia Global</h3>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                Estas políticas se aplicarán uniformemente a toda la empresa.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Reglas de Asistencia y Retardos</h3>
                                            <p className="text-xs text-gray-500 mt-1">Define los rangos de tiempo y sus consecuencias asociadas.</p>
                                        </div>
                                        <button
                                            onClick={handleAddRegla}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm transition-all"
                                        >
                                            <FiChevronRight className="w-4 h-4 rotate-90" /> Nueva Regla
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(formTolerancia.reglas || []).map((regla, index) => (
                                            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden group">
                                                {/* Indicador lateral de color */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${index === 0 ? 'bg-green-500' :
                                                    index === 1 ? 'bg-yellow-500' :
                                                        index === 2 ? 'bg-orange-500' : 'bg-red-500'
                                                    }`} />

                                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                    {/* Badge de Orden */}
                                                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                                        <span className="text-xs font-bold text-gray-400 uppercase">R{index + 1}</span>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Clasificación</label>
                                                            <div className="relative">
                                                                <input type="text" value={regla.id}
                                                                    onChange={(e) => handleUpdateRegla(index, 'id', e.target.value)}
                                                                    className="w-full pl-3 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Ej: Puntual" />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Hasta (minutos)</label>
                                                            <div className="relative">
                                                                <input type="number" min="0" value={regla.limite_minutos}
                                                                    onChange={(e) => handleUpdateRegla(index, 'limite_minutos', parseInt(e.target.value))}
                                                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500" />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Acción</label>
                                                            <select value={regla.penalizacion_tipo || 'nada'}
                                                                onChange={(e) => {
                                                                    handleUpdateRegla(index, 'penalizacion_tipo', e.target.value);
                                                                    if (e.target.value === 'acumulacion') {
                                                                        handleUpdateRegla(index, 'aplica_acumulacion', true);
                                                                    } else {
                                                                        handleUpdateRegla(index, 'aplica_acumulacion', false);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500">
                                                                <option value="nada">Permitir registro</option>
                                                                <option value="acumulacion">Acumular falta</option>
                                                            </select>
                                                        </div>

                                                        {regla.penalizacion_tipo === 'acumulacion' && (
                                                            <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Límite conteo</label>
                                                                <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg pr-3">
                                                                    <input type="number" min="1" value={regla.penalizacion_valor || 0}
                                                                        onChange={(e) => handleUpdateRegla(index, 'penalizacion_valor', parseInt(e.target.value))}
                                                                        className="w-full px-3 py-2 bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0" />
                                                                    <span className="text-[10px] font-bold text-blue-500 uppercase">veces</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-shrink-0 flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleRemoveRegla(index)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Eliminar regla"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {(!formTolerancia.reglas || formTolerancia.reglas.length === 0) && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-dashed border-yellow-200 dark:border-yellow-700/50 text-center">
                                                <FiAlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                                                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">Sin reglas configuradas</h4>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300/70 mt-1 max-w-sm mx-auto">
                                                    El sistema usará la lógica predeterminada: 0-10m Puntual, 11-20m Retardo A, etc.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Lógica de Asistencia</h3>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                    <FiArrowRight className="text-blue-500" />
                                                    ¿Requerir registro de salida?
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                                                    Si se desactiva, el bloque se considerará completado al marcar la entrada. Ideal para empresas con horarios flexibles o salidas no controladas.
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formConfig.requiere_salida}
                                                    onChange={(e) => setFormConfig(prev => ({ ...prev, requiere_salida: e.target.checked }))}
                                                    className="sr-only peer" />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Límites de Registro (Ventanas de Tiempo)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                    <FiArrowUp className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                                                </div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Anticipación entrada (min)</label>
                                            </div>
                                            <input type="number" min="0" max="180" value={formTolerancia.minutos_anticipado_max}
                                                onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_anticipado_max: parseInt(e.target.value) }))}
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-bold"
                                                disabled={!formTolerancia.permite_registro_anticipado} />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">Margen permitido antes de la hora oficial.</p>
                                        </div>

                                        {formConfig.requiere_salida && (
                                            <>
                                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-right-4 duration-300">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                                            <FiArrowDown className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                                                        </div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Anticipación salida (min)</label>
                                                    </div>
                                                    <input type="number" min="0" max="180" value={formTolerancia.minutos_anticipo_salida}
                                                        onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_anticipo_salida: parseInt(e.target.value) }))}
                                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">Margen permitido antes de la hora oficial de salida.</p>
                                                </div>

                                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-right-4 duration-400">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                                            <FiClock className="text-orange-600 dark:text-orange-400 w-5 h-5" />
                                                        </div>
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Posterior a salida (min)</label>
                                                    </div>
                                                    <input type="number" min="0" max="1440" value={formTolerancia.minutos_posterior_salida}
                                                        onChange={(e) => setFormTolerancia(prev => ({ ...prev, minutos_posterior_salida: parseInt(e.target.value) }))}
                                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">Tiempo límite para marcar salida. Después genera 'Salida no cumplida'.</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                    <FiLayout className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
                                                </div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Intervalo de Bloques (min)</label>
                                            </div>
                                            <input type="number" min="0" value={formIntervaloBloques}
                                                onChange={(e) => setFormIntervaloBloques(parseInt(e.target.value) || 0)}
                                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-bold" />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">Margen para unir turnos seguidos en un solo bloque operativo.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Comportamiento</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <input type="checkbox" id="anticipado" checked={formTolerancia.permite_registro_anticipado}
                                                    onChange={(e) => setFormTolerancia(prev => ({ ...prev, permite_registro_anticipado: e.target.checked }))}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                <label htmlFor="anticipado" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer w-full">Permitir registro anticipado</label>
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
                                                    <label htmlFor={dia} className="text-sm text-gray-700 dark:text-gray-300 capitalize cursor-pointer">{dia}</label>
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
                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Agregar nuevo punto de acceso (CIDR)
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={nuevaIP}
                                                    onChange={(e) => setNuevaIP(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAgregarRed()}
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all font-mono text-sm dark:text-white ${errorIP ? 'border-red-300 focus:ring-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800'
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
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                            El sistema validará que la IP tenga el formato correcto y su máscara de subred (0-32).
                                        </p>
                                    </div>

                                    {/* Lista de IPs */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                                            <span>Nodos activos en la malla</span>
                                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                {listaRedes.length} Total
                                            </span>
                                        </h4>

                                        {listaRedes.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                                                <FiWifi className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay puntos de red configurados aún.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {listaRedes.map((ip, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm group hover:border-blue-300 dark:hover:border-blue-500 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                                <FiGlobe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span className="font-mono text-sm text-gray-700 dark:text-gray-200">{ip}</span>
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