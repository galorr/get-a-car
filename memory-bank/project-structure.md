# Car Rental Tracking Application - Project Structure

## Directory Structure

```
car-rental-tracker/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── map.component.ts
│   │   │   │   ├── map.component.html
│   │   │   │   └── map.component.scss
│   │   │   ├── car-grid/
│   │   │   │   ├── car-grid.component.ts
│   │   │   │   ├── car-grid.component.html
│   │   │   │   └── car-grid.component.scss
│   │   │   ├── registration/
│   │   │   │   ├── registration.component.ts
│   │   │   │   ├── registration.component.html
│   │   │   │   └── registration.component.scss
│   │   │   └── search/
│   │   │       ├── search.component.ts
│   │   │       ├── search.component.html
│   │   │       └── search.component.scss
│   │   ├── models/
│   │   │   ├── car.model.ts
│   │   │   └── user.model.ts
│   │   ├── services/
│   │   │   ├── car-data.service.ts
│   │   │   ├── map.service.ts
│   │   │   └── registration.service.ts
│   │   ├── shared/
│   │   │   ├── directives/
│   │   │   │   └── draggable.directive.ts
│   │   │   ├── pipes/
│   │   │   │   └── location-format.pipe.ts
│   │   │   └── utils/
│   │   │       └── geo-utils.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── images/
│   │   │   └── car-marker.png
│   │   └── mock-data/
│   │       └── cars.json
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   └── global.scss
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Key Files Description

### Core Application Files

- **main.ts**: Entry point for the application, configures zone-less bootstrapping
- **app.component.ts**: Root component that defines the main layout
- **app.config.ts**: Application configuration including providers and dependencies
- **app.routes.ts**: Route definitions (if needed for future expansion)

### Components

#### Map Component
- **map.component.ts**: Implements the map display with car markers
- **map.component.html**: Template for the map view
- **map.component.scss**: Styles specific to the map component

#### Car Grid Component
- **car-grid.component.ts**: Implements AG Grid for displaying car data
- **car-grid.component.html**: Template for the grid view
- **car-grid.component.scss**: Styles specific to the grid component

#### Registration Component
- **registration.component.ts**: Implements the draggable and minimizable registration panel
- **registration.component.html**: Template with the registration form
- **registration.component.scss**: Styles for the registration panel

#### Search Component
- **search.component.ts**: Implements the search functionality
- **search.component.html**: Template with search input
- **search.component.scss**: Styles for the search component

### Models

- **car.model.ts**: Defines the Car interface and related types
- **user.model.ts**: Defines the User interface for registration

### Services

- **car-data.service.ts**: Manages car data and provides signals for reactive updates
- **map.service.ts**: Handles map-specific operations
- **registration.service.ts**: Manages user registration and car assignment

### Shared

- **draggable.directive.ts**: Custom directive for draggable elements
- **location-format.pipe.ts**: Pipe for formatting location coordinates
- **geo-utils.ts**: Utility functions for geolocation calculations

### Configuration

- **environment.ts**: Environment configuration for development
- **environment.prod.ts**: Environment configuration for production
- **angular.json**: Angular CLI configuration
- **package.json**: Project dependencies and scripts
- **tsconfig.json**: TypeScript configuration

## Dependencies

The project will require the following key dependencies:

```json
{
  "dependencies": {
    "@angular/animations": "^20.0.0",
    "@angular/cdk": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/compiler": "^20.0.0",
    "@angular/core": "^20.0.0",
    "@angular/forms": "^20.0.0",
    "@angular/platform-browser": "^20.0.0",
    "@angular/platform-browser-dynamic": "^20.0.0",
    "@angular/router": "^20.0.0",
    "ag-grid-angular": "^31.0.0",
    "ag-grid-community": "^31.0.0",
    "leaflet": "^1.9.4",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.0.0",
    "@angular/cli": "^20.0.0",
    "@angular/compiler-cli": "^20.0.0",
    "@types/jasmine": "~4.3.0",
    "@types/leaflet": "^1.9.8",
    "jasmine-core": "~4.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.3.2"
  }
}
```

## Implementation Strategy

1. **Initial Setup**
   - Create the Angular project with zone-less configuration
   - Set up the basic project structure
   - Install required dependencies

2. **Core Components**
   - Implement the app component with the main layout
   - Create skeleton implementations of all components

3. **Data Layer**
   - Implement models and services
   - Create mock data for development

4. **Feature Implementation**
   - Implement the map component with Leaflet integration
   - Implement the car grid component with AG Grid
   - Implement the registration component with drag functionality
   - Implement the search component

5. **Integration**
   - Connect components through services
   - Implement state management with signals
   - Ensure proper data flow between components

6. **Styling and Responsive Design**
   - Implement the responsive layout
   - Style components according to design requirements
   - Ensure proper display on various screen sizes

7. **Testing and Optimization**
   - Test with various data loads
   - Optimize performance for large datasets
   - Ensure smooth interactions between components