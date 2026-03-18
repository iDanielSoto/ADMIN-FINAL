import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiGlobe, FiActivity, FiShield, FiAlertTriangle, FiImage, FiUsers, FiMapPin, FiCheckCircle } from 'react-icons/fi';
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
        fecha_vencimiento: '',
        total_usuarios: 0,
        total_departamentos: 0
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
                    fecha_vencimiento: data.data.fecha_vencimiento ? data.data.fecha_vencimiento.split('T')[0] : '',
                    total_usuarios: parseInt(data.data.total_usuarios) || 0,
                    total_departamentos: parseInt(data.data.total_departamentos) || 0
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

    const consumoEmpleados = empresa.limite_empleados ? (empresa.total_usuarios / empresa.limite_empleados) * 100 : 0;
    const progresoEmpleados = Math.min(consumoEmpleados, 100);
    const colorProgreso = progresoEmpleados > 90 ? 'bg-red-500' : progresoEmpleados > 75 ? 'bg-yellow-500' : 'bg-blue-500';

    return (
        <div className="text-gray-300">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Cabecera / Navegacion */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/empresas')}
                            className="p-2.5 text-gray-400 hover:text-white bg-[#111111] border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-sm"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin. Instancia</h1>
                            <p className="text-sm text-gray-500 font-mono mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                Tenant ID: {id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border
                            ${empresa.es_activo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {empresa.es_activo ? 'Instancia Operativa' : 'Instancia Suspendida'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <FiAlertTriangle className="w-5 h-5 flex-shrink-0" /> <p>{error}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="p-4 bg-green-500/10 text-green-400 font-bold rounded-xl border border-green-500/20 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <FiCheckCircle className="w-5 h-5 flex-shrink-0" /> <p>{successMsg}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Columna Izquierda: Identidad y Control */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Tarjeta de Identidad */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                            {/* Halo decorativo */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mt-10 -mr-10 transition-transform group-hover:scale-150 duration-700"></div>

                            <div className="w-32 h-32 bg-black/50 rounded-2xl border border-white/10 flex items-center justify-center p-3 mb-6 relative z-10 shadow-inner backdrop-blur-xl">
                                {empresa.logo ? (
                                    <img src={empresa.logo} alt="Logo Prev" className="max-w-full max-h-full object-contain drop-shadow-lg" />
                                ) : (
                                    <FiGlobe className="w-12 h-12 text-gray-600" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight break-words max-w-full relative z-10">
                                {empresa.nombre || 'Sin Nombre'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-2 relative z-10 flex items-center gap-2">
                                <FiMapPin className="w-4 h-4" /> Entidad Registrada
                            </p>
                        </div>

                        {/* Tarjeta de Estadísticas de Consumo */}
                        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-2xl">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                                <FiActivity className="text-blue-500" /> Estadísticas de Consumo
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 font-medium flex items-center gap-2"><FiUsers className="w-4 h-4 text-gray-500" />Usuarios en BD</span>
                                        <span className="text-white font-mono font-bold">{empresa.total_usuarios} <span className="text-gray-600 font-normal">/ {empresa.limite_empleados || '∞'}</span></span>
                                    </div>
                                    {empresa.limite_empleados && (
                                        <div className="w-full bg-black/50 rounded-full h-2.5 border border-white/5 overflow-hidden">
                                            <div className={`h-2.5 rounded-full transition-all duration-1000 ${colorProgreso}`} style={{ width: `${progresoEmpleados}%` }}></div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Dptos.</p>
                                        <p className="text-2xl font-black text-white">{empresa.total_departamentos}</p>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Usuarios</p>
                                        <p className="text-2xl font-black text-white">{empresa.total_usuarios}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Control Maestro (Kill Switch) */}
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                                <FiShield className="text-red-400" /> Control Maestro
                            </h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Suspender una instancia bloqueará de inmediato el inicio de sesión para empleados, terminales y administradores asociados a esta empresa.
                            </p>

                            <label className="flex items-center justify-between cursor-pointer group bg-black/40 p-3 rounded-xl border border-white/5 hover:bg-black/60 transition-colors">
                                <div className="font-bold text-sm text-gray-300 group-hover:text-white transition-colors">
                                    {empresa.es_activo ? 'Desactivar Instancia' : 'Reactivar Instancia'}
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="es_activo"
                                        className="sr-only"
                                        checked={empresa.es_activo}
                                        onChange={handleChange}
                                    />
                                    <div className={`block w-12 h-6 rounded-full transition-colors ${empresa.es_activo ? 'bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${empresa.es_activo ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario Principal */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-[#111111] border border-white/5 rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
                            <div className="p-6 sm:p-8 flex-1 space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-4 flex items-center gap-2">
                                        <FiGlobe className="text-blue-500" /> Datos Generales del Cliente
                                    </h3>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Nombre Comercial / Razón Social <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            required
                                            value={empresa.nombre}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder-gray-600"
                                            placeholder="Ej. Corporativo FASITLAC"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Teléfono de Contacto</label>
                                            <input
                                                type="tel"
                                                name="telefono"
                                                value={empresa.telefono}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder-gray-600"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Correo Administrador</label>
                                            <input
                                                type="email"
                                                name="correo"
                                                value={empresa.correo}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder-gray-600"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                                            <FiImage className="text-gray-500" /> URL del Logotipo
                                        </label>
                                        <input
                                            type="url"
                                            name="logo"
                                            value={empresa.logo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-white font-mono text-sm placeholder-gray-600"
                                            placeholder="https://ejemplo.com/logo.png"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 font-medium">Proporcione una URL pública de imagen. Se recomienda formato transparente (PNG/SVG).</p>
                                    </div>
                                </div>

                                {/* Bloque: Configuración de Licencia SaaS */}
                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <h3 className="text-lg font-bold text-white pb-2 flex items-center gap-2">
                                        <FiShield className="text-purple-500" /> Configuración de Licencia
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Tope Empleados</label>
                                            <input
                                                type="number"
                                                name="limite_empleados"
                                                min="1"
                                                value={empresa.limite_empleados}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder-gray-600"
                                                placeholder="Vacío = Ilimitado"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Tope Dispositivos</label>
                                            <input
                                                type="number"
                                                name="limite_dispositivos"
                                                min="1"
                                                value={empresa.limite_dispositivos}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium text-white placeholder-gray-600"
                                                placeholder="Vacío = Ilimitado"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-300 mb-2">Fecha Expiración</label>
                                            <input
                                                type="date"
                                                name="fecha_vencimiento"
                                                value={empresa.fecha_vencimiento}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-medium text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1A1A1A] p-6 border-t border-white/10 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {saving ? <FiActivity className="animate-spin w-5 h-5" /> : <FiSave className="w-5 h-5" />}
                                    {saving ? 'Aplicando Configuración...' : 'Guardar Cambios de Instancia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurarEmpresaSaaS;
