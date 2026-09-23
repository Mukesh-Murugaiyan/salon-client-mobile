# Salon CRM Mobile Client — React Native & Expo Architecture

A cross-platform mobile application built with **React Native, TypeScript, and Expo (SDK 57)** for the multi-tenant Salon ERP / CRM platform. Designed for salon owners, receptionists, and staff, this app delivers **stateless secure authentication**, **live dashboard metrics**, **server-authoritative GPS geo-fencing check-in**, and a **read-only schedule of today's appointments**.

---

## 1. System Architecture & Mobile Workflow

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                    MOBILE APPLICATION                  │
                               │                (React Native / Expo SDK 57)            │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                ┌──────────────────────────┴──────────────────────────┐
                                ▼                                                     ▼
                  ┌───────────────────────────┐                         ┌───────────────────────────┐
                  │    Authentication Flow    │                         │   Expo Router Navigation  │
                  │  - Login with Quick Fill  │                         │  - (auth)/login           │
                  │  - SecureStore Session    │                         │  - (app)/dashboard        │
                  │  - Session Restoration    │                         │  - (app)/appointments     │
                  └─────────────┬─────────────┘                         └─────────────┬─────────────┘
                                │                                                     │
                                └──────────────────────────┬──────────────────────────┘
                                                           │
                                ┌──────────────────────────┴──────────────────────────┐
                                ▼                                                     ▼
                  ┌───────────────────────────┐                         ┌───────────────────────────┐
                  │   Geo-Fencing Subsystem   │                         │  Operational Subsystems   │
                  │ - `expo-location` GPS     │                         │ - Live Dashboard Summary  │
                  │ - Haversine Distance Calc │                         │ - Live Subscription Card  │
                  │ - Contextual Units (m/km) │                         │ - Today's Appts (Read-Only│
                  │ - ExceededBy Calculation  │                         │ - Currency in INR (₹)     │
                  └─────────────┬─────────────┘                         └─────────────┬─────────────┘
                                │                                                     │
                                └──────────────────────────┬──────────────────────────┘
                                                           │ HTTPS Requests (Bearer JWT)
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BACKEND SERVER API (`salon_server`)                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • POST /api/v1/auth/login        • GET /api/v1/auth/me            • GET /api/v1/dashboard/summary           │
│ • GET  /api/v1/subscription      • GET /api/v1/attendance/today   • POST /api/v1/attendance/check-in        │
│ • GET  /api/v1/appointments?date=YYYY-MM-DD (Strictly scoped to authenticated tenant)                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Deep Dive: How the Mobile Client Works with Backend & Web

### 1. Stateless Authentication & Secure Persistence
- **Secure Token Storage**: The application persists JWT authentication tokens and cached user profiles using **Expo SecureStore** (hardware-backed Keychain on iOS and KeyStore on Android).
- **Session Auto-Restoration**: On app launch, `AuthContext` retrieves the stored token and validates it against `GET /api/v1/auth/me`. If valid, the user immediately enters the authenticated stack; if invalid or expired, the storage is wiped and the user is redirected to Login.
- **Centralized Axios Interceptor**: Automatically attaches `Authorization: Bearer <token>` to all requests and intercepts `401 Unauthorized` responses to clear sessions cleanly without crashing.

### 2. Live Dashboard & Operational Status
- **Today's Appointment Counter**: Fetches live booking count from `GET /api/v1/dashboard/summary`.
- **Subscription Status Card**:
  - Dynamically displays the salon's current subscription tier, active badge (`ACTIVE` / `EXPIRED`), end date, and remaining days.
  - Sourced directly from `GET /api/v1/subscription` or dashboard summary.
  - If the subscription expires, the card alerts the user with an `EXPIRED` badge and instructions to renew via the Web portal.
- **Daily Attendance Card**:
  - Sourced from `GET /api/v1/attendance/today`.
  - Displays today's state: either `"Not Checked In"` or `"Checked In at HH:MM AM/PM"`.

### 3. Server-Authoritative GPS Geo-Fencing & Attendance Check-In
The check-in engine enforces strict boundary and proximity validations:
1. **Device Permission Verification**:
   - Requests foreground location permissions using `expo-location`.
   - If denied, displays: *"Location permission is required to check in."*
   - If device location services are toggled off, displays: *"Location services are disabled on your device."*
2. **Coordinate Acquisition**:
   - Acquires current GPS coordinates with high accuracy (`Location.Accuracy.High`).
3. **Backend Haversine Verification**:
   - Sends `{ latitude, longitude }` to `POST /api/v1/attendance/check-in`.
   - The backend computes the spherical distance between device coordinates and the salon's configured coordinates.
4. **Contextual Distance Formatting & Boundary Feedback**:
   - **Inside Allowed Radius**: Returns HTTP 200. Check-in succeeds, recording timestamp and exact distance. The button transitions to `[ Checked In ]` and disables to prevent duplicate submissions.
   - **Outside Allowed Radius**: Returns HTTP 403 `OUT_OF_RANGE`. The mobile app displays:
     - Distance from salon (formatted contextually: `< 1,000m` in meters, `≥ 1,000m` in kilometers).
     - Configured allowed boundary radius.
     - Exact distance by which the user exceeds the boundary (`exceededBy`).
5. **Duplicate Check-In Protection**:
   - If an employee has already checked in today, the server returns `400 DUPLICATE_CHECK_IN`, and the mobile UI displays their recorded check-in timestamp.

### 4. Today's Appointments (Read-Only)
- **Strict Tenant & Date Isolation**: Queries `GET /api/v1/appointments?date=YYYY-MM-DD`. The server scopes the query exclusively to the authenticated user's `companyId` and today's calendar date.
- **Read-Only Invariant**: In strict accordance with the architecture, appointments cannot be created or modified on mobile. Front-desk staff and stylists have a clear, distraction-free view of their daily appointments.
- **Card Presentation**: Displays client name and contact, service name and duration, assigned stylist, start/end time, price in Indian Rupees (**₹**), and appointment status (`CONFIRMED`, `PENDING`, `COMPLETED`, `CANCELLED`).
- **Resilience**: Includes pull-to-refresh, empty states, and offline/network error banners.

---

## 3. Evaluator Test Credentials (Pre-Configured)

> **NOTE**: Dynamic test accounts are pre-configured in the database. Use the **Quick Fill Test Credentials** chips on the Login screen to fill any role with a single tap:

| Role | Email | Password | Salon Assigned | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | `owner@ecity.com` | `Password01*` | Salon A | Full salon access, live subscription metrics, attendance check-in |
| **Receptionist** | `receptionist@ecity.com` | `Password01*` | Salon A | Front-desk view, daily attendance check-in, today's appointments |
| **Super Admin** | `superadmin@salon.com` | `Password01*` | System Global | Platform administrative overview |

---

## 4. Setup & Running the Mobile Application

### Prerequisites
- Node.js (v18+)
- Backend service running on port `5001` (`salon_server`)
- Expo CLI (`npx expo`)

### Installation & Execution
```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Platform Options:
- **Web Browser**: Press `w` in terminal to launch in browser.
- **Android Emulator**: Press `a` in terminal or run `npm run android`.
- **iOS Simulator**: Press `i` in terminal or run `npm run ios`.
- **Physical Device**: Scan the QR code using the **Expo Go** app (Android) or Camera app (iOS).

### Platform-Aware Backend URL Configuration
The mobile app resolves the backend base URL automatically:
- **iOS Simulator / Web**: Defaults to `http://localhost:5001/api/v1`
- **Android Emulator**: Defaults to `http://10.0.2.2:5001/api/v1`
- **Physical Device (Expo Go)**: Tap the server connection indicator at the bottom of the Login screen to set your machine's LAN IP (e.g. `http://192.168.1.15:5001/api/v1`).

---

## 5. Automated Test Suite (30 Tests)

Run the automated test suite using the Node.js test runner:
```bash
npm test
```

### Verified Test Suites:
1. `test/distance.test.ts` (13 tests):
   - **Contextual Distance Formatting**: Formats `< 1,000m` in meters; `≥ 1,000m` in kilometers; supports imperial units (feet/miles); safely handles null/NaN.
   - **Haversine Formula**: Verifies identical coordinates yield 0m; verifies nearby point (~39m) and distant point (~5km); parses numeric string inputs; handles invalid inputs gracefully.
   - **Geofence Boundary & Exceeded Evaluation**: Accurately classifies points inside radius; center (0m); points slightly outside radius with exact exceeded amount; points far outside radius in kilometers.
2. `test/utils.test.ts` (17 tests):
   - **Currency Formatting**: Standardizes amounts in Indian Rupees (**₹**).
   - **Validation Utility**: Validates email formats, passwords, phone numbers, and coordinate ranges (-90..90, -180..180).
   - **String & Time Utilities**: 24h to 12h time conversion, duration calculations, date formatting, name initials, sensitive text masking.
