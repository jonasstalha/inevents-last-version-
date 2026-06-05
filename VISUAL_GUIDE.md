# 🎯 Authentication System - Visual Guide

## 🎨 Screen Layouts

### 1. LOGIN SCREEN
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│                                 │
│  ✨ InEvents                    │
│  Your Creative Marketplace      │
│                                 │
│  Welcome Back! 👋               │
│  Sign in to continue            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  📧 Email Input                 │
│                                 │
│  🔒 Password Input              │
│                                 │
│         [Sign In Button]        │
│                                 │
│    Or continue with             │
│         [Google Button]         │
│                                 │
│  Don't have account? Sign Up    │
│                                 │
│  By continuing you agree to     │
│  Terms of Service & Privacy     │
│                                 │
└─────────────────────────────────┘
```

### 2. REGISTRATION - ROLE SELECTION
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│                                 │
│  Join Our Community ✨           │
│  Choose your role to get started │
│                                 │
├─────────────────────────────────┤
│  Choose Your Role               │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │   👤    │  │   🎨    │    │
│  │  Client │  │  Artist  │    │
│  │ Hire &  │  │ Sell &   │    │
│  │  Book   │  │  Earn    │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  Choose Auth Method             │
│  ┌──────────┐  ┌──────────┐    │
│  │📧 Email │  │ G Google │    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

### 3. REGISTRATION - EMAIL FORM
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│                                 │
│  Join Our Community ✨           │
│  Create your account to start    │
│                                 │
├─────────────────────────────────┤
│  👤 Full Name                   │
│  ┌─────────────────────────────┐│
│  │ Enter your full name        ││
│  └─────────────────────────────┘│
│                                 │
│  📧 Email Address               │
│  ┌─────────────────────────────┐│
│  │ you@example.com             ││
│  └─────────────────────────────┘│
│                                 │
│  🔒 Password                    │
│  ┌─────────────────────────────┐│
│  │ ••••••••                    ││
│  └─────────────────────────────┘│
│                                 │
│  🔒 Confirm Password            │
│  ┌─────────────────────────────┐│
│  │ ••••••••                    ││
│  └─────────────────────────────┘│
│                                 │
│  📱 Phone Number                │
│  ┌─────────────────────────────┐│
│  │ +1 (555) 123-4567          ││
│  └─────────────────────────────┘│
│                                 │
│      [Create Account Button]    │
│                                 │
└─────────────────────────────────┘
```

### 4. REGISTRATION - ARTIST PROFILE
```
┌─────────────────────────────────┐
│  ScrollView Content             │
├─────────────────────────────────┤
│                                 │
│  Business Details              │ (Artist Badge)
│                                 │
│  💼 Store Name                  │
│  ┌─────────────────────────────┐│
│  │ My Creative Studio          ││
│  └─────────────────────────────┘│
│                                 │
│  📍 City                        │
│  ┌─────────────────────────────┐│
│  │ New York, NY                ││
│  └─────────────────────────────┘│
│                                 │
│  Specialties (Add)              │
│  ┌─────────────────────────────┐│
│  │ 🎵 Music         [X]        ││
│  │ 🎨 Visual Arts   [X]        ││
│  │ 📸 Photography   [X]        ││
│  └─────────────────────────────┘│
│  3 of 5 categories selected     │
│                                 │
│      [Create Account Button]    │
│                                 │
└─────────────────────────────────┘
```

### 5. PHONE VERIFICATION MODAL
```
┌─────────────────────────────────┐
│  ✕ (Close)                      │
├─────────────────────────────────┤
│                                 │
│  Verify Your Phone             │
│  Enter the 6-digit code sent    │
│  to your phone                  │
│                                 │
│  ┌─────────────────────────────┐│
│  │  0 0 0 0 0 0               ││
│  └─────────────────────────────┘│
│                                 │
│      [Verify Code Button]       │
│                                 │
│  Didn't receive code?           │
│      Resend Code                │
│                                 │
└─────────────────────────────────┘
```

### 6. CATEGORY SELECTION MODAL
```
┌─────────────────────────────────┐
│  Select Specialties             │ [✕]
│  Choose your areas of expertise │
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐ ┌─────────┐       │
│  │ 🎵usicM │ │ 🎨Visual│       │
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ 🎭Perf. │ │ 💃Dance │       │
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ 📸Photog│ │ 👨‍🍳Culinary
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ 💻Digital│ │ 👗Fashion│      │
│  └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐       │
│  │ 🔨Crafts │ │ 📚Liter. │      │
│  └─────────┘ └─────────┘       │
│                                 │
├─────────────────────────────────┤
│  2 of 5 selected   [Done Button]│
│                                 │
└─────────────────────────────────┘
```

---

## 🎨 Component Layouts

### FloatingInput
```
┌─────────────────────────────────┐
│ Label (animated to top)         │
│ ┌───────────────────────────────┐
│ │ 📧 User input here...         │
│ └───────────────────────────────┘
│ ✗ Error message if any
└─────────────────────────────────┘
```

### EnhancedButton Variants
```
PRIMARY:        SECONDARY:      GOOGLE:         GHOST:
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ Sign In    │  │ Browse     │  │ Google →   │  │ Cancel     │
│ (Purple)   │  │ (Light)    │  │ (Outline)  │  │ (Outline)  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```

### RoleCard
```
INACTIVE:                   ACTIVE:
┌──────────────────────┐   ┌──────────────────────┐
│                      │   │ ✓ (Top right)       │
│      👤              │   │                      │
│                      │   │      👤              │
│     Client           │   │                      │
│  Hire & Book         │   │     Client           │
│                      │   │  Hire & Book         │
│ (White background)   │   │ (Purple gradient)    │
│                      │   │                      │
└──────────────────────┘   └──────────────────────┘
```

### CategoryChip
```
┌─────────────────────────────────┐
│ 🎵 Music                    [X] │
└─────────────────────────────────┘
```

---

## 🎯 User Journey Flow

### Email Signup Flow
```
                    Start Auth
                        ↓
            Role Selection Screen
                        ↓
        ┌───────────────┴────────────────┐
        ↓                                ↓
    Client Path                    Artist Path
        ↓                                ↓
  Email Form                       Email Form
        ↓                                ↓
        └─────────────┬────────────────┘
                      ↓
            Phone Verification
                      ↓
            SMS Code Input Modal
                      ↓
                 Verify Code
                      ↓
            ┌─────────┴─────────┐
            ↓                   ↓
        Client              Artist
        Dashboard         Dashboard
```

### Google Signup Flow
```
            Start Auth
                ↓
    Role Selection Screen
                ↓
    ┌───────────┴────────────┐
    ↓                        ↓
  Client                 Artist
    ↓                        ↓
 Google Button          Google Button
    ↓                        ↓
Google OAuth Popup
    ↓
 User Approves
    ↓
 Phone Input Form
    ↓
 Phone Verification
    ↓
 SMS Code Modal
    ↓
 Verify Code
    ↓
    ┌───────────┴────────────┐
    ↓                        ↓
Client               Artist (+ Profile)
Dashboard           Dashboard
```

---

## 🎨 Color System

### Primary Colors
```
#667eea ████ BRAND_PRIMARY (Purple)
#764ba2 ████ BRAND_SECONDARY (Dark Purple)
#f093fb ████ BRAND_ACCENT (Pink)
```

### Semantic Colors
```
#2ed573 ████ SUCCESS (Green) - ✓ Success messages
#ff4757 ████ ERROR (Red) - ✗ Error messages
#ffa502 ████ WARNING (Orange) - ! Warnings
```

### Grayscale
```
#ffffff ████ WHITE (Background)
#f8f9fa ████ LIGHT_GRAY (Surface)
#f0f0f0 ████ LIGHT_GRAY2 (Borders)
#999999 ████ MEDIUM_GRAY (Text)
#666666 ████ DARK_GRAY (Text)
#333333 ████ DARK_TEXT (Headings)
```

---

## 📊 State Transitions

### Form Validation States
```
INPUT:
Empty    →  [Field required error] ✗
Invalid  →  [Invalid format error] ✗
Valid    →  ✓ (Green highlight)

PASSWORD:
Mismatch →  [Passwords don't match] ✗
Match    →  ✓ (Green highlight)

PHONE:
Exists   →  [Already registered] ✗
Available → ✓ (Green highlight)
```

### Button States
```
NORMAL:         LOADING:        DISABLED:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Sign In  │    │ ○○○○○○○  │    │ Sign In  │
└──────────┘    └──────────┘    └──────────┘
(Clickable)     (Animating)     (Greyed out)
```

### Modal States
```
HIDDEN        ENTERING      VISIBLE       EXITING
(Invisible)   (Animating)   (Visible)     (Animating)
```

---

## 📱 Responsive Breakpoints

### Mobile (< 480px)
```
- Full width inputs
- Large touch targets (48pt)
- Single column layout
- Stacked cards
```

### Tablet (480px - 768px)
```
- Slightly wider inputs
- Two column grid for cards
- More padding
```

### Desktop (> 768px)
```
- Max width containers
- Two/three column layouts
- Larger spacing
```

---

## ♿ Accessibility Features

### Color Contrast
```
✓ Text vs Background: > 4.5:1 (AA standard)
✓ Button vs Background: > 3:1 (AA standard)
✓ Focus indicators: Visible borders
```

### Touch Targets
```
✓ Minimum 44pt x 44pt
✓ Adequate spacing (8pt min)
✓ Feedback on press
✓ No hover-only interactions
```

### Text
```
✓ Clear, readable font (16pt minimum)
✓ Good line height (1.5)
✓ Proper heading hierarchy
✓ Error messages visible
```

---

## 🔐 Security Indicators

### Safe Input
```
✓ Email validation
✓ Phone format check
✓ Password strength
✓ Confirmation match
```

### Database Checks
```
✓ Phone uniqueness query
✓ Email validation
✓ User existence check
```

### Error Messages
```
✓ Generic on purpose (no info leaks)
✓ User-friendly language
✓ Clear action items
✓ No sensitive data shown
```

---

## 📈 Performance Metrics

### Animations
```
✓ 200ms: Input focus animations
✓ 600ms: Screen transitions
✓ 1000ms: Initial fade-in
✓ useNativeDriver: ✓ Enabled
```

### Loading
```
✓ Show spinner immediately
✓ Disable button while loading
✓ Timeout after 30s
```

---

**Visual Guide Complete! Ready to build!** 🚀
