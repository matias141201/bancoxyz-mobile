# BancoXYZ Mobile

Aplicación móvil para la prueba técnica de BancoXYZ. Usa React Native, Expo SDK 58, Expo Router y TypeScript.

## Requisitos

- Node.js 24 LTS (24.3 o posterior) y npm.
- Expo Go compatible con SDK 58 en un teléfono, simulador iOS o emulador Android.

## Instalación y ejecución

```sh
npm ci
cp .env.example .env.local
npm start
```

Configurá `EXPO_PUBLIC_LOGIN_URL`, `EXPO_PUBLIC_BALANCE_URL` y `EXPO_PUBLIC_HISTORY_URL` con los endpoints HTTPS de evaluación. Para saldo se usa la ruta `/default/balance`. Usá una cuenta de evaluación provista por el contacto de la prueba. Después iniciá Expo y escaneá el QR en Expo Go o elegí `i` para iOS y `a` para Android cuando el entorno esté preparado. También podés usar `npm run ios`, `npm run android` o `npm run web`.

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

El login abre una ruta privada y mantiene la sesión en memoria hasta cerrar sesión o reiniciar la app. El inicio consulta el saldo y permite actualizarlo. El historial de movimientos permite combinar filtros de destinatario, importe y fecha. El envío de transferencias se desarrolla en su rama de funcionalidad.
