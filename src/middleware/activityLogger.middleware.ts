import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { activityService } from '../services/activity.service';

interface DecodedUser {
    id: string;
    email: string;
}

interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        [key: string]: unknown;
    };
    cookies: Record<string, unknown>;
    header: (name: string) => string | undefined;
    body: Record<string, unknown>;
}

// Helper to generate natural language description from request
const generateDescription = (
    req: Request,
    method: string,
    path: string
): { description: string; metadata?: Record<string, unknown> } | null => {
    const body = req.body || {};

    // 1. Explicit State Transitions (e.g., Kanban moves)
    // Looking for "moved from X to Y" pattern
    if ((body.from && body.to) || (body.previousStatus && body.newStatus)) {
        const from = body.from || body.previousStatus;
        const to = body.to || body.newStatus;
        return {
            description: `moved from ${from} to ${to}`,
            metadata: { from, to, type: 'status_change' },
        };
    }

    // 2. Job/Application Actions
    if (path.includes('apply') || (method === 'POST' && path.includes('application'))) {
        return {
            description: 'applied to this job',
            metadata: { type: 'application' },
        };
    }

    // 3. "Change X to Y" / "Count set to N" (Updates)
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

    // 5. Default Fallbacks based on Method
    if (method === 'POST')
        return {
            description: `created new ${path.split('/').pop()?.replace(/s$/, '')}`,
        }; // "created new user"
    if (method === 'DELETE')
        return {
            description: `deleted ${path.split('/').pop()?.replace(/s$/, '')}`,
        }; // "deleted user"

    return null; // Fallback to generic "Method Path" if null
};

export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Try to get user from req.user (if auth middleware ran first)
    const authReq = req as unknown as AuthenticatedRequest;
    let userId = authReq.user?.id;

    if (!userId) {
        try {
            const token =
                req.cookies['auth-token'] || req.header('Authorization')?.replace('Bearer ', '');
            if (token && process.env.JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedUser;
                userId = decoded.id;
            }
        } catch (error) {
            // Token invalid - ignore
        }
    }

    // Hook into response finish
    res.on('finish', () => {
        // Only log successful actions or specific user errors?
        // Usually we want to log failures too, but maybe with a flag.

        if (!userId) return;

        const path = req.originalUrl.split('?')[0];
        const method = req.method;

        // Heuristic Action Name
        const cleanPath = path.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
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

        activityService
            .logActivity(
                userId,
                action,
                description,
                {
                    ...metadata,
                    method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    bodyKeys: Object.keys(req.body || {}),
                }
            )
            .catch((err) => console.error('Activity logging failed', err));
    });

    next();
};
