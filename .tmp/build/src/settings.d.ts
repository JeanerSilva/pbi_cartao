import powerbi from "powerbi-visuals-api";
export declare function getValue<T>(objects: powerbi.DataViewObjects | undefined, objectName: string, propertyName: string, defaultValue: T): T;
export interface TextSettings {
    fontSize: number;
    color: powerbi.Fill;
    fontFamily: string;
    align: "left" | "center" | "right";
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
}
export declare function parseSettings(dataView: powerbi.DataView): VisualSettings;
