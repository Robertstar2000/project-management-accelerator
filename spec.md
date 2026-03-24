# Application Specification: MIFECO Hub - Auth & Landing Page

## Objective
Recreate the high-fidelity Authentication and Landing pages for the "MIFECO Hub" application. The design must adhere to a "Premium Technical/Cyberpunk" aesthetic with a focus on glassmorphism, neon accents, and high-density information display.

---

## 1. Aesthetic & Visual Identity

### Color Palette (Deep Slate & Neon)
- **Background**: Deep Slate (`#0f172a`) with radial gradients.
- **Primary Text**: Off-white (`#f8fafc`).
- **Secondary Text**: Muted Slate (`#94a3b8`).
- **Accents**: 
  - Indigo/Violet Gradient (`#6366f1` to `#8b5cf6`)
  - Cyan/Blue Gradient (`#06b6d4` to `#3b82f6`)
  - Neon Pink (`#ff00ff`) for high-priority actions.
- **Glassmorphism**: Semi-transparent cards (`rgba(30, 41, 59, 0.6)`) with subtle borders (`rgba(255, 255, 255, 0.08)`) and heavy backdrop-blur (20px).

### Typography
- **Display/Headings**: 'Space Grotesk' (Bold, tracking-tighter).
- **Body/UI**: 'Inter' (Medium/Regular).
- **Monospace**: For technical IDs and versioning.

---

## 2. Page Structure & Components

### A. Authentication Page (`AuthView`)
**Layout**: Full-screen split layout (50/50 on desktop, stacked on mobile).

#### Left Side: Hero/Information
- **Branding**: Large "MIFECO" title using a "Rainbow/Gradient" text effect.
- **Subtext**: "Project Acceleration Protocol" in tracked-out uppercase mono.
- **Feature List**: 5 numbered blocks (01-05) with neon-colored numbers (Cyan, Emerald, Amber, Pink, Red).
  - Each block has a bold title and a descriptive paragraph about AI-powered project management.
- **Background**: Subtle animated or static radial glows in the corners.

#### Right Side: Auth Form
- **Container**: Centered glassmorphism card.
- **Tabs**: "SIGN IN" and "SIGN UP" toggle with a sliding active state.
- **Form Fields**:
  - Labels: Tiny, uppercase, black-font, tracked-out (e.g., "EMAIL OR USERNAME").
  - Inputs: Dark slate background, rounded-2xl, subtle border that glows Cyan on focus.
- **Primary Button**: Large, white background, black text, font-black, uppercase. Hover state: Cyan background with scale effect.
- **Footer**: "Join waitlist for pro version" text button.
- **Versioning**: Absolute positioned footer text: "MIFECO © 2026 V4.03".

### B. Landing Page (`LandingPage`)
**Layout**: Centered, vertically stacked dashboard.

- **Welcome Header**: "Welcome, [Username]" with the username in a vibrant gradient.
- **Action Grid**: 2-column grid of large "Glass Cards".
  - **Card 1 (Active Projects)**: Folder icon, "ACTIVE PROJECTS" title, project count summary, "OPEN DATABASE" button.
  - **Card 2 (Create New)**: Sparkle icon, "CREATE NEW" title, "INITIATE PROTOCOL" button with Neon Pink border.
- **AI Configuration Section**: A wide glass card for "AI Engine Configuration".
  - Contains a password-masked input for the Gemini API Key.
  - "How to get a key" helper link that opens a modal with instructions.
- **System Status**: Footer with "V.5.0.0-VERIFIED | SYSTEM ONLINE".

---

## 3. Functional Requirements & Logic

### Authentication Logic
- **Sign In**: 
  - Endpoint: `POST /api/auth/login`
  - Payload: `{ emailOrUsername, password }`
  - Success: Store user object in `localStorage` under `hmap-current-user`.
- **Sign Up**:
  - Endpoint: `POST /api/auth/signup`
  - Payload: `{ username, email, password, geminiKey }`
  - Success: Automatically trigger login and redirect.
- **Persistence**: Remember email/username and password in `localStorage` (pre-fill on next visit).

### State Management
- **Auth State**: Use an `onAuthStateChanged` listener to toggle between `AuthView` and the main application.
- **Gemini Key**: The key should be synced between the user's database profile and `localStorage` (`hmap-gemini-api-key`).

---

## 4. Implementation Prompt for IDE

> "Build a React + Tailwind CSS application with a 'Cyberpunk Technical' aesthetic. 
> 
> 1. **Theme**: Use a deep slate background (`#0f172a`) with radial glows. Implement 'glassmorphism' for all cards (blur: 20px, semi-transparent slate background).
> 2. **Auth Page**: Create a split-screen view. The left side should feature a bold 'MIFECO' logo with a rainbow gradient and a numbered list of technical features. The right side should contain a centered glass card with 'Sign In' and 'Sign Up' tabs. Use rounded-2xl inputs and a high-contrast white action button.
> 3. **Landing Page**: Once authenticated, show a centered dashboard. Include a welcome message with gradient text and two large action cards ('Active Projects' and 'Create New'). Below the grid, add an 'AI Engine Configuration' card with a password input for an API key.
> 4. **Backend**: Assume an Express/SQLite backend. Implement `/api/auth/login` and `/api/auth/signup` endpoints. Passwords must be hashed.
> 5. **Typography**: Use 'Space Grotesk' for headers and 'Inter' for body text.
> 6. **Interactions**: Add subtle hover transforms (translateY) and focus glows to all interactive elements."
