import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiTrash2, FiAlertCircle, FiLayers, FiClock, FiZap, FiChevronDown } from 'react-icons/fi';
import ConfirmBox from '../ConfirmBox';
import { fusionarBloquesContinuos, DIAS_SEMANA } from '../../utils/scheduleUtils';

// --- UTILIDADES DE TIEMPO ---

const GENERATE_TIME_OPTIONS = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            times.push(`${hour}:${minute}`);
        }
    }
    times.push("23:59");
    return times;
};

const TIME_OPTIONS = GENERATE_TIME_OPTIONS();

const QUICK_PRESETS = [
    { label: 'Oficina (9-6)', inicio: '09:00', fin: '18:00' },
    { label: 'Matutino (7-3)', inicio: '07:00', fin: '15:00' },
    { label: 'Vespertino (2-10)', inicio: '14:00', fin: '22:00' },
    { label: 'Nocturno (10-6)', inicio: '22:00', fin: '06:00' },
];

// --- COMPONENTE TimeInput (COMBO BOX INTELIGENTE) ---
const TimeInput = ({ value, onChange, error, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Aseguramos que value sea string para evitar crash en startsWith
    const safeValue = value || '';
    const filteredOptions = TIME_OPTIONS.filter(t => t.startsWith(safeValue));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                validateOnBlur();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    const handleInputChange = (e) => {
        const val = e.target.value.replace(/[^0-9:]/g, '');
        if (val.length <= 5) {
            onChange(val);
            setIsOpen(true);
        }
    };

    const validateOnBlur = () => {
        let newVal = safeValue;
        if (newVal.length === 1 && !isNaN(newVal)) newVal = `0${newVal}:00`;
        else if (newVal.length === 2 && !isNaN(newVal)) newVal = `${newVal}:00`;
        else if (newVal.length === 3 && !isNaN(newVal) && !newVal.includes(':')) newVal = `0${newVal.slice(0, 1)}:${newVal.slice(1)}`;
        else if (newVal.length === 4 && !isNaN(newVal) && !newVal.includes(':')) newVal = `${newVal.slice(0, 2)}:${newVal.slice(2)}`;

        if (newVal !== value) {
            onChange(newVal);
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative group">
                <input
                    type="text"
                    value={safeValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder || "HH:MM"}
                    className={`w-full py-2 pl-3 pr-8 border rounded-md text-sm font-medium focus:ring-2 outline-none transition-all ${error
                            ? 'bg-red-50 border-red-300 text-red-700 focus:ring-red-200'
                            : 'bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-700'
                        }`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                    {isOpen ? <FiChevronDown className="w-4 h-4 transform rotate-180" /> : <FiClock className="w-4 h-4" />}
                </div>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg mt-1 text-sm animate-fadeIn">
                    {filteredOptions.map((time) => (
                        <li
                            key={time}
                            onClick={() => {
                                onChange(time);
                                setIsOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${time === value ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}
                        >
                            {time}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ScheduleModal = ({ isOpen, onClose, mode, empleados, initialData, onSave, saving }) => {
    const [formData, setFormData] = useState({
        empleado_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        configuracion_semanal: {
            lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
        }
    });

    const [selectedDay, setSelectedDay] = useState('lunes');
    const [mensaje, setMensaje] = useState(null);
    const [alertMsg, setAlertMsg] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    empleado_id: initialData.empleado_id || '',
                    fecha_inicio: initialData.fecha_inicio?.split('T')[0] || '',
                    fecha_fin: initialData.fecha_fin?.split('T')[0] || '',
                    configuracion_semanal: initialData.configuracion?.configuracion_semanal || {
                        lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
                    }
                });
            } else {
                setFormData({
                    empleado_id: '',
                    fecha_inicio: new Date().toISOString().split('T')[0],
                    fecha_fin: '',
                    configuracion_semanal: {
                        lunes: [], martes: [], miercoles: [], jueves: [], viernes: [], sabado: [], domingo: []
                    }
                });
            }
            setSelectedDay('lunes');
            setMensaje(null);
        }
    }, [isOpen, mode, initialData]);

    const agregarTurno = (inicio = '09:00', fin = '18:00') => {
        const nuevosHorarios = [...formData.configuracion_semanal[selectedDay]];
        nuevosHorarios.push({ inicio, fin });
        actualizarConfigDia(selectedDay, nuevosHorarios);
    };

    const eliminarTurno = (index) => {
        const nuevosHorarios = formData.configuracion_semanal[selectedDay].filter((_, i) => i !== index);
        actualizarConfigDia(selectedDay, nuevosHorarios);
    };

    const actualizarTurno = (index, campo, valor) => {
        const nuevosHorarios = [...formData.configuracion_semanal[selectedDay]];
        nuevosHorarios[index][campo] = valor;
        actualizarConfigDia(selectedDay, nuevosHorarios);
    };

    const actualizarConfigDia = (dia, turnos) => {
        setFormData(prev => ({
            ...prev,
            configuracion_semanal: {
                ...prev.configuracion_semanal,
                [dia]: turnos
            }
        }));
    };

    const copiarDia = () => {
        const turnosOrigen = formData.configuracion_semanal[selectedDay];
        if (turnosOrigen.length === 0) {
            setAlertMsg('No hay turnos para copiar en este día');
            return;
        }

        setConfirmAction({
            message: `¿Copiar turnos del ${selectedDay.toUpperCase()} a TODOS los demás días?`,
            onConfirm: () => {
                setConfirmAction(null);
                const nuevaConfig = { ...formData.configuracion_semanal };
                DIAS_SEMANA.forEach(d => {
                    if (d.key !== selectedDay) {
                        nuevaConfig[d.key] = turnosOrigen.map(t => ({ ...t }));
                    }
                });
                setFormData(prev => ({ ...prev, configuracion_semanal: nuevaConfig }));
            }
        });
    };

    const validar = () => {
        if (!formData.empleado_id) return 'Debes seleccionar un empleado';
        if (!formData.fecha_inicio) return 'Debes especificar una fecha de inicio';
        if (formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) return 'La fecha de fin debe ser posterior a la de inicio';

        const tieneTurnos = Object.values(formData.configuracion_semanal).some(turnos => turnos.length > 0);
        if (!tieneTurnos) return 'Debes configurar al menos un turno en la semana';

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        for (const [dia, turnos] of Object.entries(formData.configuracion_semanal)) {
            for (let i = 0; i < turnos.length; i++) {
                const t1 = turnos[i];
                // Validamos que existan antes de probar el regex
                if (!t1.inicio || !timeRegex.test(t1.inicio)) return `En ${dia}: La hora de inicio "${t1.inicio || 'vacía'}" no es válida`;
                if (!t1.fin || !timeRegex.test(t1.fin)) return `En ${dia}: La hora de fin "${t1.fin || 'vacía'}" no es válida`;

                if (t1.inicio >= t1.fin) return `En ${dia}: La hora de inicio debe ser anterior a la hora fin`;

                for (let j = i + 1; j < turnos.length; j++) {
                    const t2 = turnos[j];
                    if (t2.inicio && t2.fin && (t1.inicio < t2.fin && t1.fin > t2.inicio)) {
                        return `En ${dia}: Hay turnos que se traslapan`;
                    }
                }
            }
        }
        return null;
    };

    const handleSubmit = () => {
        const error = validar();
        if (error) {
            setMensaje({ tipo: 'error', texto: error });
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {mode === 'create' ? 'Nuevo Horario' : 'Editar Horario'}
                        </h2>
                        <p className="text-sm text-gray-500">Configura los turnos laborales semanales</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {mensaje && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-sm">{mensaje.texto}</span>
                        </div>
                    )}

                    {/* Fila 1: Datos Generales */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="md:col-span-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Empleado *</label>
                            <select
                                value={formData.empleado_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, empleado_id: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                disabled={mode === 'edit'}
                            >
                                <option value="">Seleccionar empleado...</option>
                                {empleados.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre} {emp.rfc && `(${emp.rfc})`}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Desde *</label>
                            <input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hasta (Opcional)</label>
                            <input type="date" value={formData.fecha_fin} onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    {/* Fila 2: Configuración Semanal */}
                    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">

                        {/* Izquierda: Selector de Días */}
                        <div className="w-full md:w-1/4 flex flex-col gap-2">
                            <h3 className="font-bold text-gray-800 mb-2 px-1">Días</h3>
                            {DIAS_SEMANA.map(dia => {
                                const count = formData.configuracion_semanal[dia.key].length;
                                const isActive = selectedDay === dia.key;
                                return (
                                    <button
                                        key={dia.key}
                                        type="button"
                                        onClick={() => setSelectedDay(dia.key)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]'
                                                : count > 0
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span>{dia.label}</span>
                                        {count > 0 && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Derecha: Editor de Turnos */}
                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col">
                            {/* Toolbar del Editor */}
                            <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl flex flex-wrap items-center justify-between gap-3">
                                <h4 className="font-bold text-lg text-gray-800 capitalize flex items-center gap-2">
                                    <FiClock className="text-blue-500" />
                                    {selectedDay}
                                </h4>
                                <div className="flex gap-2">
                                    <button type="button" onClick={copiarDia} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                        Copiar a todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => agregarTurno()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-colors"
                                    >
                                        <FiPlus /> Personalizado
                                    </button>
                                </div>
                            </div>

                            {/* Barra de Atajos Rápidos */}
                            <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-blue-800 flex items-center gap-1"><FiZap /> Rápido:</span>
                                {QUICK_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => agregarTurno(preset.inicio, preset.fin)}
                                        className="px-2.5 py-1 text-xs bg-white text-blue-700 border border-blue-200 rounded-md hover:border-blue-400 hover:shadow-sm transition-all"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Lista de Inputs de Turnos */}
                            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                                {formData.configuracion_semanal[selectedDay].length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 min-h-[150px]">
                                        <FiClock className="w-10 h-10 mb-2" />
                                        <p className="text-sm">No hay turnos asignados</p>
                                        <p className="text-xs mt-1">Selecciona una opción rápida arriba</p>
                                    </div>
                                ) : (
                                    formData.configuracion_semanal[selectedDay].map((turno, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors group">
                                            <span className="text-xs font-bold text-gray-300 w-6 mt-1">#{index + 1}</span>

                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-0.5">Inicio</label>
                                                    <TimeInput
                                                        value={turno.inicio || ''} // Safety check
                                                        onChange={(val) => actualizarTurno(index, 'inicio', val)}
                                                    />
                                                </div>
                                                <div className="text-gray-300 mt-5">➜</div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] text-gray-500 uppercase tracking-wide font-bold mb-0.5">Fin</label>
                                                    <TimeInput
                                                        value={turno.fin || ''} // Safety check
                                                        onChange={(val) => actualizarTurno(index, 'fin', val)}
                                                        error={turno.fin && turno.inicio && turno.fin <= turno.inicio}
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-8 w-px bg-gray-200 mx-2 mt-4"></div>

                                            <button
                                                type="button"
                                                onClick={() => eliminarTurno(index)}
                                                className="p-2 mt-4 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar turno"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fila 3: Vista Previa Compacta (CON CORRECCIÓN DE CRASH) */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <FiLayers className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resumen Visual</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {DIAS_SEMANA.map(dia => {
                                const turnos = formData.configuracion_semanal[dia.key] || [];

                                // === CORRECCIÓN ===
                                // Filtramos turnos inválidos para que la función utils no explote
                                const turnosValidos = turnos.filter(t => t.inicio && t.fin);

                                if (turnosValidos.length === 0) return null;

                                const bloques = fusionarBloquesContinuos(turnosValidos);
                                return (
                                    <div key={dia.key} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200 text-xs hover:border-blue-300 transition-colors">
                                        <span className="font-bold text-gray-600">{dia.label.substring(0, 3)}:</span>
                                        <div className="flex gap-1">
                                            {bloques.map((b, i) => (
                                                <span key={i} className={`px-1.5 py-0.5 rounded border shadow-sm ${b.fusionado ? 'bg-blue-50 text-blue-800 border-blue-100' : 'bg-white text-gray-800 border-gray-200'}`}>
                                                    {b.inicio}-{b.fin}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {!Object.values(formData.configuracion_semanal).some(t => t.length > 0) && (
                                <span className="text-sm text-gray-400 italic pl-1">Aún no hay horarios configurados.</span>
                            )}
                        </div>
                    </div>
                </div>

                {alertMsg && <ConfirmBox message={alertMsg} onConfirm={() => setAlertMsg(null)} />}
                {confirmAction && <ConfirmBox message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}

                {/* Footer Fijo */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex-shrink-0">
                    <div className="text-xs text-gray-500 hidden sm:block">
                        * Los cambios no afectarán el historial pasado
                    </div>
                    <div className="flex gap-3 ml-auto sm:ml-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Guardando...</>
                            ) : (
                                'Guardar Horario'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ScheduleModal;