/**
 * Sistema de Permisos Bitwise (Frontend)
 * Maneja hasta 64 permisos diferentes usando operaciones bit a bit
 */

/**
 * Catálogo Detallado de Permisos
 * Mapeo de bits (0-63) a acciones específicas por módulo
 * DEBE COINCIDIR EXACTAMENTE CON EL BACKEND
 */
export const CATALOGO_PERMISOS = {
    // USUARIOS Y EMPLEADOS (0-3)
    USUARIO_VER: { bit: 0, nombre: 'Ver usuarios', categoria: 'usuarios' },
    USUARIO_CREAR: { bit: 1, nombre: 'Crear usuarios', categoria: 'usuarios' },
    USUARIO_EDITAR: { bit: 2, nombre: 'Editar usuarios', categoria: 'usuarios' },
    USUARIO_ELIMINAR: { bit: 3, nombre: 'Eliminar usuarios', categoria: 'usuarios' },

    // ROLES (4-8)
    ROL_VER: { bit: 4, nombre: 'Ver roles', categoria: 'roles' },
    ROL_CREAR: { bit: 5, nombre: 'Crear roles', categoria: 'roles' },
    ROL_EDITAR: { bit: 6, nombre: 'Editar roles', categoria: 'roles' },
    ROL_ELIMINAR: { bit: 7, nombre: 'Eliminar roles', categoria: 'roles' },
    ROL_ASIGNAR: { bit: 8, nombre: 'Asignar roles', categoria: 'roles' },

    // HORARIOS E INCIDENCIAS (9-14)
    HORARIO_VER: { bit: 9, nombre: 'Ver horarios', categoria: 'horarios' },
    HORARIO_CREAR: { bit: 10, nombre: 'Crear horarios', categoria: 'horarios' },
    HORARIO_EDITAR: { bit: 11, nombre: 'Editar horarios', categoria: 'horarios' },
    HORARIO_ELIMINAR: { bit: 12, nombre: 'Eliminar horarios', categoria: 'horarios' },
    HORARIO_ASIGNAR: { bit: 13, nombre: 'Asignar horarios', categoria: 'horarios' },
    HORARIO_GESTIONAR: { bit: 14, nombre: 'Gestionar incidencias', categoria: 'horarios' },

    // DEPARTAMENTOS (15-19)
    DEPARTAMENTO_VER: { bit: 15, nombre: 'Ver departamentos', categoria: 'departamentos' },
    DEPARTAMENTO_CREAR: { bit: 16, nombre: 'Crear departamentos', categoria: 'departamentos' },
    DEPARTAMENTO_EDITAR: { bit: 17, nombre: 'Editar departamentos', categoria: 'departamentos' },
    DEPARTAMENTO_ELIMINAR: { bit: 18, nombre: 'Eliminar departamentos', categoria: 'departamentos' },
    DEPARTAMENTO_ASIGNAR: { bit: 19, nombre: 'Asignar departamentos', categoria: 'departamentos' },

    // DISPOSITIVOS (20-24)
    DISPOSITIVO_VER: { bit: 20, nombre: 'Ver dispositivos', categoria: 'dispositivos' },
    DISPOSITIVO_CREAR: { bit: 21, nombre: 'Crear dispositivos', categoria: 'dispositivos' },
    DISPOSITIVO_EDITAR: { bit: 22, nombre: 'Editar dispositivos', categoria: 'dispositivos' },
    DISPOSITIVO_ELIMINAR: { bit: 23, nombre: 'Eliminar dispositivos', categoria: 'dispositivos' },
    DISPOSITIVO_GESTIONAR: { bit: 24, nombre: 'Gestionar dispositivos', categoria: 'dispositivos' },

    // AVISOS (25-28)
    AVISO_VER: { bit: 25, nombre: 'Ver avisos', categoria: 'avisos' },
    AVISO_CREAR: { bit: 26, nombre: 'Crear avisos', categoria: 'avisos' },
    AVISO_EDITAR: { bit: 27, nombre: 'Editar avisos', categoria: 'avisos' },
    AVISO_ELIMINAR: { bit: 28, nombre: 'Eliminar avisos', categoria: 'avisos' },

    // REPORTES (29-30)
    REPORTE_VER: { bit: 29, nombre: 'Ver reportes', categoria: 'reportes' },
    REPORTE_EXPORTAR: { bit: 30, nombre: 'Exportar reportes', categoria: 'reportes' },

    // REGISTROS (31)
    REGISTRO_VER: { bit: 31, nombre: 'Ver registros de asistencia', categoria: 'asistencias' },

    // CONFIGURACIÓN (32-38)
    CONFIG_VER: { bit: 32, nombre: 'Ver configuración', categoria: 'configuracion' },
    CONFIG_GENERAL: { bit: 33, nombre: 'Configuración general', categoria: 'configuracion' },
    CONFIG_EMPRESA: { bit: 34, nombre: 'Configuración empresa', categoria: 'configuracion' },
    CONFIG_SEGURIDAD: { bit: 35, nombre: 'Configuración seguridad', categoria: 'configuracion' },
    CONFIG_ASISTENCIA: { bit: 36, nombre: 'Configuración asistencia', categoria: 'configuracion' },
    CONFIG_RED: { bit: 37, nombre: 'Configuración de red', categoria: 'configuracion' },
    CONFIG_REPORTES: { bit: 38, nombre: 'Configuración de reportes', categoria: 'configuracion' }
};

/**
 * Permisos por código para acceso rápido
 */
export const PERMISOS = Object.keys(CATALOGO_PERMISOS).reduce((acc, key) => {
    acc[key] = CATALOGO_PERMISOS[key].bit;
    return acc;
}, {});

/**
 * Verifica si un valor de permisos tiene un permiso específico
 */
export function tienePermiso(permisosBitwise, bitPosition) {
    if (permisosBitwise === undefined || permisosBitwise === null) return false;
    try {
        const permisos = BigInt(permisosBitwise);
        const mask = BigInt(1) << BigInt(bitPosition);
        return (permisos & mask) !== BigInt(0);
    } catch (e) {
        return false;
    }
}

/**
 * Verifica si tiene el permiso por código
 */
export function tienePermisoPorCodigo(permisosBitwise, codigoPermiso) {
    const bitPosition = PERMISOS[codigoPermiso];
    if (bitPosition === undefined) return false;
    return tienePermiso(permisosBitwise, bitPosition);
}

/**
 * Verifica si es super admin / dueño del sistema
 */
export function esMaestro(user) {
    return user?.esPropietarioSaaS === true || user?.empresa_id === 'MASTER';
}

/**
 * Umbrales de Jerarquía para Configuración
 * Define la posición máxima permitida para cada permiso de configuración EN EL FRONTEND.
 */
export const JERARQUIA_CONFIGURACION = {
    CONFIG_VER: 99,       // Cualquier admin puede ver
    CONFIG_REPORTES: 99,  // Cualquier admin puede ver reportes
    CONFIG_GENERAL: 5,    // Solo gerencia y superior
    CONFIG_ASISTENCIA: 5, // Solo gerencia y superior
    CONFIG_RED: 2,        // Solo IT/Gerencia alta
    CONFIG_EMPRESA: 1,    // Solo dueño del sistema/empresa
    CONFIG_SEGURIDAD: 1   // Solo dueño del sistema/empresa
};
