/**
 * Centralized REST API client for Pomofocus Pro Spring Boot 3 backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface UserDto {
  id: string;
  email: string;
  username: string;
  authProvider: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token?: string;
  status: string;
  message: string;
  user?: UserDto;
}

export interface TaskDto {
  id: string;
  title: string;
  category: string;
  colorHex: string;
  dailyTargetMinutes: number;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  todayFocusSeconds: number;
  todayFocusMinutes: number;
  progressPercentage: number;
  deficitOrSurplusMinutes: number;
  latestCheckpointNote?: string;
}

export interface SessionDto {
  id: string;
  taskId?: string;
  taskTitle: string;
  taskColorHex: string;
  sessionType: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  startTime: string;
  endTime: string;
  durationSeconds: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface CheckpointDto {
  id: string;
  taskId: string;
  taskTitle: string;
  taskColorHex: string;
  checkpointNote: string;
  createdAt: string;
}

export type PriorityTier = 'INBOX' | 'MANDATORY' | 'PRIORITY' | 'NEED_TO_COMPLETE' | 'IF_GOT_TIME';

export interface DailyTaskDto {
  id: string;
  targetId?: string | null;
  targetTitle?: string | null;
  targetColorHex?: string | null;
  title: string;
  priorityTier: PriorityTier;
  plannedDate: string;
  isCompleted: boolean;
  completedAt?: string | null;
  estimatedMinutes: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDailyTaskRequest {
  title: string;
  priorityTier?: PriorityTier;
  plannedDate?: string;
  targetId?: string | null;
  estimatedMinutes?: number;
  sortOrder?: number;
}

export interface RolloverRequest {
  fromDate: string;
  toDate: string;
  taskIds?: string[];
}

export interface DailyDebriefDto {
  id: string;
  debriefDate: string;
  whatWentWell?: string | null;
  whatWentWrong?: string | null;
  energyRating: number;
  tomorrowNotes?: string | null;
  totalFocusSecondsSnapshot: number;
  tasksCompletedCount: number;
  tasksTotalCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveDailyDebriefRequest {
  debriefDate: string;
  whatWentWell?: string;
  whatWentWrong?: string;
  energyRating?: number;
  tomorrowNotes?: string;
}

export interface TaskReportItem {
  taskId: string;
  title: string;
  category: string;
  colorHex: string;
  targetMinutes: number;
  actualMinutes: number;
  actualSeconds: number;
  completionPercentage: number;
  deficitOrSurplusMinutes: number;
  sessionCount: number;
}

export interface DailyReportDto {
  date: string;
  totalTargetMinutes: number;
  totalActualMinutes: number;
  totalActualSeconds: number;
  overallCompletionPercentage: number;
  totalDeficitOrSurplusMinutes: number;
  contextSwitchCount: number;
  totalFocusSessions: number;
  taskBreakdown: TaskReportItem[];
  timeline: SessionDto[];
}

export interface DailyTrendItem {
  date: string;
  targetMinutes: number;
  actualMinutes: number;
  focusSessionsCount: number;
  completionPercentage: number;
}

export interface WeeklyReportDto {
  startDate: string;
  endDate: string;
  totalTargetMinutes: number;
  totalActualMinutes: number;
  consistencyScore: number;
  dailyTrends: DailyTrendItem[];
  taskBreakdown: TaskReportItem[];
}

export const getClientTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pomopro_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': getClientTimezone(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    signup: (body: { email: string; username: string; password: string }) =>
      apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    verifyEmail: (body: { email: string; otp: string }) =>
      apiRequest<AuthResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }),
    resendCode: (body: { email: string }) =>
      apiRequest<AuthResponse>('/auth/resend-code', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    demoLogin: () =>
      apiRequest<AuthResponse>('/auth/demo', { method: 'POST' }),
    me: () =>
      apiRequest<UserDto>('/auth/me'),
  },

  tasks: {
    list: () =>
      apiRequest<TaskDto[]>('/tasks'),
    create: (body: { title: string; category?: string; colorHex?: string; dailyTargetMinutes?: number }) =>
      apiRequest<TaskDto>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { title: string; category?: string; colorHex?: string; dailyTargetMinutes?: number; sortOrder?: number }) =>
      apiRequest<TaskDto>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    archive: (id: string) =>
      apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  sessions: {
    log: (body: { taskId?: string; sessionType: string; startTime: string; endTime: string; durationSeconds: number; completed: boolean }) =>
      apiRequest<SessionDto>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
    recent: () =>
      apiRequest<SessionDto[]>('/sessions/recent'),
  },

  checkpoints: {
    save: (body: { taskId: string; checkpointNote: string }) =>
      apiRequest<CheckpointDto>('/checkpoints', { method: 'POST', body: JSON.stringify(body) }),
    getLatest: (taskId: string) =>
      apiRequest<CheckpointDto | null>(`/checkpoints/latest?taskId=${taskId}`),
    recent: () =>
      apiRequest<CheckpointDto[]>('/checkpoints/recent'),
  },

  reports: {
    daily: (date?: string) =>
      apiRequest<DailyReportDto>(`/reports/daily${date ? `?date=${date}` : ''}`),
    weekly: (startDate?: string, endDate?: string) =>
      apiRequest<WeeklyReportDto>(`/reports/weekly${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`),
    getExportUrl: () =>
      `${BASE_URL}/reports/export?format=csv&timezone=${encodeURIComponent(getClientTimezone())}`,
  },

  dailyTasks: {
    list: (date?: string) =>
      apiRequest<DailyTaskDto[]>(`/daily-tasks${date ? `?date=${date}` : ''}`),
    create: (body: CreateDailyTaskRequest) =>
      apiRequest<DailyTaskDto>('/daily-tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateDailyTaskRequest>) =>
      apiRequest<DailyTaskDto>(`/daily-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    toggle: (id: string) =>
      apiRequest<DailyTaskDto>(`/daily-tasks/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: string) =>
      apiRequest<void>(`/daily-tasks/${id}`, { method: 'DELETE' }),
    rollover: (body: RolloverRequest) =>
      apiRequest<DailyTaskDto[]>('/daily-tasks/rollover', { method: 'POST', body: JSON.stringify(body) }),
  },

  dailyDebriefs: {
    get: (date?: string) =>
      apiRequest<DailyDebriefDto | null>(`/daily-debriefs${date ? `?date=${date}` : ''}`),
    save: (body: SaveDailyDebriefRequest) =>
      apiRequest<DailyDebriefDto>(
        `/daily-debriefs?timezone=${encodeURIComponent(getClientTimezone())}`,
        { method: 'POST', body: JSON.stringify(body) }
      ),
    history: () =>
      apiRequest<DailyDebriefDto[]>('/daily-debriefs/history'),
  },
};
