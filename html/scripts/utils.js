
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJob3NwaXRhbF9vcmFuIiwicm9sZSI6Imhvc3BpdGFsIiwicGVyc29uX2lkIjpudWxsLCJ3aWxheWFfY29kZSI6IjE2IiwiY29tbXVuZV9jb2RlIjoiMDEwOCIsImlhdCI6MTc3NDM3NjE3MSwiZXhwIjoxNzc0Mzc3MDcxfQ.Oe3H-BmgVNDzvqDkFs6Iqikt8YGLFB7G9nQpdAmLGhY'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}