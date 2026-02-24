import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiGlobe, FiActivity, FiShield, FiAlertTriangle, FiImage } from 'react-icons/fi';
import { API_CONFIG } from '../config/Apiconfig';
import DynamicLoader from '../components/common/DynamicLoader';

const ConfigurarEmpresaSaaS = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const [empresa, setEmpresa] = useState({
        nombre: '',
        logo: '',
        es_activo: true,
        telefono: '',
        correo: '',
        limite_empleados: '',
        limite_dispositivos: '',
        fecha_vencimiento: ''
    });

    const API_URL = API_CONFIG.BASE_URL;

    useEffect(() => {
        fetchEmpresaDetails();
    }, [id]);

    const fetchEmpresaDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/empresas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al obtener detalles de la empresa');
            }

            if (data.success && data.data) {
                setEmpresa({
                    nombre: data.data.nombre || '',
                    logo: data.data.logo || '',
                    es_activo: data.data.es_activo ?? true,
                    telefono: data.data.telefono || '',
                    correo: data.data.correo || '',
                    limite_empleados: data.data.limite_empleados || '',
                    limite_dispositivos: data.data.limite_dispositivos || '',
                    fecha_vencimiento: data.data.fecha_vencimiento ? data.data.fecha_vencimiento.split('T')[0] : ''
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEmpresa(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccessMsg('');

            const dataToSubmit = { ...empresa };
            if (dataToSubmit.limite_empleados === '') dataToSubmit.limite_empleados = null;
            if (dataToSubmit.limite_dispositivos === '') dataToSubmit.limite_dispositivos = null;
            if (dataToSubmit.fecha_vencimiento === '') dataToSubmit.fecha_vencimiento = null;

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/empresas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSubmit)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar la configuración');
            }

            setSuccessMsg('Configuración actualizada correctamente');

            // Ocultar mensaje despues de 3 seg
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DynamicLoader text="Obteniendo configuración del Tenant..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* Cabecera / Navegacion */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/empresas')}
                    className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin. Instancia (Tenant)</h1>
                    <p className="text-sm text-gray-500 font-mono">ID: {id}</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 flex items-center gap-2">
                    <FiAlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 font-bold rounded-lg border border-green-100 flex items-center gap-2">
                    <FiShield className="w-5 h-5" /> {successMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Visualizador de Identidad */}
                <div className="md:col-span-1 space-y-6">
                    <div className="card text-center flex flex-col items-center p-8">
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center p-2 mb-4 overflow-hidden shadow-inner">
                            {empresa.logo ? (
                                <img src={empresa.logo} alt="Logo Prev" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <FiGlobe className="w-12 h-12 text-gray-300" />
                            )}
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-words max-w-full">
                            {empresa.nombre || 'Sin Nombre'}
                        </h2>
                        <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs uppercase font-extrabold tracking-widest ${empresa.es_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {empresa.es_activo ? 'Operativo' : 'Suspendido'}
                        </span>
                    </div>

                    <div className="card bg-gray-900 border-none shadow-xl text-white">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <FiShield className="text-blue-400" /> Control Maestro
                        </h3>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                            Al suspender una instancia, se bloqueará inmediatamente el inicio de sesión para todos los empleados y administradores de esta empresa.
                        </p>

                        <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="es_activo"
                                    className="sr-only"
                                    checked={empresa.es_activo}
                                    onChange={handleChange}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${empresa.es_activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${empresa.es_activo ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 font-bold text-sm">
                                Instancia Activa
                            </div>
                        </label>
                    </div>
                </div>

                {/* Formulario Principal */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="card space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
                            Datos Generales del Cliente
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial / Razón Social <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="nombre"
                                    required
                                    value={empresa.nombre}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                    placeholder="Ej. Corporativo FASITLAC"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Teléfono de Contacto</label>
                                    <input
                                        type="tel"
                                        name="telefono"
                                        value={empresa.telefono}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Correo Administrador</label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={empresa.correo}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <FiImage className="text-gray-400" /> URL del Logotipo
                                </label>
                                <input
                                    type="url"
                                    name="logo"
                                    value={empresa.logo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900 font-mono text-sm"
                                    placeholder="https://ejemplo.com/logo.png"
                                />
                                <p className="text-xs text-gray-500 mt-2 font-medium">Proporcione una URL pública de imagen. Se recomienda formato transparente (PNG/SVG).</p>
                            </div>
                        </div>

                        {/* Bloque: Configuración de Licencia SaaS */}
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-2 flex items-center gap-2">
                                <FiShield className="text-primary-500" /> Configuración de Licencia
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Top de Empleados</label>
                                    <input
                                        type="number"
                                        name="limite_empleados"
                                        min="1"
                                        value={empresa.limite_empleados}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                        placeholder="Ej. 50 (Vacio = Ilimitado)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tope Dispositivos</label>
                                    <input
                                        type="number"
                                        name="limite_dispositivos"
                                        min="1"
                                        value={empresa.limite_dispositivos}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                        placeholder="Ej. 10 (Vacio = Ilimitado)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha Expiración</label>
                                    <input
                                        type="date"
                                        name="fecha_vencimiento"
                                        value={empresa.fecha_vencimiento}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition font-medium text-gray-900"
                                        placeholder="Vacio = Nunca expira"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <FiActivity className="animate-spin w-5 h-5" /> : <FiSave className="w-5 h-5" />}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConfigurarEmpresaSaaS;
