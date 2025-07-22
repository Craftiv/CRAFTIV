# Changelog

All notable changes to the CRAFTIV Frontend Design App will be documented in this file.

## [Unreleased] - 2024-12-19

### Added
- **API Key Security**: Implemented secure API key management and removed remote API logic for templates
- **Local Template System**: Switched to local mock data for templates instead of remote API calls
- **Timer Integration**: Added timer quick-select behavior and improved input display
- **TimeGoalPopup**: Enhanced popup with better card heights and fixed mismatches in recent designs
- **Floating Toolbox Modal**: Implemented floating toolbox modal for CanvaDesignPage (later removed)
- **Bottom Button Group**: Added bottom button group for toolbox categories
- **Sound Integration**: Implemented sound and alert on timer completion with double sound playback
- **Voice Input**: Integrated voice input for AI design prompt using `@react-native-voice/voice`
- **Drawing Tools**: Added comprehensive drawing functionality with:
  - Pencil tool with customizable thickness
  - Eraser tool for removing drawn paths
  - Marker tool with opacity effects
  - Color picker for drawing tools
  - Real-time drawing with SVG Polyline
- **Shape Picker**: Enhanced shape picker component with:
  - Scrollable row layout for all shapes
  - Visible styling and improved modal positioning
  - Better z-index management to prevent overlap
  - Automatic return to select mode after shape placement
- **Background Color Tool**: Implemented background color functionality:
  - Context-aware color picker (shape vs canvas)
  - Automatic color picker display when tool is selected
  - Return to select mode after color selection
- **Image Tool**: Enhanced image functionality:
  - Auto-trigger image picker when Images tool is selected
  - Automatic return to select mode after image selection
- **Text Tool**: Improved text input system:
  - Floating text input box on canvas
  - Font size, font family, and color controls in popup
  - Automatic text placement and return to select mode
- **Font Controls**: Added comprehensive font management:
  - Font size picker with predefined sizes (12-72px)
  - Font family picker with system fonts
  - Text color picker integration
- **Element Options**: Added options modal for selected elements:
  - Bring to front/send to back functionality
  - Shape color modification
  - Image insertion into shapes
  - Text color modification

### Changed
- **Timer Behavior**: Adjusted timer quick-select to be more intuitive
- **UI Layout**: Improved card heights and fixed layout mismatches
- **Modal Positioning**: Adjusted shape picker modal to be less intrusive
- **Tool Selection**: Enhanced tool selection logic and visual feedback
- **Drawing System**: Switched from dynamic imports to direct imports for better compatibility
- **Color Picker**: Made color picker context-aware based on selection state
- **Text Input**: Changed text input to appear directly on canvas for better UX

### Fixed
- **TypeScript Errors**: Fixed multiple TypeScript compilation errors:
  - Added missing imports for `@react-native-community/slider`
  - Fixed missing properties in component interfaces
  - Added explicit type annotations where needed
- **Linter Errors**: Resolved ESLint warnings and errors throughout the codebase
- **Runtime Errors**: Fixed "Text strings must be rendered within a <Text> component" error
- **Drawing Visibility**: Fixed drawing tool visibility issues by allowing user color selection
- **Drawing Responsiveness**: Improved drawing tool responsiveness and path persistence
- **Polyline Component**: Resolved errors related to `Polyline` component by switching to direct imports
- **Web Compatibility**: Added web fallback for Polyline with appropriate message
- **Null Pointer Errors**: Added defensive checks to prevent null pointer errors on drawing paths
- **Modal Z-Index**: Fixed modal visibility issues by adjusting z-index values
- **Shape Selection**: Fixed logic for shape placement and selection after adding shapes
- **Color Picker Logic**: Fixed color picker target logic for different element types
- **Text Element Width**: Fixed text width calculation and updating
- **UI Layout Overlap**: Fixed bottom toolbar buttons being covered by toolbox by adjusting z-index values and positioning
- **Phone Navigation Overlap**: Moved toolbox up to avoid being covered by phone's navigation buttons/home indicator
- **Text Drag Issue**: Fixed issue where first drag after typing text would create a copy instead of dragging the existing text
  - Added proper state reset and timing controls
  - Fixed bounding box calculation for text elements
  - Added drag prevention during text input
  - Added debugging and conflict prevention

### Technical Improvements
- **Package Management**: Installed `@react-native-community/slider` for Slider component
- **Component Architecture**: Improved component structure and state management
- **Error Handling**: Added comprehensive error handling for user interactions
- **Performance**: Optimized rendering and state updates for better performance
- **Code Organization**: Better separation of concerns and component modularity

### Dependencies
- Added `@react-native-community/slider` for slider functionality
- Added `@react-native-voice/voice` for voice input features
- Removed `expo-notifications` due to compatibility warnings

### Documentation
- Updated component documentation and inline comments
- Added comprehensive error handling documentation
- Documented new feature usage and interactions

---

## [Previous Versions]
*Note: This changelog was created to track changes from this development session. Previous versions may have additional features not documented here.* 