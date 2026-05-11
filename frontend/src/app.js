// API base URL
const API_BASE = '/api';

// DOM elements
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// Navigation
const employeesTab = document.getElementById('employees-tab');
const addEmployeeTab = document.getElementById('add-employee-tab');
const departmentsTab = document.getElementById('departments-tab');
const dashboardTab = document.getElementById('dashboard-tab');

// Content sections
const employeesSection = document.getElementById('employees-section');
const addEmployeeSection = document.getElementById('add-employee-section');
const departmentsSection = document.getElementById('departments-section');
const dashboardSection = document.getElementById('dashboard-section');

// Forms and lists
const addEmployeeForm = document.getElementById('add-employee-form');
const addEmployeeError = document.getElementById('add-employee-error');
const employeesList = document.getElementById('employees-list');
const departmentsList = document.getElementById('departments-list');
const dashboardDept = document.getElementById('dashboard-dept');
const dashboardContent = document.getElementById('dashboard-content');

// Global state
let currentUser = null;
let token = null;
let departments = [];

// Utility functions
function showError(element, message) {
  element.textContent = message;
  element.style.display = message ? 'block' : 'none';
}

function setActiveTab(activeTab) {
  [employeesTab, addEmployeeTab, departmentsTab, dashboardTab].forEach(tab => {
    tab.classList.remove('active');
  });
  activeTab.classList.add('active');

  [employeesSection, addEmployeeSection, departmentsSection, dashboardSection].forEach(section => {
    section.classList.add('hidden');
  });
}

function showSection(section) {
  section.classList.remove('hidden');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

// API functions
async function apiRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication
async function login(email, password) {
  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    showError(loginError, '');
    showApp();
    await loadDepartments();
    showEmployees();
  } catch (error) {
    showError(loginError, error.message);
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showLogin();
}

function checkAuth() {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  if (savedToken && savedUser) {
    token = savedToken;
    currentUser = JSON.parse(savedUser);
    showApp();
    loadDepartments();
    showEmployees();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

function showApp() {
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  userEmail.textContent = currentUser.email;
}

// Data loading
async function loadDepartments() {
  try {
    departments = await apiRequest('/departments');
    updateDepartmentSelects();
  } catch (error) {
    console.error('Failed to load departments:', error);
  }
}

function updateDepartmentSelects() {
  const selects = [document.getElementById('emp-department'), dashboardDept];

  selects.forEach(select => {
    select.innerHTML = '<option value="">Select Department</option>';
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.id;
      option.textContent = dept.name;
      select.appendChild(option);
    });
  });
}

async function loadEmployees() {
  try {
    const employees = await apiRequest('/employees');
    displayEmployees(employees);
  } catch (error) {
    console.error('Failed to load employees:', error);
    employeesList.innerHTML = '<p>Failed to load employees</p>';
  }
}

function displayEmployees(employees) {
  employeesList.innerHTML = '';

  if (employees.length === 0) {
    employeesList.innerHTML = '<p>No employees found</p>';
    return;
  }

  employees.forEach(employee => {
    const card = document.createElement('div');
    card.className = 'employee-card';

    card.innerHTML = `
      <h3>${employee.name}</h3>
      <p><strong>Email:</strong> ${employee.email}</p>
      <p><strong>Department:</strong> <span class="department">${employee.department_name || 'Not assigned'}</span></p>
      <p><strong>Position:</strong> ${employee.position || 'Not specified'}</p>
      <p><strong>Salary:</strong> ${employee.salary ? formatCurrency(employee.salary) : 'Not specified'}</p>
      <p><strong>Hire Date:</strong> ${formatDate(employee.hire_date)}</p>
    `;

    employeesList.appendChild(card);
  });
}

async function loadDepartmentsList() {
  departmentsList.innerHTML = '';

  departments.forEach(dept => {
    const card = document.createElement('div');
    card.className = 'department-card';

    card.innerHTML = `
      <h3>${dept.name}</h3>
      <p>${dept.description || 'No description available'}</p>
    `;

    departmentsList.appendChild(card);
  });
}

async function loadDashboard(departmentId) {
  if (!departmentId) {
    dashboardContent.innerHTML = '<p>Please select a department</p>';
    return;
  }

  try {
    const data = await apiRequest(`/dashboard/${departmentId}`);

    dashboardContent.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <h4>Total Employees</h4>
          <div class="stat-value">${data.stats.total_employees}</div>
        </div>
        <div class="stat-card">
          <h4>Average Salary</h4>
          <div class="stat-value">${formatCurrency(data.stats.avg_salary || 0)}</div>
        </div>
        <div class="stat-card">
          <h4>Highest Salary</h4>
          <div class="stat-value">${formatCurrency(data.stats.max_salary || 0)}</div>
        </div>
        <div class="stat-card">
          <h4>Lowest Salary</h4>
          <div class="stat-value">${formatCurrency(data.stats.min_salary || 0)}</div>
        </div>
      </div>

      <div class="dashboard-employees">
        <h4>Department Employees</h4>
        ${data.employees.length === 0 ? '<p>No employees in this department</p>' :
          data.employees.map(emp => `
            <div class="employee-row">
              <div>
                <div class="name">${emp.name}</div>
                <div class="position">${emp.position || 'No position specified'}</div>
              </div>
              <div>${formatCurrency(emp.salary || 0)}</div>
            </div>
          `).join('')
        }
      </div>
    `;
  } catch (error) {
    dashboardContent.innerHTML = `<p>Error loading dashboard: ${error.message}</p>`;
  }
}

// Event listeners
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await login(email, password);
});

logoutBtn.addEventListener('click', logout);

// Navigation
employeesTab.addEventListener('click', () => {
  setActiveTab(employeesTab);
  showSection(employeesSection);
  loadEmployees();
});

addEmployeeTab.addEventListener('click', () => {
  if (currentUser.role !== 'admin') {
    alert('Only administrators can add employees');
    return;
  }
  setActiveTab(addEmployeeTab);
  showSection(addEmployeeSection);
});

departmentsTab.addEventListener('click', () => {
  setActiveTab(departmentsTab);
  showSection(departmentsSection);
  loadDepartmentsList();
});

dashboardTab.addEventListener('click', () => {
  setActiveTab(dashboardTab);
  showSection(dashboardSection);
  loadDashboard(dashboardDept.value);
});

dashboardDept.addEventListener('change', (e) => {
  loadDashboard(e.target.value);
});

// Add employee form
addEmployeeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name: document.getElementById('emp-name').value,
    email: document.getElementById('emp-email').value,
    department_id: parseInt(document.getElementById('emp-department').value),
    position: document.getElementById('emp-position').value,
    salary: parseFloat(document.getElementById('emp-salary').value) || 0
  };

  try {
    await apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    showError(addEmployeeError, '');
    addEmployeeForm.reset();
    alert('Employee added successfully! Login credentials: email/password123');
    showEmployees();
  } catch (error) {
    showError(addEmployeeError, error.message);
  }
});

// Initialize app
checkAuth();
