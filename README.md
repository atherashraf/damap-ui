# DAMapUI

> Vite-based React UI for Digital Arz Maps. Built on top of OpenLayers and fully integrated with DigitalArzNode for map visualization, analysis, and interaction.

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install damap
```

### 2. Environment Variables

Create a `.env` file in the root of your project with one of the following configurations:

#### ✅ Option 1: Using Full Backend URL

```env
VITE_MAP_URL=https://yourdomain.com/api
VITE_MAP_PORT=         # leave empty
VITE_BING_MAPS_KEY=*********************************
VITE_APP_NAME=DAMap #or your App Name
```

* Use this when your backend is hosted at a full domain URL (e.g., production on whhdrm.club).
* The app will use this URL directly for all API requests.

#### ✅ Option 2: Using Local Network or IP with Port and Endpoint

```env
VITE_MAP_URL=          # leave empty
VITE_MAP_PORT=8778
VITE_BING_MAPS_KEY=*********************************
VITE_APP_NAME=DAMap #or your App Name
```

* Use this in a **local/WAN setup** where only the port is known.
---

## DAMap Architecture Model

The architecture of DAMap follows the MVVM (Model–View–ViewModel) design pattern, where:

- **View** consists of React components like `MapView`, `LeftDrawer`, `RightDrawer`, and `TimeSlider`.
- **ViewModel** is represented by the `MapVM` class, which manages map state, layer logic, interaction handling, and UI communication.
- **Model** includes the underlying `Map` object from OpenLayers and associated layers such as `BaseLayers`, `HighlightLayer`, and `DALayer`.

![DAMap Architecture Model](./readme_damap_architecture.png)


## 🧱 Folder Structure

```bash
damap-ui/
├── public/                      # Static assets
├── src/
│   ├── api/                     # API abstraction layer
│   ├── assets/                  # Images, icons, logos, etc.
│   ├── components/
│   │   ├── admin/               # Admin-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── base/                # Base/shared UI components (snackbar, dialogs, etc.)
│   │   ├── map/                 # Map-related components (MapView, drawers, tools)
│   │   └── styled/              # Styled MUI or layout components
│   ├── hooks/                   # Custom React hooks
│   ├── layouts/                 # Layout components
│   ├── pages/
│   │   └── admin/               # Admin pages like MapAdmin, LayerDesigner
│   ├── routes/                  # App routing setup
│   ├── services/                # Data fetching, service layers
│   ├── store/                   # Redux store config and slices
│   ├── types/                   # TypeScript declarations
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Root App component
│   └── index.tsx                # Main entry point
├── .env
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🗺️ Map View and Map View Model  Usage
### 🧱 Embed the MapView Component

Import and use the `MapView` component:

```tsx
import MapView from "@/components/map/MapView.tsx";

const mapRef = useRef();
const mapUUID = "your-map-uuid";

<MapView ref={mapRef} uuid={mapUUID} isMap={true}>
  <Appbar>
    <Button variant="contained">Custom Toolbar Button</Button>
  </Appbar>
</MapView>
```

### 🧠 Access the Map ViewModel
Use the useMapVM() hook (inside React components) or getMapVM() (outside) to interact with the map:



```tsx
import {useMapVM} from "@/components/map/model/MapVMContext.tsx";
const mapVM =useMapVM();
mapVM.addDALayer({ uuid: selectedOption });
mapVM.zoomToFullExtent();
```

---

## 🧩 Add New Button to Map Toolbar
The MapToolbar in the map interface supports dynamic extension, allowing developers to programmatically add new buttons—such as tools, toggles, or actions—to the toolbar from anywhere in the application.

To ensure the button is only added once, use a useRef() guard inside a useEffect().

ℹ️ Note: Use getMapVM() if you're outside React’s component tree (e.g., utility files). Use useMapVM() if you're inside a React component.
### ✅ Example (Using getMapVM() in React Lifecycle)
```tsx
import {useEffect, useRef} from "react";
import {IconButton, Tooltip} from "@mui/material";
import BuildIcon from '@mui/icons-material/Build'; // any icon you prefer
import {getMapVM} from "@/components/map/models/MapVMContext";

const buttonAdded = useRef(false);

useEffect(() => {
    const mapVM = getMapVM();

    if (!buttonAdded.current && mapVM?.getMapToolbar) {
        mapVM.getMapToolbar().addButton(
            <Tooltip title="Custom Tool">
                <IconButton onClick={() => alert("Custom action executed!")}>
                    <BuildIcon/>
                </IconButton>
            </Tooltip>
        );
        buttonAdded.current = true;
    }
}, []);
```
### 🔧 Built-in Toolbar Buttons 

In addition to custom buttons, the system comes with several built-in buttons that can be added dynamically via addButton(...) or by uncommenting them inside the MapToolbarContainer.

These components provide commonly used tools for interaction, layer management, and map control.

#### 🧰 Available Buttons

| Component                     | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `AddLayer`                    | Opens a dialog to add a new data layer (DALayer) to the map.        |
| `LayerSwitcherControl`        | Toggles visibility of individual layers.                            |
| `NavigationTreeControl`       | Displays a hierarchical tree of all map layers.                     |
| `Zoom2Extent`                 | Zooms the map to its full configured extent.                        |
| `RefreshMap`                  | Refreshes all data layers currently loaded on the map.              |
| `ClearSelection`              | Clears currently selected/highlighted features.                     |
| `Identifier`                  | Enables click-based identify tool to inspect feature attributes.    |
| `AttributeTableControl`       | Opens the attribute table for the currently selected layer.         |
| `CommentButton` ✅             | Opens the comment panel for user discussions or notes on layers.    |
| `SaveMap` 🔒                  | Saves the current map design (typically used in map designer mode). |
| `LOISelector` 🔍              | Lets users choose a Layer of Interest (LOI) from a dropdown.        |
| `SymbologyControl` 🎨         | Opens a symbology editor for changing layer style.                  |
| `RasterArea` 🖊️              | Enables polygon drawing for raster-based analysis or clipping.      |
| `AddClassificationSurface` 🌍 | Loads land classification or AI-based surfaces (like NDVI, LULC).   |

### 🧪 Example: Adding the Available Button Dynamically
```tsx 
import { useEffect, useRef } from "react";
import CommentButton from "@/components/map/toolbar/controls/CommentButton";
import { getMapVM } from "@/components/map/models/MapVMContext";

const commentBtnAdded = useRef(false);

useEffect(() => {
    const mapVM = getMapVM();
    if (!commentBtnAdded.current) {
        mapVM.getMapToolbar()?.addButton(<CommentButton />);
        commentBtnAdded.current = true;
    }
}, []);

```

## ⚙️ Admin Tools (Layer & Map Management)

To manage maps and layers inside DigitalArzNode:

```tsx
import "@/pages/LayerInfoAdmin";
<LayerInfoAdmin />

import "@/pages/MapInfo";
<MapInfo />
```

---

## 👨‍💻 Developed by

**Ather Ashraf**
Geospatial Data Scientist and AI Specialist

* 📧 Email: [atherashraf@gmail.com](mailto:atherashraf@gmail.com)
* 🌐 LinkedIn: [https://sa.linkedin.com/in/ather-ashraf](https://sa.linkedin.com/in/ather-ashraf)
* 📜 Google Scholar: [View Profile](https://scholar.google.com.pk/citations?user=XbqhyrsAAAAJ&hl=en)
* 📱 WhatsApp: +966557252342 | +923224785104

---
