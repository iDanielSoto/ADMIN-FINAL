import React from 'react';
import { FiUser, FiCalendar, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { fusionarBloquesContinuos, timeToMinutes, DIAS_SEMANA } from '../../utils/scheduleUtils';

const HORA_MIN = 6 * 60;  // 6:00
const HORA_MAX = 22 * 60; // 22:00
const RANGO = HORA_MAX - HORA_MIN;

const MiniTimeline = ({ configuracion }) => {
    if (!configuracion?.configuracion_semanal) return null;

    const config = configuracion.configuracion_semanal;

    return (
        <div className="space-y-1">
            {DIAS_SEMANA.map(dia => {
                const turnos = config[dia.key] || [];
                const bloques = fusionarBloquesContinuos(turnos);

                return (
                    <div key={dia.key} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 w-5 text-right">{dia.short}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-sm relative overflow-hidden">
                            {bloques.map((bloque, i) => {
                                const start = timeToMinutes(bloque.inicio);
                                const end = timeToMinutes(bloque.fin);
                                const left = ((start - HORA_MIN) / RANGO) * 100;
                                const width = ((end - start) / RANGO) * 100;

                                return (
                                    <div
                                        key={i}
                                        className={`absolute top-0 h-full rounded-sm ${bloque.fusionado ? 'bg-blue-400' : 'bg-blue-500'}`}
                                        style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` }}
                                        title={`${bloque.inicio} - ${bloque.fin}${bloque.fusionado ? ' (fusionado)' : ''}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {/* Leyenda de horas */}
            <div className="flex items-center gap-2">
                <span className="w-5" />
                <div className="flex-1 flex justify-between text-[10px] text-gray-400">
                    <span>6:00</span>
                    <span>14:00</span>
                    <span>22:00</span>
                </div>
            </div>
        </div>
    );
};

const ScheduleCard = ({ horario, empleadoNombre, onEdit, onDelete, onReactivar }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
                        <FiUser className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                            {empleadoNombre}
                        </h3>
                    </div>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${horario.es_activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {horario.es_activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            {/* Fechas */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-700">Inicio:</span>
                    <span>{new Date(horario.fecha_inicio).toLocaleDateString('es-MX')}</span>
                </div>
                {horario.fecha_fin ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700">Fin:</span>
                        <span>{new Date(horario.fecha_fin).toLocaleDateString('es-MX')}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                        <FiCalendar className="w-4 h-4 flex-shrink-0" />
                        <span>Sin fecha de fin</span>
                    </div>
                )}
            </div>

            {/* Mini Timeline Semanal */}
            <div className="flex-1 border-t border-gray-100 pt-3 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Bloques semanales</p>
                <MiniTimeline configuracion={horario.configuracion} />
            </div>

            {/* Footer */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                {horario.es_activo ? (
                    <>
                        <button
                            onClick={() => onEdit(horario)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiEdit2 className="w-4 h-4" />
                            Editar
                        </button>
                        <button
                            onClick={() => onDelete(horario)}
                            className="flex items-center justify-center px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent"
                            title="Desactivar horario"
                        >
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onReactivar(horario)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        Reactivar
                    </button>
                )}
            </div>
        </div>
    );
};

export default ScheduleCard;
