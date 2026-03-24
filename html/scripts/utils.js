
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJzb21lb25lIiwicm9sZSI6ImNpdGl6ZW4iLCJwZXJzb25faWQiOiIxNTAwMCIsImlhdCI6MTc3NDM2NjI1MSwiZXhwIjoxNzc0MzY3MTUxfQ.Z-faatO_xCqnkZWSOlEMfCYwIZzMbGt-SpppRDeZC2s'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}