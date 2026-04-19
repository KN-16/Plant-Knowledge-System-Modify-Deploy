# 🌿 Plant Knowledge & CBIR-Based Identification System

A comprehensive full-stack system for managing **plant taxonomy, botanical knowledge, morphology, and distribution data**. The system integrates an AI service capable of extracting CNN feature vectors from plant images and performing high-dimensional similarity searches using PostgreSQL's `pgvector`.

Designed for production-readiness, the entire infrastructure (Frontend, Backend Web, AI Service, Database, and Message Broker) is fully containerized via Docker.

---

## 🚀 Quick Start (Under 5 Minutes)

### 1. Clone the repository

```bash
git clone https://github.com/KN-16/Plant-Knowledge-System.git
cd plant-knowledge-system
```

### 2. Extract Required Dependencies & Models

Before starting the containers, ensure all compressed models and source files are extracted.

```bash
# Extract Backend Web dependencies (if compressed)
cd backendweb
unzip uploads.zip -d .
cd ..

# Extract AI Models (Critical for CNN feature extraction)
cd backend-ai
unzip models.zip -d .
cd ..
```

### 3. Spin up the infrastructure

```bash
docker compose up -d --build
```

---

## 🌐 Access URLs

Once the containers are running, you can access the services via your browser using the following local endpoints:

- **Frontend Web App:** http://localhost
- **Admin Dashboard:** http://localhost/admin
- **pgAdmin (Database UI):** http://localhost:5050
- **RabbitMQ Dashboard:** http://localhost:15672

---

## 🔐 System Accounts & Credentials

The database is pre-seeded with test data and accounts via `init.sql`. Use these credentials to test the system immediately.

### Web Application Accounts

```txt
Admin Role:
  Username: admin (or admin@system.com)
  Password: 123456
  Access:   Full CRUD on taxonomy, users, and AI knowledge chunks.

Standard User Role:
  Username: user (or user@example.com)
  Password: 123456
  Access:   Plant identification and knowledge browsing.
```

### Infrastructure Accounts

```txt
pgAdmin (Web UI):
  Email:    admin@example.com
  Password: adminpass

RabbitMQ (Message Broker):
  Username: admin
  Password: admin

PostgreSQL (Direct Connection):
  Database: plant_knowledge_db
  User:     admin
  Password: adminpass
```

---

## 📂 Project Structure

```text
plant-knowledge-system/
├── backend-web/              # Node.js REST API (Express, Sequelize)
├── backend-AI/               # AI service (Python, model inference)
├── frontend-web/             # Web client (Vite-based)
├── nginx-gateway/            # Reverse proxy (entrypoint)
│   └── nginx.conf            # Nginx configuration
├── pgadmin/                  # PgAdmin configuration
│   └── servers.json          # Preconfigured database connections
├── envs/                     # Centralized environment variables
├── .venv/                    # Local Python environment (dev only)
├── init.sql                  # Database schema & seed data
├── docker-compose.yml        # Multi-service orchestration
├── .gitignore
└── README.md
```

---

## 🏗 System Architecture

The system operates on a microservices-inspired architecture:

1. **Frontend** interacts directly with the **Backend Web API**.
2. **Backend Web** handles standard CRUD (taxonomy, morphology) and delegates asynchronous or heavy ML tasks to **RabbitMQ**.
3. **AI Service** listens to tasks, processes images through its CNN model, and generates high-dimensional vectors.
4. **PostgreSQL** stores structured data and utilizes the `pgvector` extension to run fast Nearest-Neighbor (`<->`) similarity searches on plant images and knowledge chunks.

---

## ⚙️ Environment Configuration

The system uses centralized environment configuration files located in the `envs/` directory.  
Each service is configured via its own `.env` file.

---

### 📂 Environment Files Overview

```text
envs/
├── .env.productionBackendWeb   # Backend Web (Node.js API)
├── .env.productionBackendAI    # AI Service (Python)
├── .env.productionPgadmin      # PgAdmin configuration
├── .env.productionPostgres     # PostgreSQL database
└── .env.productionRabbit       # RabbitMQ message broker
```

---

## ⚠️ Important Notes for Deployment

### ✅ Safe for Local Development

The current values are configured for **local development and testing**.  
You can use them directly when running the system locally.

---

### 🔐 MUST change when deploying to production

Update the following variables before public deployment:

- JWT secrets:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`

- Database credentials:
  - `POSTGRES_PASSWORD`
  - `DB_PASS`

- RabbitMQ credentials:
  - `RABBITMQ_DEFAULT_USER`
  - `RABBITMQ_DEFAULT_PASS`

- PgAdmin credentials:
  - `PGADMIN_DEFAULT_EMAIL`
  - `PGADMIN_DEFAULT_PASSWORD`

---

### 💡 Best Practices

- Never commit real production secrets into source control
- Use `.env` overrides or secret managers in production
- Keep `envs/` for development defaults only
- Rotate credentials regularly

---

## 🚀 Summary

- The system is fully containerized using Docker Compose
- All core services (Backend, AI, Database, Message Broker) are pre-configured via the `envs/` directory
- Nginx acts as the single public entrypoint (port 80)

---

## ⚠️ Additional Configuration Notes

While most services are pre-configured, some adjustments may be required depending on your environment:

### 🔧 Frontend Configuration (Build-time)

The frontend uses Vite and requires correct API endpoints during build time.

Defined in `docker-compose.yml`:

```yaml
args:
  - VITE_API_URL=http://localhost/api
  - VITE_BACKEND_URL=http://localhost
```

👉 Update these values if:

- You deploy to a different domain
- You change the public gateway (Nginx)

---

### 🌐 Nginx Gateway

- All external traffic is routed through `nginx-gateway`
- Only port `80` is exposed to the host:

```yaml
ports:
  - "80:80"
```

👉 You may need to update:

- `nginx-gateway/nginx.conf` (routing rules)
- Add SSL (port 443) for production

---

### 🧠 When deploying publicly

You should review:

- Frontend build args (`VITE_*`)
- Nginx routing config
- Environment variables in `envs/`
- Credentials and secrets

---

### 💡 Summary

- Local development → mostly plug & play
- Production deployment → requires:
  - Updating environment variables
  - Adjusting frontend API URLs
  - Configuring Nginx properly

---

## 📝 Notes & Troubleshooting

- **`pgvector` Dependency:** Ensure your PostgreSQL container image supports `pgvector`. The `init.sql` script will automatically map `CREATE EXTENSION IF NOT EXISTS vector` upon initialization.
- **Model Extraction Failure:** If the AI Service crashes on startup, verify that `models.zip` was successfully extracted into the `backend-ai/models/` directory.
- **Upload Directory Issue:** If file uploads are not working or the service throws errors related to missing files, ensure that the required archives (if any) have been extracted correctly so that the backend-web/uploads/ directory exists and is populated as expected.
- **Data Persistence:** Database files are persisted via Docker volumes. To wipe the database completely and re-seed from `init.sql`, run `docker compose down -v`.
- **Port Conflicts:** Ensure ports `80`, `5050`, and `15672` are free on your host machine before starting Docker Compose.

## 🗄️ Database Backup & Restore

This section provides commands to export (dump) and restore the PostgreSQL database running inside Docker.

### 📤 Dump Database (Export)

```bash
# Dump the database inside the PostgreSQL container to a temporary file
docker compose exec postgres pg_dump -U admin -d plant_knowledge_db --clean --if-exists --encoding=UTF8 -f /tmp/init.sql

# Copy the dumped SQL file from the container to the host machine
docker compose cp postgres:/tmp/init.sql ./init.sql
```

👉 This will generate a full database backup as `init.sql` on your local machine.

---

### 📥 Restore Database (Import)

#### Option 1: Restore using file inside container (Recommended)

```bash
# Copy the SQL file into the container
docker compose cp ./init.sql postgres:/tmp/init.sql

# Execute the SQL file inside PostgreSQL container
docker compose exec postgres psql -U admin -d plant_knowledge_db -f /tmp/init.sql
```

---

#### Option 2: Restore using pipe (no file copy needed)

```bash
# Pipe SQL file directly into PostgreSQL container
cat init.sql | docker compose exec -T postgres psql -U admin -d plant_knowledge_db
```
