import React, { useState, useMemo } from 'react';
import { fusionarBloquesContinuos, timeToMinutes, DIAS_SEMANA, EMPLOYEE_COLORS } from '../../utils/scheduleUtils';

const HORA_INICIO = 6;
const HORA_FIN = 22;
const TOTAL_HORAS = HORA_FIN - HORA_INICIO;
const ROW_HEIGHT_PX = 48; // px por hora

const WeeklyCalendar = ({ horarios, getEmpleadoNombre }) => {
    const [hoveredBlock, setHoveredBlock] = useState(null);

    // Preparar datos: por cada día, lista de bloques con color y empleado
    const datosPorDia = useMemo(() => {
        const result = {};
        DIAS_SEMANA.forEach(dia => { result[dia.key] = []; });

        horarios.forEach((horario, idx) => {
            if (!horario.configuracion?.configuracion_semanal) return;
            const color = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
            const nombre = getEmpleadoNombre(horario);
            const config = horario.configuracion.configuracion_semanal;

            DIAS_SEMANA.forEach(dia => {
                const turnos = config[dia.key] || [];
                if (turnos.length === 0) return;
                const bloques = fusionarBloquesContinuos(turnos);
                bloques.forEach(bloque => {
                    result[dia.key].push({
                        ...bloque,
                        empleadoNombre: nombre,
                        horarioId: horario.id,
                        color,
                        empleadoIdx: idx
                    });
                });
            });
        });

        return result;
    }, [horarios, getEmpleadoNombre]);

    const horas = [];
    for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
        horas.push(h);
    }

    const getBlockStyle = (bloque) => {
        const startMin = timeToMinutes(bloque.inicio);
        const endMin = timeToMinutes(bloque.fin);
        const topPx = ((startMin - HORA_INICIO * 60) / 60) * ROW_HEIGHT_PX;
        const heightPx = ((endMin - startMin) / 60) * ROW_HEIGHT_PX;
        return { top: `${topPx}px`, height: `${heightPx}px` };
    };

    // Agrupar bloques superpuestos por columna dentro de cada día
    const layoutBloques = (bloques) => {
        if (bloques.length === 0) return [];

        const sorted = [...bloques].sort((a, b) => timeToMinutes(a.inicio) - timeToMinutes(b.inicio));
        const columns = [];

        sorted.forEach(bloque => {
            const startMin = timeToMinutes(bloque.inicio);
            let placed = false;
            for (let col = 0; col < columns.length; col++) {
                const lastInCol = columns[col][columns[col].length - 1];
                if (timeToMinutes(lastInCol.fin) <= startMin) {
                    columns[col].push(bloque);
                    bloque._col = col;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                bloque._col = columns.length;
                columns.push([bloque]);
            }
        });

        const totalCols = columns.length;
        sorted.forEach(b => {
            b._totalCols = totalCols;
        });

        return sorted;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header de días */}
            <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
                <div className="p-3 bg-gray-50 border-r border-gray-200" />
                {DIAS_SEMANA.map(dia => (
                    <div key={dia.key} className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 border-r border-gray-100 last:border-r-0">
                        {dia.label}
                    </div>
                ))}
            </div>

            {/* Grid de horas */}
            <div className="grid overflow-y-auto" style={{ gridTemplateColumns: '60px repeat(7, 1fr)', maxHeight: '600px' }}>
                {/* Columna de horas + columnas de días */}
                <div className="relative border-r border-gray-200 bg-gray-50">
                    {horas.map(h => (
                        <div
                            key={h}
                            className="flex items-start justify-end pr-2 text-xs text-gray-500"
                            style={{ height: `${ROW_HEIGHT_PX}px` }}
                        >
                            <span className="-mt-2">{String(h).padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>

                {DIAS_SEMANA.map(dia => {
                    const bloques = layoutBloques(datosPorDia[dia.key]);

                    return (
                        <div key={dia.key} className="relative border-r border-gray-100 last:border-r-0">
                            {/* Líneas de hora */}
                            {horas.map(h => (
                                <div
                                    key={h}
                                    className="border-b border-gray-100"
                                    style={{ height: `${ROW_HEIGHT_PX}px` }}
                                />
                            ))}

                            {/* Bloques de horario */}
                            {bloques.map((bloque, i) => {
                                const style = getBlockStyle(bloque);
                                const colWidth = 100 / bloque._totalCols;
                                const isHovered = hoveredBlock === `${dia.key}-${i}`;

                                return (
                                    <div
                                        key={i}
                                        className={`absolute rounded-md border px-1.5 py-0.5 overflow-hidden cursor-default transition-shadow
                                            ${bloque.color.bg} ${bloque.color.border} ${bloque.color.text}
                                            ${isHovered ? 'shadow-lg z-10 ring-2 ring-offset-1 ring-blue-400' : 'shadow-sm'}`}
                                        style={{
                                            ...style,
                                            left: `${bloque._col * colWidth + 1}%`,
                                            width: `${colWidth - 2}%`,
                                            minWidth: '30px'
                                        }}
                                        onMouseEnter={() => setHoveredBlock(`${dia.key}-${i}`)}
                                        onMouseLeave={() => setHoveredBlock(null)}
                                    >
                                        <p className="text-[10px] font-semibold truncate leading-tight">{bloque.empleadoNombre}</p>
                                        <p className="text-[10px] truncate leading-tight opacity-80">{bloque.inicio} - {bloque.fin}</p>
                                        {bloque.fusionado && (
                                            <p className="text-[9px] opacity-60 leading-tight">fusionado</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Leyenda de empleados */}
            {horarios.length > 0 && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-3">
                        {horarios.map((horario, idx) => {
                            const color = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
                            return (
                                <div key={horario.id} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded-sm ${color.bg} border ${color.border}`} />
                                    <span className="text-xs text-gray-600">{getEmpleadoNombre(horario)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyCalendar;
