# Secure Notes Vault 🔐

A production-ready secure notes application built with the MERN stack, featuring end-to-end encryption, TOTP MFA, and a stunning glossy gradient UI.

## ✨ Features

### 🔒 Security First
- **End-to-End Encryption**: AES-GCM encryption with client-side PBKDF2 key derivation
- **Two-Factor Authentication**: TOTP-based MFA with QR code setup
- **JWT Authentication**: Secure httpOnly cookies with access/refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation using Zod
- **Password Policy**: Strong password requirements with complexity validation

### 📝 Note Management
- Create, edit, and delete encrypted notes
- Mark notes as favorites for quick access
- Soft delete with trash management (restore/permanent delete)
- Download notes as text files
- Real-time search through encrypted content (client-side)
- Responsive design optimized for all devices

### 🎨 Beautiful UI/UX
- Glossy gradient theme with cyber blue/aqua tones
- Glass morphism design with backdrop blur effects
- Smooth animations and micro-interactions
- Accessible design with proper ARIA labels
- Mobile-responsive layout

### 📧 Communication
- Welcome emails upon successful registration
- Login notification emails with security details
- SMTP integration with customizable templates

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management
- **Axios** for HTTP requests
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT handling
- **otplib** for TOTP generation
- **qrcode** for QR code generation
- **nodemailer** for email sending
- **helmet** for security headers
- **cors** for cross-origin requests
- **express-rate-limit** for rate limiting

### Security Libraries
- **crypto** (Node.js built-in) for server-side operations
- **Web Crypto API** for client-side encryption
- **zod** for input validation

## 📁 Project Structure

```
secure-notes-vault/
├── src/                          # Frontend React application
│   ├── components/              # Reusable UI components
│   │   ├── layouts/            # Layout components
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── CryptoContext.tsx   # Encryption management
│   ├── pages/                  # Application pages
│   │   ├── auth/              # Authentication pages
│   │   └── app/               # Main application pages
│   ├── services/              # API services
│   └── utils/                 # Utility functions
├── server/                     # Backend Express application
│   ├── models/                # MongoDB models
│   ├── routes/                # API route handlers
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic services
│   └── server.js              # Server entry point
└── README.md                  # Project documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-notes-vault
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Configure environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```

4. **Edit the `.env` file with your configuration:**
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb://localhost:27017/secure-notes
   
   # JWT Secrets (generate strong random strings)
   JWT_ACCESS_SECRET=your-super-secret-access-token-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-here
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the frontend (port 5173) and backend (port 5000) servers concurrently.

## 🔐 Security Features

### Encryption Flow
1. User creates encryption passphrase during first login
2. PBKDF2 derives encryption key (200,000+ iterations)
3. Each note encrypted with AES-GCM + random IV
4. Only ciphertext, IV, and salt stored on server
5. Decryption happens only on client-side

### MFA Implementation
- TOTP secrets generated using `otplib`
- QR codes created for easy authenticator app setup
- Manual secret backup option provided
- Time-based codes with ±1 step tolerance
- Account lockout after failed attempts

### Authentication Security
- JWT access tokens (15 minutes expiration)
- JWT refresh tokens (7 days expiration)
- httpOnly, secure, SameSite=strict cookies
- Automatic token refresh mechanism
- Rate limiting on auth endpoints

## 📧 Email Templates

The application includes professional HTML email templates for:
- **Welcome Email**: Sent after successful MFA setup
- **Login Notification**: Sent after each successful login

Templates include security information and best practices reminders.

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/verify-mfa` - Verify MFA code and complete signup
- `POST /api/auth/login` - User login with MFA support
- `POST /api/auth/refresh` - Refresh JWT tokens
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Notes Management
- `GET /api/notes` - Get all user notes (with filters)
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Soft delete note (move to trash)
- `POST /api/notes/:id/restore` - Restore note from trash
- `DELETE /api/notes/:id/hard` - Permanently delete note

## 🔧 Development

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run client:dev` - Start only frontend development server
- `npm run server:dev` - Start only backend development server
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint

### Database Schema

#### User Model
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  mfa: {
    enabled: Boolean,
    secret: String,
    backupCodes: Array
  },
  encryptionSalt: String,
  lastLogin: Date,
  timestamps: true
}
```

#### Note Model
```javascript
{
  userId: ObjectId,
  title: String,
  content: {
    ciphertext: String,
    iv: String,
    salt: String
  },
  isFavorite: Boolean,
  isDeleted: Boolean,
  deletedAt: Date,
  timestamps: true
}
```

## 🛡️ Security Considerations

### Client-Side Security
- Encryption keys never leave the client
- Sensitive data cleared from memory after use
- Input sanitization and validation
- XSS protection through proper escaping

### Server-Side Security
- Helmet.js for security headers
- CORS configured for specific origins
- Rate limiting on all endpoints
- Input validation with Zod schemas
- MongoDB injection prevention
- Bcrypt for password hashing (12 rounds)

### Best Practices
- Zero-knowledge architecture
- Defense in depth security model
- Regular security audits recommended
- Keep dependencies updated
- Use HTTPS in production
- Monitor for suspicious activities

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a production MongoDB instance
3. Configure proper SMTP service
4. Set secure JWT secrets (use crypto.randomBytes)
5. Enable HTTPS
6. Configure proper CORS origins
7. Set up monitoring and logging
8. Regular backups of encrypted data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Notes

- **Backup Your Data**: Keep backups of your encryption passphrase
- **MFA Security**: Secure your MFA device and backup codes
- **Regular Updates**: Keep all dependencies updated
- **Production Security**: Follow security best practices in production
- **Data Recovery**: Lost passphrases mean unrecoverable notes

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ for secure note-taking and privacy-first applications.