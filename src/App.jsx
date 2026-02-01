import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/InicioSesion';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';
import Dashboard from './pages/Tablero';
import Empleados from './pages/Empleados';
import Configuracion from './pages/Configuracion';
import PerfilUsuario from './pages/PerfilUsuario'
import Horarios from './pages/Horarios';
import Departamentos from './pages/Departamentos';
import Roles from './pages/Roles';
import Dispositivos from './pages/Dispositivos'
import Incidencias from './pages/Incidencias'
import Reportes from './pages/Reportes';
import Registros from './pages/Registros'
import Error404 from './pages/Error404'

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

// Definición de rutas de la aplicación
function AppRoutes() {
    const { isAuthenticated, loading } = useAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando aplicación...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Ruta de Login */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                }
            />

            {/* Rutas protegidas */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Dashboard */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Empleados */}
            <Route
                path="/empleados"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Empleados />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="empleados/usuario/:username"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <PerfilUsuario />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Horarios */}
            <Route
                path="/horarios"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Horarios />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Departamentos */}
            <Route
                path="/departamentos"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Departamentos />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Roles */}
            <Route
                path="/roles"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Roles />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Dispositivos */}
            <Route
                path='/dispositivos'
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Dispositivos />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Incidencias */}
            <Route
                path='/incidencias'
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Incidencias />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Reportes */}
            <Route
                path="/reportes"
                element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Reportes />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/registros"
                element={
                    <ProtectedRoute requireAdmin={true}>
                        <MainLayout>
                            <Registros />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Configuración (solo admin) */}
            <Route
                path="/configuracion"
                element={
                    <ProtectedRoute requireAdmin={true}>
                        <MainLayout>
                            <Configuracion />
                        </MainLayout>
                    </ProtectedRoute>
                }
            />

            {/* Ruta 404 */}
            <Route path="*"
                element={
                    <Error404 />
                }
            />
        </Routes>
    );
}

export default App;