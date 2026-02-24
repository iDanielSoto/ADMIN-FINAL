import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarWithAuth from '../Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut } from 'lucide-react' // Importamos LogOut
import ConfirmBox from '../ConfirmBox';
import NotificationBell from '../NotificationBell';

// Configuración de páginas
const pageConfig = {
    '/': { titulo: 'Dashboard', descripcion: 'Resumen general del sistema' },
    '/dashboard': { titulo: 'Dashboard', descripcion: 'Resumen general del sistema' },
    '/empleados': { titulo: 'Empleados', descripcion: 'Gestión de empleados' },
    '/roles': { titulo: 'Roles', descripcion: 'Gestión de roles y permisos' },
    '/horarios': { titulo: 'Horarios', descripcion: 'Gestión de horarios' },
    '/departamentos': { titulo: 'Departamentos', descripcion: 'Gestión de departamentos' },
    '/dispositivos': { titulo: 'Dispositivos', descripcion: 'Gestión de dispositivos' },
    '/incidencias': { titulo: 'Incidencias', descripcion: 'Gestión de incidencias' },
    '/reportes': { titulo: 'Reportes', descripcion: 'Reportes y estadísticas' },
    '/configuracion': { titulo: 'Configuración', descripcion: 'Configuración del sistema' },
    '/avisos': { titulo: 'Avisos', descripcion: 'Gestión de avisos y notificaciones' },
    '/registros': { titulo: 'Registros', descripcion: 'Historial de registros del sistema' },
};

// Obtiene la configuración de página, incluyendo rutas dinámicas
const getPageConfig = (pathname) => {
    // Ruta exacta
    if (pageConfig[pathname]) {
        return pageConfig[pathname];
    }
    // Ruta dinámica de perfil de usuario
    if (pathname.startsWith('/empleados/usuario/')) {
        return { titulo: 'Perfil de Usuario', descripcion: 'Información detallada del usuario' };
    }

    // Fallback: Generar título basado en la ruta si no existe en la configuración
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Capitalizar la primera letra y reemplazar guiones/bajos con espacios
        const generatedTitle = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/[-_]/g, ' ');
        return { titulo: generatedTitle, descripcion: '' };
    }

    return { titulo: 'Página', descripcion: '' };
};

const getInitials = (nombre) => {
    if (!nombre) return '?';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
};

/**
 * Layout principal con autenticación
 */
const MainLayout = ({ children }) => {
    const { user, logout } = useAuth(); // Obtenemos logout del contexto
    const location = useLocation();
    const navigate = useNavigate();

    // Verificar si estamos en modo impersonación
    const isImpersonating = !!localStorage.getItem('saas_auth_token');

    // Obtener config de la página actual
    const currentPage = getPageConfig(location.pathname);

    // Función para cerrar sesión
    const [confirmAction, setConfirmAction] = useState(null);

    const handleLogout = () => {
        setConfirmAction({
            message: '¿Estás seguro de que deseas cerrar sesión?',
            onConfirm: async () => {
                setConfirmAction(null);
                // Si estamos impersonando, también limpiamos el token de saas
                localStorage.removeItem('saas_auth_token');
                await logout();
                navigate('/login');
            }
        });
    };

    const handleTerminarImpersonacion = () => {
        const saasToken = localStorage.getItem('saas_auth_token');
        if (saasToken) {
            localStorage.setItem('auth_token', saasToken);
            localStorage.removeItem('saas_auth_token');
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="select-none flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar con autenticación */}
            <SidebarWithAuth />

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto flex flex-col">
                {/* Banner de Impersonación */}
                {isImpersonating && (
                    <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between z-30 shadow-md">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            MODO IMPERSONACIÓN: Estás operando como Administrador del Tenant
                        </div>
                        <button
                            onClick={handleTerminarImpersonacion}
                            className="bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm"
                        >
                            Volver al Panel SaaS
                        </button>
                    </div>
                )}

                {/* Header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors duration-200">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {currentPage.titulo}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {currentPage.descripcion}
                        </p>
                    </div>

                    {/* Acciones del header */}
                    <div className="flex items-center gap-4">

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Perfil de Usuario */}
                        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
                            onClick={() => navigate(`/empleados/usuario/${user?.usuario?.usuario}`)}
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none">
                                    {user?.usuario?.nombre}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {user?.roles?.[0]?.nombre || 'Usuario'}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white overflow-hidden">
                                {user?.usuario?.foto ? (
                                    <img src={user.usuario.foto} alt={user.usuario.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{getInitials(user?.usuario?.nombre)}</span>
                                )}
                            </div>
                        </div>

                        {/* Separador vertical para Logout */}
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        {/* Botón Logout */}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Contenido */}
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            {confirmAction && <ConfirmBox message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
        </div>
    );
};

export default MainLayout;