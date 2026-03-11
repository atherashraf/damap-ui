import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    List,
    ListItem,
    Typography,
    Link
} from "@mui/material";

export default function MapAdmin() {

    const items = {
        DCH: [
            { name: "Layer Info", href: "/LayerInfo" },
            { name: "Map Info", href: "/MapInfo" },
            { name: "Overlay testing", href: "/MapOverlays" },
            { name: "Customize Attributes Table", href: "/CustomizeAttributeTable" },
            { name: "Test IDW Layer", href: "/TestIDWLayer" },
            { name: "GIS Viewer", href: "/GISViewer" },
            { name: "Geoserver Test", href: "/GeoserverTest" }
        ],
    };

    return (
        <>
            {Object.keys(items).map((key) => (
                <Accordion
                    key={"accordion-" + key}
                    expanded={true}
                    sx={{
                        backgroundColor: "#2f2f2f",
                        color: "#ffffff",
                        mb: 1
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: "#ffffff" }} />}
                    >
                        <Typography
                            sx={{
                                fontSize: "18px",
                                fontWeight: 600,
                                fontFamily: "sans-serif"
                            }}
                        >
                            {key}
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                        <List>
                            {
                                //@ts-ignore
                                items[key].map((item: any) => (
                                    <ListItem key={item.name} sx={{ py: 0.5 }}>
                                        <Link
                                            href={item.href}
                                            underline="none"
                                            sx={{
                                                color: "#90caf9",
                                                fontSize: "1.3rem",
                                                "&:hover": {
                                                    color: "#42a5f5",
                                                    textDecoration: "underline"
                                                }
                                            }}
                                        >
                                            {item.name}
                                        </Link>
                                    </ListItem>
                                ))
                            }
                        </List>
                    </AccordionDetails>
                </Accordion>
            ))}
        </>
    );
}