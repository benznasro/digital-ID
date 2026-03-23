
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJtYXIiLCJyb2xlIjoiTWFycmlhZ2VfTm90YXJ5IiwicGVyc29uX2lkIjpudWxsLCJ3aWxheWFfY29kZSI6bnVsbCwiY29tbXVuZV9jb2RlIjpudWxsLCJpYXQiOjE3NzQyOTQ5MTEsImV4cCI6MTc3NDI5NTgxMX0.a_ImoifRncr_EJ81KLBUiegtpfgE9CctBe0ohKRE9fI'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}