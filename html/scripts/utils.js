
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJtYXIiLCJyb2xlIjoiTWFycmlhZ2VfTm90YXJ5IiwicGVyc29uX2lkIjpudWxsLCJ3aWxheWFfY29kZSI6bnVsbCwiY29tbXVuZV9jb2RlIjpudWxsLCJpYXQiOjE3NzQyMTc1MzksImV4cCI6MTc3NDIxODQzOX0.gJogG5bcJCM3wH5E4LtCETvs2WEUT58av2DgQoCn-d4'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}