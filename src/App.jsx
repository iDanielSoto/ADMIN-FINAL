import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { ConfigProvider } from './context/ConfigContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';
import { protectedRoutes, specialRoutes } from './config/routes';

// Páginas que no usan lazy loading (críticas para UX)
import Login from './pages/InicioSesion';
import Error404 from './pages/Error404';

// Componente de loading para Suspense
const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
        </div>
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NetworkProvider>
                    <ConfigProvider>
                        <ThemeProvider>
                            <AppRoutes />
                        </ThemeProvider>
                    </ConfigProvider>
                </NetworkProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

// Definición de rutas de la aplicación
function AppRoutes() {
    const { isAuthenticated, loading } = useAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Ruta de Login */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Login />
                    }
                />

                {/* Rutas protegidas generadas dinámicamente */}
                {protectedRoutes.map(({ path, component: Component, requireAdmin }) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <ProtectedRoute requireAdmin={requireAdmin}>
                                <MainLayout>
                                    <Component />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                ))}

                {/* Rutas especiales (con parámetros) */}
                {specialRoutes.map(({ path, component: Component, requireAdmin }) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <ProtectedRoute requireAdmin={requireAdmin}>
                                <MainLayout>
                                    <Component />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                ))}

                {/* Ruta 404 */}
                <Route path="*" element={<Error404 />} />
            </Routes>
        </Suspense>
    );
}

export default App;