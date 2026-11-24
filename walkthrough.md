# Security Summary

**Reviewed Files**: 14
**Issues Resolved**: 2

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Cross-Origin Mutation Guard | `server.ts` | 241 | Mutating endpoints (`POST /api/periods`, `DELETE /api/periods/:id`) accepted requests without verifying request origin against host. | Medium | Fixed | Added `verifySameOrigin` middleware for non-GET `/api` routes to reject cross-origin write requests with HTTP 403. |
| Security Response Headers | `server.ts` | 269 | Express responses included default `X-Powered-By` header and lacked `X-Content-Type-Options` / `Referrer-Policy`. | Low | Fixed | Disabled `x-powered-by` and added `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| API Keys & Secrets | `server.ts` | `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are read strictly from server `process.env`, never exposed to the browser or prefixed with `VITE_`. |
| Database Queries | `server.ts` | All reads and writes use parameterized Supabase SDK methods (`.eq()`, `.insert()`, `.upsert()`, `.delete()`) with UUID format validation and numeric range bounds. |
| Server-Side Aggregation | `server.ts` | Totals for students, classrooms, staffing counts, and deficit percentages are recalculated on the server rather than trusting client totals. |
| XSS & Safe Rendering | `src/components/*.tsx` | All school names, notes, and CSV text render through React text bindings with zero `dangerouslySetInnerHTML`. |
| Dependencies | `package.json` | Verified with `bun audit` across 270 packages with zero known vulnerabilities. |

> **Recommendation**: Before exposing write endpoints (`POST /api/periods`, `DELETE /api/periods/:id`) to external users on a public URL, add user sign-in (such as Supabase Auth with role verification) so only authorized personnel can upload or delete period snapshots.

## PoC Verification

### Cross-Origin Write Request Protection

#### Summary
| Field | Value |
|---|---|
| Issue Type | Cross-Origin Request Forgery on Mutating Endpoints |
| Impact | Medium |
| Affected File | `server.ts:241` |
| Test Scenario | `POST /api/periods` sent with spoofed `Origin: https://evil.example` against `Host: localhost:3000`. |

#### How It Was Fixed
Added `verifySameOrigin` middleware mounted on `/api` in `server.ts` that compares the parsed `Origin` host against `X-Forwarded-Host` / `Host` on all mutating HTTP methods.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `POST /api/periods` enters Express `/api` router (`server.ts:276`). | Invokes `verifySameOrigin` |
| 2 | `verifySameOrigin` (`server.ts:251-257`) parses `Origin` header (`evil.example`) and compares with `Host` (`localhost:3000`). | Mismatch detected |
| 3 | Middleware returns HTTP `403` JSON error before reaching route handler. | **Blocked Safely** |

#### Conclusion
**Fix Verified** - Cross-origin mutating requests to `/api/periods` and `/api/periods/:id` are rejected at the middleware boundary before touching Supabase.
