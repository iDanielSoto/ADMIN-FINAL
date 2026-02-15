import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DynamicLoader from '../components/common/DynamicLoader';
import {
    FiUser,
    FiLock,
    FiEye,
    FiEyeOff,
    FiAlertCircle,
    FiArrowRight
} from 'react-icons/fi';


/**
 * Componente de Login rediseñado estilo App Móvil
 */
const Login = () => {
    const { login, loading, error: authError } = useAuth();
    const [formData, setFormData] = useState({
        usuario: '',
        contraseña: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Limpiar error al escribir
        if (error) setError('');
    };

    // Manejar submit del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.usuario.trim()) {
            setError('El usuario o correo es requerido');
            return;
        }

        if (!formData.contraseña) {
            setError('La contraseña es requerida');
            return;
        }

        if (formData.contraseña.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = await login(formData.usuario, formData.contraseña);

            if (!result.success) {
                setError(result.message || 'Error al iniciar sesión');
            }
            // Si es exitoso, el AuthContext redirigirá automáticamente
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1a73e8] flex flex-col items-center justify-center p-4 font-sans">

            {/* Sección de Logo y Marca */}
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-wide">FASITLAC™</h1>
                <p className="text-blue-100 text-sm mt-1">Fábrica de Software del ITLAC</p>
            </div>

            {/* Card del Formulario */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Iniciar Sesión
                    </h2>

                    {/* Mensaje de error */}
                    {(error || authError) && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 font-medium">
                                {error || authError}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Usuario */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600 ml-1">
                                Usuario o Correo
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiUser className="w-5 h-5 text-[#1a73e8]" />
                                </div>
                                <input
                                    type="text"
                                    name="usuario"
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all outline-none font-medium"
                                    placeholder="edgaryahir@gmail.com"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600 ml-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="w-5 h-5 text-[#1a73e8]" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="contraseña"
                                    value={formData.contraseña}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all outline-none font-medium"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Olvidaste contraseña */}
                        <div className="flex justify-end pt-1">
                            <a href="#" className="text-sm font-semibold text-[#1a73e8] hover:text-blue-700 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="w-full py-4 bg-[#1a73e8] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting || loading ? (
                                <DynamicLoader text="Iniciando..." size="tiny" color="white" />
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <FiArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Footer en Card */}
                        <div className="pt-4 text-center">
                            <p className="text-sm text-gray-500">
                                ¿No tienes cuenta?{' '}
                                <a href="#" className="text-[#1a73e8] font-bold hover:underline">
                                    Contacta al admin
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Copyright Footer */}
            <div className="mt-8 text-center text-blue-200 text-xs font-medium">
                © 2026 FASITLAC™
            </div>
        </div>
    );
};

export default Login;