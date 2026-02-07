import React from 'react';
import { FiEdit2, FiTrash2, FiMapPin, FiUsers, FiRefreshCw } from 'react-icons/fi';

const DepartamentsCard = ({ depto, onEdit, onDelete, onReactivar, onFocus }) => {

    const getInitials = (nombre) => {
        if (!nombre) return '--';
        const parts = nombre.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nombre.substring(0, 2).toUpperCase();
    };

    return (
        <div
            onClick={() => onFocus(depto)}
            style={{ borderTop: `4px solid ${depto.es_activo === false ? '#EF4444' : (depto.color?.startsWith('#') ? depto.color : `#${depto.color || '6B7280'}`)}` }}
            className={`rounded-xl shadow-sm border hover:shadow-md transition-all flex flex-col h-full overflow-hidden group cursor-pointer ${depto.es_activo === false
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-red-200 dark:border-red-900/30 opacity-75'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className={`font-bold text-lg line-clamp-1 ${depto.es_activo === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`} title={depto.nombre}>
                            {depto.nombre}
                        </h3>
                        {depto.es_activo === false && <span className="flex-shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded">Desactivado</span>}
                    </div>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                        {depto.es_activo === false ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReactivar && onReactivar(depto);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
                                title="Reactivar"
                            >
                                <FiRefreshCw className="w-3.5 h-3.5" /> Reactivar
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(depto);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(depto);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Desactivar"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">
                    {depto.descripcion || 'Sin descripción'}
                </p>

                {/* Jefes (Avatares) */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                        {depto.jefes?.slice(0, 3).map((jefe, i) => (
                            jefe.foto ? (
                                <img key={i} src={jefe.foto} alt={jefe.nombre || 'Jefe'} title={jefe.nombre || 'Sin nombre'} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover" />
                            ) : (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300" title={jefe.nombre || 'Sin nombre'}>
                                    {getInitials(jefe.nombre)}
                                </div>
                            )
                        ))}
                        {(depto.jefes?.length || 0) > 3 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                +{depto.jefes.length - 3}
                            </div>
                        )}
                        {(depto.jefes?.length || 0) === 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic pl-1">Sin jefes</span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <div className="flex items-center gap-1" title="Empleados">
                            <FiUsers className="w-3.5 h-3.5" />
                            {depto.empleados_count || 0}
                        </div>
                        <div className="flex items-center gap-1" title="Zonas Geográficas">
                            <FiMapPin className="w-3.5 h-3.5" />
                            {depto.ubicacion?.zonas?.length || 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartamentsCard;