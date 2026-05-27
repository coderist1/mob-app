# Car Rental Mobile

Expo Router mobile app for the Car Rental System (IT323 Final Project).

> **Full system docs:** [FastAPI SYSTEM_DOCUMENTATION.md](../../fastapi/SYSTEM_DOCUMENTATION.md)

## Team

| Name | Role |
|------|------|
| Polinar, Mathew Jhon K. | Backend, Database, Deployment |
| Dequino, Lovely C. | Web Application |
| Baquiro, Coneybelle L. | Mobile Application |
| Camense, Angela G. | UI/UX, Documentation, Testing |

## Quick Start

```powershell
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

## Backend Connection

Both web and mobile must point to the **same backend URL**.

**Local development** (`.env`):

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:8000
```

Use your PC's LAN IP from `ipconfig`. Phone and PC must be on the same Wi-Fi.

**Production** (`.env` or `eas.json`):

```env
EXPO_PUBLIC_API_URL=https://fastapi-n7sg.onrender.com
```

Start the backend first:

```powershell
cd c:\Users\Acer\fastapi
.\run.ps1
```

## Features

- Owner, Renter, and Admin dashboards
- Vehicle management with photo upload
- Booking workflow with calendar picker
- Log / damage reports synced to backend
- Bearer token auth stored in AsyncStorage

## Build APK

```powershell
npx eas build -p android --profile production
```

Rebuild after backend or auth changes so the APK picks up the latest code.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gmail.com | Admin123 | admin |
| matowner1@gmail.com | Owner123 | owner |
| matrenter1@gmail.com | admin123 | renter |

## Sync with Web

1. Log in with the same account on web and mobile
2. Add a vehicle or booking on one client
3. Refresh the other — data comes from the shared Render database

See [docs/README.md](docs/README.md) for screen and context details.
