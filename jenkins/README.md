# Jenkins CI/CD for Expense Tracker

A self-contained Jenkins setup that watches the GitHub repo, runs build/lint
checks, scans for security issues, and **emails you the results on every push**.

## What you get

- **Jenkins** (with Node.js 20 + required plugins) running at http://localhost:8080
- A pre-created pipeline job **`expense-tracker-pipeline`** that reads `Jenkinsfile` from the repo
- Automatic SCM polling every 5 minutes (a local Jenkins can't receive GitHub webhooks)
- A pipeline that runs: checkout → install → lint → **security scan** (`npm audit`) → **secret scan** → **email**
- Login: **admin / admin** (change it — see below)

## 1. Configure email (required to receive security reports)

Email is read from environment variables. Either export them in your shell, or put
them in a `.env` file next to `docker-compose.yml` (Compose auto-loads it).

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_RECIPIENT` | *(empty → email skipped)* | Where security reports are sent |
| `SMTP_HOST` | `smtp.gmail.com` | Your SMTP relay |
| `SMTP_PORT` | `587` | 587 (TLS) or 465 (SSL) |
| `SMTP_USER` | *(empty)* | SMTP login (e.g. your Gmail address) |
| `SMTP_PASS` | *(empty)* | SMTP password / app password |
| `SMTP_TLS` | `true` | Use STARTTLS |
| `SMTP_SSL` | `false` | Use implicit SSL |
| `JENKINS_ADMIN_USER` | `admin` | Jenkins login |
| `JENKINS_ADMIN_PASS` | `admin` | Jenkins password |
| `GIT_REPO_URL` | `https://github.com/KangYan23/expensestracker.git` | Repo to watch |
| `GIT_BRANCH` | `main` | Branch to build |
| `GIT_CREDENTIALS_ID` | *(empty)* | Jenkins credential id if the repo is **private** |

**Gmail example** (create an App Password at
https://myaccount.google.com/apppasswords, then):

```dotenv
EMAIL_RECIPIENT=you@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_TLS=true
```

## 2. Start Jenkins

```bash
docker compose up -d --build jenkins
```

First boot downloads plugins (~2-3 min). Watch it with `docker compose logs -f jenkins`.

## 3. Private GitHub repo (optional)

If `expensestracker` is private, Jenkins needs a credential to clone it:

1. Jenkins → **Manage Jenkins → Credentials → System → Global credentials → Add**.
2. Kind: **Username with password** (or **GitHub App**), set a meaningful **ID** (e.g. `github`).
3. Set `GIT_CREDENTIALS_ID=github` in your `.env`, then restart Jenkins.

## 4. Push to trigger a build

Because a local Jenkins can't be reached by GitHub webhooks, the job **polls** the
repo every 5 minutes. To trigger a build:

```bash
git add -A && git commit -m "your change" && git push origin main
```

Within ~5 minutes Jenkins builds, scans, and emails you the report. You can also
click **Build Now** in the job for an immediate run.

## The pipeline (`Jenkinsfile`)

| Stage | What it does |
|-------|--------------|
| Checkout | Clones the repo |
| Install | `npm ci` for backend + frontend |
| Build & Lint | `node --check` (backend) + `npm run lint` (frontend) |
| Security Scan | `npm audit --json` for both services, summarised by severity |
| Secret Scan | grep for leaked passwords/keys/tokens |
| post → email | Archives reports + emails the summary (attaches JSON) |

Results are also archived under `build/security-reports/` on each build.

## Extending to deploy

The pipeline currently does CI (validate + scan + notify). To deploy the built
images to Kubernetes (see `k8s/`), add a stage after `Security Scan`, e.g. build
images with `docker build`, tag with `${env.BUILD_ID}`, and `kubectl apply` — then
mount `/var/run/docker.sock` and a kubeconfig into the Jenkins container.
