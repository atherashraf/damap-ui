import KeyValueTable from "@/components/base/KeyValueTable";

interface IProps {
    feature: any
}

const CustomFeatureViewer = ({feature}: IProps) => {
    const properties = feature.getProperties();
    const { geometry, ...restProps } = properties; // Exclude geometry
    console.log("properties", properties)
    return(
        <>
            <KeyValueTable data={restProps} />
        </>
    )
}
export default CustomFeatureViewer;