import React, { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { DASnackbarHandle } from "@/components/base/DASnackbar";
import MapApi, { MapAPIs } from "@/api/MapApi";

interface IProps {
    snackbarRef: React.RefObject<DASnackbarHandle | null>;
    handleBack: () => void;
    onConnectionAdded: () => void;
}

const AddDBConnectionForm = ({
                                 snackbarRef,
                                 handleBack,
                                 onConnectionAdded,
                             }: IProps) => {
    const [connectionName, setConnectionName] = useState("");
    const [host, setHost] = useState("");
    const [port, setPort] = useState("5432");
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [dbName, setDbName] = useState("");
    const [testing, setTesting] = useState(false);

    const mapApi = new MapApi(snackbarRef);

    const payload = {
        connection_name: connectionName,
        engine: "postgresql",
        params: {
            host,
            user,
            password,
            name: dbName,
            port,
        },
    };

    const handleSubmit = async () => {
        const res = await mapApi.post(MapAPIs.DCH_ADD_DB_CONNECTION, payload);
        if (res?.success) {
            snackbarRef.current?.show(
                res.msg || "Database connection added successfully."
            );
            onConnectionAdded();
            handleBack();
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const res = await mapApi.post(MapAPIs.DCH_TEST_DB_CONNECTION, payload);
            if (res?.success) {
                snackbarRef.current?.show(res.msg || "Connection is valid.");
            }
        } catch (err) {
            snackbarRef.current?.show("Connection failed. Check details.", "error");
        } finally {
            setTesting(false);
        }
    };

    const isFormValid =
        connectionName && host && port && user && password && dbName;

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
                Add New PostGIS Connection
            </Typography>

            <TextField fullWidth label="Connection Name" value={connectionName}
                       onChange={(e) => setConnectionName(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Host" value={host}
                       onChange={(e) => setHost(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Port" value={port}
                       onChange={(e) => setPort(e.target.value)} margin="normal" required />
            <TextField fullWidth label="User" value={user}
                       onChange={(e) => setUser(e.target.value)} margin="normal" required />
            <TextField fullWidth type="password" label="Password" value={password}
                       onChange={(e) => setPassword(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Database Name" value={dbName}
                       onChange={(e) => setDbName(e.target.value)} margin="normal" required />

            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={handleBack}>
                    Cancel
                </Button>
                <Box>
                    <Button
                        sx={{ mr: 2 }}
                        variant="outlined"
                        onClick={handleTestConnection}
                        disabled={!isFormValid || testing}
                    >
                        {testing ? <CircularProgress size={20} /> : "Test Connection"}
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={!isFormValid}>
                        Save Connection
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AddDBConnectionForm;
