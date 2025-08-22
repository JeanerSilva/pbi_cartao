import powerbi from "powerbi-visuals-api";
export interface TextSettings {
    fontSize: number;
    fontFamily: string;
    align: "left" | "center" | "right";
    color: powerbi.Fill;
}
export interface LayoutSettings {
    padding: number;
    itemSpacing: number;
    showBorder: boolean;
    borderColor: powerbi.Fill;
}
export interface VisualSettings {
    text: TextSettings;
    layout: LayoutSettings;
    color: powerbi.Fill;
}
export declare function getValue<T>(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: T): T;
export declare function parseSettings(dataView: powerbi.DataView): VisualSettings;
