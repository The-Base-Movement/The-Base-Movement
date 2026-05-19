# Memory Index

- [users-table-schema-and-drift](schema_users_table.md) — full users column list (no registration_source column) and TS↔DB drift in User interface
- [users-table-rls-policies](rls_users_table.md) — RLS on public.users: members see only own row; chapter-leader read is constituency-scoped, not chapter-scoped; INSERT is public
- [mobilization-ledger-schema](schema_mobilization_ledger.md) — mobilization_ledger columns, no FKs, RLS: SuperAdmin-only writes, regional admin SELECT scoped by chapter
