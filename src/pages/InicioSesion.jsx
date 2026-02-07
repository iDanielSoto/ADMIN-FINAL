import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    FiUser,
    FiLock,
    FiEye,
    FiEyeOff,
    FiAlertCircle,
    FiClock
} from 'react-icons/fi';

/**
 * Componente de Login para el sistema Checador
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

    // Toggle mostrar/ocultar contraseña
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            {/* Contenedor principal */}
            <div className="w-full max-w-md">
                {/* Card de Login */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header con logo */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-10 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <FiClock className="w-10 h-10 text-primary-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Checador
                        </h1>
                        <p className="text-blue-100 text-sm">
                            Sistema de Control de Asistencias
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="px-8 py-8">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
                            Iniciar Sesión
                        </h2>

                        {/* Mensaje de error */}
                        {(error || authError) && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-800 font-medium">
                                        {error || authError}
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Campo Usuario */}
                            <div>
                                <label htmlFor="usuario" className="label">
                                    Usuario o Correo
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="usuario"
                                        name="usuario"
                                        value={formData.usuario}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        placeholder="tu.usuario o correo@ejemplo.com"
                                        autoComplete="username"
                                        autoFocus
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div>
                                <label htmlFor="contraseña" className="label">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="contraseña"
                                        name="contraseña"
                                        value={formData.contraseña}
                                        onChange={handleChange}
                                        className="input pl-10 pr-10"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleShowPassword}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <FiEyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <FiEye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Recordar sesión */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        defaultChecked
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        Recordar sesión
                                    </span>
                                </label>

                                <a
                                    href="#"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            {/* Botón de submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || loading}
                                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting || loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            ¿No tienes cuenta?{' '}
                            <a href="#" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                                Contacta al administrador
                            </a>
                        </p>
                    </div>
                </div>

                {/* Info adicional */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">FASITLAC</span> © 2026 - Sistema Checador v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;