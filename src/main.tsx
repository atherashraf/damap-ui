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
            main: '#3f543c',       // Strong Blue
            light: '#639865',
            dark: '#254222',
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
