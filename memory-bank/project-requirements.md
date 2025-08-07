# Car Rental Tracking Application Requirements

## Overview
This document outlines the requirements for a car rental tracking application built with Angular 20 in zone-less mode. The application will allow a car rental company to track their vehicles on a map and manage vehicle information.

## Core Requirements

### Technical Stack
- Angular 20 (latest version)
- Zone-less implementation for improved performance
- AG Grid for data grid display
- Map integration for vehicle location tracking

### Features
1. **One-page Application**
   - Single page interface with responsive design

2. **Map Component**
   - Interactive map showing all car locations
   - Ability to select cars on the map
   - Real-time or periodic location updates

3. **Car Location Grid**
   - Implemented using AG Grid
   - Displays car information:
     - Car name
     - Car ID
     - Latitude
     - Longitude
   - Sorting and filtering capabilities
   - Positioned at the bottom of the page

4. **Search Functionality**
   - Search for cars by name, ID, or location
   - Quick filtering of the grid based on search terms

5. **Registration Component**
   - Form for registering cars to track
   - Minimizable interface
   - Draggable component
   - Positioned on the left side of the page

## User Experience
- Intuitive interface for tracking multiple vehicles
- Seamless interaction between map and grid components
- Responsive design for various screen sizes