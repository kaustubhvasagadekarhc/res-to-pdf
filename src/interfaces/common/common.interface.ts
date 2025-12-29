export interface ApiResponse<T = unknown> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
