# PersonIngestAPI – Data Cloud Ingestion API Data Stream

Org: `salesforce-ogillw`

| Item | Value |
|---|---|
| Connector | PersonIngestAPI (`PersonIngestAPI_2966d7ef_fb3a_4728_91de_b18e5e9a3439`) |
| Source object | PersonRecord |
| Data stream | `PersonIngestAPI_PersonRecord_96099A81` (ACTIVE, UPSERT) |
| Data Lake Object | `PersonIngestAPI_PersonRecord_96099A81__dll` (Profile, default dataspace) |
| Primary key | `Guid` |
| Record modified field | `LastModified` |

## Fields
| Field | Type |
|---|---|
| Guid | Text (PK) |
| FirstName | Text |
| LastName | Text |
| LastModified | DateTime |

## Ingest endpoint
`POST https://<tenant>.c360a.salesforce.com/api/v1/ingest/sources/PersonIngestAPI/PersonRecord`

```json
{"data":[{"Guid":"3f2b8c1e-9d4a-4e7b-a1c2-5f6e7d8c9b0a","FirstName":"Test","LastName":"User","LastModified":"2026-10-26T12:00:00Z"}]}
```
Requires a Data Cloud token (connected app with `cdp_ingest_api` scope).

## Files
- `connector.json` – connector definition
- `schema.json` – PersonRecord schema
- `data-stream.json` – data stream / DLO definition
