# StreamFlix - Streaming Content Platform

## Overview

StreamFlix is a modern streaming platform web application built with React and Express. The application provides users with a Netflix-like experience for browsing movies, series, and anime content. It features a clean, dark-themed interface with trending content carousels, category filtering, and responsive design optimized for various screen sizes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TailwindCSS** with custom CSS variables for dark-themed styling
- **Framer Motion** for smooth animations and transitions
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and data fetching
- **shadcn/ui** component library built on Radix UI primitives for consistent UI components

### Backend Architecture
- **Express.js** server with TypeScript for the REST API
- **In-memory storage** (MemStorage class) with sample data seeding for development
- RESTful API endpoints for content management:
  - `/api/content` - Get all content
  - `/api/content/type/:type` - Filter content by type (movie, series, anime)
  - `/api/content/trending` - Get trending content
  - `/api/content/new-releases` - Get new releases
  - `/api/content/popular` - Get popular content

### Data Layer
- **Drizzle ORM** configured for PostgreSQL with schema definitions
- Database schema includes content table with fields for title, description, year, rating, genre, type, image URLs, and trending/popularity flags
- **Zod** for runtime type validation and schema inference
- Connection ready for PostgreSQL via `@neondatabase/serverless`

### Development Tools
- **TypeScript** configuration with strict mode and ES modules
- **ESBuild** for production bundling
- **PostCSS** with Autoprefixer for CSS processing
- Hot Module Replacement (HMR) in development
- Replit-specific plugins for development environment integration

### Component Architecture
- Modular component structure with separation of concerns
- Custom hooks for data fetching (`use-content.ts`)
- Reusable UI components following atomic design principles
- Responsive design with mobile-first approach using TailwindCSS breakpoints

### Styling System
- Dark theme with custom CSS variables for consistent color palette
- Gradient-based design elements (primary: purple, secondary: cyan, accent: orange)
- Custom fonts: Inter for UI text, Fira Code for monospace
- Component variants using `class-variance-authority` for consistent styling patterns

## External Dependencies

### Core Framework Dependencies
- **React 18** - Frontend framework
- **Express.js** - Backend web framework
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Build tool and development server

### UI and Styling
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless UI component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Data Management
- **TanStack Query** - Server state management
- **Drizzle ORM** - TypeScript ORM for database operations
- **Zod** - Schema validation library
- **@neondatabase/serverless** - PostgreSQL database connection

### Development Tools
- **tsx** - TypeScript execution environment
- **ESBuild** - Fast JavaScript bundler
- **PostCSS** - CSS processing tool
- **@replit/* plugins** - Replit development environment integration

### Utility Libraries
- **clsx** and **tailwind-merge** - Conditional CSS class management
- **date-fns** - Date manipulation utilities
- **nanoid** - Unique ID generation
- **wouter** - Lightweight routing for React