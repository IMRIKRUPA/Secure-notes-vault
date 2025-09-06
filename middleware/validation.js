import { z } from 'zod';

// Validation schemas
export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain symbol'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits').optional(),
});

export const mfaVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  mfaCode: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.object({
    ciphertext: z.string().min(1, 'Encrypted content is required'),
    iv: z.string().min(1, 'IV is required'),
    salt: z.string(),
  }),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.object({
    ciphertext: z.string().min(1, 'Encrypted content is required'),
    iv: z.string().min(1, 'IV is required'),
    salt: z.string(),
  }).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};