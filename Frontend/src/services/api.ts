const BASE_URL = 'http://localhost:3001/api';
const apiRequest = async (endpoint: string, method: string = 'GET', body?: object) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });

        if (refreshRes.ok) {
            response = await fetch(`${BASE_URL}${endpoint}`, config);
        }
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Hmm..Something went wrong");
    }

    return data;
};
//auth checks 
export const loginUser = (emailid: string, password: string) => {
    return apiRequest('/auth/login', 'POST', { emailid, password });
}; // we USE POST API here and not get, for security reasons

export const registerUser = (first_name: string, surname: string, emailid: string, password: string) => {
    return apiRequest('/auth/register', 'POST', { first_name, surname, emailid, password });
};

export const getProfile = () => {
    return apiRequest('/auth/profile');
}

export const logoutUser = () => {
    return apiRequest('/auth/logout', 'POST');
};

export const uploadAvatar = async (file: File) => {
    // Convert file to base64 to avoid using external upload libraries (like multer)
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
    return data;
};

export const fetchProjects = () => {
    return apiRequest('/projects');
};

export const fetchProjectById = (projectId: number) => {
    return apiRequest(`/projects/${projectId}`);
};

export const createProject = (name: string, description?: string, status?: string) => {
    return apiRequest('/projects', 'POST', { name, description, status });
};

export const updateProject = (projectId: number, name: string, description: string, status: string, progress: number) => {
    return apiRequest(`/projects/${projectId}`, 'PUT', { name, description, status, progress });
};

export const getComments = async (taskId: number) => {
    return apiRequest(`/tasks/${taskId}/comments`);
};

export const addComment = async (taskId: number, content: string) => {
    return apiRequest(`/tasks/${taskId}/comments`, 'POST', { content });
};

export const editComment = async (taskId: number, commentId: number, content: string) => {
    return apiRequest(`/tasks/${taskId}/comments/${commentId}`, 'PUT', { content });
};

export const deleteComment = async (taskId: number, commentId: number) => {
    return apiRequest(`/tasks/${taskId}/comments/${commentId}`, 'DELETE');
};

export const archiveProject = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/archive`, 'PUT', { is_archived: true });
};

export const restoreProject = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/archive`, 'PUT', { is_archived: false });
};

export const deleteProject = (projectId: number) => {
    return apiRequest(`/projects/${projectId}`, 'DELETE');
};

export const toggleStarProject = (projectId: number, isStarred: boolean) => {
    return apiRequest(`/projects/${projectId}/star`, 'PUT', { is_starred: isStarred });
};

export const fetchBoards = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/boards`);
};

export const createBoard = (projectId: number, name: string) => {
    return apiRequest(`/projects/${projectId}/boards`, 'POST', { name });
};

export const fetchColumns = (boardId: number) => {
    return apiRequest(`/boards/${boardId}/columns`);
};

export const createColumn = (boardId: number, name: string, wipLimit?: number) => {
    return apiRequest(`/boards/${boardId}/columns`, 'POST', { name, wip_limit: wipLimit });
};

export const renameColumn = (columnId: number, name: string) => {
    return apiRequest(`/boards/columns/${columnId}/rename`, 'PUT', { name });
};

export const updateColumnLimit = (columnId: number, wipLimit: number | null) => {
    return apiRequest(`/boards/columns/${columnId}/limit`, 'PUT', { wip_limit: wipLimit });
};

export const reorderColumns = (boardId: number, order: number[]) => {
    return apiRequest(`/boards/${boardId}/columns/reorder`, 'PUT', { order });
};

export const deleteColumn = (columnId: number) => {
    return apiRequest(`/boards/columns/${columnId}`, 'DELETE');
};

export const fetchTasks = (boardId: number) => {
    return apiRequest(`/boards/${boardId}/tasks`);
};

export const getTask = (taskId: number) => {
    return apiRequest(`/boards/tasks/${taskId}`);
};

export const getChildTasks = (taskId: number) => {
    return apiRequest(`/boards/tasks/${taskId}/children`);
};

export const createTask = (
    boardId: number,
    title: string,
    columnId: number,
    priority?: string,
    type?: string,
    description?: string,
    assignedTo?: number | null,
    dueDate?: string | null,
    parentId?: number | null
) => {
    return apiRequest(`/boards/${boardId}/tasks`, 'POST', {
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
    return apiRequest(`/boards/tasks/${taskId}/move`, 'PUT', { column_id: columnId });
};

export const updateTask = (taskId: number, updates: object) => {
    return apiRequest(`/boards/tasks/${taskId}`, 'PUT', updates);
};

export const deleteTask = (taskId: number) => {
    return apiRequest(`/boards/tasks/${taskId}`, 'DELETE');
};

export const fetchTeamMembers = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/members`);
};
export const inviteMember = (projectId: number, emailid: string, role?: string) => {
    return apiRequest(`/projects/${projectId}/members`, 'POST', { emailid, role });
};
export const removeMember = (projectId: number, userId: number) => {
    return apiRequest(`/projects/${projectId}/members/${userId}`, 'DELETE');
};

export const fetchNotifications = () => {
    return apiRequest('/notifications');
};