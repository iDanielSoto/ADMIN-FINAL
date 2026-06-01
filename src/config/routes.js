import { lazy } from 'react';

// Lazy loading de todas las páginas
const Dashboard = lazy(() => import('../pages/Tablero'));
const Empleados = lazy(() => import('../pages/Empleados'));
const Horarios = lazy(() => import('../pages/Horarios'));
const Departamentos = lazy(() => import('../pages/Departamentos'));
const Roles = lazy(() => import('../pages/Roles'));
const Dispositivos = lazy(() => import('../pages/Dispositivos'));
const Incidencias = lazy(() => import('../pages/Incidencias'));
const Reportes = lazy(() => import('../pages/Reportes'));
const Registros = lazy(() => import('../pages/Registros'));
const Configuracion = lazy(() => import('../pages/Configuracion'));
const PerfilUsuario = lazy(() => import('../pages/PerfilUsuario'));
const Avisos = lazy(() => import('../pages/Avisos'));
const HorariosIncidencias = lazy(() => import('../pages/HorariosIncidencias'));
const AdminSaaS = lazy(() => import('../pages/AdminSaaS')); 
const EmpresasSaaS = lazy(() => import('../pages/EmpresasSaaS'));
const ConfigurarEmpresaSaaS = lazy(() => import('../pages/ConfigurarEmpresaSaaS'));
const SaasLogs = lazy(() => import('../pages/SaasLogs'));

export const protectedRoutes = [
    { path: '/dashboard', component: Dashboard },
    { path: '/avisos', component: Avisos, permissionRequired: 'AVISO_VER' },
    { path: '/empleados', component: Empleados, permissionRequired: 'USUARIO_VER' },
    { path: '/horarios', component: HorariosIncidencias, permissionRequired: 'HORARIO_VER' },
    { path: '/departamentos', component: Departamentos, permissionRequired: 'DEPARTAMENTO_VER' },
    { path: '/roles', component: Roles, permissionRequired: 'ROL_VER' },
    { path: '/dispositivos', component: Dispositivos, permissionRequired: 'DISPOSITIVO_VER' },
    { path: '/incidencias', component: HorariosIncidencias, permissionRequired: 'HORARIO_GESTIONAR' },
    { path: '/reportes', component: Reportes, permissionRequired: 'REPORTE_VER' },
    { path: '/registros', component: Registros, permissionRequired: 'REGISTRO_VER' },
    { path: '/configuracion', component: Configuracion, permissionRequired: 'CONFIG_VER' },
    
    // SaaS Routes (El middleware se encarga de esMaestro)
    { path: '/super-administradores', component: AdminSaaS },
    { path: '/empresas', component: EmpresasSaaS },
    { path: '/empresas/:id', component: ConfigurarEmpresaSaaS },
    { path: '/saas-logs', component: SaasLogs },
];

export const specialRoutes = [
    { path: 'empleados/usuario/:username', component: PerfilUsuario },
];