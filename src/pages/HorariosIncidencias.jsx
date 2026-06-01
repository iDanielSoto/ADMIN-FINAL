import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';
import Horarios from './Horarios';
import Incidencias from './Incidencias';
import { useAuth } from '../context/AuthContext';

/**
 * Página unificada de Horarios e Incidencias con pestañas internas
 */
const HorariosIncidencias = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    
    // Determinar pestaña inicial basada en la URL o permisos
    const [activeTab, setActiveTab] = useState(() => {
        if (location.hash === '#incidencias') return 'incidencias';
        if (hasPermission('HORARIO_VER')) return 'horarios';
        if (hasPermission('HORARIO_GESTIONAR')) return 'incidencias';
        return 'horarios';
    });

    // Permisos específicos para las pestañas
    const canSeeHorarios = hasPermission('HORARIO_VER');
    const canSeeIncidencias = hasPermission('HORARIO_GESTIONAR') || hasPermission('HORARIO_VER');

    useEffect(() => {
        // Sincronizar hash de la URL con la pestaña
        const hash = location.hash.replace('#', '');
        if (hash === 'incidencias' && canSeeIncidencias) {
            setActiveTab('incidencias');
        } else if (hash === 'horarios' && canSeeHorarios) {
            setActiveTab('horarios');
        }
    }, [location.hash, canSeeHorarios, canSeeIncidencias]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`#${tab}`);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Navegación de Pestañas */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {canSeeHorarios && (
                    <button
                        onClick={() => handleTabChange('horarios')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'horarios'
                                ? 'text-blue-600 dark:text-primary-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Calendario de Horarios
                        {activeTab === 'horarios' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-primary-500" />
                        )}
                    </button>
                )}
                {canSeeIncidencias && (
                    <button
                        onClick={() => handleTabChange('incidencias')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'incidencias'
                                ? 'text-blue-600 dark:text-primary-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        Incidencias y Justificantes
                        {activeTab === 'incidencias' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-primary-500" />
                        )}
                    </button>
                )}
            </div>

            {/* Contenido de la Pestaña */}
            <div className="transition-all duration-300">
                {activeTab === 'horarios' && canSeeHorarios && <Horarios isSubpage={true} />}
                {activeTab === 'incidencias' && canSeeIncidencias && <Incidencias isSubpage={true} />}
                
                {!canSeeHorarios && activeTab === 'horarios' && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Acceso Restringido</h3>
                        <p className="text-gray-500 dark:text-gray-400">No tienes permisos para ver los horarios.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HorariosIncidencias;
