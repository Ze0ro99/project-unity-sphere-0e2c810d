# Language and network synchronization
- [x] Integrate dedicated read-only Pi Testnet portal feed into existing portal sync dashboard; poll at 60 seconds and manual refresh.
- [x] Test feed parsing, empty/stale/error/rate-limit states without publishing.
- [x] Apply shared languages across gateways; verify Arabic direction and proof input preservation.
- [x] Detect active protocol from closed ledgers automatically; track v28, v29, v30 without claiming unverified contract compatibility.
- [x] Verify native Pi and IPPR constants and fix startup errors.
- [x] Verify gateway navigation and network detection in the browser; run regression tests.
- [ ] Restore real event retrieval: external endpoint returns HTTP 502 feed_query_failed; requires correction in the dedicated project's function/query.
- [ ] Resolve two broad record-access findings: paid-challenge access mapping and access-scope confirmation are unavailable; policies unchanged.
- [x] Save verified changes and report files, commit, and configuration.