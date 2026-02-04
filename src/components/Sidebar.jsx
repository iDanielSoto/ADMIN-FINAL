import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Book, Users, Calendar, Settings, BarChart3, AlertCircle, Menu, X, ChevronLeft, Building2, Shield, Cpu } from 'lucide-react'
import { useRealTime } from '../hooks/useRealTime';

import { API_CONFIG } from '../config/Apiconfig';
const API_URL = API_CONFIG.BASE_URL;

// Menú principal (Sin configuración)
const menuItems = [
    { id: 'dashboard', nombre: 'Dashboard', icono: Home, ruta: '/dashboard' },
    { id: 'empleados', nombre: 'Empleados', icono: Users, ruta: '/empleados' },
    { id: 'roles', nombre: 'Roles', icono: Shield, ruta: '/roles' },
    { id: 'horarios', nombre: 'Horarios', icono: Calendar, ruta: '/horarios' },
    { id: 'departamentos', nombre: 'Departamentos', icono: Building2, ruta: '/departamentos' },
    { id: 'dispositivos', nombre: 'Dispositivos', icono: Cpu, ruta: '/dispositivos' },
    { id: 'incidencias', nombre: 'Incidencias', icono: AlertCircle, ruta: '/incidencias' },
    { id: 'reportes', nombre: 'Reportes', icono: BarChart3, ruta: '/reportes' },
    { id: 'registros', nombre: 'Registros', icono: Book, ruta: '/registros' },
];

/**
 * Sidebar con menú estático y Configuración en el footer
 */
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [empresa, setEmpresa] = useState(null);

    // Cargar datos de la empresa
    useEffect(() => {
        const fetchEmpresa = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_URL}/api/empresas?es_activo=true`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success && result.data?.length > 0) {
                    setEmpresa(result.data[0]);
                }
            } catch (err) {
                console.error('Error al cargar empresa:', err);
            }
        };
        fetchEmpresa();
    }, []);

    useRealTime({
        'empresa-actualizada': (data) => {
            if (data && data.es_activo) {
                setEmpresa(prev => ({ ...prev, ...data }));
            }
        }
    });

    const handleMenuClick = (ruta) => {
        setIsMobileOpen(false);
        navigate(ruta);
    };

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
    const toggleCollapsed = () => setIsCollapsed(!isCollapsed);

    // Renderiza un botón de menú (reutilizable para la lista y el footer)
    const renderMenuButton = (item) => {
        const IconComponent = item.icono;
        const isActive = location.pathname === item.ruta;

        return (
            <button
                key={item.id}
                onClick={() => handleMenuClick(item.ruta)}
                className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.nombre : ''}
            >
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                )}

                <IconComponent
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                />

                {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                        <div className={`font-medium text-sm truncate ${isActive ? 'text-primary-700' : 'text-gray-700'
                            }`}>
                            {item.nombre}
                        </div>
                    </div>
                )}

                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.nombre}
                    </div>
                )}
            </button>
        );
    };

    return (
        <>
            {/* Botón hamburguesa móvil */}
            <button
                onClick={toggleMobile}
                className="select-none lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-2 bg-white rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.35)] border border-gray-200">
                {isMobileOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                )}
            </button>

            {/* Overlay móvil */}
            {isMobileOpen && (
                <div
                    className="select-none lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={toggleMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          select-none fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 
          transition-all duration-300 z-40 flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Header con logo y nombre de empresa */}
                <div className={`h-16 flex items-center border-b border-gray-200 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {empresa?.logo ? (
                                    <img
                                        src={empresa.logo}
                                        alt={empresa.nombre}
                                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-sm">
                                            {empresa?.nombre?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-sm text-gray-800 block leading-tight truncate">
                                        {empresa?.nombre || 'Cargando...'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={toggleCollapsed}
                                className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={toggleCollapsed}
                            className="hidden lg:flex w-12 h-12 items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                            title={empresa?.nombre || 'Expandir'}
                        >
                            {empresa?.logo ? (
                                <img
                                    src={empresa.logo}
                                    alt={empresa.nombre}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                        {empresa?.nombre?.charAt(0) || '?'}
                                    </span>
                                </div>
                            )}
                        </button>
                    )}
                </div>

                {/* Contenido del Menú (Scrollable) */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'py-2' : 'py-4'}`}>
                    <nav className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {menuItems.map((item) => renderMenuButton(item))}
                    </nav>
                </div>

                {/* Footer del Sidebar (Configuración) */}
                <div className={`flex-shrink-0 border-t border-gray-200 bg-white ${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'}`}>
                    <nav className="space-y-1">
                        {renderMenuButton({
                            id: 'configuracion',
                            nombre: 'Configuración',
                            icono: Settings,
                            ruta: '/configuracion'
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;