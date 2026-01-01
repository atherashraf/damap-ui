# DAMapUI

> Vite-based React UI for Digital Arz Maps. Built on top of OpenLayers and fully integrated with DigitalArzNode for map visualization, analysis, and interaction.

---

## 🚀 Getting Started

### 1) Installation

```bash
npm install damap
```

Install peer dependencies:

```bash
npm install \
  react@^18.2.0 \
  react-dom@^18.2.0 \
  @emotion/react@^11.11.0 \
  @emotion/styled@^11.11.0 \
  @mui/material@^7.0.0 \
  @mui/icons-material@^7.0.0 \
  @mui/lab@^7.0.0-beta.12 \
  @mui/x-date-pickers@^8.3.1 \
  ol@^10.6.1 \
  ol-ext@^4.0.31

```

---

## 🔧 Configuration

### 2) Environment Variables

Create a `.env` file in your project root using **one** of the following options.

#### ✅ Option A: Full Backend URL (Production)

```env
VITE_MAP_URL=https://yourdomain.com
VITE_MAP_ENDPOINT=/api
VITE_MAP_PORT=
VITE_BING_MAPS_KEY=*********************************
VITE_APP_NAME=DAMap
```

#### ✅ Option B: Local / LAN with Port (Development)

```env
VITE_MAP_URL=
VITE_MAP_ENDPOINT=/api
VITE_MAP_PORT=8778
VITE_BING_MAPS_KEY=*********************************
VITE_APP_NAME=DAMap
```

---

### ⚙️ initDamap Configuration (Required)

DAMap requires runtime configuration before rendering `MapView`.

Rules:
- **Production** → use `mapUrl + endpoint`
- **Local/LAN** → use `mapPort + endpoint`

---

### Step 1: Create `damap.bootstrap.ts`

```ts
// src/damap.bootstrap.ts
import { initDamap } from 'damap';
import 'damap/damap.css';

initDamap({
  mapUrl: import.meta.env.VITE_MAP_URL,
  mapPort: import.meta.env.VITE_MAP_PORT,
  endpoint: import.meta.env.VITE_MAP_ENDPOINT,
});
```

---

### Step 2: Import bootstrap once

```tsx
// src/main.tsx or src/index.tsx
import './damap.bootstrap';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## 🗺️ MapView – Minimal Example

```tsx
import { Paper, AppBar, Toolbar, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MapView } from 'damap';

export default function App() {
  const theme = useTheme();

  return (<Paper elevation={3} sx={{ m: 0, height: '100%', overflow: 'auto' }}>
      <MapView uuid="-1" isMap theme={theme} height="100%">
        <AppBar position="static" color="secondary">
          <Toolbar variant="dense">
            <Button variant="contained">Custom Toolbar Button</Button>
          </Toolbar>
        </AppBar>
      </MapView>
    </Paper>
  );
}
```

---

## 🧠 DAMap Architecture (MVVM)

- **View**: MapView, Drawers, TimeSlider
- **ViewModel**: MapVM (logic + state)
- **Model**: OpenLayers Map & Layers

---

## 🧱 Using MapVM

```tsx
import { useMapVM } from 'damap';

const mapVM = useMapVM();
mapVM.addDALayer({ uuid: 'layer-uuid' });
mapVM.zoomToFullExtent();
```

---

## 🧰 Toolbar System

### Dynamic Toolbar Buttons

```tsx
<MapToolbarContainer
  mapVM={mapVM}
  dynamicButtons={[<MyCustomButton />]}
/>
```

---

## 🧾 Attribute Table – Custom Data

```tsx
mapVM.openCustomAttributeTable({
  columns: [
    { id: 'name', label: 'Name', type: 'string' },
    { id: 'age', label: 'Age', type: 'number' },
  ],
  rows: [
    { name: 'Ali', age: 20 },
    { name: 'Sara', age: 22 },
  ],
});
```

---

## ➕ Attribute Table Toolbar Buttons

```tsx
mapVM.addAttributeToolbarButton({
  id: 'export',
  slot: 'end',
  node: <Button size="small">Export</Button>,
});
```

Clear buttons:

```ts
mapVM.clearAttributeToolbarButtons();
```

⚠️ Call after opening Attribute Table.

---

## 🔧 Custom Tool System

```ts
mapVM.tools.activateCustomExclusive(
  'identify',
  (on) => {
    on('click', (evt) => {
      console.log(evt.coordinate);
    });
  },
  'crosshair'
);
```

---

## 🕒 Time Slider

```tsx
<TimeSlider ref={timeSliderRef} mapVM={mapVM} />
```

---

## 🔐 Authentication

```ts
AuthServices.isLoggedIn();
AuthServices.performLogin(token, refreshToken);
AuthServices.performLogout();
```

---

## 📚 Quick API Reference

### Core
- `initDamap(config)`
- `MapView`
- `MapVM`
- `useMapVM()`
- `getMapVM()`

### Layers
- `addDALayer()`
- `removeDALayer()`
- `SelectionLayer`
- `OverlayVectorLayer`

### Attribute Table
- `openAttributeTable()`
- `openCustomAttributeTable()`
- `addAttributeToolbarButton()`
- `clearAttributeToolbarButtons()`

### Tools
- `tools.activateCustomExclusive()`
- `tools.offCustomTool()`

### Utilities
- `showSnackbar()`
- `zoomToFullExtent()`

---

## 👨‍💻 Developed by

**Ather Ashraf**  
Geospatial Data Scientist & AI Specialist

📧 atherashraf@gmail.com  
🌐 https://sa.linkedin.com/in/ather-ashraf  
📱 +966557252342 | +923224785104
