import powerbi from "powerbi-visuals-api";

export interface TextSettings {
  fontSize: number;
  color: powerbi.Fill; // { solid: { color: string } }
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

export function getValue<T>(
  objects: powerbi.DataViewObjects | undefined,
  objectName: string,
  propertyName: string,
  defaultValue: T
): T {
  if (!objects) return defaultValue;
  const object = objects[objectName];
  const property = object && (object as any)[propertyName];
  if (property === null || property === undefined) return defaultValue;
  return property as T;
}

export function parseSettings(dataView: powerbi.DataView): VisualSettings {
  const objects = dataView?.metadata?.objects;

  const text: TextSettings = {
    fontSize: getValue<number>(objects, "text", "fontSize", 12),
    color: getValue<powerbi.Fill>(objects, "text", "color", { solid: { color: "#212121" } }),
    fontFamily: getValue<string>(objects, "text", "fontFamily", "Segoe UI, Roboto, Arial, sans-serif"),
    align: getValue<any>(objects, "text", "align", "left")
  };

  const layout: LayoutSettings = {
    padding: getValue<number>(objects, "layout", "padding", 4),
    itemSpacing: getValue<number>(objects, "layout", "itemSpacing", 6),
    showBorder: getValue<boolean>(objects, "layout", "showBorder", false),
    borderColor: getValue<powerbi.Fill>(objects, "layout", "borderColor", { solid: { color: "#C8C8C8" } })
  };

  return { text, layout };
}
