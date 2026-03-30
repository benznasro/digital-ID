const methodTabs = Array.from(document.querySelectorAll('.method-tab'));
const identifierInput = document.getElementById('identifierInput');
const identifierLabel = document.getElementById('identifierLabel');
const identifierHint = document.getElementById('identifierHint');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');

const tabConfig = {
  username: {
    label: 'Username',
    placeholder: 'Enter your username',
    hint: 'Use your account username'
  },
  email: {
    label: 'Email Address',
    placeholder: 'you@email.com',
    hint: 'Use your registered email'
  },
  phone: {
    label: 'Phone Number',
    placeholder: '+213 000 000 000',
    hint: 'Use your linked phone number'
  }
};

function setMessage(text, type = '') {
  loginMessage.classList.remove('error', 'success');
  if (type) {
    loginMessage.classList.add(type);
  }
  loginMessage.textContent = text;
}

function activateTab(method) {
  methodTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.method === method);
  });

  const config = tabConfig[method] || tabConfig.username;
  identifierLabel.textContent = config.label;
  identifierInput.placeholder = config.placeholder;
  identifierHint.textContent = config.hint;
  identifierInput.value = '';
  identifierInput.focus();
}

methodTabs.forEach((tab) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.method));
});

function parseJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRoleRoute(role) {
  const routes = {
    hospital: 'hospital.html',
    Marriage_Notary: 'Marriage_Notary_page.html',
    citizen: 'personal_info_page.html',
    police: 'criminal_records.html',
  };

  return routes[role] || 'homePage.html';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const identifier = identifierInput.value.trim();
  const password = document.getElementById('passwordInput').value;

  if (!identifier || !password) {
    setMessage('Please provide both identifier and password.', 'error');
    return;
  }

  setMessage('Signing in...');
  loginSubmitBtn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('token', data.accessToken);

    const payload = parseJwtPayload(data.accessToken);
    const role = payload?.role;

    if (role) {
      localStorage.setItem('role', role);
    }
    if (payload?.id) {
      localStorage.setItem('userId', String(payload.id));
    }

    setMessage('Login successful. Redirecting...', 'success');

    const target = getRoleRoute(role);
    window.location.href = target;
  } catch (err) {
    setMessage(err.message || 'Unable to sign in. Try again.', 'error');
  } finally {
    loginSubmitBtn.disabled = false;
  }
});
