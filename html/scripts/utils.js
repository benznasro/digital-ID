
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJob3NwaXRhbF9vcmFuIiwicm9sZSI6Imhvc3BpdGFsIiwicGVyc29uX2lkIjpudWxsLCJ3aWxheWFfY29kZSI6IjE2IiwiY29tbXVuZV9jb2RlIjoiMDEwOCIsImlhdCI6MTc3NDM3NzY5NCwiZXhwIjoxNzc0Mzc4NTk0fQ.Ye5YVErdJtAs2cK1C_Xzhvbnh7cCAu3Iq3oHmRPodaQ'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}