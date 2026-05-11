# GitHub Actions CI/CD

The workflow files are in the repository-root `.github/workflows` folder:

- `helm-validate.yml` validates the Helm chart on pull requests and manual runs.
- `build-and-deploy.yml` builds both Docker images, pushes them to Amazon ECR, and deploys the Helm chart to EKS on pushes to `main`.

## Required GitHub Variables

Create these under repository `Settings` > `Secrets and variables` > `Actions` > `Variables`:

| Name | Example |
| --- | --- |
| `AWS_REGION` | `ap-south-1` |
| `EKS_CLUSTER_NAME` | `my-eks-cluster` |
| `ECR_BACKEND_REPOSITORY` | `two-tier-backend` |
| `ECR_FRONTEND_REPOSITORY` | `two-tier-frontend` |

## Required GitHub Secret

Create this under repository `Settings` > `Secrets and variables` > `Actions` > `Secrets`:

| Name | Example |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::<account-id>:role/github-actions-eks-deploy-role` |

The IAM role should allow GitHub OIDC authentication, ECR image push access, and EKS deployment access.

