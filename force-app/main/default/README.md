# Apex Cursors POC -- Spring '26 (API v66.0)

Working demo of **Database.Cursor** and **Database.PaginationCursor** for paginating Account records in LWC.

## What's Inside

| File | Purpose |
|------|---------|
| `TFB_StandardCursorController.cls` | Apex controller using Database.Cursor (offset-based, random access) |
| `TFB_PaginationCursorController.cls` | Apex controller using Database.PaginationCursor (index-based, skips deleted records) |
| `tfbStandardCursorDemo/` | LWC component wired to the standard cursor controller |
| `tfbPaginationCursorDemo/` | LWC component wired to the pagination cursor controller |

## Prerequisites

- Salesforce org on **Spring '26** (API v66.0)
- Account records in the org (20+ recommended to see pagination in action)

## Deploy

```bash
sf project deploy start \
  --source-dir force-app/main/default/classes/TFB_StandardCursorController.cls \
  --source-dir force-app/main/default/classes/TFB_PaginationCursorController.cls \
  --source-dir force-app/main/default/lwc/tfbStandardCursorDemo \
  --source-dir force-app/main/default/lwc/tfbPaginationCursorDemo \
  --target-org yourOrgAlias
```

Then add the components to any Lightning App Page via App Builder.

## Cursor vs PaginationCursor

| | Database.Cursor | Database.PaginationCursor |
|---|---|---|
| Max rows | 50M | 100K |
| Daily limit | 10,000/org | 200,000/org |
| Navigation | Random access (offset) | Sequential (nextIndex) |
| Deleted records | May return fewer per page | Skips, always returns full page |
| Best for | Backend processing, Queueable chains | UI pagination, record lists |

## References

- [Apex Cursors Documentation](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_cursors.htm)
- [Spring '26 Developer's Guide](https://developer.salesforce.com/blogs/2026/01/developers-guide-to-the-spring-26-release)
