
# Real-time Chat Application

A modern, full-stack real-time chat application built with React, Express, and WebSockets. Features instant messaging, typing indicators, message replies, and a clean responsive design.

## Features

- 🚀 **Real-time messaging** - Instant message delivery using WebSockets
- 💬 **Message replies** - Reply to specific messages with contextual preview
- ⌨️ **Typing indicators** - See when others are typing
- 📱 **Responsive design** - Works seamlessly on desktop and mobile
- 🔐 **Secure authentication** - JWT-based auth with bcrypt password hashing
- ✅ **Message status** - Double tick system for message delivery and read status
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- 📄 **Message pagination** - Efficient loading of chat history

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **shadcn/ui** components built on Radix UI
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express.js
- **WebSocket** for real-time communication
- **JWT** authentication
- **Drizzle ORM** with PostgreSQL
- **Zod** for validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo-url>
cd chat-app
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

3. **Set up the database:**
```bash
npm run db:push
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Authentication
1. Register a new account or login with existing credentials
2. The app uses JWT tokens stored in localStorage for session management

### Messaging
- **Send messages:** Type in the input field and press Enter or click Send
- **Reply to messages:** Click the reply button on any message
- **View message status:** Single tick = sent, double tick = delivered/seen
- **See typing indicators:** When someone is typing, you'll see an indicator
- **Load message history:** Scroll to the top to load older messages

### Real-time Features
- Messages appear instantly without page refresh
- Typing indicators show in real-time
- Message read status updates automatically
- Connection status is managed automatically

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Messages
- `GET /api/messages` - Get all messages
- `GET /api/messages/paginated` - Get paginated messages
- `POST /api/messages` - Send new message
- `POST /api/messages/mark-seen` - Mark messages as seen

### WebSocket Events
- `auth` - Authenticate WebSocket connection
- `typing` - Send/receive typing indicators
- `message_seen` - Real-time seen status updates

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and auth
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # App entry point
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Database schema
└── package.json         # Dependencies and scripts
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

This application is optimized for deployment on Replit:

1. Fork this Repl
2. Set up your environment variables in the Secrets tab
3. Click Run to start the application
4. Use the Deployments tab to publish your app to the web

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with ❤️ using modern web technologies
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Deployed on [Replit](https://replit.com/)
