# Private storage diagnostics

Native builds fail closed when private storage cannot be opened. They preserve existing files instead of silently replacing them. The interface may show a short reference, which identifies the failing stage without exposing database keys, SQL statements, outing content or account credentials.

| Reference | Stage |
| --- | --- |
| V01 | Read key from platform secure storage. |
| V02 | Inspect whether the encrypted database already exists. |
| V03 | Required key is missing; replacement is refused. |
| V04 | Obtain secure random bytes for a new key. |
| V05 | Persist the new key in platform secure storage. |
| V06 | Open an independent native SQLite connection. |
| V07 | Query the cipher implementation version. |
| V08 | Cipher support is missing or unrecognized. |
| V09 | Apply the database key and memory/journal settings. |
| V10 | Open or create the encrypted payload table. |

Do not ask a tester to erase app data as the first response to an error. Confirm the build, platform and reference, then investigate with synthetic data. A missing key is not fixed by generating another key for the same database. Android SQLite directories must be converted from absolute filesystem paths to `file:///` URIs before inspection through Expo FileSystem; iOS file URIs must retain their scheme.
