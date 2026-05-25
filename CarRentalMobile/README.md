# Car Rental Mobile

Expo Router mobile app for a car rental workflow with owner, renter, and admin roles.

## Start Here

For the full project documentation, see [docs/README.md](docs/README.md).

## Expo Go

```bash
npm install
npx expo start
```

Open the Expo Go app on your phone and scan the QR code from the Expo terminal or browser.

## Android APK

This project already has an EAS build profile for an Android APK in [eas.json](eas.json).

```bash
npx eas build -p android --profile production
```

## Environment

Set the backend base URL in `.env`:

```env
EXPO_PUBLIC_API_URL=https://fastapi-n7sg.onrender.com
```

The app also supports runtime overrides through the shell environment before Expo starts.

