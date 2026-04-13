# AGENTS.md - DocNet Backend Development Guide

This document provides comprehensive guidelines for AI agents and developers working on the DocNet backend codebase. Follow these conventions to maintain consistency and quality.

## Table of Contents
1. [Build, Lint, and Test Commands](#build-lint-and-test-commands)
2. [Code Style Guidelines](#code-style-guidelines)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Common Patterns](#common-patterns)

## Build, Lint, and Test Commands

### Build Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Lint and Type Check Commands
> **Note**: ESLint and Prettier are not currently configured. It is recommended to configure these tools before relying on lint/type-check scripts in automation.

```bash
# Install recommended dev dependencies for linting/formatting
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier

# (Optional) Add script entries to package.json:
# "lint": "eslint src/**/*.ts",
# "lint:fix": "eslint src/**/*.ts --fix",
# "format": "prettier --write src/**/*.ts",
# "typecheck": "tsc --noEmit"

# Lint TypeScript files
npx eslint src/**/*.ts

# Fix linting issues automatically
npx eslint src/**/*.ts --fix

# Format code with Prettier
npx prettier --write src/**/*.ts

# Type check
npx tsc --noEmit
```

> **If you depend on linting/type-checking in agent workflows, ensure the scripts above exist and dependencies are installed first.**


### Test Commands
> **Note**: Testing framework is not currently configured. Recommended setup with Jest:

```bash
# Install testing dependencies
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# (Optional) Add script entries to package.json:
# "test": "jest",
# "test:watch": "jest --watch",

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm test -- path/to/test/file.test.ts

# Run tests with coverage
npm test -- --coverage
```

> **If you depend on automated testing, verify test scripts are actually defined and that Jest is configured first.**

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2020
- **Module**: CommonJS
- **Strict mode**: Enabled (except `noImplicitAny: false`)
- **Source maps**: Enabled
- **Declarations**: Generated

### Import/Export Style
```typescript
// Use ES6 imports/exports
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';

// Group imports by source:
// 1. Node.js built-ins
// 2. External libraries
// 3. Internal modules (use relative paths)
```

### Naming Conventions
- **Files**: `camelCase.ts` (e.g., `authRoutes.ts`, `userModel.ts`)
- **Classes**: `PascalCase` (e.g., `User`, `AuthController`)
- **Interfaces**: `PascalCase` with `I` prefix or descriptive names (e.g., `UserAttributes`, `AuthRequest`)
- **Functions/Methods**: `camelCase` (e.g., `validatePassword`, `generateToken`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`)
- **Variables**: `camelCase` (e.g., `userData`, `authToken`)

### Database Conventions
- **Table names**: `snake_case` plural (e.g., `users`, `user_profiles`)
- **Column names**: `snake_case` (e.g., `first_name`, `created_at`)
- **Model properties**: `camelCase` (Sequelize handles mapping)

### API Response Format
```typescript
// Success responses
res.json({
  success: true,
  data: userData,
  message?: 'Optional success message'
});

// Error responses
res.status(400).json({
  success: false,
  message: 'Error description',
  errors?: validationErrors // For validation errors
});
```

### Error Handling
```typescript
// Route-level error handling
router.post('/endpoint', async (req: Request, res: Response) => {
  try {
    // Business logic
    const result = await someOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Operation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Global error handling middleware (in app.ts)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});
```

### Validation
```typescript
// Use express-validator for input validation
router.post('/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    // Continue with validated data
  }
);
```

### Authentication & Authorization
```typescript
// JWT token generation
const generateToken = (id: number): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

// Protected routes
router.get('/protected', protect, (req: AuthRequest, res: Response) => {
  // req.user is available here
  res.json({ success: true, user: req.user });
});

// Role-based authorization
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  // Only admins can access
});
```

### Environment Variables
- Store sensitive data in `.env` file
- Use `process.env.VARIABLE_NAME!` for required variables
- Provide defaults for optional variables: `process.env.PORT || 5000`
- Never commit `.env` files to version control

### Database Models
```typescript
// Define interfaces for type safety
interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName?: string;
  // ... other attributes
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// Class implementation with Sequelize
class User extends Model<UserAttributes, UserCreationAttributes> {
  // Instance methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

// Model initialization
User.init({
  // Field definitions with validation
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  // ... other fields
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users', // Explicit table name
  timestamps: true,   // Auto-manage createdAt/updatedAt
  hooks: {
    // Password hashing hooks
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});
```

## Project Structure

```
src/
├── app.ts              # Express application setup
├── config/
│   └── db.ts           # Database configuration
├── controllers/        # (Currently empty - use routes for now)
├── middleware/
│   └── auth.ts         # Authentication middleware
├── models/             # Sequelize models
│   ├── index.ts        # Model associations
│   ├── User.ts         # User model
│   └── ...             # Other models
├── routes/             # API route handlers
│   ├── auth.ts         # Authentication routes
│   ├── users.ts        # User management routes
│   └── ...             # Other route files
├── services/           # Business logic services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── validators/         # Input validation logic
```

## Development Workflow

### 1. Environment Setup
```bash
# Clone and install dependencies
npm install

# Set up environment variables (.env file)
cp .env.example .env  # Create if example exists

# Start development server
npm run dev
```

### 2. Database Setup
- Uses PostgreSQL with Sequelize ORM
- Auto-sync in development mode
- Connection pooling configured
- Environment-based logging

### 3. Adding New Features
1. **Models**: Create Sequelize model in `src/models/`
2. **Routes**: Add routes in `src/routes/` with validation
3. **Middleware**: Add custom middleware in `src/middleware/` if needed
4. **Services**: Extract business logic to `src/services/`
5. **Types**: Define interfaces in `src/types/`

### 4. Code Quality Checks
> **Note**: Implement these tools for better code quality:

- **ESLint**: For code linting
- **Prettier**: For code formatting
- **TypeScript**: For type checking
- **Jest**: For unit/integration tests
- **Husky**: For pre-commit hooks

## Common Patterns

### Async/Await Usage
```typescript
// Always use async/await over Promises/callbacks
const userController = {
  async getUser(req: Request, res: Response) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};
```

### Middleware Composition
```typescript
// Combine multiple middlewares
router.post('/protected-endpoint',
  protect,                    // Authentication
  authorize('user'),          // Authorization
  upload.single('file'),      // File upload
  validateRequest,            // Custom validation
  controller.handler          // Route handler
);
```

### Sequelize Associations
```typescript
// Define model relationships in models/index.ts
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Use associations in queries
const userWithPosts = await User.findOne({
  where: { id: userId },
  include: [{ model: Post, as: 'posts' }]
});
```

### File Upload Handling
```typescript
// Use multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Validate file types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
```

### Security Best Practices
- Use Helmet for security headers
- Implement CORS properly
- Rate limiting on API endpoints
- Input validation on all endpoints
- JWT tokens with expiration
- Password hashing with bcrypt
- SQL injection prevention (handled by Sequelize)
- XSS protection (handled by proper response encoding)

### Logging
```typescript
// Use console for development logging
console.log('User created:', user.id);
console.error('Database error:', error);

// Consider implementing structured logging for production
// e.g., Winston or Pino
```

## Recommended Tooling

### Development Tools to Add
1. **ESLint + Prettier**: Code linting and formatting
2. **Jest + Supertest**: Unit and integration testing
3. **Husky + lint-staged**: Pre-commit hooks
4. **Nodemon/ts-node-dev**: Already configured for development

### VS Code Extensions
- TypeScript and JavaScript Language Features
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

#### Example VS Code Settings (optional)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.enable": true,
  "files.exclude": {
    "dist": true,
    "node_modules": true
  }
}
```

### Git Workflow
- Use feature branches
- Write descriptive commit messages
- Never commit sensitive data (.env files)
- Use .gitignore for build artifacts and dependencies

This guide should be updated as the project evolves and new tools/patterns are adopted.</content>
<parameter name="filePath">/Users/debasish/docnet-backend/AGENTS.md