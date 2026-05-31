# Validation Record

Last local validation: 2026-05-31

## Environment

Project:

```text
C:\Users\Mr.Bin\Documents\Codex\2026-05-30\codexspark-codex5-5\magicuidesign-portfolio
```

Local URL:

```text
http://localhost:3001
```

## Production build

Command:

```powershell
npm.cmd run build
```

Result:

```text
Passed
```

Re-run after repair-502 script:

```text
Passed
```

Re-run after dynamic Nginx/status scripts:

```text
Passed
```

Re-run after lint fixes:

```text
Passed
```

Re-run after SSE room events:

```text
Passed
```

Re-run after next/image cleanup:

```text
Passed
```

Evidence:

```text
Compiled successfully
Running TypeScript passed
Generated static pages completed
```

Generated application routes included:

```text
/
/journal
/journal/[slug]
/notes
/notes/[slug]
/garden
/garden/[slug]
/room
/about
/studio
/api/comments
/api/comments/[id]
/api/room/messages
/api/room/presence
/api/room/events
/api/studio/*
```

Known build warning:

```text
Using edge runtime on a page currently disables static generation for that page
```

This warning comes from Open Graph image routes and is not a blocker for the site.

## Local API smoke test

Command:

```powershell
npm.cmd run site:smoke
```

Result:

```text
Passed
```

Re-run after lint fixes:

```text
Passed
```

Re-run after SSE room events:

```text
Passed
```

Re-run after next/image cleanup:

```text
Passed
```

Covered behavior:

- `/api/health`
- comment creation
- comment like
- comment self-delete
- room presence
- room events stream
- room message creation
- Studio login
- Studio comment listing
- Studio room message listing

Smoke output:

```text
health ok
comment post ok
comment like ok
comment self-delete ok
room presence ok
room events stream ok
room message post ok
studio login ok
studio comments ok
studio messages ok
smoke test complete
```

## Lint

Command:

```powershell
npm.cmd run lint
```

Result:

```text
Passed with warnings
```

Re-run after SSE room events:

```text
Passed with warnings
```

Re-run after next/image cleanup:

```text
Passed with warnings
```

Re-run after release packaging scripts:

```text
Passed with warnings
```

Remaining warnings:

- content-collections generated file uses anonymous default export.

No lint errors remain. Application code currently has no lint warnings; the only remaining warning is from a generated content-collections file.

## Release package

Command:

```powershell
npm.cmd run release:zip
```

Result:

```text
Passed
```

Output:

```text
release/personal-room-deploy.zip
```

The release directory is ignored by both Git and ESLint.

## Not yet verified

- Remote server deployment on `106.52.232.205`.
- Public access through `http://106.52.232.205:3001`.
- Nginx proxy from public `:3001` to local `127.0.0.1:3002`.
- PostgreSQL-backed storage on the server.
- Server-side preflight script execution.
- Server-side backup and restore script execution.
- Server-side dynamic Nginx config script execution.
- Server-side status report script execution.

## Current public endpoint observation

Checked from local environment:

```text
http://106.52.232.205:3001/api/health -> 502 Bad Gateway
```

Re-checked after adding the automatic repair script:

```text
http://106.52.232.205:3001/api/health -> 502 Bad Gateway
```

Re-checked after adding dynamic Nginx/status scripts:

```text
http://106.52.232.205:3001/api/health -> 502 Bad Gateway
```

This proves the public port is reachable, but the upstream application is not currently healthy.
