import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/Apiconfig';
import { FiGlobe, FiSearch, FiPlus, FiArrowRight, FiActivity, FiLogIn } from 'react-icons/fi';
import DynamicLoader from '../components/common/DynamicLoader';
import Pagination from '../components/Pagination';
import NuevaEmpresaModal from '../components/NuevaEmpresaModal';

const EmpresasSaaS = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para Modal Nuevo Tenant

    // Paginación
    const [pagina, setPagina] = useState(1);
    const elementosPorPagina = 9;

    const API_URL = API_CONFIG.BASE_URL;

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_URL}/api/empresas`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error al obtener las empresas');
                }

                setEmpresas(data.data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmpresas();
    }, [API_URL]);

    const handleImpersonate = async (empresaId) => {
        try {
            const token = localStorage.getItem('auth_token');
            // Guardamos el token SaaS original para poder regresar
            localStorage.setItem('saas_auth_token', token);

            const res = await fetch(`${API_URL}/api/auth/impersonate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ empresa_id: empresaId })
            });
            const data = await res.json();

            if (data.success) {
                // Sobrescribir el token con el token impersonado
                localStorage.setItem('auth_token', data.data.token);
                // Forzar recarga completa para limpiar estados de React (Redux/Contextos) y arrancar en modo Tenant
                window.location.href = '/dashboard';
            } else {
                alert(data.message || 'Error al impersonar empresa');
            }
        } catch (err) {
            console.error('Error en impersonación:', err);
            alert('Error de conexión al intentar ingresar a la empresa');
        }
    };

    const handleEmpresaCreada = (nuevaEmpresa) => {
        // Añadir la nueva empresa al inicio del listado y cerrar modal
        setEmpresas(prev => [nuevaEmpresa, ...prev]);
        setSearchTerm('');
        setPagina(1);
    };

    // Filtrar localmente por búsqueda
    const filteredEmpresas = empresas.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.identificador && e.identificador.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calcular páginas a partir de los elementos filtrados
    const totalPaginas = Math.ceil(filteredEmpresas.length / elementosPorPagina);
    const empresasPaginadas = filteredEmpresas.slice(
        (pagina - 1) * elementosPorPagina,
        pagina * elementosPorPagina
    );

    // Reiniciar a página 1 cuando se realiza una búsqueda
    useEffect(() => {
        setPagina(1);
    }, [searchTerm]);

    if (loading) return <DynamicLoader text="Cargando panel maestro..." />;

    return (
        <div className="select-none space-y-6">

            {/* Controles Principales */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o identificador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-600 outline-none transition text-gray-800 font-medium"
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                    <FiPlus className="w-5 h-5" /> Registrar Nueva Empresa
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100 flex items-center gap-2">
                    <FiActivity className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Listado Principal de Empresas SaaS */}
            <div className="mt-8 card">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Directorio de Entidades</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {empresasPaginadas.map((empresa) => (
                        <div key={empresa.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md transition-all flex flex-col overflow-hidden group relative min-h-[140px]">

                            {/* Capa de opacidad para asegurar legibilidad */}
                            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/80 z-0"></div>

                            {/* Marca de agua gráfica del Logo (Detrás del Título) */}
                            {empresa.logo && (
                                <img
                                    src={empresa.logo}
                                    alt="watermark"
                                    className="absolute -right-6 -top-6 w-36 h-36 object-contain opacity-[0.10] dark:opacity-[0.05] group-hover:opacity-[0.15] dark:group-hover:opacity-[0.10] transition-all duration-500 filter blur-sm transform rotate-12 group-hover:scale-110 group-hover:-rotate-6 z-0"
                                />
                            )}

                            <div className="relative z-10 p-5 flex-grow flex flex-col justify-center">
                                <div className="z-20">
                                    <h3 className="font-extrabold text-xl text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors drop-shadow-sm">
                                        {empresa.nombre}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                            {empresa.identificador || 'Sin ID'}
                                        </p>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${empresa.es_activo ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                            {empresa.es_activo ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex px-3 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 relative z-10 mt-auto justify-between gap-2">
                                <button
                                    onClick={() => handleImpersonate(empresa.id)}
                                    title="Entrar como Administrador de esta empresa"
                                    className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded transition-colors text-xs font-bold flex justify-center items-center gap-1"
                                >
                                    <FiLogIn className="w-3.5 h-3.5" /> Entrar
                                </button>

                                <button
                                    onClick={() => navigate(`/empresas/${empresa.id}`)}
                                    title="Configuración SaaS de la Empresa"
                                    className="flex-1 px-3 py-1.5 bg-gray-100 font-bold hover:bg-primary-50 text-gray-700 hover:text-primary-700 dark:bg-gray-700 dark:hover:bg-primary-900/30 dark:text-gray-300 dark:hover:text-primary-400 rounded transition-colors text-xs flex justify-center items-center gap-1"
                                >
                                    Configurar <FiArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredEmpresas.length === 0 && !loading && (
                        <div className="col-span-full py-16 text-center border-dashed border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                            <FiSearch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No hay resultados</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Prueba buscando con otro identificador.</p>
                        </div>
                    )}
                </div>

                {filteredEmpresas.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Pagination
                            pagina={pagina}
                            totalPaginas={totalPaginas}
                            total={filteredEmpresas.length}
                            porPagina={elementosPorPagina}
                            onChange={setPagina}
                        />
                    </div>
                )}
            </div>

            {/* Modal de Aprovisionamiento */}
            <NuevaEmpresaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEmpresaCreada={handleEmpresaCreada}
            />
        </div>
    );
};

export default EmpresasSaaS;
