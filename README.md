# BancoXYZ Mobile

Aplicación móvil para consultar el saldo y gestionar transferencias. Usa React Native, Expo SDK 58, Expo Router y TypeScript.

## Instalación

Requiere Node.js 24 LTS (24.3 o posterior), npm y Expo Go compatible con SDK 58 en un teléfono, simulador iOS o emulador Android.

```sh
npm ci
cp .env.example .env.local
```

`.env.example` ya incluye las cuatro URLs completas del entorno de evaluación. Al copiarlo a `.env.local`, la app queda configurada para conectarse.

| Variable | Ruta |
| --- | --- |
| `EXPO_PUBLIC_LOGIN_URL` | `/default/login` |
| `EXPO_PUBLIC_BALANCE_URL` | `/default/balance` |
| `EXPO_PUBLIC_HISTORY_URL` | `/default/transferList` |
| `EXPO_PUBLIC_TRANSFER_URL` | `/default/transfer` |

Ingresá con una cuenta de evaluación provista por el contacto de la prueba. Las variables `EXPO_PUBLIC_*` se incluyen en el bundle y deben contener únicamente configuración pública.

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

Para probar una transferencia, el campo **Documento del destinatario** usa el valor de `payeer.document` del historial. Los ID de la tabla de credenciales corresponden a las cuentas de acceso. En la comprobación de evaluación, el backend aceptó un envío inmediato de USD 0,01 con el documento de un destinatario del historial.

Cada confirmación envía un único `POST /transfer` con `value`, `currency`, `payeerDocument` y `transferDate`. La prueba controlada verificó que la API acepta esos cuatro campos.

### Incidencia del backend de evaluación

- El envío de prueba devolvió HTTP 200 con `status: "success"`. Las consultas directas posteriores a `GET /balance` y `GET /transferList` devolvieron exactamente el mismo saldo e historial que antes del envío.
- Dos cuentas de evaluación distintas recibieron el mismo token, el mismo saldo y los mismos movimientos. Las consultas repetidas sin caché reprodujeron el resultado.
- La app consulta el historial al abrirlo y el saldo al volver al inicio. Ambas pantallas muestran los datos que devuelve la API. El proveedor debe verificar la persistencia de los envíos y la ejecución de fechas programadas.
