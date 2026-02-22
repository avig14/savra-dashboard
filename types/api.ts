// Standard API response envelope — every endpoint wraps in this
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalRecords: number;
    duplicatesDetected: number;
    lastUpdated: string; // ISO timestamp
  };
  error?: string;
}

// Helper to build success response
export function ok<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
): ApiResponse<T> {
  return { success: true, data, meta };
}

// Helper to build error response
export function err<T>(
  message: string,
  statusHint?: number
): ApiResponse<T> {
  void statusHint; // used by caller for HTTP status code
  return { success: false, data: null as T, error: message };
}
