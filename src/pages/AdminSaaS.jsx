import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/Apiconfig';
import { FiUser, FiMail, FiLock, FiPlus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import DynamicLoader from '../components/common/DynamicLoader';

const AdminSaaS = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        usuario: '',
        correo: '',
        contraseña: '',
        nombre: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.usuario || !formData.correo || !formData.contraseña || !formData.nombre) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/super-administradores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear el  Super Administrador.');
            }

            setSuccess(data.message);
            setFormData({ usuario: '', correo: '', contraseña: '', nombre: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user?.esPropietarioSaaS) {
        return (
            <div className="flex items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-red-200">
                <div className="text-center space-y-4">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
                    <p className="text-gray-600">Esta área es exclusiva para los Propietarios del Sistema (SaaS).</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#1a73e8] to-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Panel Maestro (SaaS)</h1>
                    <p className="text-blue-100 max-w-2xl">
                        Registra a nuevos dueños o inversores del sistema con acceso absoluto a todas las empresas clientes.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FiLock className="w-32 h-32" />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Crear Nuevo Propietario</h2>
                        <p className="text-sm text-gray-500">Credenciales maestras para administración global.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                        <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
                        <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nombre Completo</label>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Usuario de Ingreso</label>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="usuario"
                                value={formData.usuario}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Ej. jperez_master"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Correo Electrónico</label>
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="maestro@fasitlac.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Contraseña Segura</label>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="password"
                                name="contraseña"
                                value={formData.contraseña}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Mínimo 8 caracteres..."
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <DynamicLoader text="Creando..." size="tiny" color="white" />
                            ) : (
                                <>
                                    <FiPlus className="w-5 h-5" />
                                    <span>Registrar Propietario SaaS</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSaaS;
