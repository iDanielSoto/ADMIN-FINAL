import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'https://9dm7dqf9-3002.usw3.devtunnels.ms';

// Crear el contexto
const AuthContext = createContext(null);

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

/**
 * Provider del contexto de autenticación
 * Maneja el estado global del usuario autenticado
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verificar sesión al cargar la app
    useEffect(() => {
        checkAuth();
    }, []);

    /**
     * Verificar si hay una sesión activa
     */
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');

            if (token && userData) {
                // Restaurar datos del usuario desde localStorage
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    /**
     * Iniciar sesión
     */
    const login = async (usuario, contraseña) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ usuario, contraseña }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            if (!data.success) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            // Guardar token y datos del usuario
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('user_data', JSON.stringify(data.data));

            setUser(data.data);
            return { success: true };
        } catch (error) {
            console.error('Error en login:', error);
            setError(error.message);
            return {
                success: false,
                message: error.message,
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cerrar sesión
     */
    const logout = async () => {
        try {
            // Llamar al endpoint de logout (opcional)
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar localStorage y estado
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setUser(null);
            setError(null);
        }
    };

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    const hasPermission = (permiso) => {
        if (!user) return false;
        if (user.esAdmin) return true;

        // Verificar permisos bitwise (implementar según tu lógica)
        // Por ahora retornamos true si está autenticado
        return true;
    };

    /**
     * Verificar si el usuario es admin
     */
    const isAdmin = () => {
        return user?.esAdmin || false;
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        isAdmin,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;