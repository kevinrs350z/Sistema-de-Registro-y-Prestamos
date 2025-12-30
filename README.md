# Sistema de Reserva y Préstamo de Equipos  
**Universidad de Tarapacá – Departamento de Diseño Multimedia**

Proyecto académico desarrollado como solución integral para la **gestión de préstamos, devoluciones, inventario y reportes de equipos audiovisuales y tecnológicos**, orientado a estudiantes, docentes y administradores.

---

## 1. Descripción General

El **Sistema de Reserva y Préstamo de Equipos** permite administrar de forma centralizada y segura:

- Solicitudes de préstamo de equipos
- Control de inventario en tiempo real
- Devoluciones parciales y totales
- Gestión de sanciones
- Reportes estadísticos y dashboards
- Autenticación tradicional y con Google

El sistema está diseñado bajo una **arquitectura MVC**, separando claramente frontend y backend para facilitar la escalabilidad y el mantenimiento.

---

## 2. Arquitectura del Sistema

El proyecto se organiza en dos capas principales:

Sistema-de-Reserva-Diseno-multimedia/
│
├── Frontend/ → Aplicación Angular
└── Backend/ → API REST Laravel


### 🔹 Frontend
- Framework: Angular
- Arquitectura basada en componentes
- Comunicación mediante API REST
- Interfaces diferenciadas por rol (Alumno / Administrador)

### 🔹 Backend
- Framework: Laravel
- API RESTful
- Autenticación con Sanctum
- Lógica de negocio desacoplada en servicios
- Control de estados de préstamos y equipos

---

## 3. Tecnologías Utilizadas

### Frontend
- Angular
- TypeScript
- HTML5 / CSS3
- Chart.js
- Bootstrap / CSS personalizado

### Backend
- PHP 8.x
- Laravel
- Laravel Sanctum
- Eloquent ORM
- MySQL

### Herramientas
- Git & GitHub
- Postman
- Composer
- Node.js / npm
- Laragon
- MariaDB

---

## 4. Funcionalidades Principales

### 👤 Usuarios
- Inicio de sesión con correo y contraseña
- Inicio de sesión con Google
- Recuperación de contraseña vía correo

### 🎓 Alumnos
- Catálogo de equipos
- Solicitud de préstamo (interno / externo)
- Selección de equipos específicos o por cantidad
- Visualización de solicitudes y estados

- Interno: dentro de la universidad
- Externo: fuera de la universidad

### 🛠️ Administradores
- Aprobación y rechazo de solicitudes
- Gestión de inventario
- Devolución parcial y total de equipos
- Registro de observaciones
- Gestión de sanciones

### 📊 Reportes
- KPIs generales
- Uso interno vs externo
- Equipos más solicitados
- Top alumnos
- Exportación a PDF y Excel

---

## 5. Flujo General del Sistema

1. El usuario inicia sesión.
2. El alumno solicita equipos desde el frontend.
3. El backend valida disponibilidad y registra la solicitud.
4. El administrador aprueba o rechaza la solicitud.
5. Los equipos cambian de estado (`DISPONIBLE`, `PRESTADO`).
6. Se realiza la devolución (parcial o total).
7. El inventario se actualiza automáticamente.
8. Los reportes reflejan los cambios en tiempo real.

---

## 6. Configuración del Entorno (.env)

### Backend (Laravel)

- Crear el archivo `.env` a partir de:

```bash
cp .env.example .env


    APP_NAME=SistemaReservaEquipos
    APP_ENV=local
    APP_KEY=base64:GENERAR_CON_PHP_ARTISAN
    APP_DEBUG=true
    APP_URL=http://localhost:8000

    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=reservas_equipos
    DB_USERNAME=root
    DB_PASSWORD=

    MAIL_MAILER=smtp
    MAIL_HOST=smtp.gmail.com
    MAIL_PORT=587
    MAIL_USERNAME=correo@gmail.com
    MAIL_PASSWORD=clave_de_aplicacion
    MAIL_ENCRYPTION=tls
    MAIL_FROM_ADDRESS=correo@gmail.com
    MAIL_FROM_NAME="Sistema de Reservas"

    GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=xxxxxxxx

```
### Luego ejecutar:
```bash
php artisan key:generate
-php artisan migrate --seed
php artisan serve
```

## 7. Instalación del Frontend.

```bash
cd Frontend
npm install
ng serve
```

## Acceder desde:

http://localhost:4200

## 8. Reportes y Dashboard

- El sistema incluye un módulo de reportes con:

- Gráficos dinámicos

- Indicadores clave (KPIs)

- Exportación a PDF

- Exportación a Excel

- - Los datos son obtenidos en tiempo real desde la API.

## 9. Seguridad

- Autenticación mediante tokens (Sanctum)

- Middleware de autorización por rol

- Validaciones en backend con FormRequest

- Protección contra accesos no autorizados

## 10. Contexto Académico

- Proyecto desarrollado en el marco de la asignatura Proyecto III, correspondiente a la carrera de Ingeniería Civil en Computación e Informática Universidad de Tarapacá. Desarrolado para la carrera de Diseño Multimedia.

## 11. Licencia

- Proyecto de carácter académico, desarrollado con fines educativos.
No destinado a uso comercial.

## 12. Equipo de Desarrollo

- **Andrea Navia**  
  GitHub: https://github.com/galletaneru  
  LinkedIn: —  

- **Ignacio Garrido**  
  GitHub: https://github.com/Nach129
  LinkedIn: —  

- **Juan Meneses**  
  GitHub: https://github.com/dujuu  
  LinkedIn: https://www.linkedin.com/in/juan-meneses-muñoz  

- **Kevin Rojas**  
  GitHub: https://github.com/kevinrs350z  
  LinkedIn: —  

- **Pablo Valladares**  
  GitHub: https://github.com/DGX5  
  LinkedIn: —  


## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
