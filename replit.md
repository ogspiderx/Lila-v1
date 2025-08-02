# Real-time Chat Application

## Overview

This is a full-stack real-time chat application built with React, Express, and WebSockets. The application provides a modern chat interface with instant messaging capabilities, typing indicators, and user authentication. It features a clean, responsive design using shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js for HTTP server and API endpoints
- **WebSockets**: Native WebSocket implementation for real-time bidirectional communication
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Validation**: Zod schemas for request/response validation and type safety
- **Development**: In-memory storage (MemStorage) with interface abstraction for easy database integration

### Data Storage Design
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe queries
- **Schema**: Centralized schema definitions in `shared/schema.ts` for type consistency
- **Database**: PostgreSQL (via @neondatabase/serverless) for production-ready data persistence
- **Migration**: Drizzle Kit for database schema management and migrations

### Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage for session management
- **Security**: Bcrypt password hashing with salt rounds for secure credential storage
- **Middleware**: Express middleware for request authentication and authorization
- **Session Management**: Automatic token validation and user context preservation

### Real-time Communication
- **Protocol**: WebSocket connections for instant message delivery and typing indicators
- **Connection Management**: Server-side connection tracking with user mapping
- **Message Types**: Structured message protocol for different event types (auth, messages, typing)
- **Fallback**: Graceful degradation with automatic reconnection handling

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **ws**: WebSocket library for real-time communication

### UI & Styling
- **@radix-ui/react-***: Accessible headless UI components (accordion, dialog, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant handling for component styling
- **clsx**: Conditional className utility

### Authentication & Validation
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and comparison
- **zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Form validation integration

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development enhancements