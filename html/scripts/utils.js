const getAccessToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');

const saveTokens = (accessToken, refreshToken) => {
    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken);
    }
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
};

const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
};

const tryRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        return false;
    }

    const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });

    const refreshData = await refreshRes.json();
    if (!refreshRes.ok || refreshData.error || !refreshData.accessToken) {
        clearTokens();
        return false;
    }

    saveTokens(refreshData.accessToken, refreshData.refreshToken);
    return true;
};

export const apiFetch = async (url, method = 'GET', body = null) => {
    const doRequest = async () => {
        const token = getAccessToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
    };

    let res = await doRequest();

    if (res.status === 401 && url !== '/api/auth/refresh') {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            res = await doRequest();
        }
    }

    try {
        return await res.json();
    } catch {
        return { error: 'Invalid server response' };
    }
};