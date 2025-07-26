# CRAFTIV App Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Navigation Structure](#navigation-structure)
3. [Authentication Screens](#authentication-screens)
4. [Drawer Screens](#drawer-screens)
5. [Tab Screens](#tab-screens-within-drawer)
6. [Other Screens](#other-screens)
7. [Contexts & State Management](#contexts--state-management)
8. [Notable Features](#notable-features)
9. [Assets & Constants](#assets--constants)
10. [API & Services](#api--services)

---

## Overview

CRAFTIV is a React Native app for creative design, featuring Canva-like tools, AI-powered design generation, Figma template import, and productivity utilities (timer, logs, achievements). It supports Google OAuth and email/password authentication.

---

## Navigation Structure

- **Drawer Navigation:** Main creative tools, profile, and utilities.
- **Tab Navigation (within Drawer):** Home, Explore, Projects, Settings.
- **Auth Stack:** Login and registration flows.

---

## Authentication Screens

### 1. `LogIn.tsx`

- **Features:**
  - Email/password login, input validation, simulated login, navigation to main app.
- **Props:** None (uses context and hooks).
- **UI Structure:**
  - TextInputs for email and password
  - Login button
  - Link to registration
  - Error messages

### 2. `LogIn2.tsx`

- **Features:**
  - Google OAuth login, token decoding, backend authentication, error handling.
- **Props:** None.
- **UI Structure:**
  - Google login button
  - Error messages
  - Back navigation

### 3. `SignUpfill.tsx`

- **Features:**
  - Email/password registration, field validation, password strength check, backend integration.
- **Props:** None.
- **UI Structure:**
  - TextInputs for first name, last name, email, password
  - Register button
  - Error messages
  - Back navigation

---

## Drawer Screens

### 1. `CreateScreen.tsx`

- **Features:**
  - Search bar, category tabs, create new section, templates, start creating button, photo/video section.
- **Props:** None.
- **UI Structure:**
  - Search bar (TextInput)
  - Horizontal scrollable tabs
  - Image cards for new creations
  - Templates section
  - Button to start creating
  - Photo/video cards

### 2. `YourStories.tsx`

- **Features:**
  - Displays saved stories/designs, preview, share, download, delete, restore.
- **Props:** None.
- **UI Structure:**
  - List of stories with preview thumbnails
  - Action buttons (share, download, delete, restore)

### 3. `TemplateEditScreen.tsx`

- **Features:**
  - Canva-like template editor, add/move/resize/delete shapes, text, images, color palette, font selection, undo/redo, save/export.
- **Props:** None.
- **UI Structure:**
  - Canvas area
  - Toolbox for shapes, text, images
  - Color and font pickers
  - Undo/redo, save, export buttons

### 4. `Profile.tsx`

- **Features:**
  - View/edit profile, stats, theme toggle, logout.
- **Props:** None.
- **UI Structure:**
  - Avatar and edit photo
  - Editable fields (name, email)
  - Stats display
  - Theme switch
  - Logout button

### 5. `CanvaDesignPage.tsx`

- **Features:**
  - Canvas-based design tool, add shapes/text/images, draw, undo/redo, export, color/font selection, toolbox.
- **Props:**
  - `hideHeader?: boolean`
  - `hideToolbar?: boolean`
- **UI Structure:**
  - Canvas
  - Toolbox (shapes, text, images, draw)
  - Color/font pickers
  - Export/save buttons

### 6. `MobileVideoScreen.tsx`

- **Features:**
  - Multi-frame video design, timeline navigation, play preview, export.
- **Props:** None.
- **UI Structure:**
  - Timeline of frames
  - Canvas for each frame
  - Toolbar for adding elements
  - Play/export buttons

### 7. `TShirtDesignScreen.tsx`

- **Features:**
  - T-shirt designer (front/back), draw, add images, change color, export.
- **Props:** None.
- **UI Structure:**
  - T-shirt canvas (front/back)
  - Color picker
  - Image picker
  - Draw/erase tools
  - Export button

### 8. `PresentationsScreen.tsx`

- **Features:**
  - Slide creation/editing, add/delete slides, set background, add text/images, preview mode.
- **Props:** None.
- **UI Structure:**
  - Slide navigation
  - Slide editor (title, body, image, background)
  - Add/delete/preview buttons

### 9. `AIDesignScreen.tsx`

- **Features:**
  - AI-powered design generation (text/voice prompt), voice recognition, navigation to CanvaDesignPage.
- **Props:** None.
- **UI Structure:**
  - Prompt input (TextInput)
  - Voice input button
  - Generate button
  - Error messages

### 10. `DocsEditor.tsx`

- **Features:**
  - Rich text editor, bold/color/font formatting, save as template, undo/redo, template gallery.
- **Props:** None.
- **UI Structure:**
  - TextInput for document
  - Formatting toolbar
  - Save as template button
  - Template gallery

### 11. `LogsScreen.tsx`

- **Features:**
  - Design activity logs, grouped by date, export/clear logs.
- **Props:** None.
- **UI Structure:**
  - List of logs by date
  - Export/clear buttons

### 12. `AchievementsScreen.tsx`

- **Features:**
  - Shows unlocked achievements, share/acknowledge.
- **Props:** None.
- **UI Structure:**
  - Achievement card
  - Share/OK buttons

### 13. `TimerScreen.tsx`

- **Features:**
  - Focus timer, start/pause/reset, add time, notification/sound, focus mode toggle.
- **Props:** None.
- **UI Structure:**
  - Timer display
  - Start/pause/reset/add time buttons
  - Focus mode switch

### 14. `Trash.tsx`

- **Features:**
  - Shows deleted items, restore/delete, empty trash.
- **Props:** None.
- **UI Structure:**
  - List of trashed items
  - Restore/delete/empty buttons

---

## Tab Screens (within Drawer)

### 1. `index.tsx` (Home)

- **Features:** Main dashboard/home (details depend on implementation).
- **Props:** None.
- **UI Structure:** Home content (customizable).

### 2. `explore.tsx`

- **Features:**
  - Fetches and displays Figma templates, preview/import, open in browser.
- **Props:** None.
- **UI Structure:**
  - List of Figma templates
  - Preview/import buttons

### 3. `projects.tsx`

- **Features:**
  - List/manage user projects (CRUD, details depend on implementation).
- **Props:** None.
- **UI Structure:**
  - List of projects
  - Project actions

### 4. `settings.tsx`

- **Features:**
  - User settings (theme, preferences, etc.).
- **Props:** None.
- **UI Structure:**
  - Settings options

---

## Other Screens

### 1. `Splash.tsx`

- **Features:** Initial splash/loading screen.
- **Props:** None.
- **UI Structure:** Splash image/logo.

### 2. `Menu.tsx`

- **Features:** Navigation/options menu (details depend on implementation).
- **Props:** None.
- **UI Structure:** Menu items.

---

## Contexts & State Management

- **AuthContext:** Authentication state, user info, login/logout.
- **DesignContext:** Design data, actions for design screens.
- **ThemeContext:** Theme (dark/light), color palette.

---

## Notable Features

- Google OAuth and email/password authentication.
- Canva-like design tools for images, videos, presentations, t-shirts.
- AI-powered design generation.
- Figma template import.
- Rich text document editor.
- Activity logs, achievements, and productivity timer.
- Trash/restore for deleted items.

---

## Assets & Constants

- **Assets:** Images, fonts, sounds in `assets/`.
- **Constants:** API keys, color palette in `constants/`.

---

## API & Services

- **API Client:** `constants/apiClient.ts` for backend requests.
- **Template Service:** `services/templateService.ts` for template management.

---

## How to Extend

- Add new screens to `(drawer)` or `(tabs)` as needed.
- Use contexts for shared state.
- Follow UI structure patterns for consistency.

---

*This documentation is auto-generated and should be updated as new features/screens are added.*
