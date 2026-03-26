# Gatus Config Generator

Visual web interface for generating, managing, and deploying [Gatus](https://github.com/TwiN/gatus) `config.yaml` files.

**Demo: https://gatus-generator.hibbit.cloud**

> Demo mode - Saving, updating and deleting configurations is disabled.

## Features

- Visual editor for all Gatus sections: Endpoints, Alerting, Storage, Security, Maintenance, UI & Web
- Live YAML preview with syntax highlighting
- Condition builder with presets
- 13 alerting providers (Slack, Discord, Telegram, Teams, Email, PagerDuty, Ntfy, and more)
- Save and load configurations (SQLite)
- Direct deployment to Gatus via a shared config path
- YAML validation before deployment

## Quick Start

### Generate a SECRET_KEY

Before starting, generate a secure secret key for the application. Use one of the following methods:

**Linux / macOS:**

```bash
openssl rand -hex 32
```

**PowerShell (Windows):**

```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Copy the output and set it as the `SECRET_KEY` environment variable in `docker-compose.yml` (see [Configuration](#configuration)).

### Start with Docker Compose

```yaml
services:
  gatus-generator:
    image: ghcr.io/r0gger/gatus-config-generator:latest
    ports:
      - "8000:8000"
    volumes:
      - gatus-config:/gatus-config
    environment:
      - GATUS_CONFIG_PATH=/gatus-config/config.yaml
      - SECRET_KEY=changeme-in-production
      - AUTH_USERNAME=   # auth disabled when empty
      - AUTH_PASSWORD=   # auth disabled when empty 
      - STANDALONE_MODE=true # Set to false if you want Gatus and the config generator and deploy/load the configuration to/from Gatus
      - MAX_SAVED_CONFIGS=10
    restart: unless-stopped

# Uncomment this if you want to run Gatus and the config generator and deploy/load the configuration to/from Gatus
#  gatus:
#    image: ghcr.io/twin/gatus:stable
#    ports:
#      - "8080:8080"
#    volumes:
#      - gatus-config:/config
#      - gatus-data:/data
#    restart: unless-stopped

volumes:
  gatus-config:
  gatus-data:
```

```bash
docker compose up -d
```

Go to `gatus-generator` in your browser: **http://localhost:8000**

#### Optional: Running with Gatus
If `STANDALONE_MODE=false` and the `gatus` service in `docker-compose.yml` is uncommented, the Gatus uptime monitoring dashboard becomes available at **http://localhost:8080**.

Both services share a Docker volume (`gatus-config`). When you deploy a configuration through the generator, Gatus automatically picks up the changes via hot-reload.

- **Deploy to Gatus:** In the config preview (YAML editor), click **Deploy**.
- **Load deployed config:** Go to **Saved / Import > Import > Deployed configuration**, then click **Load Deployed**.

## Authentication

The Config Generator supports optional HTTP Basic Auth to protect the web interface and API. Authentication is **disabled by default** and can be enabled by setting the `AUTH_USERNAME` and `AUTH_PASSWORD` environment variables.

To enable authentication, uncomment (or add) the following lines in `docker-compose.yml`:

```yaml
- AUTH_USERNAME=admin
- AUTH_PASSWORD=a-strong-password
```

Then restart the container:

```bash
docker compose up -d
```

When enabled, the browser will display a login prompt on the first API request. Credentials are cached for the duration of the browser session.

> **Note:** Basic Auth transmits credentials as base64 (not encrypted). Use a reverse proxy with TLS (e.g. Caddy, Traefik, or nginx) if the generator is exposed outside your local network.

To disable authentication, simply remove or leave `AUTH_USERNAME` and `AUTH_PASSWORD` empty.

## Configuration

Environment variables can be set in `docker-compose.yml` under the `gatus-generator` service:

| Variable | Default | Description |
|---|---|---|
| `GATUS_CONFIG_PATH` | `/config/config.yaml` | Path where the config is deployed to |
| `SECRET_KEY` | `changeme-in-production` | Secret key for the application (see [Generate a SECRET_KEY](#generate-a-secret_key)) |
| `DATABASE_URL` | `sqlite:///./gatus_generator.db` | SQLite path or PostgreSQL connection URL |
| `AUTH_USERNAME` | _(empty)_ | Username for Basic Auth (auth disabled when empty) |
| `AUTH_PASSWORD` | _(empty)_ | Password for Basic Auth (auth disabled when empty) |
| `STANDALONE_MODE` | `false` | Run without Gatus (hides deploy features in the UI) |
| `DEMO_MODE` | `false` | Demo mode (disables saving, updating, deleting and deploying) |
| `MAX_SAVED_CONFIGS` | `25` | Maximum number of saved configurations |

### Gatus: Generate a bcrypt + base64 password (Basic Auth)

Gatus Basic Auth requires a bcrypt-hashed password encoded as base64. Use one of the methods below:

```bash
docker run --rm ghcr.io/r0gger/bcrypt-base64-password:latest YourPassword
```

Options:

| Option | Description |
|---|---|
| `-r <rounds>` | Number of bcrypt rounds (default: 10) |
| `--no-base64` | Output the raw bcrypt hash without base64 encoding |

See [bcrypt-base64-password](https://github.com/R0GGER/bcrypt-base64-password) for more details.

Paste the final base64 string into the **Security > Basic Auth** password field in the Config Generator.

> **Tip:** The Config Generator auto-encodes plain bcrypt hashes (starting with `$2`) to base64 when generating YAML. You can paste either the raw bcrypt hash or the base64-encoded version.

## Project Structure

```
gatus-config-generator/
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # CI/CD: build & push Docker image
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── configs.py      # CRUD for saved configs
│   │   │   └── deploy.py       # Deploy, validate & read deployed config
│   │   ├── __init__.py
│   │   ├── auth.py             # Optional HTTP Basic Auth
│   │   ├── database.py         # SQLite / PostgreSQL engine
│   │   ├── main.py             # FastAPI app, health endpoint & static mount
│   │   ├── models.py           # SQLModel schemas
│   │   └── settings.py         # Pydantic settings (env variables)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html              # Vue 3 SPA (CDN, no build step)
│   ├── styles.css
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   └── js/
│       ├── app.js              # Vue app entry
│       ├── store.js            # Reactive config state
│       ├── yaml-generator.js   # Config → YAML generation
│       ├── yaml-parser.js      # YAML → config parsing (import)
│       └── components/
│           ├── AdvancedSection.js
│           ├── AlertingSection.js
│           ├── BadgeChartSection.js
│           ├── ConditionBuilder.js
│           ├── EndpointForm.js
│           ├── EndpointsEditor.js
│           ├── MaintenanceSection.js
│           ├── SavedImport.js
│           ├── SecuritySection.js
│           ├── Sidebar.js
│           ├── StorageSection.js
│           ├── UISection.js
│           └── YamlPreview.js
├── .gitignore
├── docker-compose.yml
├── LICENSE
└── README.md
```

## API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/configs/` | List saved configs |
| POST | `/api/configs/` | Save a new config |
| GET | `/api/configs/{id}` | Retrieve a config |
| PUT | `/api/configs/{id}` | Update a config |
| DELETE | `/api/configs/{id}` | Delete a config |
| POST | `/api/deploy/` | Deploy config to Gatus config path |
| POST | `/api/deploy/validate` | Validate YAML |
| GET | `/api/deploy/settings` | Retrieve deploy settings |
| GET | `/api/deploy/current` | Read the currently deployed configuration |
| GET | `/api/health` | Health check |

## Built With

This application was built with the help of [Cursor](https://www.cursor.com/) and Claude Opus 4.6 (Anthropic).
