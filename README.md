# YarnQueue

> Backend service for **managing handmade product** sales — built for crafters
> who want to sell without juggling spreadsheets.

YarnQueue lets independent producers list handmade products, manage demand-based or stock-based inventory, and process customer orders through a clean REST API.

## Features

- **Production-grade authentication** — access + refresh tokens with database-backed revocation, multi-device session management, timing attack mitigation, and httpOnly cookie delivery.

## Tech Stack

**Backend**

- [NestJS](https://nestjs.com/) 11 — Node.js framework with DI, modular architecture
- TypeScript — strict mode

**Database & ORM**

- [Prisma](https://www.prisma.io/) — type-safe ORM and migrations
- PostgreSQL 16 — relational database

**Authentication**

- JWT (access tokens, stateless validation)
- bcrypt (password hashing)
- httpOnly cookies (XSS-resistant token delivery)

**Infrastructure**

- Docker Compose — local development environment

**Validation & Quality**

- class-validator + class-transformer — DTO validation
- ESLint + Prettier — code style

## Documentation

- [Development guide](./docs/development.md) — local setup, scripts, troubleshooting
- [Architecture overview](./docs/architecture.md) — modules, layers, design choices
- [Authentication design](./docs/auth.md) — token flow, security decisions, limitations

## How to run locally

## Roadmap

Tracked as [GitHub issues](https://github.com/ThiagoACNascimento/yarnqueue/issues).
