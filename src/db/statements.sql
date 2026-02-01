CREATE TABLE usuarios (
    id CHAR(8) PRIMARY KEY,

    usuario CHAR(50) UNIQUE NOT NULL,
    correo CHAR(50) UNIQUE NOT NULL,

    contraseña TEXT NOT NULL,
    nombre TEXT,
    foto TEXT,

    telefono CHAR(10),

    estado_cuenta VARCHAR(12) CHECK (
        estado_cuenta IN ('activo', 'suspendido', 'baja')
    ) DEFAULT 'activo',

    es_empleado BOOLEAN DEFAULT FALSE,

    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    clave_seguridad INT UNIQUE,

    empresa_id CHAR(8),

    CONSTRAINT fk_usuarios_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
