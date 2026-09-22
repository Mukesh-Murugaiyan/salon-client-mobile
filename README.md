# Salon CRM — Mobile Application (React Native / Expo)

Cross-platform mobile client for the **Salon CRM / ERP Platform**, built with **React Native** and **Expo (SDK 57)**. This application provides salon owners, receptionists, and staff with attendance tracking via GPS geo-fencing, dashboard metrics, and a read-only view of today's appointment schedule.

---

## 1. Features & Scope

1. **Authentication (Login & Logout)**:
   - Dynamic role-based login (`SUPER_ADMIN`, `OWNER`, `RECEPTIONIST`).
   - Secure token and session persistence via **Expo SecureStore**.
   - Server-authoritative session resolution (`GET /api/auth/me`).
   - Quick-fill preset buttons for fast assessment testing.
2. **Salon Dashboard**:
   - **Today's Appointment Count**: Live count from `GET /api/dashboard/summary`.
   - **Subscription Status Card**: Live status badge (`ACTIVE` / `EXPIRED`), plan name, expiration date, and days remaining from backend (`GET /api/subscription/status`).
   - **Attendance Status Card**: Today's status ("Not Checked In" or "Checked in at HH:MM AM/PM") from `GET /api/attendance/today`.
   - **GPS Check-In Action**: Triggers device GPS acquisition and backend Haversine geo-fencing verification.
3. **Attendance Check-In (GPS & Geo-Fencing)**:
   - Obtains high-accuracy device coordinates via `expo-location`.
   - Submits `{ latitude, longitude }` to `POST /api/attendance/check-in`.
   - The backend performs server-side Haversine distance calculations and validates against the salon's configured allowed radius.
   - Comprehensive handling for permission denied, location services disabled, and 403 `OUT_OF_RANGE`.
4. **Today's Appointments (Read-Only)**:
   - Scoped strictly to today's date and the authenticated salon tenant (`GET /api/appointments?date=YYYY-MM-DD`).
   - Displays client name & contact, service name & price, assigned stylist, start/end time, notes, and appointment status (`CONFIRMED`, `PENDING`, `COMPLETED`, `CANCELLED`).
   - Includes pull-to-refresh, empty states, and network error handling.
5. **Security & Tenant Isolation**:
   - Zero client-side tenant selection. Tenant ID is bound strictly to the authenticated user's JWT.
   - Graceful 403 `SUBSCRIPTION_EXPIRED` alerting without application crashes.
   - Centralized Axios interceptor automatically redirects to Login upon 401 Unauthorized.

---

## 2. Architecture & File Structure

```text
salon-client-mobile/
├── app.json                     # Expo configuration & location config plugins
├── .env.example                 # Template for EXPO_PUBLIC_API_URL
├── .env                         # Environment variables
├── src/
│   ├── app/                     # Expo Router navigation
│   │   ├── _layout.tsx          # Root layout with AuthProvider & Stack
│   │   ├── index.tsx            # Auth state guard / router
│   │   ├── (auth)/
│   │   │   └── login.tsx        # Login screen with credentials presets
│   │   └── (app)/
│   │       ├── _layout.tsx      # Authenticated Stack navigation
│   │       ├── dashboard.tsx    # Dashboard with attendance & subscription
│   │       └── appointments.tsx # Today's appointments (Read-Only)
│   ├── config/
│   │   └── api.ts               # Platform-aware API base URL resolution
│   ├── context/
│   │   └── AuthContext.tsx      # Session state & SecureStore integration
│   ├── services/
│   │   ├── apiClient.ts         # Axios client with Auth & error interceptors
│   │   ├── authService.ts       # Login, profile, and logout API calls
│   │   ├── dashboardService.ts  # Summary and subscription APIs
│   │   ├── attendanceService.ts # Location checks and GPS check-in API
│   │   ├── appointmentService.ts# Today's appointments query API
│   │   └── storage.ts           # Expo SecureStore wrapper
│   └── types/                   # TypeScript interfaces (Auth, Dashboard, Appointments)
```

---

## 3. Prerequisites & Setup

### Prerequisites
- **Node.js** (v18+)
- **npm** or **bun**
- **Expo CLI** (`npx expo`)
- **Backend Service** running on port `5001` (`salon_server`)

### Installation
```bash
cd salon-client-mobile
npm install
```

---

## 4. API Base URL Configuration

The mobile app includes intelligent platform-aware API routing:
- **Android Emulator**: Defaults to `http://10.0.2.2:5001/api`
- **iOS Simulator / Web**: Defaults to `http://localhost:5001/api`
- **Physical Device (Expo Go)**: Connects to your computer's local IP address (e.g., `http://192.168.1.15:5001/api`)

### Setting Environment Variables
Create or edit `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

*(Note: You can also adjust the backend URL directly from the Login screen by tapping the server indicator at the bottom).*

---

## 5. Running the Application

### Start Development Server
```bash
npx expo start
```

### Run on Platforms:
- **Android Emulator**: Press `a` in the terminal or run `npm run android`
- **iOS Simulator**: Press `i` in the terminal or run `npm run ios`
- **Web Browser**: Press `w` in the terminal or run `npm run web`
- **Physical Device**: Scan the QR code using the **Expo Go** app (Android) or Camera app (iOS)

---

## 6. Required Location Permissions

The app requires foreground location permission to retrieve GPS coordinates for attendance check-in.

### Permissions configured in `app.json`:
```json
[
  "expo-location",
  {
    "locationAlwaysAndWhenInUsePermission": "Allow Salon CRM to access your location to verify attendance check-in."
  }
]
```

### Handled edge cases:
- **Permission Granted**: Coordinates retrieved and check-in API called.
- **Permission Denied**: Displays *"Location permission is required to check in."* (API is **not** called).
- **Location Services Disabled**: Displays *"Location services are disabled on your device. Please enable device location services to check in."*
- **Unable to Locate**: Displays *"Unable to get your current location. Please try again."* (No dummy coordinates are sent).

---

## 7. Test Credentials

The following credentials are configured in the backend database for testing:

| Role | Email | Password | Salon Assigned | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | `ownera@salon.com` | `Password@123` | Salon A | Full salon access, subscription view, attendance |
| **Receptionist** | `receptionista@salon.com` | `Password@123` | Salon A | Attendance check-in, today's appointments |
| **Super Admin** | `superadmin@salon.com` | `Admin@123` | Global | Platform overview & administrative scope |

*(Tip: On the Login screen, tap any of the "Quick Fill Test Credentials" chips to automatically fill these credentials).*

---

## 8. Verified Test Cases

- [x] **Login**:
  - Valid Owner login navigates to Dashboard.
  - Valid Receptionist login navigates to Dashboard.
  - Invalid credentials displays backend validation error.
  - Token persists across restarts via Expo SecureStore.
  - Logout clears token and redirects to Login.
- [x] **Dashboard**:
  - Today's appointment count loads from `GET /api/dashboard/summary`.
  - Subscription status loads (`ACTIVE` / `EXPIRED`), along with plan name and days remaining.
  - Attendance status loads ("Not Checked In" or "Checked In at HH:MM").
  - Pull-to-refresh updates all dashboard metrics.
- [x] **Attendance Check-In**:
  - Validates location services and requests permission.
  - Successfully checks in when inside allowed radius (`12.971598, 77.594562`).
  - Button disables and shows `[ Checked In ]` after successful check-in.
  - Returns `OUT_OF_RANGE` 403 when outside allowed radius with friendly message: *"You are outside the allowed salon location."*
  - Rejects duplicate check-ins (`DUPLICATE_CHECK_IN`).
- [x] **Today's Appointments**:
  - Displays list of appointments with client, service, stylist, time, and status.
  - Read-only display without edit or create controls.
  - Proper empty and error states.
- [x] **Tenant Isolation**:
  - Salon A users only see Salon A appointments.
  - Client never provides `salonId` in request bodies.

---

## 9. Known Limitations & Assumptions

1. **Expo Go Geolocation on Emulators**: Android emulators or iOS simulators require setting mock location points in emulator settings to simulate being inside or outside the salon radius.
2. **Read-Only Scope**: In strict accordance with assessment requirements, appointments cannot be created or edited from the mobile app. All CRM scheduling and subscription management is handled via the web application.
