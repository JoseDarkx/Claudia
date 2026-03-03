# SUR COMPANY - SGI (Sistema de Gestión Integral)

<div align="center">
  <img width="1200" height="475" alt="SUR Company SGI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 1. Descripción
**SUR COMPANY SGI** es una solución empresarial de vanguardia diseñada para la gestión, monitoreo y análisis inteligente de indicadores de procesos corporativos. La plataforma permite centralizar métricas críticas, visualizar tendencias históricas y obtener *insights* accionables mediante inteligencia artificial, eliminando la dependencia de procesos manuales y garantizando la integridad de la información para una toma de decisiones basada en datos.

## 2. Propósito
Optimizar el ciclo de gestión de indicadores (KPIs) de los procesos estratégicos, misionales y de apoyo, proporcionando una herramienta colaborativa que integra gobernanza de datos, control de acceso basado en roles (RBAC) y análisis heurístico mediante modelos de lenguaje de gran escala.

## 3. Tabla de Contenidos
- [Características Principales](#4-características-principales)
- [Arquitectura](#5-arquitectura)
- [Estructura del Proyecto](#6-estructura-del-proyecto)
- [Stack Tecnológico](#7-tecnologías-utilizadas)
- [Requisitos Previos](#8-requisitos-previos)
- [Instalación](#9-instalación)
- [Configuración](#10-configuración)
- [Uso](#11-uso)
- [Modelo de Datos](#12-modelo-de-datos)
- [Deployment](#14-deployment)
- [Buenas Prácticas](#15-buenas-prácticas)
- [Contribución](#16-contribución)
- [Licencia](#17-licencia)

## 4. Características Principales
- **Dashboard Ejecutivo:** Centro de mando interactivo con visualizaciones en tiempo real.
- **Gestión de Procesos:** Clasificación y administración de procesos (Estratégicos, Misionales, Apoyo).
- **Control de Indicadores:** Definición de metas, frecuencias (Mensual, Trimestral, etc.) y umbrales (Semáforo).
- **IA Insights:** Análisis predictivo y descriptivo integrado con **Google Gemini**.
- **Autenticación Segura:** Sistema robusto basado en JWT y validación de perfiles.
- **Histórico de Cumplimiento:** Registro detallado y consulta de periodos anteriores con gráficas de tendencia.
- **Gobernanza RBAC:** Diferenciación clara entre Administradores y Líderes de Proceso.

## 5. Arquitectura
El sistema implementa una arquitectura **Modern SPA (Single Page Application)** con un enfoque de **BaaS (Backend as a Service)**, optimizada para escalabilidad y baja latencia.

- **Frontend:** Basado en **React 18** con componentes funcionales y Hooks para gestión de estado.
- **Backend/DB:** Integración nativa con **Supabase** para persistencia dinámica y Realtime.
- **Security Layer:** Seguridad a nivel de fila (RLS) en base de datos y middleware de protección de rutas en el cliente.
- **AI Integration:** Capa de servicios desacoplada para comunicación con el SDK de Google Generative AI.

## 6. Estructura de Carpetas
```text
Claudia-main/
├── lib/               # Inicialización de clientes (Supabase, Gemini API)
├── pages/             # Vistas principales y componentes de página
│   ├── AdminPanel.tsx      # Configuración y administración
│   ├── Dashboard.tsx       # Vista general de indicadores
│   ├── Registro.tsx        # Captura de datos mensuales
│   └── Historico.tsx       # Análisis de periodos pasados
├── public/            # Activos estáticos y media
├── scripts/           # Utilidades de mantenimiento y migración SQL
├── supabase/          # Lógica de base de datos (Migrations, Seeds, Schema)
├── utils/             # Funciones auxiliares y formateadores
├── types.ts           # Definiciones globales de TypeScript (Interfaces)
├── vite.config.ts     # Configuración del motor de construcción
└── App.tsx            # Enrutamiento y gestión de estado de autenticación
```

## 7. Tecnologías Utilizadas

### Backend & DevOps
- **Supabase:** PostgreSQL (DB), Auth (JWT), Realtime.
- **Node.js 20:** Entorno de ejecución para herramientas de construcción.
- **Vercel:** Plataforma recomendada de despliegue continuo.

### Frontend
- **React 18 & TypeScript:** Core del desarrollo y tipado estático.
- **Vite:** Herramienta de bundling de última generación.
- **Tailwind CSS:** Diseño de interfaz basado en utilidades de alto rendimiento.
- **Recharts:** Librería de gráficos para visualización de métricas corporativas.
- **Lucide React:** Iconografía vectorial profesional.

### Intelligence & Analysis
- **Google Generative AI (Gemini):** Motor para generación de planes de mejora y análisis de KPIs.

## 8. Requisitos Previos
- **Node.js:** Versión 20.x o superior.
- **Gestor de paquetes:** `npm` o `pnpm`.
- **Credenciales:** Acceso a un proyecto de Supabase y una API Key de Google AI Studio.

## 9. Instalación
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/JoseDarkx/Claudia.git
   cd Claudia
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```

## 10. Configuración
Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
VITE_GEMINI_API_KEY=tu_api_key_de_google_gemini
```

## 11. Uso
Para iniciar el entorno de desarrollo local:
```bash
npm run dev
```

## 12. Modelo de Datos
La estructura principal de la base de datos se organiza en las siguientes entidades:

| Tabla | Descripción |
| :--- | :--- |
| `profiles` | Usuarios, roles y asignación de procesos. |
| `procesos` | Maestros de procesos corporativos. |
| `indicadores` | Definición comercial y técnica de cada KPI. |
| `registro_mensual` | Histórico de resultados y observaciones. |

## 13. Testing
El proyecto cuenta con un entorno preparado para la integración de pruebas.
- **Unit Testing:** Planeado con Vitest para cálculos de fórmulas.
- **E2E Testing:** Estructurado para flujos críticos de usuario.


## 14. Buenas Prácticas Implementadas
- **Modularización:** Separación estricta de lógica de negocio y presentación.
- **Lazy Loading:** Carga bajo demanda de rutas para mejorar la velocidad inicial.
- **Validación de Roles:** Middleware centralizado para prevenir accesos no autorizados.
- **Seguridad en DB:** Políticas RLS que garantizan que los usuarios solo vean datos permitidos.

## 15. Contribución
1. Fork del repositorio.
2. Crear rama: `git checkout -b feature/MejoraPropuesta`.
3. Commit cambios: `git commit -m 'Añadir nueva funcionalidad'`.
4. Pull Request detallado.

## 16. Licencia
Este software es propiedad privada de **Sur Company SAS**. Todos los derechos reservados.
