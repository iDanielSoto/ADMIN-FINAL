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

    const [animationState, setAnimationState] = useState('idle'); // idle, start, falling, squash, ripple, expanding, done

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
            // Usar deferUpdate: true para controlar la animación antes de redirigir
            const result = await login(formData.usuario, formData.contraseña, true);

            if (!result.success) {
                setError(result.message || 'Error al iniciar sesión');
                setIsSubmitting(false);
            } else {
                // Secuencia de animación "MÁS AGUA" - Lenta y Pesada
                setAnimationState('start');

                setTimeout(() => {
                    setAnimationState('falling'); // Cae pesadamente (1500ms)

                    setTimeout(() => {
                        setAnimationState('squash'); // Impacto violento (300ms)

                        setTimeout(() => {
                            setAnimationState('ripple'); // Inicia ondas masivas
                            setAnimationState('expanding'); // Inundación

                            setTimeout(() => {
                                if (result.confirmLogin) {
                                    result.confirmLogin();
                                }
                            }, 2500); // Tiempo largo para disfrutar la inundación
                        }, 250); // Tiempo de splash
                    }, 1400); // Tiempo de caída (ligeramente menos que la transición para impacto)
                }, 100);
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1a73e8] overflow-hidden relative font-sans flex items-center justify-center">

            {/* Animación de Gota con Deformación */}
            {animationState !== 'idle' && (
                <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">

                    {/* Fondo Inmersivo */}
                    <div
                        className={`absolute inset-0 bg-blue-900 transition-opacity duration-[2000ms] ease-out ${['ripple', 'expanding'].includes(animationState) ? 'opacity-100' : 'opacity-0'
                            }`}
                    />

                    {/* Ondas de Choque Multiples (Efecto Oleaje) */}
                    {[0, 150, 300, 450].map((delay, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-full border-[15px] border-blue-300/30 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 transition-all ease-out ${['ripple', 'expanding'].includes(animationState)
                                ? 'w-[300vmax] h-[300vmax] opacity-0 duration-[3000ms] border-[300px]'
                                : 'w-0 h-0 opacity-100 border-[0px] duration-0'
                                }`}
                            style={{ transitionDelay: `${delay}ms` }}
                        />
                    ))}

                    {/* Gota Principal */}
                    <div
                        className={`absolute bg-gradient-to-b from-blue-300 to-blue-600 shadow-2xl transition-all transform -translate-x-1/2 left-1/2 ${animationState === 'start'
                            ? '-top-40 w-24 h-32 opacity-100 duration-0 rounded-[50%] rounded-t-[0%] translate-y-0 scale-y-100'
                            : animationState === 'falling'
                                ? 'top-1/2 w-20 h-36 opacity-100 duration-[1500ms] ease-in rounded-full -translate-y-1/2 scale-y-110'
                                : animationState === 'squash'
                                    ? 'top-1/2 w-48 h-12 opacity-100 duration-[200ms] ease-out rounded-[40%] -translate-y-1/2 scale-x-150 scale-y-40'
                                    : ['ripple', 'expanding'].includes(animationState)
                                        ? 'top-1/2 w-[500vmax] h-[500vmax] opacity-100 duration-[2000ms] ease-in rounded-full -translate-y-1/2 scale-100'
                                        : 'opacity-0'
                            }`}
                    >
                        {/* Reflejos Realistas */}
                        <div className="absolute top-[20%] left-[25%] w-[20%] h-[15%] bg-white rounded-full opacity-60 blur-sm"></div>
                    </div>
                </div>
            )}

            {/* Contenedor del Contenido (Se deforma al impacto) */}
            <div
                className={`flex flex-col items-center justify-center w-full max-w-md transition-all duration-300 ease-out transform ${['squash', 'ripple'].includes(animationState)
                    ? 'scale-90 blur-[4px] skew-x-2 skew-y-2 brightness-125' // Distorsión violenta al impacto
                    : animationState === 'falling'
                        ? 'scale-100 blur-[0.5px]' // Ligera tensión mientras cae
                        : 'scale-100 blur-0'
                    }`}
            >
                {/* Sección de Logo y Marca */}
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-wide drop-shadow-md">FASITLAC™</h1>
                    <p className="text-blue-100 text-sm mt-2 font-medium drop-shadow-sm">Fábrica de Software del ITLAC</p>
                </div>

                {/* Card del Formulario */}
                <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
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
        </div>
    );
};

export default Login;