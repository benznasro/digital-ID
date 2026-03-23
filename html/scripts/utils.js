
export const apiFetch = async (url, method, body) => {
    const token = localStorage.getItem('token');

    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwidXNlcm5hbWUiOiJtYXIiLCJyb2xlIjoiTWFycmlhZ2VfTm90YXJ5IiwicGVyc29uX2lkIjpudWxsLCJ3aWxheWFfY29kZSI6bnVsbCwiY29tbXVuZV9jb2RlIjpudWxsLCJpYXQiOjE3NzQyMzI0MjAsImV4cCI6MTc3NDIzMzMyMH0.ulecey7VXib_cIegkPBQ3dshQ52FhMBU_FU3KqKvi-g'
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}