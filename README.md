# Endeavours - Task & Project Management Platform

A modern, production-ready SaaS application for task and project management built with Next.js 15, TypeScript, and MongoDB.

## ✨ Features

- **Project Management** - Create, organize, and manage multiple projects
- **Task Management** - Full CRUD operations with priorities, statuses, and due dates
- **Team Collaboration** - Add members to projects and assign tasks
- **Dashboard Analytics** - Visual charts and statistics for productivity insights
- **Activity Tracking** - Complete audit log of all actions
- **Dark Mode** - Beautiful light and dark theme support
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Secure Authentication** - JWT-based auth with httpOnly cookies

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **Charts**: Recharts
- **Data Fetching**: SWR
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn
- MongoDB instance (local or cloud like MongoDB Atlas)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
cd ENDEAVOURS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/endeavours

# JWT secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints
│   │   ├── projects/      # Project CRUD
│   │   ├── tasks/         # Task CRUD
│   │   ├── activity/      # Activity logs
│   │   └── stats/         # Dashboard stats
│   └── dashboard/         # Protected dashboard pages
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
└── lib/
    ├── auth/              # Authentication utilities
    ├── db/                # Database models and connection
    ├── validations/       # Zod schemas
    └── utils.ts           # Helper functions
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Deploying to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/endeavours)

### Option 2: Manual Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Configure Environment Variables** in Vercel Dashboard:
   - `MONGODB_URI` - Your MongoDB connection string (use MongoDB Atlas for production)
   - `JWT_SECRET` - A strong secret key for JWT signing
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://endeavours.vercel.app`)

### Production MongoDB Setup

For production, we recommend using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Get your connection string and add it to Vercel environment variables
4. Whitelist `0.0.0.0/0` in Network Access for Vercel serverless functions

## 🔒 Security Notes

- JWT tokens are stored in httpOnly cookies for XSS protection
- Passwords are hashed using bcrypt with salt rounds
- All API routes validate user authentication
- Input validation using Zod schemas
- CSRF protection via SameSite cookie attribute

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity logs |
| GET | `/api/stats` | Get dashboard statistics |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js and MongoDB
