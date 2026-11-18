# Pi Sign-in OAuth Integration

**Status:** Source implementation proposal. Developer Portal redirect registration and domain verification are required before production sign-in can be used.

## Authentication boundary

This application supports two separate Pi identity paths:

- Pi Apps SDK authentication (Pi.authenticate) remains in place for the existing Pi App flow and payment permissions.
- Pi Sign-in (Pi.signIn) is an additional OAuth implicit-flow identity path for web sign-in.

Do not treat OAuth sign-in as payment permission. Pi Sign-in currently supports only the implicit flow and the username and wallet_address scopes. It does not issue a client secret, refresh token, authorization code, or payments scope.

## Configuration

- Public Client ID: the supplied Pi Developer Portal client ID. It is public and may be present in browser code.
- Default redirect URI: https://project-unity-sphere.lovable.app/signin/callback.
- Optional overrides: VITE_PI_OAUTH_CLIENT_ID and VITE_PI_OAUTH_REDIRECT_URI.

The exact redirect URI must be registered in the Pi Developer Portal. Production redirect hosts must be verified domains. For local development, register a loopback URI such as http://localhost:8080/signin/callback.

If the configured redirect URI is not registered exactly, Pi will reject the authorization request. Verify the App URL, complete the Developer Portal App Domain challenge, and register the callback URI before enabling production sign-in.

## Flow

1. Generate a cryptographically random state and keep it in session storage.
2. Call Pi.signIn with the client ID, exact registered redirect URI, username and wallet_address scopes, and state.
3. Parse the returned URL fragment and compare its state with the stored value.
4. Remove the fragment from browser history immediately.
5. Call GET https://api.minepi.com/v2/me with Authorization: Bearer access_token.
6. Validate the returned uid and username; use the app-specific uid as the identity key.
7. Store only the verified profile in session storage. Do not persist the bearer token or use it as a long-lived application session.
8. Protected backend operations must perform their own authentication and authorization checks.

## Security

- Never create or request a client_secret; none is issued for this flow.
- Never implement an authorization-code exchange or PKCE for the current Pi Sign-in flow.
- Never trust URL-fragment data before validating state and calling /v2/me.
- Never grant payment, mint, burn, transfer, or admin permissions based on Pi Sign-in.
- Re-authenticate after token expiry; there is no refresh token.
- Keep Pi Platform Server API keys and signing credentials server-side.
- OAuth identity and Pi Apps SDK payment authentication remain independent.

## Validation

Run npm test and npm run build.

The Pi Developer Portal domain verification and redirect URI checklist is an external operator step; source tests cannot prove that the portal has accepted the redirect URI.
