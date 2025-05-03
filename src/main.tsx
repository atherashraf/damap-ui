import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import {ThemeProvider, createTheme} from "@mui/material/styles";
import {Provider} from "react-redux";
import {store} from "@/store";


const theme = createTheme({
    palette: {
        mode: 'light', // or 'dark' if preferred
        primary: {
            main: '#1565c0',       // Strong Blue
            light: '#5e92f3',
            dark: '#003c8f',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#6f0000',       // Deep maroon (your requested color)
            light: '#9a1a1a',
            dark: '#450000',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
    },
    components: {
        MuiToolbar: {
            styleOverrides: {
                root: {
                    minHeight: '36px !important',
                },
            },
        },
    },
});

createRoot(document.getElementById("da-map")!).render(
    <StrictMode>
        <Provider store={store}> {/* ✅ Redux context is now available */}
            <BrowserRouter>
                <ThemeProvider theme={theme}>
                    <App/>
                </ThemeProvider>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
