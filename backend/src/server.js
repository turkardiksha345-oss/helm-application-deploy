const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize database
const db = new Database("employees.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department_id INTEGER,
    position TEXT,
    salary REAL,
    hire_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments (id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    employee_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  );
`);

// Insert sample data if empty
const deptCount = db.prepare("SELECT COUNT(*) as count FROM departments").get();
if (deptCount.count === 0) {
  const insertDept = db.prepare("INSERT INTO departments (name, description) VALUES (?, ?)");
  insertDept.run("Engineering", "Software development and engineering");
  insertDept.run("HR", "Human resources management");
  insertDept.run("Finance", "Financial operations and accounting");
  insertDept.run("Marketing", "Marketing and sales");

  // Sample admin user
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run("admin@company.com", hashedPassword, "admin");
}

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "Employee Management System API" });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Get all employees (protected)
app.get("/api/employees", authenticateToken, (req, res) => {
  const employees = db.prepare(`
    SELECT e.*, d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.created_at DESC
  `).all();

  res.json(employees);
});

// Add employee (protected, admin only)
app.post("/api/employees", authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { name, email, department_id, position, salary } = req.body;

  if (!name || !email || !department_id) {
    return res.status(400).json({ error: "Name, email, and department are required" });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO employees (name, email, department_id, position, salary, hire_date)
      VALUES (?, ?, ?, ?, ?, date('now'))
    `);
    const result = insert.run(name, email, department_id, position || '', salary || 0);

    // Create user account for employee
    const hashedPassword = bcrypt.hashSync("password123", 10); // Default password
    db.prepare("INSERT INTO users (email, password, role, employee_id) VALUES (?, ?, 'employee', ?)")
      .run(email, hashedPassword, result.lastInsertRowid);

    res.status(201).json({ id: result.lastInsertRowid, message: "Employee added successfully" });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Failed to add employee" });
    }
  }
});

// Get departments
app.get("/api/departments", authenticateToken, (req, res) => {
  const departments = db.prepare("SELECT * FROM departments ORDER BY name").all();
  res.json(departments);
});

// Department dashboard (protected)
app.get("/api/dashboard/:departmentId", authenticateToken, (req, res) => {
  const { departmentId } = req.params;

  const department = db.prepare("SELECT * FROM departments WHERE id = ?").get(departmentId);
  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  const employees = db.prepare(`
    SELECT id, name, email, position, salary, hire_date
    FROM employees
    WHERE department_id = ?
    ORDER BY hire_date DESC
  `).all(departmentId);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_employees,
      AVG(salary) as avg_salary,
      MAX(salary) as max_salary,
      MIN(salary) as min_salary
    FROM employees
    WHERE department_id = ?
  `).get(departmentId);

  res.json({
    department,
    employees,
    stats
  });
});

// Get current user profile
app.get("/api/profile", authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.*, e.name, e.position, d.name as department_name
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    position: user.position,
    department: user.department_name
  });
});

app.listen(port, () => {
  console.log(`Employee Management System API listening on port ${port}`);
  console.log(`Database initialized with sample data`);
});
