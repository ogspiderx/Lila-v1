
# Real-time Chat Application

## Overview

This is a modern, full-stack real-time chat application that demonstrates the power of combining React, Express, WebSockets, and PostgreSQL. The application provides instant messaging capabilities with advanced features like message replies, typing indicators, read receipts, and message pagination - all wrapped in a beautiful, responsive interface.

## Live Demo

🚀 **[Try the Live Demo](https://your-repl-url.replit.app)**

## Key Features

### 💬 **Real-time Communication**
- Instant message delivery using WebSocket connections
- Live typing indicators with automatic timeout
- Real-time message read status (double tick system)
- Automatic connection management and reconnection

### 📱 **Modern User Experience**
- Clean, responsive design that works on all devices
- Message replies with contextual preview
- Infinite scroll pagination for chat history
- Emoji support in messages
- Loading states and error handling

### 🔐 **Security & Authentication**
- JWT-based authentication with secure token storage
- Password hashing using bcrypt with salt rounds
- Protected API endpoints with middleware validation
- Session management with automatic token validation

### 🗃️ **Data Management**
- PostgreSQL database with Drizzle ORM
- Type-safe database operations
- Efficient message pagination
- Automatic message status tracking

## User Preferences

**Preferred communication style:** Simple, everyday language that's easy to understand.

## Recent Changes

**File Attachment Feature (August 2, 2025):**
- Added comprehensive file upload functionality to the chat application
- Backend: Created multer-based file upload API with 10MB file size limit
- Supported file types: images, PDFs, documents, text files, spreadsheets
- Frontend: Created FileAttachment component with drag-and-drop interface
- File preview and download capabilities for all attachment types
- Integrated file attachments into message system with attachment metadata storage
- Updated database schema to support file attachment fields (attachmentUrl, attachmentName, attachmentType, attachmentSize)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight, fast client-side routing
- **State Management**: TanStack Query for powerful server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for consistent theming
- **Build Tool**: Vite for lightning-fast development and optimized production builds
- **Real-time**: Custom WebSocket hook for managing connection state

### Backend Architecture
- **Runtime**: Node.js with Express.js for robust HTTP server and RESTful APIs
- **WebSockets**: Native WebSocket implementation for bidirectional real-time communication
- **Authentication**: JWT tokens with bcrypt password hashing for security
- **Validation**: Zod schemas for runtime type validation and API safety
- **Development**: Graceful development/production environment handling

### Database Design
- **ORM**: Drizzle ORM with full TypeScript integration
- **Database**: PostgreSQL via @neondatabase/serverless for scalable cloud storage
- **Schema**: Centralized type-safe schema definitions in `shared/schema.ts`
- **Migrations**: Drizzle Kit for version-controlled database schema management

### Real-time Communication Protocol
- **Connection Management**: Server-side WebSocket connection tracking with user mapping
- **Message Types**: Structured protocol for authentication, messaging, and typing events
- **Reliability**: Automatic reconnection with exponential backoff
- **Fallback**: Polling mechanism ensures message delivery even with connection issues

## Technical Highlights

### Performance Optimizations
- **Efficient Polling**: Smart 1-second polling with 304 caching for minimal bandwidth
- **Message Pagination**: Load older messages on-demand to reduce initial load time
- **Optimistic Updates**: Immediate UI updates with server confirmation
- **Connection Pooling**: Reuse database connections for better performance

### Developer Experience
- **Full TypeScript**: End-to-end type safety from database to UI
- **Hot Reloading**: Instant development feedback with Vite
- **Component Library**: Consistent, accessible UI components
- **Error Boundaries**: Graceful error handling throughout the application

## Getting Started on Replit

### Quick Start
1. **Fork this Repl** - Click the fork button to create your own copy
2. **Set up Secrets** - Add your environment variables in the Secrets tab:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
3. **Run the Application** - Click the Run button to start development
4. **Deploy** - Use the Deployments tab to publish your chat app to the web

### Environment Configuration
The application automatically detects the Replit environment and configures itself appropriately. The default setup includes:
- Port 5000 for development (auto-forwarded to 80/443 in production)
- Automatic package installation based on package.json
- Database schema initialization with `npm run db:push`

## Usage Guide

### For Users
1. **Register/Login**: Create an account or sign in with existing credentials
2. **Start Chatting**: Send messages that appear instantly for all users
3. **Reply to Messages**: Click the reply button to respond to specific messages
4. **Watch for Activity**: See typing indicators and message read status
5. **Browse History**: Scroll up to load older messages automatically

### For Developers
1. **Explore the Code**: Well-commented, modular code structure
2. **Customize UI**: Modify Tailwind classes and shadcn components
3. **Extend Features**: Add new message types, file uploads, or user presence
4. **Scale Up**: The architecture supports adding rooms, user roles, or message encryption

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL for scalable cloud database
- **drizzle-orm & drizzle-kit**: Modern TypeScript ORM with excellent developer experience
- **@tanstack/react-query**: Powerful data fetching and caching library
- **wouter**: Minimalist router perfect for single-page applications
- **ws**: Fast, standards-compliant WebSocket implementation

### UI & Design
- **@radix-ui/react-***: Unstyled, accessible components (dialog, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Beautiful, consistent icon library

### Authentication & Security
- **jsonwebtoken**: Industry-standard JWT implementation
- **bcrypt**: Proven password hashing with configurable difficulty
- **zod**: Runtime type validation for API endpoints and forms

### Development Tools
- **vite**: Next-generation frontend tooling with native ESM
- **typescript**: Static type checking for better code quality
- **@replit/vite-plugin-***: Replit-specific optimizations and debugging tools

## Advanced Features

### Message System
- **Reply Threading**: Messages can reference and reply to previous messages
- **Read Receipts**: Track when messages are delivered and seen
- **Typing Indicators**: Real-time feedback when users are composing messages
- **Message Status**: Visual indicators for sent, delivered, and read states

### Connection Management
- **Auto-reconnection**: Seamless reconnection on network interruptions
- **Graceful Degradation**: Polling fallback when WebSockets aren't available
- **Connection Status**: UI feedback for connection state

### Data Handling
- **Pagination**: Efficient loading of message history
- **Caching**: Smart caching strategies to minimize database queries
- **Real-time Sync**: Immediate updates across all connected clients

## Customization

### Theming
The application uses CSS variables for theming, making it easy to customize colors and appearance:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  /* ... more variables */
}
```

### Adding Features
The modular architecture makes it easy to add new features:
- **File Uploads**: Extend the message schema and add file handling
- **User Presence**: Track online status using WebSocket connections
- **Message Reactions**: Add emoji reactions to messages
- **Chat Rooms**: Implement multiple chat channels

## Performance Considerations

- **Database Indexing**: Optimized queries with proper indexing on message timestamps
- **Connection Limits**: WebSocket connection pooling for scalability
- **Memory Management**: Efficient cleanup of inactive connections
- **Caching Strategy**: Smart caching at multiple levels (browser, CDN, database)

## Security Features

- **Input Sanitization**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevent spam and abuse with request rate limiting
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Secure configuration management

This chat application showcases modern web development practices and can serve as a foundation for more complex real-time applications. The clean architecture and comprehensive documentation make it perfect for learning, teaching, or extending into a production-ready service.
