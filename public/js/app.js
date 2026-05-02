const API_BASE = '/api';

function evaluatePasswordRules(password) {
    return {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[#$%&*@]/.test(password)
    };
}

function bindSignUpPasswordRules(signUpForm) {
    const passwordInput = signUpForm.password;
    const rulesContainer = document.getElementById('passwordRules');
    if (!passwordInput || !rulesContainer) {
        return () => true;
    }

    const ruleItems = rulesContainer.querySelectorAll('li[data-rule]');

    const updateRules = () => {
        const state = evaluatePasswordRules(passwordInput.value);
        ruleItems.forEach((item) => {
            const isOk = Boolean(state[item.dataset.rule]);
            item.classList.toggle('rule-ok', isOk);
            item.classList.toggle('rule-pending', !isOk);
        });
        return state;
    };

    passwordInput.addEventListener('input', updateRules);
    updateRules();

    return () => Object.values(updateRules()).every(Boolean);
}

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(`${base64}${padding}`));
    } catch (_error) {
        return null;
    }
}

function getSession() {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    const payload = decodeToken(token);
    if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
        clearSession();
        return null;
    }
    return { token, payload };
}

function clearSession() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}

function logout() {
    clearSession();
    window.location.href = '/signIn';
}

function toast(message, classes = '') {
    if (window.M) {
        M.toast({ html: message, classes });
    } else {
        alert(message);
    }
}

function rolesFromToken(token) {
    const payload = decodeToken(token);
    return Array.isArray(payload?.roles) ? payload.roles : [];
}

function redirectAfterLogin(token) {
    const roles = rolesFromToken(token);
    if (roles.includes('admin')) {
        window.location.href = '/dashboard/admin';
        return;
    }
    window.location.href = '/dashboard/user';
}

function hasRequiredRole(roles, requiredRoles) {
    if (!requiredRoles.length) return true;
    return roles.some((role) => requiredRoles.includes(role));
}

function getRequiredRoles(body) {
    const raw = body.dataset.requiredRoles || '';
    return raw.split(',').map((role) => role.trim()).filter(Boolean);
}

function ensureAuthenticated(body) {
    const session = getSession();
    if (!session) {
        window.location.href = '/signIn';
        return null;
    }

    const requiredRoles = getRequiredRoles(body);
    if (!hasRequiredRole(session.payload.roles || [], requiredRoles)) {
        window.location.href = '/403';
        return null;
    }

    return session;
}

async function apiFetch(path, options = {}) {
    const session = getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        return null;
    }

    if (response.status === 403) {
        window.location.href = '/403';
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
        throw new Error(data?.message || 'Error en la petición');
    }

    return data;
}

function renderUserCard(user) {
    const container = document.getElementById('userDashboard');
    if (!container) return;

    container.innerHTML = `
        <div class="col s12 m6">
            <div class="card-panel hero-card">
                <span class="eyebrow">Tus datos</span>
                <h1>${user.name} ${user.lastName || ''}</h1>
                <p>Email: ${user.email}</p>
                <p>Teléfono: ${user.phoneNumber || '-'}</p>
                <p>Edad: ${user.age ?? '-'}</p>
                <p>Dirección: ${user.adress || '-'}</p>
            </div>
        </div>
        <div class="col s12 m6">
            <div class="card-panel hero-card">
                <span class="eyebrow">Roles</span>
                <h1>${(user.roles || []).join(', ') || 'Sin roles'}</h1>
                <p>Registrado: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</p>
            </div>
        </div>
    `;
}

async function loadProfile() {
    const form = document.getElementById('profileForm');
    const session = ensureAuthenticated(document.body);
    if (!form || !session) return;

    const user = await apiFetch('/users/me');
    if (!user) return;

    form.name.value = user.name || '';
    form.lastName.value = user.lastName || '';
    form.phoneNumber.value = user.phoneNumber || '';
    form.birthdate.value = user.birthdate ? new Date(user.birthdate).toISOString().slice(0, 10) : '';
    form.email.value = user.email || '';
    form.url_profile.value = user.url_profile || '';
    form.adress.value = user.adress || '';

    M.updateTextFields();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            name: form.name.value.trim(),
            lastName: form.lastName.value.trim(),
            phoneNumber: form.phoneNumber.value.trim(),
            birthdate: form.birthdate.value,
            email: form.email.value.trim(),
            url_profile: form.url_profile.value.trim(),
            adress: form.adress.value.trim(),
            ...(form.password.value.trim() ? { password: form.password.value.trim() } : {})
        };

        try {
            const updated = await apiFetch('/users/me', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!updated) return;
            toast('Perfil actualizado correctamente', 'green');
            form.password.value = '';
            M.updateTextFields();
        } catch (error) {
            toast(error.message, 'red darken-2');
        }
    });
}

async function loadUserDashboard() {
    const session = ensureAuthenticated(document.body);
    if (!session) return;
    const user = await apiFetch('/users/me');
    if (!user) return;
    renderUserCard(user);
}

async function loadAdminDashboard() {
    const session = ensureAuthenticated(document.body);
    if (!session) return;

    const tableBody = document.getElementById('usersTableBody');
    const detailsContent = document.getElementById('userDetailsContent');
    const modalElement = document.getElementById('userDetailsModal');
    const modalInstance = modalElement ? M.Modal.init(modalElement) : null;

    const users = await apiFetch('/users');
    if (!users || !tableBody) return;

    tableBody.innerHTML = users.map((user) => `
        <tr>
            <td>${user.name} ${user.lastName || ''}</td>
            <td>${user.email}</td>
            <td>${user.phoneNumber || '-'}</td>
            <td>${(user.roles || []).join(', ') || '-'}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
            <td><button class="btn-small" data-user-id="${user.id}">Ver</button></td>
        </tr>
    `).join('');

    tableBody.querySelectorAll('button[data-user-id]').forEach((button) => {
        button.addEventListener('click', async () => {
            const user = await apiFetch(`/users/${button.dataset.userId}`);
            if (!user || !detailsContent || !modalInstance) return;

            detailsContent.innerHTML = `
                <p><strong>Nombre:</strong> ${user.name} ${user.lastName || ''}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Teléfono:</strong> ${user.phoneNumber || '-'}</p>
                <p><strong>Fecha de nacimiento:</strong> ${user.birthdate ? new Date(user.birthdate).toLocaleDateString() : '-'}</p>
                <p><strong>Edad:</strong> ${user.age ?? '-'}</p>
                <p><strong>Dirección:</strong> ${user.adress || '-'}</p>
                <p><strong>Roles:</strong> ${(user.roles || []).join(', ') || '-'}</p>
            `;
            modalInstance.open();
        });
    });
}

function initAuthPage(body) {
    const session = getSession();
    if (session) {
        redirectAfterLogin(session.token);
        return;
    }

    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    if (signInForm) {
        signInForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                const response = await apiFetch('/auth/signIn', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: signInForm.email.value.trim(),
                        password: signInForm.password.value
                    })
                });

                if (!response?.token) return;

                sessionStorage.setItem('token', response.token);
                sessionStorage.setItem('user', JSON.stringify(decodeToken(response.token)));
                redirectAfterLogin(response.token);
            } catch (error) {
                toast(error.message, 'red darken-2');
            }
        });
    }

    if (signUpForm) {
        const isPasswordValid = bindSignUpPasswordRules(signUpForm);

        signUpForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!isPasswordValid()) {
                toast('La contraseña no cumple las reglas requeridas', 'red darken-2');
                return;
            }

            const payload = {
                name: signUpForm.name.value.trim(),
                lastName: signUpForm.lastName.value.trim(),
                phoneNumber: signUpForm.phoneNumber.value.trim(),
                birthdate: signUpForm.birthdate.value,
                email: signUpForm.email.value.trim(),
                password: signUpForm.password.value,
                url_profile: signUpForm.url_profile.value.trim(),
                adress: signUpForm.adress.value.trim(),
                roles: ['user']
            };

            try {
                await apiFetch('/auth/signUp', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                toast('Cuenta creada. Ahora inicia sesión.', 'green');
                window.location.href = '/signIn';
            } catch (error) {
                toast(error.message, 'red darken-2');
            }
        });
    }
}

function bindCommonActions() {
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogout = document.getElementById('mobile-logout');

    if (logoutBtn) logoutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });

    if (mobileLogout) mobileLogout.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
    });
}

function initNavigation() {
    const session = getSession();
    const desktopNav = document.getElementById('desktop-nav');

    if (desktopNav) {
        desktopNav.innerHTML = session
            ? `
                <li><a href="/dashboard/user">Dashboard</a></li>
                <li><a href="/profile">Mi cuenta</a></li>
                <li><a href="#" id="desktop-logout">Cerrar sesión</a></li>
            `
            : `
                <li><a href="/signIn">Sign In</a></li>
                <li><a href="/signUp">Sign Up</a></li>
            `;

        const desktopLogout = document.getElementById('desktop-logout');
        if (desktopLogout) {
            desktopLogout.addEventListener('click', (event) => {
                event.preventDefault();
                logout();
            });
        }
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = event.target.closest('button');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = '<i class="material-icons">visibility_off</i>';
    } else {
        input.type = 'password';
        button.innerHTML = '<i class="material-icons">visibility</i>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.M) {
        M.AutoInit();
    }

    initNavigation();
    bindCommonActions();

    const body = document.body;
    switch (body.dataset.page) {
        case 'signin':
        case 'signup':
            initAuthPage(body);
            break;
        case 'dashboard-user':
            loadUserDashboard();
            break;
        case 'dashboard-admin':
            loadAdminDashboard();
            break;
        case 'profile':
            loadProfile();
            break;
        default:
            break;
    }
});