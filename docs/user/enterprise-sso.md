# Enterprise SSO Integration

HEP Companion supports enterprise Single Sign-On (SSO) through various identity providers, enabling seamless authentication for physical therapists at larger healthcare organizations.

## Supported Enterprise Identity Providers

- Microsoft Azure AD / Entra ID
- Okta
- OneLogin
- SAML 2.0 providers
- OIDC-compliant providers

## Integration Benefits

- **Simplified Login**: Users can access HEP Companion using their existing organizational credentials
- **Enhanced Security**: Leverage your organization's existing security policies, MFA, and access controls
- **Centralized User Management**: Control access to HEP Companion directly from your existing IAM solution
- **Automated Provisioning/Deprovisioning**: Users can be automatically added or removed when they join or leave your organization

## Implementation Guide

### 1. Azure AD / Microsoft Entra ID Integration

Azure AD is Microsoft's enterprise identity service that provides SSO and multi-factor authentication.

#### Configuration Steps

1. **Register HEP Companion in Azure AD**:
   - Navigate to the Azure Portal > Azure Active Directory > App registrations
   - Select "New registration"
   - Name the application "HEP Companion"
   - Set the redirect URI to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Select "Register"

2. **Configure Authentication**:
   - In your new app registration, go to "Authentication"
   - Enable ID tokens
   - Save changes

3. **Add HEP Companion to Azure Enterprise Applications**:
   - Go to Azure Active Directory > Enterprise applications
   - Find and select your registered HEP Companion application
   - Configure user assignment settings based on your organization's needs

4. **In HEP Companion Supabase Dashboard**:
   - Go to Authentication > Providers
   - Enable "Azure"
   - Enter the Client ID and Client Secret from your Azure AD app registration
   - Save changes

### 2. Okta Integration

Okta is a leading identity and access management service that can be used for SSO with HEP Companion.

#### Configuration Steps

1. **Add HEP Companion to Okta**:
   - Log in to your Okta admin dashboard
   - Go to Applications > Applications
   - Click "Add Application" and select "Create New App"
   - Select "Web" as the platform and "OpenID Connect" as the sign-on method
   - Name the application "HEP Companion"
   - Set the redirect URI to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

2. **Configure App Settings**:
   - Under "General Settings," configure the app as needed
   - Ensure the authorization server is properly set up
   - Assign the application to the appropriate user groups

3. **In HEP Companion Supabase Dashboard**:
   - Go to Authentication > Providers
   - Enable "OIDC" (for Okta)
   - Enter the Client ID and Client Secret from your Okta application
   - Set the Issuer URL from your Okta authorization server
   - Save changes

### 3. SAML 2.0 Integration

For organizations using other SAML 2.0 compliant identity providers.

#### Configuration Steps

1. **Configure Your Identity Provider**:
   - Set up a new SAML application in your IdP
   - Configure the Assertion Consumer Service (ACS) URL as:
     `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Set up the appropriate attribute mappings:
     - `email` → User's email
     - `given_name` → User's first name
     - `family_name` → User's last name

2. **In HEP Companion Supabase Dashboard**:
   - Go to Authentication > Providers
   - Enable "SAML 2.0"
   - Upload the IdP metadata XML file or enter the metadata URL
   - Configure attribute mappings to match your IdP settings
   - Save changes

## Clinic ID Mapping

For enterprise customers, we can automatically map Clinic IDs based on organizational information from the SSO provider:

1. **Azure AD**: Map to Department, Cost Center, or custom attribute
2. **Okta**: Use Profile or Group attributes
3. **SAML**: Configure custom SAML attributes to pass Clinic ID information

## User Provisioning

For automatic user provisioning, we support:

1. **SCIM 2.0**: System for Cross-domain Identity Management
2. **Just-in-time Provisioning**: Users are created upon first login
3. **Group-based Access Control**: Authorize based on IdP group membership

## Enterprise Support

For assistance with enterprise SSO implementation, contact our support team at support@hepcompanion.com or schedule a call with our implementation specialists.

## Security Considerations

1. **Identity Provider Security**: Ensure your IdP enforces strong authentication policies
2. **Role Assignment**: Configure appropriate role mappings between your IdP and HEP Companion
3. **Session Management**: Configure session timeout settings to match your organization's security policies
4. **Audit Logging**: SSO authentication events are recorded in the HEP Companion audit logs 