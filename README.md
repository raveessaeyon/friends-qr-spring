# Friends QR Circle

Friends QR Circle is a standalone React + Vite app for browsing and sharing payment QR codes.

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Production output can be created with `npm run build` and previewed with `npm run preview`.

## Docker

```powershell
docker build -t friends-qr-circle .
docker run --rm -p 8080:80 friends-qr-circle
```

The app stores newly added QR codes and the theme preference in browser local storage. Built-in QR images are in `public/assets`.
