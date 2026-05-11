# Employee Management System Deployed Through Helm

This folder contains an Employee Management System with authentication, employee CRUD operations, and department dashboards, deployed via Helm to an EKS cluster.

## Features

- **Employee Login**: Secure JWT-based authentication
- **Add Employee**: Admin-only employee creation with automatic user account generation
- **View Employees**: List all employees with department information
- **Department Dashboard**: Statistics and employee listings per department

## Default Credentials

- **Admin**: admin@company.com / admin123
- **Employee**: Use email from added employees / password123

## Structure

```text
Application-deploy-through-helm/
  backend/                 Node.js API with SQLite database
  frontend/                React-style SPA served by Nginx
  helm/employee-management-system/  Helm chart for EKS
```

## Run Locally With Docker

Build the backend image:

```powershell
docker build -t employee-management-backend:local ./backend
```

Build the frontend image:

```powershell
docker build -t employee-management-frontend:local ./frontend
```

Create a local Docker network:

```powershell
docker network create employee-management
```

Run backend:

```powershell
docker run --rm --name employee-management-backend --network employee-management -p 3000:3000 employee-management-backend:local
```

Run frontend:

```powershell
docker run --rm --network employee-management -p 8080:80 employee-management-frontend:local
```

Open `http://localhost:8080`.

## Deploy To EKS With Helm

Push both images to Docker Hub, then install the chart:

```powershell
helm upgrade --install two-tier-app ./helm/two-tier-app `
  --namespace two-tier `
  --create-namespace `
  --set backend.image.repository=<account-id>.dkr.ecr.<region>.amazonaws.com/two-tier-backend `
  --set backend.image.tag=<tag> `
  --set frontend.image.repository=<account-id>.dkr.ecr.<region>.amazonaws.com/two-tier-frontend `
  --set frontend.image.tag=<tag>
```

For AWS Load Balancer Controller ingress, enable ingress:

```powershell
helm upgrade --install two-tier-app ./helm/two-tier-app `
  --namespace two-tier `
  --create-namespace `
  --set ingress.enabled=true `
  --set ingress.hosts[0].host=two-tier.example.com `
  --set ingress.hosts[0].paths[0].path=/ `
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## CI/CD

GitHub Actions workflows were added in the repository-root `.github/workflows` folder:

- `helm-validate.yml` validates the Helm chart.
- `build-and-deploy.yml` builds both Docker images, pushes them to Amazon ECR, and deploys to EKS.

See `CI-CD.md` for the required GitHub secrets and variables.
