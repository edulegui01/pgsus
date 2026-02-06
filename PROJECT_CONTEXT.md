# SCO - Sistema de Integración POS

## Descripción General
Backend desarrollado en NestJS que actúa como capa de integración entre un sistema POS legacy en SQL Server y una base de datos PostgreSQL para registro de transacciones.

## Arquitectura de Bases de Datos

### 1. PostgreSQL (Transacciones)
- **Propósito**: Registro y almacenamiento de transacciones del sistema
- **Tecnología**: TypeORM
- **Configuración**:
  - Connection name: `postgresql`
  - Entities: `dist/**/*.postgres.entity{.ts,.js}`
  - Synchronize: `true` (desarrollo)

### 2. SQL Server (POS Legacy)
- **Propósito**: Conexión directa al sistema POS existente
- **Tecnología**: mssql (driver nativo)
- **Gestión**: DatabaseService personalizado
- **Características**:
  - Pool de conexiones
  - Soporte para queries directos
  - Soporte para stored procedures

## Estructura del Proyecto

### Módulo Principal: `PosIntegrationModule`

#### Servicios
- **DatabaseService** (`services/database.service.ts`)
  - Gestiona conexión con SQL Server
  - Métodos: `query()`, `execute()`, `getPool()`, `closeConnection()`
  - Logging integrado con NestJS Logger

- **ProductsService** (`services/products.service.ts`)
  - Lógica de negocio para productos
  - Método principal: `findProductByCode(codigo: string)`
  - Manejo de excepciones y logging

- **VentasAutService** (`services/ventas-aut.service.ts`)
  - Lógica de negocio para ventas automáticas
  - Gestión de transacciones del POS

#### Repositorios
- **ProductsRepository** (`repositories/products.repository.ts`)
  - Consultas a SQL Server para productos

- **VentasAutRepository** (`repositories/ventas-aut.repository.ts`)
  - Consultas a SQL Server para ventas automáticas

#### Controladores
- **ProductsController** (`controllers/products.controller.ts`)
  - Base path: `/pos/productos`
  - Endpoints:
    - `GET /pos/productos/codigo/:codigo` - Buscar producto por código

## Modelos de Datos

### Producto (`entities/producto.entity.ts`)
```typescript
{
  codigo: string
  descripcion_producto: string
  precio: number
  codigo_barra_int: string
  descripcion_corta: string
  nivel3: number
  pesable?: number
}
```

### VentasAut (`entities/ventas-aut.entity.ts`)
```typescript
{
  id: number
  zeta: number
  caja: number
  ticket: number
  operacion: number
  codigo: string
  codigo_barra: string
  cantidad: number
  precio: number
  total_venta: number
  tipo_cobro: number
  cod_condicion: number
  bin: string
  cod_tarjeta: number
  nro_boleta: string
  cod_autorizacion: string
  tipo_qr: string
  importe_cobrado: number
  estado: number
  obs: string
  documento: string
  nombre_cliente: string
  nro_ecom: number
}
```

### ModelProducTicket (`entities/model-produc-ticket.entity.ts`)
- Entidad para gestión de tickets de productos

## Stack Tecnológico

### Framework y Core
- **NestJS** v11.0.1
- **Node.js** / **TypeScript** 5.7.3
- **RxJS** 7.8.1

### Bases de Datos
- **TypeORM** 0.3.28 (PostgreSQL)
- **pg** 8.16.3 (Driver PostgreSQL)
- **mssql** 12.2.0 (Driver SQL Server)

### Configuración y Utilidades
- **@nestjs/config** 4.0.2 (Variables de entorno)
- **@nestjs/platform-express** 11.0.1

### Testing
- **Jest** 30.0.0
- **Supertest** 7.0.0
- **ts-jest** 29.2.5

## Variables de Entorno Requeridas

### PostgreSQL
```env
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### SQL Server (POS)
```env
SQLSERVER_HOST=
SQLSERVER_PORT=1433
SQLSERVER_USER=
SQLSERVER_PASSWORD=
SQLSERVER_DATABASE=
```

### Aplicación
```env
PORT=3000
```

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo watch
npm run start:debug        # Modo debug

# Producción
npm run build              # Compilar
npm run start:prod         # Ejecutar compilado

# Testing
npm run test               # Tests unitarios
npm run test:e2e          # Tests end-to-end
npm run test:cov          # Cobertura

# Calidad de Código
npm run lint              # ESLint
npm run format            # Prettier
```

## Patrones de Diseño Implementados

1. **Repository Pattern**: Separación de lógica de acceso a datos
2. **Service Layer**: Lógica de negocio centralizada
3. **Dependency Injection**: Inyección de dependencias vía NestJS
4. **Module Pattern**: Organización en módulos funcionales
5. **Configuración Global**: ConfigModule para variables de entorno

## Estado Actual del Proyecto

- Branch: `develop`
- Primer commit realizado
- Módulo POS Integration implementado
- Conexión dual a bases de datos configurada
- Endpoint de productos funcional

## Notas Importantes

- El sistema mantiene dos conexiones de BD simultáneas
- SQL Server usa conexión directa (no TypeORM) para mayor control
- PostgreSQL usa TypeORM para aprovechar ORM features
- Synchronize en true solo para desarrollo (cambiar en producción)
- Logging implementado en servicios críticos
- Manejo de errores centralizado con excepciones de NestJS
