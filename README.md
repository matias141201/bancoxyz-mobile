# BancoXYZ Mobile

Aplicación móvil para la prueba técnica de BancoXYZ. Usa React Native, Expo SDK 58, Expo Router y TypeScript.

## Requisitos

- Node.js 24 LTS (24.3 o posterior) y npm.
- Expo Go compatible con SDK 58 en un teléfono, simulador iOS o emulador Android.

## Instalación y ejecución

```sh
npm ci
npm start
```

Escaneá el QR en Expo Go o elegí `i` para iOS y `a` para Android cuando el entorno esté preparado. También podés usar `npm run ios`, `npm run android` o `npm run web`.

## Pruebas y calidad

```sh
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:coverage
```

Jest incluye pruebas de componentes y navegación. El umbral global de esta base es 80% en ramas, líneas, funciones y sentencias.

## Estructura

- `src/app` contiene las rutas y la configuración de navegación.
- `src/features` agrupa el código por funcionalidad.
- `src/theme` concentra los tokens visuales.

## Estado

La base de Expo y el acceso inicial están en desarrollo. La autenticación, el saldo y las transferencias se integran en ramas de funcionalidad.
