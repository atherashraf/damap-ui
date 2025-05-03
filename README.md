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
VITE_MAP_ENDPOINT=     # leave empty
```

* Use this when your backend is hosted at a full domain URL (e.g., production on whhdrm.club).
* The app will use this URL directly for all API requests.

#### ✅ Option 2: Using Local Network or IP with Port and Endpoint

```env
VITE_MAP_URL=          # leave empty
VITE_MAP_PORT=8778
VITE_MAP_ENDPOINT=/api
```

* Use this in a **local/WAN setup** where only the port is known.
* The app constructs the URL as:

  ```
  http://<frontend-ip>:<port>/<endpoint>
  ```

> This ensures flexibility for both public access and internal network environments.

---

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

## 🗘️ Map Usage

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

Access the map’s ViewModel to interact with layers:

```tsx
import {useMapVM} from "@/components/map/toolbar/MapToolbarVMContext.tsx";
const mapVM =useMapVM();
mapVM.addDALayer({ uuid: selectedOption });
mapVM.zoomToFullExtent();
```

---

## 📊 Attribute Table API

Open the attribute table programmatically:

```ts
mapVM.openAttributeTable(columns, rows, pkCols, tableHeight, daGridRef, pivotTableSrc);
```

> See full documentation for column/row format and pivot options.

---

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
