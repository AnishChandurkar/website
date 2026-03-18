const BASE_URL = 'http://localhost:5000/api';
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
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${BASE_URL}/auth/profile/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
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

export const createProject = (name: string, description?: string, status?: string) => {
    return apiRequest('/projects', 'POST', { name, description, status });
};

export const updateProject = (projectId: number, name: string, description: string, status: string, progress: number) => {
    return apiRequest(`/projects/${projectId}`, 'PUT', { name, description, status, progress });
};

export const archiveProject = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/archive`, 'PUT');
};

export const deleteProject = (projectId: number) => {
    return apiRequest(`/projects/${projectId}`, 'DELETE');
};

export const toggleStarProject = (projectId: number, isStarred: boolean) => {
    return apiRequest(`/projects/${projectId}/star`, 'PUT', { is_starred: isStarred });
};

export const fetchBoard = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/board`);
};

export const createBoard = (projectId: number, name: string) => {
    return apiRequest(`/boards/${projectId}/tasks`, 'POST', { name });
};

// tasks
export const fetchTasks = (boardId: number) => {
    return apiRequest(`/boards/${boardId}/tasks`);
};
export const createTask = (boardId: number, title: string, priority: string) => {
    return apiRequest(`/boards/${boardId}/tasks`, 'POST', { title, priority });
};
export const updateTaskStatus = (taskId: number, status: string) => {
    return apiRequest(`/boards/tasks/${taskId}`, 'PUT', { status });
};
// team
export const fetchTeamMembers = (projectId: number) => {
    return apiRequest(`/projects/${projectId}/team`);
};
export const inviteMember = (projectId: number, emailid: string) => {
    return apiRequest(`/projects/${projectId}/team`, 'POST', { emailid });
};
// notifications
export const fetchNotifications = () => {
    return apiRequest('/notifications');
};