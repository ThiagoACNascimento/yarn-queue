# Development Guide

## Prerequisites

To run the application, first you will need some dependencies:

- [Node](https://nodejs.org/en/download) (version 18+)
- [Docker](https://www.docker.com/get-started/) and Docker Compose

## Setup

Setting up the project is easy, follow these steps to run **YarnQueue** locally:

**1. Clone the repository and enter the folder**

```bash
  # Clone the repository and enter the folder
  git clone https://github.com/ThiagoACNascimento/yarn-queue
  cd yarn-queue
```

**2. Install dependencies**

```bash
  npm i
  # or
  npm install
```

**3. Configure environment variables**

Copy the example file and adjust values for your environment:

```bash
  # Mac / Linux / Windows PowerShell
  cp .env.example .env.development

  # Windows Command Prompt
  copy .env.example .env.development
```

**4. Start the development server**

```bash
  npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

## Available Scripts

Here you will see some useful scripts to use. This scripts are not default ones from `nest-cli` — some have custom configurations.

The main script handles the full startup flow:

- Run Docker Compose
- Run Migrations
- Run Server

```bash
  npm run start:dev
```

Other scripts:

```bash
  # Docker container management
  npm run services:up         # Start PostgreSQL container
  npm run services:stop       # Stop container (preserves data)
  npm run services:down       # Stop and remove the container

  # Database migrations
  npm run migrations:create   # Create a new migration after schema changes
  npm run migrations:up       # Apply pending migrations
  npx prisma migrate reset    # Wipe all data and re-apply migrations

  # Prisma
  npx prisma generate         # Generate prisma client
```

For all available commands, see the `scripts` section in [Package.json](../package.json)

## Project Structure

The project is organized according to the following structure:

```bash
    .
    ├── prisma              # Schema and migrations
    ├── src
    │   ├── generated       # Generated Prisma client
    │   ├── infra
    │   │     └── database  # Database module (PrismaService)
    │   └── modules         # Feature modules
    │       ├── auth        # Authentication
    │       ├── users       # User management
    │       └── health      # Database health
    │
    └── test # E2E tests (Not implemented yet)
```

## Common Tasks

### Update the database schema

After editing `prisma/schema.prisma`:

```bash
  npm run migrations:create <MIGRATION_NAME> # Ex: add_user_avatar
  npm run migrations:up
```

### Reset the database (development only)

To wipe all data and re-apply migrations from scratch:

```bash
  npx prisma migrate reset
```

**IMPORTANT**: This deletes all data.

### Stop and clean up containers

```bash
  npm run services:down
```

## Troubleshooting

### `ERROR: P1001: Can't reach database server at localhost:5432`

This can happen on slow machines or first-time Docker image pulls, when Postgres needs more time to fully accept connections after the container starts.

If you see this error:

1. Verify Docker is running: `docker ps`
2. Wait a few seconds and re-run:

```bash
  npm run start:dev
```
