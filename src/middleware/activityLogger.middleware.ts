import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import { verifyToken } from '../utils/jwt';

// interface DecodedUser {
//     id: string;
//     email: string;
// }

interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        name?: string;
        [key: string]: unknown;
    };
    cookies: Record<string, unknown>;
    header: (name: string) => string | undefined;
    body: Record<string, unknown>;
}

// Helper to get username from request
const getUserName = (req: Request): string | null => {
    const authReq = req as unknown as AuthenticatedRequest;
    if (authReq.user?.name) {
        return authReq.user.name;
    }
    if (authReq.user?.email) {
        return authReq.user.email;
    }
    return null;
};

// Helper to generate natural language description from request
const generateDescription = (
    req: Request,
    method: string,
    path: string
): { description: string; metadata?: Record<string, unknown> } | null => {
    const body = req.body || {};
    const pathLower = path.toLowerCase();
    const lastSegment = path.split('/').pop() || '';
    const userName = getUserName(req);

    // 1. Auth Routes - Special handling for authentication actions
    // Format: "{username} - {action}" for authenticated actions
    if (pathLower.includes('/auth/')) {
        if (method === 'POST') {
            if (pathLower.includes('/login')) {
                // For login, user might not be authenticated yet, so use email from body or generic
                const loginEmail = (body.email as string) || userName || 'user';
                return {
                    description: userName ? `${userName} - logged in` : `${loginEmail} - logged in`,
                    metadata: { type: 'authentication', action: 'login' },
                };
            }
            if (pathLower.includes('/logout')) {
                // For logout, user should be authenticated
                if (userName) {
                    return {
                        description: `${userName} - logged out`,
                        metadata: { type: 'authentication', action: 'logout' },
                    };
                }
                return {
                    description: 'logged out',
                    metadata: { type: 'authentication', action: 'logout' },
                };
            }
            if (pathLower.includes('/register')) {
                return {
                    description: 'created new registration',
                    metadata: { type: 'authentication', action: 'register' },
                };
            }
            if (pathLower.includes('/verify-otp')) {
                return {
                    description: 'created new otp verification',
                    metadata: { type: 'authentication', action: 'verify_otp' },
                };
            }
            if (pathLower.includes('/resend-otp')) {
                return {
                    description: 'created new otp resend',
                    metadata: { type: 'authentication', action: 'resend_otp' },
                };
            }
            if (pathLower.includes('/forgot-password')) {
                return {
                    description: 'created new password reset request',
                    metadata: { type: 'authentication', action: 'forgot_password' },
                };
            }
            if (pathLower.includes('/reset-password')) {
                return {
                    description: 'created new password reset',
                    metadata: { type: 'authentication', action: 'reset_password' },
                };
            }
            if (pathLower.includes('/vetlly/callback')) {
                return {
                    description: 'created new sso login',
                    metadata: { type: 'authentication', action: 'sso_login' },
                };
            }
        }
    }

    // 2. Dashboard Routes - Special handling for dashboard actions
    if (pathLower.includes('/dashboard/')) {
        if (method === 'POST' && pathLower.includes('/resumes')) {
            return {
                description: 'created new resume',
                metadata: { type: 'resume', action: 'create' },
            };
        }
    }

    // 3. Explicit State Transitions (e.g., Kanban moves)
    // Looking for "moved from X to Y" pattern
    if ((body.from && body.to) || (body.previousStatus && body.newStatus)) {
        const from = body.from || body.previousStatus;
        const to = body.to || body.newStatus;
        return {
            description: `moved from ${from} to ${to}`,
            metadata: { from, to, type: 'status_change' },
        };
    }

    // 4. Job/Application Actions
    if (path.includes('apply') || (method === 'POST' && path.includes('application'))) {
        return {
            description: 'applied to this job',
            metadata: { type: 'application' },
        };
    }

    // 5. "Change X to Y" / "Count set to N" (Updates)
    if (method === 'PATCH' || method === 'PUT') {
        const keys = Object.keys(body).filter(
            (k) => !['id', 'userId', 'password', 'confirmPassword', 'token'].includes(k) // Exclude technical/sensitive fields
        );

        if (keys.length === 1) {
            const key = keys[0];
            const val = body[key];

            // Format key: "jobTitle" -> "job title"
            const readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();

            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                return {
                    description: `change ${readableKey} to ${val}`, // "change job title to Math Teacher"
                    metadata: { field: readableKey, value: val, type: 'update' },
                };
            }
            return {
                description: `update ${readableKey}`,
                metadata: { field: readableKey, type: 'update' },
            };
        } else if (keys.length > 1) {
            const readableKeys = keys
                .map((k) => k.replace(/([A-Z])/g, ' $1').toLowerCase())
                .join(', ');
            return {
                description: `updated ${readableKeys}`,
                metadata: { fields: readableKeys, type: 'update_multiple' },
            };
        }
    }

    // 6. Default Fallbacks based on Method
    if (method === 'POST') {
        const resource = lastSegment.replace(/s$/, ''); // Remove plural 's'
        return {
            description: `created new ${resource}`,
        }; // "created new user", "created new resume"
    }
    if (method === 'DELETE') {
        const resource = lastSegment.replace(/s$/, ''); // Remove plural 's'
        return {
            description: `deleted ${resource}`,
        }; // "deleted user", "deleted resume"
    }

    return null; // Fallback to generic "Method Path" if null
};

export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // 1. Try to get user from req.user (if auth middleware ran first)
    const authReq = req as unknown as AuthenticatedRequest;
    let userId = authReq.user?.id;

    if (!userId) {
        try {
            const token =
                req.cookies['auth-token'] || req.header('Authorization')?.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = verifyToken(token);
                    userId = decoded.id;
                } catch (error) {
                    // Token invalid - ignore, but still log the attempt
                }
            }
        } catch (error) {
            // Token invalid - ignore
        }
    }

    // Hook into response finish
    res.on('finish', () => {
        // Allow controllers to opt-out when they perform custom logging
        if (res.locals && (res.locals as any).skipActivityLog) {
            return;
        }
        const duration = Date.now() - startTime;
        const path = req.originalUrl.split('?')[0];
        const method = req.method;
        const statusCode = res.statusCode;

        // Log ALL requests, including unauthenticated ones (for security monitoring)
        // This helps track failed login attempts, unauthorized access, etc.

        // Heuristic Action Name
        let processingPath = path;
        if (res.locals.targetIdentifier) {
            const uuidRegex = /[0-9a-fA-F-]{36}/g;
            processingPath = processingPath.replace(uuidRegex, res.locals.targetIdentifier);
        }

        const cleanPath = processingPath.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        const action = `${method}_${cleanPath}`;

        // Generate Description
        // Priority:
        // 1. res.locals.activityDescription (Controller override)
        // 2. generateDescription (Inference)
        // 3. Generic fallback

        let description = res.locals.activityDescription;
        let metadata: Record<string, unknown> = {};

        if (!description) {
            const generated = generateDescription(req, method, path);
            if (generated) {
                description = generated.description;
                metadata = generated.metadata || {};
            }
        }

        if (!description) {
            // Generic Fallback
            description = `accessed ${path}`;
        }

        // Enhanced metadata with more details
        const enhancedMetadata = {
            ...metadata,
            method,
            url: req.originalUrl,
            statusCode,
            duration, // Request duration in milliseconds
            userAgent: req.headers['user-agent'] || 'unknown',
            bodyKeys: Object.keys(req.body || {}),
            queryParams: Object.keys(req.query || {}),
            // Include error information if present
            ...(statusCode >= 400 && statusCode < 500 ? { 
                error: res.locals.error || 'Client error',
                errorType: 'client_error'
            } : {}),
            ...(statusCode >= 500 ? { 
                error: res.locals.error || 'Server error',
                errorType: 'server_error'
            } : {}),
            // Include file upload info if present
            ...(req.file ? {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileType: req.file.mimetype
            } : {}),
        };

        // Log activity (even if userId is null for unauthenticated attempts)
        activityService
            .logActivity(
                userId || null,
                action,
                description,
                enhancedMetadata
            )
            .catch(() => { /* ignored */ });
    });

    next();
};
