import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DynamicLoader from '../components/common/DynamicLoader';
import {
    FiUser,
    FiLock,
    FiEye,
    FiEyeOff,
    FiAlertCircle,
    FiArrowRight,
    FiChevronLeft,
    FiBriefcase
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
    const [empresas, setEmpresas] = useState(null); // lista de empresas si multi-tenant
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

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

    const [animationState, setAnimationState] = useState('idle');

    // Re-enviar login con empresa_id seleccionado (multi-tenant)
    const handleSubmitWithEmpresa = async (empresaId) => {
        setIsSubmitting(true);
        setError('');
        try {
            const result = await login(formData.usuario, formData.contraseña, true, empresaId);
            if (!result.success) {
                setError(result.message || 'Error al iniciar sesión');
                setIsSubmitting(false);
            } else {
                setAnimationState('start');
                setTimeout(() => {
                    setAnimationState('falling');
                    setTimeout(() => {
                        setAnimationState('squash');
                        setTimeout(() => {
                            setAnimationState('ripple');
                            setAnimationState('expanding');
                            setTimeout(() => {
                                if (result.confirmLogin) result.confirmLogin();
                            }, 2500);
                        }, 250);
                    }, 1400);
                }, 100);
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
            setIsSubmitting(false);
        }
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
            const empresaId = empresaSeleccionada || null;
            const result = await login(formData.usuario, formData.contraseña, true, empresaId);

            // Multi-tenant: mostrar selector de empresas
            if (result.multiTenant) {
                setEmpresas(result.empresas);
                setIsSubmitting(false);
                return;
            }

            if (!result.success) {
                setError(result.message || 'Error al iniciar sesión');
                setIsSubmitting(false);
            } else {
                // Secuencia de animación
                setAnimationState('start');

                setTimeout(() => {
                    setAnimationState('falling');

                    setTimeout(() => {
                        setAnimationState('squash');

                        setTimeout(() => {
                            setAnimationState('ripple');
                            setAnimationState('expanding');

                            setTimeout(() => {
                                if (result.confirmLogin) {
                                    result.confirmLogin();
                                }
                            }, 2500);
                        }, 250);
                    }, 1400);
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

                        {/* ─── SELECTOR DE EMPRESA (multi-tenant) ─── */}
                        {empresas ? (
                            <div className="space-y-6">
                                <button
                                    type="button"
                                    onClick={() => { setEmpresas(null); setEmpresaSeleccionada(null); setError(''); }}
                                    className="flex items-center gap-1 text-sm font-semibold text-[#1a73e8] hover:text-blue-700 transition-colors"
                                >
                                    <FiChevronLeft className="w-4 h-4" /> Volver
                                </button>

                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-gray-800">Selecciona tu empresa</h2>
                                    <p className="text-sm text-gray-500 mt-2">Tu cuenta está registrada en varias empresas</p>
                                </div>

                                <div className="space-y-3">
                                    {empresas.map((emp) => (
                                        <button
                                            key={emp.empresa_id}
                                            type="button"
                                            onClick={() => {
                                                setEmpresaSeleccionada(emp.empresa_id);
                                                // Re-enviar login automáticamente con la empresa elegida
                                                setEmpresas(null);
                                                setTimeout(() => {
                                                    // Disparar submit con empresa_id
                                                    const fakeEvent = { preventDefault: () => { } };
                                                    // Seteamos empresaSeleccionada y hacemos submit
                                                    handleSubmitWithEmpresa(emp.empresa_id);
                                                }, 50);
                                            }}
                                            className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-[#1a73e8] rounded-xl transition-all duration-200 flex items-center gap-4 group"
                                        >
                                            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors">
                                                <FiBriefcase className="w-6 h-6 text-[#1a73e8]" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className="font-bold text-gray-800 group-hover:text-[#1a73e8] transition-colors">{emp.nombre}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Clic para ingresar</p>
                                            </div>
                                            <FiArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#1a73e8] transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ─── FORMULARIO DE LOGIN NORMAL ─── */
                            <>
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
                            </>
                        )}
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