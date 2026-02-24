import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiX, FiGlobe, FiUser, FiActivity, FiShield, FiSave, FiInfo } from 'react-icons/fi';
import { API_CONFIG } from '../config/Apiconfig';

const NuevaEmpresaModal = ({ isOpen, onClose, onEmpresaCreada }) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const [formParams, setFormParams] = useState({
        nombre: '',
        telefono: '',
        correo: '', // Correo de contacto general (opcional)
        logo: '',
        admin_usuario: '', // Requerido para SaaS
        admin_correo: '',  // Requerido para SaaS
        limite_empleados: '',
        limite_dispositivos: '',
        fecha_vencimiento: ''
    });

    const API_URL = API_CONFIG.BASE_URL;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGenerateUsername = () => {
        if (!formParams.nombre) return;
        const baseNombre = formParams.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = Math.floor(Math.random() * 900) + 100;
        setFormParams(prev => ({
            ...prev,
            admin_usuario: `admin_${baseNombre.substring(0, 10)}${suffix}`
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);

            // Procesar valores para que envíe null si están vacíos
            const dataToSubmit = { ...formParams };
            if (dataToSubmit.limite_empleados === '') dataToSubmit.limite_empleados = null;
            if (dataToSubmit.limite_dispositivos === '') dataToSubmit.limite_dispositivos = null;
            if (dataToSubmit.fecha_vencimiento === '') dataToSubmit.fecha_vencimiento = null;

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/api/empresas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSubmit)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al aprovisionar la nueva empresa');
            }

            // Mostrar la credencial generada
            setSuccessData(data.data.admin);

            // Informar a la ventana padre para refrescar
            if (onEmpresaCreada) onEmpresaCreada(data.data.empresa);

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Modal */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiGlobe className="text-primary-500" /> Aprovisionar Nuevo Tenant
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Este proceso creará el entorno aislado y un administrador maestro.
                        </p>
                    </div>
                    {!successData && (
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 flex items-start gap-2 text-sm">
                            <FiActivity className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {successData ? (
                        // PANTALLA DE ÉXITO Y CREDENCIALES
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <FiShield className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Instancia Creada Exitosamente!</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    El entorno de la empresa ha sido configurado. Comparte las siguientes credenciales de acceso con el contacto del cliente:
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-sm text-left shadow-inner">
                                <div className="mb-4">
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Nombre de Usuario</span>
                                    <div className="font-mono text-lg font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-100 dark:border-gray-700">
                                        {successData.usuario}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Contraseña Temporal</span>
                                    <div className="font-mono text-lg font-bold text-red-600 bg-red-50 px-3 py-2 rounded border border-red-100">
                                        {successData.password_temporal}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-start gap-2 text-left max-w-sm">
                                <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>Recomienda al cliente acceder a la plataforma y cambiar su contraseña inmediatamente tras el primer inicio de sesión.</p>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-4 px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg transition-colors"
                            >
                                Entendido, Cerrar
                            </button>
                        </div>
                    ) : (
                        // FORMULARIO DE CREACIÓN
                        <form id="formNuevaEmpresa" onSubmit={handleSubmit} className="space-y-8">

                            {/* Bloque 1: Datos Generales */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700">1. Identidad del Cliente</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            required
                                            value={formParams.nombre}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Ej. Corporativo FASITLAC"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Teléfono Global</label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formParams.telefono}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Opcional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Correo Global</label>
                                        <input
                                            type="email"
                                            name="correo"
                                            value={formParams.correo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Opcional (Facturación, etc)"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">URL del Logotipo (PNG/JPG)</label>
                                        <input
                                            type="url"
                                            name="logo"
                                            value={formParams.logo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                            placeholder="https://ejemplo.com/logo.png"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bloque 2: Administrador Principal */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <FiUser /> 2. Credenciales del Administrador
                                </h3>

                                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-4">
                                    <p className="text-sm text-yellow-800">
                                        Se creará automáticamente la cuenta de Administrador Base para que el cliente pueda acceder a configurar sus horarios y empleados. <strong>La contraseña predeterminada será "12345678"</strong>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico (Login) <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            name="admin_correo"
                                            required
                                            value={formParams.admin_correo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="admin@empresa.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Usuario (Alias) <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="admin_usuario"
                                                required
                                                value={formParams.admin_usuario}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                                placeholder="Ej. admin_fasit"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGenerateUsername}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                Sugerir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bloque 3: Configuración de Licencia SaaS */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <FiShield /> 3. Configuración de Licencia
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Límite de Trabajadores</label>
                                        <input
                                            type="number"
                                            name="limite_empleados"
                                            min="1"
                                            value={formParams.limite_empleados}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Ej. 50 (Vacio = Ilimitado)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Límite de Dispositivos</label>
                                        <input
                                            type="number"
                                            name="limite_dispositivos"
                                            min="1"
                                            value={formParams.limite_dispositivos}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Ej. 10 (Vacio = Ilimitado)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha de Expiración</label>
                                        <input
                                            type="date"
                                            name="fecha_vencimiento"
                                            value={formParams.fecha_vencimiento}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Vacio = Nunca expira"
                                        />
                                    </div>
                                </div>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer Modal Actions */}
                {!successData && (
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 font-bold rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="formNuevaEmpresa"
                            disabled={saving}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <FiActivity className="animate-spin w-5 h-5" /> : <FiSave className="w-5 h-5" />}
                            {saving ? 'Aprovisionando...' : 'Crear y Aprovisionar Tenant'}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default NuevaEmpresaModal;
