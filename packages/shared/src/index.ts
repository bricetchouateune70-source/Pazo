// Enums
export * from './enums';

// Schemas & Types
export * from './schemas';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Cart Types (für Frontend State)
export interface CartState {
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string | null;
    };
    quantity: number;
  }>;
  total: number;
}
