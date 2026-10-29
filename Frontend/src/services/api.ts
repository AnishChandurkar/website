// base url for our backend server
const BASE_URL = '/api';

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

export interface ProjectFull {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    is_starred: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
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
    priority: string;
    type: string;
    parent_id: number | null;
    parent_title: string | null;
    parent_column_name: string | null;
    parent_type: string | null;
    assigned_to: number | null;
    assigned_first_name: string | null;
    assigned_surname: string | null;
    reporter_first_name: string | null;
    reporter_surname: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
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
    task_title: string;
    event_type: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    creator_first_name: string | null;
    creator_surname: string | null;
    editor_first_name: string | null;
    editor_surname: string | null;
    is_closed: boolean;
    is_resolved: boolean;
    max_col_name: string | null;
}

// user profile shape returned by the server
interface UserProfile {
    id: number;
    emailid: string;
    first_name: string;
    surname: string;
    avatar_data: string | null;
    global_role: string;
    created_at: string;
}

// login response shape
interface LoginResponse {
    message: string;
    user: { id: number; first_name: string; surname: string; emailid: string; global_role: string };
}

// teammate shape from the api
interface TeammateInfo {
    id: number;
    emailid: string;
    first_name: string;
    surname: string;
    avatar_data: string | null;
}

// helper function to make api requests with auto token refresh
const apiRequest = async (endpoint: string, method: string = 'GET', body?: object): Promise<unknown> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
    };

    const config: RequestInit = {
        method,
        headers,
        credentials: 'include',
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    // if we get a 401, try to refresh the token and retry once
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });

        if (refreshRes.ok) {
            response = await fetch(`${BASE_URL}${endpoint}`, config);
        }
    }

    const text = await response.text();
    let data: Record<string, unknown> | null = null;
    try {
        data = JSON.parse(text);
    } catch {
        // not a json response
    }

    if (!response.ok) {
        const errorMsg = (data?.message as string) || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
    }

    return data;
};

// auth
export const loginUser = async (emailid: string, password: string) => {
    const data = await apiRequest('/auth/login', 'POST', { emailid, password });
    return data as LoginResponse;
};

export const registerUser = async (first_name: string, surname: string, emailid: string, password: string) => {
    const data = await apiRequest('/auth/register', 'POST', { first_name, surname, emailid, password });
    return data as { message: string; user: { id: number; first_name: string; surname: string; emailid: string } };
};

export const getProfile = async () => {
    const data = await apiRequest('/auth/profile');
    return data as UserProfile;
};

export const logoutUser = async () => {
    const data = await apiRequest('/auth/logout', 'POST');
    return data as { message: string };
};

export const uploadAvatar = async (file: File) => {
    const base64Avatar = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const response = await fetch(`${BASE_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: base64Avatar }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
    }
    return data as { message: string; avatar_data: string };
};

// projects
export const fetchProjects = async () => {
    const data = await apiRequest('/projects');
    return data as Project[];
};

export const fetchProjectById = async (projectId: number) => {
    const data = await apiRequest(`/projects/${projectId}`);
    return data as ProjectFull;
};

export const createProject = async (name: string, description?: string, status?: string) => {
    const data = await apiRequest('/projects', 'POST', { name, description, status });
    return data as { project: Project };
};

export const updateProject = async (projectId: number, name: string, description: string, status: string, progress: number) => {
    await apiRequest(`/projects/${projectId}`, 'PUT', { name, description, status, progress });
};

// comments
export const getComments = async (taskId: number) => {
    const data = await apiRequest(`/tasks/${taskId}/comments`);
    return data as Comment[];
};

export const addComment = async (taskId: number, content: string) => {
    const data = await apiRequest(`/tasks/${taskId}/comments`, 'POST', { content });
    return data as { message: string; comment: Comment };
};

export const editComment = async (taskId: number, commentId: number, content: string) => {
    const data = await apiRequest(`/tasks/${taskId}/comments/${commentId}`, 'PUT', { content });
    return data as { message: string };
};

export const deleteComment = async (taskId: number, commentId: number) => {
    const data = await apiRequest(`/tasks/${taskId}/comments/${commentId}`, 'DELETE');
    return data as { message: string };
};

// archive and star
export const archiveProject = async (projectId: number) => {
    await apiRequest(`/projects/${projectId}/archive`, 'PUT', { is_archived: true });
};

export const restoreProject = async (projectId: number) => {
    await apiRequest(`/projects/${projectId}/archive`, 'PUT', { is_archived: false });
};

export const deleteProject = async (projectId: number) => {
    await apiRequest(`/projects/${projectId}`, 'DELETE');
};

export const toggleStarProject = async (projectId: number, isStarred: boolean) => {
    await apiRequest(`/projects/${projectId}/star`, 'PUT', { is_starred: isStarred });
};

// boards
export const fetchBoards = async (projectId: number) => {
    const data = await apiRequest(`/projects/${projectId}/boards`);
    return data as Board[];
};

export const createBoard = async (projectId: number, name: string) => {
    const data = await apiRequest(`/projects/${projectId}/boards`, 'POST', { name });
    return data as { board: Board };
};

export const fetchBoardProject = async (boardId: number) => {
    const data = await apiRequest(`/boards/${boardId}/project`);
    return data as { project_id: number; currentUserRole: string };
};

// columns
export const fetchColumns = async (boardId: number) => {
    const data = await apiRequest(`/boards/${boardId}/columns`);
    return data as Column[];
};

export const createColumn = async (boardId: number, name: string, wipLimit?: number) => {
    const data = await apiRequest(`/boards/${boardId}/columns`, 'POST', { name, wip_limit: wipLimit });
    return data as { message: string };
};

export const renameColumn = async (columnId: number, name: string) => {
    const data = await apiRequest(`/boards/columns/${columnId}/rename`, 'PUT', { name });
    return data as { message: string };
};

export const updateColumnLimit = async (columnId: number, wipLimit: number | null) => {
    const data = await apiRequest(`/boards/columns/${columnId}/limit`, 'PUT', { wip_limit: wipLimit });
    return data as { message: string };
};

export const reorderColumns = async (boardId: number, order: number[]) => {
    const data = await apiRequest(`/boards/${boardId}/columns/reorder`, 'PUT', { order });
    return data as { message: string };
};

export const deleteColumn = async (columnId: number) => {
    const data = await apiRequest(`/boards/columns/${columnId}`, 'DELETE');
    return data as { message: string };
};

// tasks
export const fetchTasks = async (boardId: number) => {
    const data = await apiRequest(`/boards/${boardId}/tasks`);
    return data as Task[];
};

export const getTask = async (taskId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}`);
    return data as Task;
};

export const getChildTasks = async (taskId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}/children`);
    return data as Task[];
};

export const createTask = async (
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
    const data = await apiRequest(`/boards/${boardId}/tasks`, 'POST', {
        title,
        column_id: columnId,
        priority,
        type,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
        parent_id: parentId,
    });
    return data as { message: string; task: Task };
};

export const moveTask = async (taskId: number, columnId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}/move`, 'PUT', { column_id: columnId });
    return data as { message: string };
};

export const closeTask = async (taskId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}/close`, 'PUT');
    return data as { message: string };
};

export const updateTask = async (taskId: number, updates: object) => {
    const data = await apiRequest(`/boards/tasks/${taskId}`, 'PUT', updates);
    return data as { message: string };
};

export const deleteTask = async (taskId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}`, 'DELETE');
    return data as { message: string };
};

// team members
export const fetchTeamMembers = async (projectId: number) => {
    const data = await apiRequest(`/projects/${projectId}/members`);
    return data as Member[];
};

export const inviteMember = async (projectId: number, emailid: string, role?: string) => {
    const data = await apiRequest(`/projects/${projectId}/members`, 'POST', { emailid, role });
    return data as { message: string };
};

export const removeMember = async (projectId: number, userId: number) => {
    const data = await apiRequest(`/projects/${projectId}/members/${userId}`, 'DELETE');
    return data as { message: string };
};

// notifications
export const fetchNotifications = async () => {
    const data = await apiRequest('/notifications');
    return data as Notification[];
};

export const markNotificationAsRead = async (id: number) => {
    const data = await apiRequest(`/notifications/${id}/read`, 'PUT');
    return data as { message: string };
};

export const deleteNotification = async (id: number) => {
    const data = await apiRequest(`/notifications/${id}`, 'DELETE');
    return data as { message: string };
};

// workflows
export const fetchProjectWorkflows = async (projectId: number) => {
    const data = await apiRequest(`/projects/${projectId}/workflows`);
    return data as Workflow[];
};

export const addWorkflow = async (projectId: number, board_id: number, from_column_id: number, to_column_id: number) => {
    const data = await apiRequest(`/projects/${projectId}/workflows`, 'POST', { board_id, from_column_id, to_column_id });
    return data as { id: number };
};

export const deleteWorkflow = async (projectId: number, workflowId: number) => {
    const data = await apiRequest(`/projects/${projectId}/workflows/${workflowId}`, 'DELETE');
    return data as { message: string };
};

// audit
export const fetchAuditLogs = async (boardId: number | string) => {
    const data = await apiRequest(`/boards/${boardId}/audit`);
    return data as AuditLog[];
};

export const fetchTaskAuditLogs = async (taskId: number) => {
    const data = await apiRequest(`/boards/tasks/${taskId}/audit`);
    return data as AuditLog[];
};

// sync
export const reSyncStories = async (boardId: number) => {
    const data = await apiRequest(`/boards/${boardId}/sync-stories`, 'PUT');
    return data as { message: string };
};

// profile
export const updateUserProfile = async (data: { first_name?: string; surname?: string; emailid?: string }) => {
    const result = await apiRequest('/auth/profile', 'PUT', data);
    return result as { message: string; user?: UserProfile };
};

export const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const data = await apiRequest('/auth/profile/password', 'POST', { currentPassword, newPassword, confirmPassword });
    return data as { message: string };
};

export const fetchMyTeammates = async () => {
    const data = await apiRequest('/auth/teammates');
    return data as TeammateInfo[];
};

export const updateMemberRole = async (projectId: number, userId: number, role: string) => {
    const data = await apiRequest(`/projects/${projectId}/members/${userId}`, 'PUT', { role });
    return data as { message: string };
};