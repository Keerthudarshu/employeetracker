# EduPrajna Daily Reports Application

## Overview

This is a full-stack web application built for EduPrajna's daily reporting system. It allows employees to submit daily work reports and provides administrators with a comprehensive dashboard to view, filter, and export report data. The application now includes full employee management capabilities for administrators. The application uses a modern tech stack with React frontend, Express backend, PostgreSQL database, and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between frontend and backend code:

- **Frontend**: React SPA with TypeScript, built with Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui component library with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Authentication**: Session-based auth with JWT-like tokens

## Key Components

### Directory Structure
- `/client` - React frontend application
  - `/src/pages/employee-management.tsx` - Employee management interface (NEW)
- `/server` - Express.js backend server
  - Employee management API routes added to `routes.ts`
- `/shared` - Shared TypeScript schemas and types
  - Added employee creation/update schemas
- `/migrations` - Database migration files

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with React plugin
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: TanStack Query with custom fetch wrapper

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Custom session management with bcrypt
- **Validation**: Zod schemas shared between frontend/backend

### Database Schema
- **employees**: User accounts for report submission
- **daily_reports**: Daily work performance data
- **admins**: Administrator accounts
- **sessions**: Session management for authentication

## Data Flow

1. **Authentication Flow**:
   - Users login with employee ID/password or admin username/password
   - Server validates credentials and creates session
   - Client stores session token in localStorage
   - Subsequent requests include Authorization header

2. **Report Submission Flow**:
   - Employee fills out daily report form
   - Form validates data using Zod schemas
   - Data submitted to `/api/employee/report` endpoint
   - Server validates and stores in database

3. **Admin Dashboard Flow**:
   - Admin accesses dashboard with filtering options
   - Data fetched from `/api/admin/reports` with query parameters
   - Results displayed in paginated table
   - Export functionality generates CSV downloads

4. **Employee Management Flow** (NEW):
   - Admin accesses employee management from dashboard
   - Can create new employees with credentials
   - View, edit, and delete existing employees
   - Full CRUD operations with proper validation

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **Backend**: Express.js, bcrypt for password hashing
- **Database**: Drizzle ORM, Neon serverless PostgreSQL driver
- **Validation**: Zod for schema validation
- **Build Tools**: Vite, esbuild, TypeScript

### UI Dependencies
- **Component Library**: Complete shadcn/ui component set (30+ components)
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React icon library
- **Utilities**: clsx, tailwind-merge for conditional styling

### Development Dependencies
- **Replit Integration**: Vite plugins for Replit environment
- **Type Checking**: Full TypeScript setup with strict mode

## Deployment Strategy

### Development
- `npm run dev` - Starts development server with hot reloading
- Vite dev server proxies API requests to Express backend
- Database migrations run with `npm run db:push`

### Production Build
- `npm run build` - Creates optimized frontend bundle and server bundle
- Frontend built to `dist/public` directory
- Backend bundled with esbuild to `dist/index.js`
- `npm start` - Runs production server

### Database Management
- Uses Drizzle migrations stored in `/migrations`
- Schema defined in `/shared/schema.ts`
- Supports both development and production PostgreSQL instances
- Connection configured via `DATABASE_URL` environment variable

### Environment Configuration
- Development: Uses local or development database
- Production: Requires `DATABASE_URL` environment variable
- Session management uses secure tokens
- CORS and security headers configured for production deployment

## Recent Changes (January 2025)

### Employee Management System Added
- **Full CRUD Operations**: Administrators can now create, read, update, and delete employee accounts
- **Secure Password Management**: Passwords are properly hashed using bcrypt
- **Form Validation**: Both frontend and backend validation for employee data
- **Navigation Integration**: Employee management accessible from admin dashboard
- **API Endpoints Added**:
  - `GET /api/admin/employees` - List all employees
  - `POST /api/admin/employees` - Create new employee
  - `PUT /api/admin/employees/:id` - Update employee
  - `DELETE /api/admin/employees/:id` - Delete employee

### Technical Implementation
- Extended storage interface with employee management methods
- Added Zod schemas for employee creation and updates
- Implemented React forms with proper validation
- Added navigation routing for employee management page
- Enhanced admin dashboard with employee management button

The application is designed for deployment on platforms like Replit, with specific integrations for the Replit development environment while maintaining compatibility with standard Node.js hosting platforms.