"use strict";

import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;

import { parseSettings, VisualSettings } from "./settings";

export class Visual implements IVisual {
  private target: HTMLElement;
  private updateCount: number;
  private settings: VisualSettings = {} as VisualSettings;
  private list: HTMLElement;
  private host: IVisualHost | undefined;

  constructor(options?: VisualConstructorOptions) {
    console.log('Visual constructor', options);
    this.host = options?.host;
    this.target = options?.element || document.createElement("div");
    this.updateCount = 0;
    if (document) {
      const newDiv: HTMLElement = document.createElement("div");
      newDiv.className = "rcv-visual";
      this.list = document.createElement("div");
      this.list.className = "cv-list";
      newDiv.appendChild(this.list);
      this.target.appendChild(newDiv);
    } else {
      // Fallback for document not being available (e.g., during testing or non-browser environments)
      this.list = {} as HTMLElement;
    }
  }

  public update(options: VisualUpdateOptions) {
    this.settings = parseSettings(options.dataViews[0]);
    console.log('Visual update', options);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }
    let values: any[] = [];
    let category;

    if (options.dataViews && options.dataViews[0] && options.dataViews[0].categorical && options.dataViews[0].categorical.categories && options.dataViews[0].categorical.categories[0].values) {
      category = options.dataViews[0].categorical.categories[0];
      values = options.dataViews[0].categorical.categories[0].values;
    }

    const textSettings = this.settings.text;
    const layoutSettings = this.settings.layout;
    const colorSettings = this.settings.color;

    let listStyle = `
      padding: ${layoutSettings.padding}px;
      background-color: ${colorSettings?.solid?.color || "transparent"};
      border: ${layoutSettings.showBorder ? `1px solid ${layoutSettings.borderColor?.solid?.color || "#C8C8C8"}` : "none"};
    `;
    this.list.setAttribute("style", listStyle);

    // Render dos itens
    for (let i = 0; i < values.length; i++) {
      const text = values[i] == null ? "" : String(values[i]);
      const item = document.createElement("div");
      item.className = "cv-item";
      item.style.fontSize = textSettings.fontSize + "pt";
      item.style.fontFamily = textSettings.fontFamily;
      item.style.textAlign = textSettings.align as any; // Ensure textAlign is applied from settings
      item.style.color = textSettings.color?.solid?.color || "#212121";
      item.style.marginBottom = layoutSettings.itemSpacing + "px";
      item.textContent = text;
      this.list.appendChild(item);

      // Compatibilidade (edge/ie antigos)
      (item.style as any).webkitUserSelect = "text";
      (item.style as any).msUserSelect = "text";
    }
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    const textSlices: powerbi.visuals.SimpleVisualFormattingSlice[] = [
      {
        uid: "fontSize_uid",
        displayName: "Tamanho da fonte",
        control: {
          type: powerbi.visuals.FormattingComponent.NumUpDown,
          properties: {
            descriptor: { objectName: "text", propertyName: "fontSize" },
            value: this.settings?.text?.fontSize
          }
        }
      } as any,
      {
        uid: "textColor_uid",
        displayName: "Cor do texto",
        control: {
          type: powerbi.visuals.FormattingComponent.ColorPicker,
          properties: {
            descriptor: { objectName: "text", propertyName: "color" },
            value: { value: this.settings?.text?.color?.solid?.color || "#212121" }
          }
        }
      } as any,
      {
        uid: "fontFamily_uid",
        displayName: "Fonte",
        control: {
          type: powerbi.visuals.FormattingComponent.FontPicker,
          properties: {
            descriptor: { objectName: "text", propertyName: "fontFamily" },
            value: this.settings?.text?.fontFamily
          }
        }
      } as any,
      {
        uid: "align_uid",
        displayName: "Alinhamento",
        control: {
          type: powerbi.visuals.FormattingComponent.AlignmentGroup,
          properties: {
            descriptor: { objectName: "text", propertyName: "align" },
            value: this.settings?.text?.align,
            mode: powerbi.visuals.AlignmentGroupMode.Horizonal
          }
        }
      } as any
    ];

    const textGroup: powerbi.visuals.FormattingGroup = {
      displayName: "Formato",
      slices: textSlices,
      uid: "textGroup_uid"
    } as any;

    const textCard: powerbi.visuals.FormattingCard = {
      displayName: "Texto",
      groups: [textGroup],
      uid: "textCard_uid"
    } as any;

    const layoutSlices: powerbi.visuals.SimpleVisualFormattingSlice[] = [
      {
        uid: "padding_uid",
        displayName: "Padding",
        control: {
          type: powerbi.visuals.FormattingComponent.NumUpDown,
          properties: {
            descriptor: { objectName: "layout", propertyName: "padding" },
            value: this.settings?.layout?.padding
          }
        }
      } as any,
      {
        uid: "itemSpacing_uid",
        displayName: "Espaçamento entre itens",
        control: {
          type: powerbi.visuals.FormattingComponent.NumUpDown,
          properties: {
            descriptor: { objectName: "layout", propertyName: "itemSpacing" },
            value: this.settings?.layout?.itemSpacing
          }
        }
      } as any,
      {
        uid: "showBorder_uid",
        displayName: "Borda",
        control: {
          type: powerbi.visuals.FormattingComponent.ToggleSwitch,
          properties: {
            descriptor: { objectName: "layout", propertyName: "showBorder" },
            value: this.settings?.layout?.showBorder
          }
        }
      } as any,
      {
        uid: "borderColor_uid",
        displayName: "Cor da borda",
        control: {
          type: powerbi.visuals.FormattingComponent.ColorPicker,
          properties: {
            descriptor: { objectName: "layout", propertyName: "borderColor" },
            value: { value: this.settings?.layout?.borderColor?.solid?.color || "#C8C8C8" }
          }
        }
      } as any
    ];

    const layoutGroup: powerbi.visuals.FormattingGroup = {
      displayName: "Configurações de Layout",
      slices: layoutSlices,
      uid: "layoutGroup_uid"
    } as any;

    const layoutCard: powerbi.visuals.FormattingCard = {
      displayName: "Layout",
      groups: [layoutGroup],
      uid: "layoutCard_uid"
    } as any;

    const colorSlices: powerbi.visuals.SimpleVisualFormattingSlice[] = [
      {
        uid: "defaultColor_uid",
        displayName: "Cor",
        control: {
          type: powerbi.visuals.FormattingComponent.ColorPicker,
          properties: {
            descriptor: { objectName: "color", propertyName: "default" },
            value: { value: this.settings?.color?.solid?.color || "#212121" }
          }
        }
      } as any
    ];

    const colorGroup: powerbi.visuals.FormattingGroup = {
      displayName: "Cor",
      slices: colorSlices,
      uid: "colorGroup_uid"
    } as any;

    const colorCard: powerbi.visuals.FormattingCard = {
      displayName: "Cor",
      groups: [colorGroup],
      uid: "colorCard_uid"
    } as any;

    const formattingModel: powerbi.visuals.FormattingModel = {
      cards: [textCard, layoutCard, colorCard]
    } as any;

    return formattingModel;
  }
}