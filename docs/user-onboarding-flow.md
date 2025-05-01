# User Onboarding Flow

## Authentication & Onboarding Journey

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Landing Page   │────▶│   Login Page    │────▶│ Authentication  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Main App      │◀────│  Review & Save  │◀────│   Onboarding    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Detailed Steps

### 1. User Authentication Options

Users can authenticate through multiple methods:

- **Google OAuth**: Single-click social login
- **Email/Password**: Traditional authentication
- **Magic Link**: Passwordless email login
- **Enterprise SSO**: For users at larger healthcare organizations

### 2. First-time User Flow

After successful authentication, new users are directed to a multi-step onboarding process:

#### Step 1: Profile Information
- Full Name
- Professional Role (Physical Therapist, Occupational Therapist, etc.)

#### Step 2: Practice Details
- Organization/Hospital/Clinic Name
- Clinic ID (for patient record association)

#### Step 3: Review & Confirmation
- Verify all entered information
- Complete setup

### 3. Returning User Flow

- Authenticated users with completed profiles are directed straight to the main application
- Users can update their profile information from the settings page at any time

## Enterprise SSO Implementation

For organizations using enterprise identity providers:

1. **Automatic Profile Creation**: User profiles are automatically created using information from the SSO provider
2. **Simplified Onboarding**: Some onboarding steps may be skipped if the necessary information is provided by the identity provider
3. **Organization-Based Settings**: Clinic ID can be automatically assigned based on organizational information

## Benefits of the Flow

- **User-Friendly**: Step-by-step flow prevents overwhelming new users
- **Progressive Information Collection**: Gathers only what's needed when it's relevant
- **Centralized Clinic Information**: Stores Clinic ID with user profile instead of requiring it for each interaction
- **Easy Updates**: Users can modify their information at any time through settings

## Data Storage & Security

- All user information is stored in the `profiles` table with Row-Level Security
- Each user can only view and edit their own profile
- Enterprise SSO information is handled securely through identity provider integrations
- Patient-specific information (MRN) is still collected per interaction and securely hashed 