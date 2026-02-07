import React from 'react';
import { FiEdit2, FiMail, FiPhone, FiChevronRight, FiTrash2, FiRefreshCw } from 'react-icons/fi';

const UserCard = ({ usuario, onEdit, onViewProfile, onDelete, onReactivar }) => {

    const getInitials = (nombre) => {
        if (!nombre) return '?';
        const parts = nombre.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nombre.substring(0, 2).toUpperCase();
    };

    const statusBadge = {
        activo: 'bg-green-100 text-green-700',
        suspendido: 'bg-yellow-100 text-yellow-700',
        baja: 'bg-red-100 text-red-700'
    };

    return (
        <div
            onClick={() => onViewProfile(usuario.usuario)}
            className={`group relative border rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer ${usuario.estado_cuenta === 'baja'
                    ? 'bg-gray-50 dark:bg-gray-900/50 border-red-200 dark:border-red-900/30 opacity-75'
                    : usuario.estado_cuenta === 'suspendido'
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
        >
            <div className="flex items-center gap-4">
                {/* 1. Avatar */}
                <div className="flex-shrink-0">
                    {usuario.foto ? (
                        <img
                            src={usuario.foto}
                            alt={usuario.nombre}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(usuario.nombre)}
                        </div>
                    )}
                </div>

                {/* 2. Información Principal (Nombre y Usuario) */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {usuario.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{usuario.usuario}</p>
                    </div>

                    {/* 3. Contacto (Oculto en móviles muy pequeños si deseas, o visible) */}
                    <div className="hidden md:block">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <FiMail className="w-3 h-3" />
                            <span className="truncate">{usuario.correo}</span>
                        </div>
                        {usuario.telefono && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <FiPhone className="w-3 h-3" />
                                <span>{usuario.telefono}</span>
                            </div>
                        )}
                    </div>

                    {/* 4. Badges de Rol y Estado */}
                    <div className="flex items-center gap-2">
                        {usuario.es_empleado && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                                Empleado
                            </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${usuario.estado_cuenta === 'activo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                usuario.estado_cuenta === 'suspendido' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                            {usuario.estado_cuenta}
                        </span>
                    </div>
                </div>

                {/* 5. Acciones */}
                <div className="flex items-center gap-1 pl-4 border-l border-gray-100 dark:border-gray-700">
                    {usuario.estado_cuenta === 'baja' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReactivar && onReactivar(usuario);
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors"
                            title="Reactivar usuario"
                        >
                            <FiRefreshCw className="w-3.5 h-3.5" /> Reactivar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(usuario);
                                }}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                title="Editar"
                            >
                                <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete && onDelete(usuario);
                                }}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Dar de baja"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
            </div>
        </div>
    );
};

export default UserCard;