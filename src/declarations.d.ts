declare module "*properties-geocoded.jsonl" {
    const value: GeocodedProperty[];
    export default value;
}

declare module "*.jsonl" {
    const value: unknown[];
    export default value;
}
