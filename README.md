# BancoXYZ Mobile

Aplicación móvil para consultar el saldo y gestionar transferencias. Usa React Native, Expo SDK 58, Expo Router y TypeScript.

## Instalación

Requiere Node.js 24 LTS (24.3 o posterior), npm y Expo Go compatible con SDK 58 en un teléfono, simulador iOS o emulador Android.

```sh
npm ci
cp .env.example .env.local
```

Completá `.env.local` con los endpoints HTTPS de evaluación.

| Variable | Ruta |
| --- | --- |
| `EXPO_PUBLIC_LOGIN_URL` | `/default/login` |
| `EXPO_PUBLIC_BALANCE_URL` | `/default/balance` |
| `EXPO_PUBLIC_HISTORY_URL` | `/default/transferList` |
| `EXPO_PUBLIC_TRANSFER_URL` | `/default/transfer` |

Usá las URL completas y una cuenta de evaluación provista por el contacto de la prueba. Las variables `EXPO_PUBLIC_*` se incluyen en el bundle y deben contener únicamente configuración pública.

## Ejecución

```sh
npm start
```

Escaneá el QR en Expo Go o elegí `i` para iOS y `a` para Android cuando el entorno esté preparado. También podés usar `npm run ios`, `npm run android` o `npm run web`. La vista web depende de los permisos CORS del entorno de evaluación.

## Pruebas

```sh
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:coverage
```

Jest cubre reglas de dinero y fecha, contratos HTTP, estados de pantalla y el flujo de login a historial con respuestas simuladas. La cobertura global mínima configurada es 80% para líneas, ramas, funciones y sentencias.

## Estructura

- `src/app` compone pantallas y protege las rutas privadas.
- `src/features` separa autenticación, saldo, historial y transferencias.
- `src/composition` conecta los adaptadores con la configuración de cada entorno.
- `src/shared` contiene las reglas y componentes transversales. `src/theme` concentra los tokens visuales.

## Verificación de la API

Login, saldo e historial se verificaron contra la API de evaluación. La sesión se mantiene en memoria y una respuesta HTTP 401 en el área privada vuelve a pedir el ingreso.

El adaptador de transferencia envía `valor`, `moneda`, `documentoPayeer` y `fechaDeTransferencia` y lee `estado`, tal como los presenta el enunciado. Su envío inmediato y programado se verificaron con respuestas simuladas. El contrato del POST y la ejecución de fechas programadas por el servidor siguen pendientes de verificación en el entorno de evaluación. Si la respuesta de un envío es incierta, la aplicación permite consultar el historial antes de intentar otra transferencia.
