// base url for our backend server
const BACKEND_URL = 'http://localhost:3001/api';

// --- Shared Types ---

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    is_starred: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProjectFull extends Project {
    boards: Board[];
    members: Member[];
}

export interface Board {
    id: number;
    project_id: number;
    name: string;
    color: string;
    task_count?: number;
    created_at: string;
}

export interface Column {
    id: number;
    board_id: number;
    name: string;
    wip_limit: number | null;
    order_index: number;
    position: number;
}

export interface Task {
    id: number;
    board_id: number;
    column_id: number | null;
    column_name: string | null;
    title: string;
    description: string | null;
    priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW' | string;
    type: 'Story' | 'Task' | 'Bug' | string;
    parent_id: number | null;
    parent_title: string | null;
    parent_column_name: string | null;
    assigned_to: number | null;
    assigned_first_name: string | null;
    assigned_surname: string | null;
    due_date: string | null;
    created_at: string;
}

export interface Member {
    id: number;
    first_name: string;
    surname: string;
    emailid: string;
    role: string;
    avatar_data?: string | null;
    global_role?: string;
}

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface Workflow {
    id: number;
    project_id: number;
    board_id: number;
    from_column_id: number;
    to_column_id: number;
    source: string;
    target: string;
}

export type Story = Task;

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    first_name: string;
    surname: string;
}

export interface AuditLog {
    id: number;
    board_id: number;
    task_id: number | null;
    user_id: number;
    action: string;
    details: string;
    created_at: string;
    first_name: string;
    surname: string;
}

/**
 * Helper to handle fetch calls, auth refresh, and error parsing
 */
const callApi = async <T>(url: string, method: string = 'GET', payload?: any): Promise<T> => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
        credentials: 'include',
    };

    if (payload) options.body = JSON.stringify(payload);

    let res = await fetch(`${BACKEND_URL}${url}`, options);

    // if we get a 401, try to refresh the token and retry once
    if (res.status === 401 && !url.includes('/auth/login')) {
        const refresh = await fetch(`${BACKEND_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (refresh.ok) res = await fetch(`${BACKEND_URL}${url}`, options);
    }

    const raw = await res.text();
    let json: any = null;
    try {
        json = JSON.parse(raw);
    } catch { 
        /* ignore parsing errors for non-json responses */ 
    }

    if (!res.ok) {
        const msg = json?.message || `Request failed with status ${res.status}`;
        throw new Error(msg);
    }

    return json as T;
};

// auth checks 
export const loginUser = (emailid: string, password: string) => {
    return callApi<{ message: string; user: { id: number, emailid: string, global_role: string } }>('/auth/login', 'POST', { emailid, password });
};

export const registerUser = (first_name: string, surname: string, emailid: string, password: string) => {
    return callApi<{ message: string }>('/auth/register', 'POST', { first_name, surname, emailid, password });
};

export const getProfile = () => {
    return callApi<{ id: number, emailid: string, first_name: string, surname: string, avatar_data: string | null, global_role: string, created_at: string }>('/auth/profile');
}

export const logoutUser = () => {
    return callApi<{ message: string }>('/auth/logout', 'POST');
};

export const uploadAvatar = async (file: File) => {
    const base64Avatar = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const response = await fetch(`${BACKEND_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: base64Avatar }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
    }
    return data as { message: string, avatar_data: string };
};

export const fetchProjects = () => {
    return callApi<Project[]>('/projects');
};

export const fetchProjectById = (projectId: number) => {
    return callApi<ProjectFull>(`/projects/${projectId}`);
};

export const createProject = (name: string, description?: string, status?: string) => {
    return callApi<{ project: Project }>('/projects', 'POST', { name, description, status });
};

export const updateProject = (projectId: number, name: string, description: string, status: string, progress: number) => {
    return callApi<void>(`/projects/${projectId}`, 'PUT', { name, description, status, progress });
};

export const getComments = async (taskId: number) => {
    return callApi<Comment[]>(`/tasks/${taskId}/comments`);
};

export const addComment = async (taskId: number, content: string) => {
    return callApi<{ message: string; comment: Comment }>(`/tasks/${taskId}/comments`, 'POST', { content });
};

export const editComment = async (taskId: number, commentId: number, content: string) => {
    return callApi<{ message: string }>(`/tasks/${taskId}/comments/${commentId}`, 'PUT', { content });
};

export const deleteComment = async (taskId: number, commentId: number) => {
    return callApi<{ message: string }>(`/tasks/${taskId}/comments/${commentId}`, 'DELETE');
};

export const archiveProject = (projectId: number) => {
    return callApi<void>(`/projects/${projectId}/archive`, 'PUT', { is_archived: true });
};

export const restoreProject = (projectId: number) => {
    return callApi<void>(`/projects/${projectId}/archive`, 'PUT', { is_archived: false });
};

export const deleteProject = (projectId: number) => {
    return callApi<void>(`/projects/${projectId}`, 'DELETE');
};

export const toggleStarProject = (projectId: number, isStarred: boolean) => {
    return callApi<void>(`/projects/${projectId}/star`, 'PUT', { is_starred: isStarred });
};

export const fetchBoards = (projectId: number) => {
    return callApi<Board[]>(`/projects/${projectId}/boards`);
};

export const createBoard = (projectId: number, name: string) => {
    return callApi<{ board: Board }>(`/projects/${projectId}/boards`, 'POST', { name });
};

export const fetchBoardProject = (boardId: number) => {
    return callApi<{ project_id: number; currentUserRole: string }>(`/boards/${boardId}/project`);
};

export const fetchColumns = (boardId: number) => {
    return callApi<Column[]>(`/boards/${boardId}/columns`);
};

export const createColumn = (boardId: number, name: string, wipLimit?: number) => {
    return callApi<{ message: string }>(`/boards/${boardId}/columns`, 'POST', { name, wip_limit: wipLimit });
};

export const renameColumn = (columnId: number, name: string) => {
    return callApi<{ message: string }>(`/boards/columns/${columnId}/rename`, 'PUT', { name });
};

export const updateColumnLimit = (columnId: number, wipLimit: number | null) => {
    return callApi<{ message: string }>(`/boards/columns/${columnId}/limit`, 'PUT', { wip_limit: wipLimit });
};

export const reorderColumns = (boardId: number, order: number[]) => {
    return callApi<{ message: string }>(`/boards/${boardId}/columns/reorder`, 'PUT', { order });
};

export const deleteColumn = (columnId: number) => {
    return callApi<{ message: string }>(`/boards/columns/${columnId}`, 'DELETE');
};

export const fetchTasks = (boardId: number) => {
    return callApi<Task[]>(`/boards/${boardId}/tasks`);
};

export const getTask = (taskId: number) => {
    return callApi<Task>(`/boards/tasks/${taskId}`);
};

export const getChildTasks = (taskId: number) => {
    return callApi<Task[]>(`/boards/tasks/${taskId}/children`);
};

export const createTask = (
    boardId: number,
    title: string,
    columnId: number | null,
    priority?: string,
    type?: string,
    description?: string,
    assignedTo?: number | null,
    dueDate?: string | null,
    parentId?: number | null
) => {
    return callApi<{ message: string; task: Task }>(`/boards/${boardId}/tasks`, 'POST', {
        title,
        column_id: columnId,
        priority,
        type,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
        parent_id: parentId,
    });
};

export const moveTask = (taskId: number, columnId: number) => {
    return callApi<{ message: string }>(`/boards/tasks/${taskId}/move`, 'PUT', { column_id: columnId });
};

export const closeTask = (taskId: number) => {
    return callApi<{ message: string }>(`/boards/tasks/${taskId}/close`, 'PUT');
};

export const updateTask = (taskId: number, updates: object) => {
    return callApi<{ message: string }>(`/boards/tasks/${taskId}`, 'PUT', updates);
};

export const deleteTask = (taskId: number) => {
    return callApi<{ message: string }>(`/boards/tasks/${taskId}`, 'DELETE');
};

export const fetchTeamMembers = (projectId: number) => {
    return callApi<Member[]>(`/projects/${projectId}/members`);
};
export const inviteMember = (projectId: number, emailid: string, role?: string) => {
    return callApi<{ message: string }>('/projects/' + projectId + '/members', 'POST', { emailid, role });
};
export const removeMember = (projectId: number, userId: number) => {
    return callApi<{ message: string }>(`/projects/${projectId}/members/${userId}`, 'DELETE');
};

export const fetchNotifications = () => {
    return callApi<Notification[]>('/notifications');
};

export const markNotificationAsRead = (id: number) => {
    return callApi<{ message: string }>(`/notifications/${id}/read`, 'PUT');
};

export const deleteNotification = (id: number) => {
    return callApi<{ message: string }>(`/notifications/${id}`, 'DELETE');
};

export const fetchProjectWorkflows = (projectId: number) => {
    return callApi<Workflow[]>(`/projects/${projectId}/workflows`);
};

export const fetchAuditLogs = (boardId: number | string) => {
    return callApi<AuditLog[]>(`/boards/${boardId}/audit`);
};

export const fetchTaskAuditLogs = (taskId: number) => {
    return callApi<AuditLog[]>(`/boards/tasks/${taskId}/audit`);
};

export const addWorkflow = (projectId: number, board_id: number, from_column_id: number, to_column_id: number) => {
    return callApi<{ id: number }>('/projects/' + projectId + '/workflows', 'POST', { board_id, from_column_id, to_column_id });
};

export const deleteWorkflow = (projectId: number, workflowId: number) => {
    return callApi<{ message: string }>(`/projects/${projectId}/workflows/${workflowId}`, 'DELETE');
};

export const reSyncStories = (boardId: number) => {
    return callApi<{ message: string }>(`/boards/${boardId}/sync-stories`, 'PUT');
};

export const updateUserProfile = (data: { first_name?: string; surname?: string; emailid?: string }) => {
    return callApi<{ message: string }>('/auth/profile', 'PUT', data);
};

export const changePassword = (currentPassword: string, newPassword: string, confirmPassword: string) => {
    return callApi<{ message: string }>('/auth/profile/password', 'POST', { currentPassword, newPassword, confirmPassword });
};

export const fetchMyTeammates = () => {
    return callApi<{ id: number, emailid: string, first_name: string, surname: string }[]>('/auth/teammates', 'GET');
};

export const updateMemberRole = (projectId: number, userId: number, role: string) => {
    return callApi<{ message: string }>(`/projects/${projectId}/members/${userId}`, 'PUT', { role });
};