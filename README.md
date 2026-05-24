# Go ASCII LLM

Aplicacion web sencilla para convertir posiciones de Go en un tablero ASCII facil de pegar en un LLM. Tambien genera la lista de jugadas y un SGF basico.

## Uso local

```bash
npm start
```

Abre `http://127.0.0.1:3091`.

## Funciones

- Tableros de 9x9, 13x13 y 19x19.
- Tablero clicable con alternancia de turno.
- Capturas basicas al reproducir jugadas.
- Importacion desde SGF sencillo o lista de jugadas tipo `1. B Q16`.
- Exportacion de tablero ASCII, lista de jugadas, SGF y prompt completo.

## Arranque en macOS

Instala el LaunchAgent:

```bash
./scripts/install_launchagent.sh
```

Esto crea `~/Library/LaunchAgents/com.domingo.go-ascii-llm.plist`, arranca la app en `127.0.0.1:3091` y la reinicia si se cae.

## Publicacion en Tailscale

La app queda preparada para publicarse en la misma cuenta de Tailscale que `docflow`. La configuracion recomendada es mantener `docflow` en `/` y publicar esta app en `/go`:

```bash
./scripts/publish_tailscale.sh
```

El resultado esperado es:

- `https://nuevo-macbook-air-de-domingo.tail9bf5a2.ts.net/` para `docflow`.
- `https://nuevo-macbook-air-de-domingo.tail9bf5a2.ts.net/go/` para Go ASCII LLM.

Si Tailscale cambia de host, revisa el resultado con:

```bash
tailscale serve status
```
