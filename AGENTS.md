# Application safeguards
- Keep scaled IPPR model calculations separate from native Pi denomination and execution prices so model values cannot alter atomic accounting.
- Preserve Pi Platform access-token authentication independently of site accounts so Pi Browser users can authorize payments.
- Observe active network protocols from fresh closed ledgers per endpoint; supported versions never enable contracts or alter economic constants.
- Keep gateway translations in the shared locale dictionaries and preserve form state when language changes.
- Keep the dedicated public PiRC portal feed isolated from managed app auth and accounting; query its read-only function with a single shared, bounded poller.