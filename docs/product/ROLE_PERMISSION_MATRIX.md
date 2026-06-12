# Role & Permission Matrix

| Capability | Owner | Admin | Manager | Employee |
|---|---:|---:|---:|---:|
| Manage tenant | Yes | No | No | No |
| Manage users | Yes | Yes | No | No |
| Manage roles | Yes | Yes | No | No |
| View dashboard | Yes | Yes | Yes | Limited |
| Create task | Yes | Yes | Yes | Yes |
| Assign task | Yes | Yes | Yes | No |
| Update own task status | Yes | Yes | Yes | Yes |
| Delete task | Yes | Yes | Limited | No |
| Check-in/out | Yes | Yes | Yes | Yes |
| View own attendance | Yes | Yes | Yes | Yes |
| View team attendance | Yes | Yes | Yes | No |
| View audit log | Yes | Yes | No | No |

## Tenant isolation rule

Every business query must include `tenantId`. Any endpoint that can expose cross-tenant data fails acceptance criteria.
