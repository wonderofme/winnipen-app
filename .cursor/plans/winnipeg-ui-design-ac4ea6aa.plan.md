<!-- ac4ea6aa-98e8-4990-9715-ef40a6acefc8 d1894675-e151-4b2f-976d-ef0e44d64b37 -->
# Winnipeg-Themed UI Design Overhaul

## Overview

Transform the app into a distinctly Winnipeg experience with full local branding, using Winnipeg Jets colors (navy blue #041E42, Jets blue #243959, white #FFFFFF, gold accent #C5A05C) and prairie-inspired design elements.

## Implementation Steps

### 1. Create Centralized Theme System

**File: `frontend/src/utils/theme.js` (NEW)**

- Define Winnipeg color palette (Jets navy, Jets blue, gold accent, prairie earth tones)
- Typography constants (clean, bold fonts for community feel)
- Spacing and border radius standards
- Shadow and elevation presets
- Winnipeg-specific constants (neighborhood names, local phrases)

### 2. Update Login/Splash Screen

**File: `frontend/src/screens/LoginScreen.js`**

- Replace generic blue (#3b82f6) with Jets navy (#041E42)
- Add "Welcome to Winnipeg's Community" tagline
- Use Jets blue for primary buttons
- Add subtle gradient background (navy to lighter blue)
- Update button styles to match Winnipeg theme

### 3. Redesign Map Screen

**File: `frontend/src/screens/MapScreen.js`**

- Control buttons: Jets navy background instead of white
- Active states: Gold accent (#C5A05C)
- Add "Winnipeg, MB" label to map
- Update pin colors: Jets blue for text, gold for images
- Map header with local neighborhood context

**File: `frontend/src/components/PostPin.js`**

- Blue pins: Jets blue (#243959)
- Image pins: Gold (#C5A05C)
- Add slight glow effect for visibility
- Larger pins with better contrast

### 4. Redesign Feed Screen

**File: `frontend/src/screens/FeedScreen.js`**

- Header: Jets navy background with white text
- "Winnipeg Feed" → "What's Happening in Winnipeg"
- Sort button: Gold accent when active
- Background: Light prairie beige (#F5F1E8)

**File: `frontend/src/components/PostCard.js`**

- Card borders: Subtle Jets blue accent on left side
- Like button: Jets blue when liked (instead of red)
- Comment icon: Gold accent
- Author names: Jets navy color
- Background: White cards on beige feed background

### 5. Update Post Detail Screen

**File: `frontend/src/screens/PostDetailScreen.js`**

- Like button: Jets blue heart
- Comment count: Gold accent
- Submit button: Jets blue background
- Header: Match theme colors

**File: `frontend/src/components/CommentItem.js`**

- Nested comments: Light Jets blue background
- Like icons: Jets blue
- Author names: Jets navy

### 6. Redesign Profile Screen

**File: `frontend/src/screens/ProfileScreen.js`**

- Stats cards: Jets navy background with white text
- Anonymous mode toggle: Jets blue when active
- Setting items: Gold accent icons
- Sign out button: Keep red but softer shade
- Profile header: Navy gradient

### 7. Update Create Post Modal

**File: `frontend/src/components/CreatePostModal.js`**

- Modal header: Jets navy
- Submit button: Jets blue
- Media buttons: Gold accent
- Cancel button: Subtle navy outline
- Location indicator: Gold pin icon

### 8. Add Local Winnipeg Touches

**Multiple Files**

- Replace generic location text with Winnipeg neighborhoods (St. Boniface, Osborne Village, The Forks, Exchange District, etc.)
- Add "Posted in [neighborhood]" based on coordinates
- Use local terminology: "Winnipeggers", "The Peg", "Winterpeg" (seasonal)
- Distance indicators: "Near The Forks", "Downtown Winnipeg"

### 9. Typography and Iconography

**All component files**

- Fontweight adjustments: Bolder headers (700) for strong presence
- Icon colors standardized: Jets navy primary, Jets blue secondary, gold accent
- Consistent spacing using theme constants

## Key Color Applications

- Primary Actions: Jets Blue (#243959)
- Backgrounds/Headers: Jets Navy (#041E42)
- Accents/Highlights: Gold (#C5A05C)
- Success/Active: Jets Blue
- Text Primary: Jets Navy
- Text Secondary: Gray (#6B7280)
- Background: Prairie Beige (#F5F1E8)

## Files to Modify

1. `frontend/src/utils/theme.js` - CREATE NEW
2. `frontend/src/screens/LoginScreen.js` - Color scheme, branding
3. `frontend/src/screens/MapScreen.js` - Controls, pins, headers
4. `frontend/src/components/PostPin.js` - Pin colors, size
5. `frontend/src/screens/FeedScreen.js` - Header, background, sort button
6. `frontend/src/components/PostCard.js` - Card design, colors
7. `frontend/src/screens/PostDetailScreen.js` - Actions, colors
8. `frontend/src/components/CommentItem.js` - Comment styling
9. `frontend/src/screens/ProfileScreen.js` - Profile layout, colors
10. `frontend/src/components/CreatePostModal.js` - Modal design

## Testing Checklist

- Verify color contrast for accessibility (WCAG AA)
- Test on both light and dark mode devices
- Ensure Jets colors are consistently applied
- Validate local neighborhood names display correctly
- Check that gold accents are visible but not overwhelming

### To-dos

- [ ] Create centralized Winnipeg theme system with Jets colors and constants
- [ ] Redesign login screen with Winnipeg branding and Jets colors
- [ ] Apply Winnipeg theme to map screen, controls, and pins
- [ ] Redesign feed screen with Winnipeg branding and prairie background
- [ ] Apply theme to post detail screen and comment components
- [ ] Redesign profile screen with Jets navy and gold accents
- [ ] Apply theme to create post modal
- [ ] Add Winnipeg neighborhood names and local terminology throughout