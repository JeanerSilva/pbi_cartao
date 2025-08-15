
  "use strict";

  import powerbi from "powerbi-visuals-api";
  import DataView = powerbi.DataView;
  import IViewport = powerbi.IViewport;
  import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
  import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
  import IVisual = powerbi.extensibility.visual.IVisual;
  import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
  import VisualObjectInstance = powerbi.VisualObjectInstance;

  import { parseSettings, VisualSettings } from "./settings";



  export class Visual implements IVisual {
    private root: HTMLElement;
    private list: HTMLElement;
    private settings: VisualSettings | undefined;
    private ctxMenu!: HTMLDivElement;
    private copyItem!: HTMLDivElement;
    private _lastContextTarget?: HTMLElement;
    

    constructor(options: VisualConstructorOptions | undefined) {
      
      this.root = document.createElement("div");
      this.root.className = "cv-root";
      this.root.style.setProperty("--item-gap", "6px");
      this.root.style.setProperty("--item-padding", "4px");
      this.root.style.overflowY = "auto";
      this.root.style.overflowX = "hidden";
      this.root.style.userSelect = "text";


      // Deixa o menu nativo do navegador e bloqueia o do host
      this.root.addEventListener("contextmenu", (e) => {
        e.stopPropagation(); // NÃO use preventDefault()
      }, { capture: true });

      // Bloqueia eventos que o host usa para "data point" (sem afetar seleção de texto)
      ["click","dblclick","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend"]
        .forEach(evt => this.root.addEventListener(evt, (e) => {
          e.stopPropagation();
        }, { capture: true }));

      this.list = document.createElement("div");
      this.list.className = "cv-list";
      this.root.appendChild(this.list);

      (options && options.element || document.body).appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
      const dataView = options.dataViews && options.dataViews[0];
      const viewport: IViewport = options.viewport;

      this.root.style.width = viewport.width + "px";
      this.root.style.height = viewport.height + "px";

      if (!dataView || !dataView.categorical || !dataView.categorical.categories || dataView.categorical.categories.length === 0) {
        this.renderEmpty();
        return;
      }

      // Configurações do painel de formato
      this.settings = parseSettings(dataView);

      const category = dataView.categorical.categories[0];
      const values = category.values;

      const fontSize = (this.settings.text.fontSize || 12) + "px";
      const color = this.settings.text.color?.solid?.color || "#212121";
      const fontFamily = this.settings.text.fontFamily || "Segoe UI, Roboto, Arial, sans-serif";
      const align = this.settings.text.align || "left";
      const itemPadding = (this.settings.layout.padding ?? 4) + "px";
      const itemGap = (this.settings.layout.itemSpacing ?? 6) + "px";
      const showBorder = !!this.settings.layout.showBorder;
      const borderColor = this.settings.layout.borderColor?.solid?.color || "transparent";

      this.root.style.setProperty("--item-gap", itemGap);
      this.root.style.setProperty("--item-padding", itemPadding);
      this.root.style.setProperty("--border-color", borderColor);
      (this.root.style as any).fontFamily = fontFamily;
      this.root.style.fontSize = fontSize;
      this.root.style.color = color;
      (this.root.style as any).textAlign = align as any;

      while (this.list.firstChild) { this.list.removeChild(this.list.firstChild as Node); }
      if (!values || values.length === 0) {
        this.renderEmpty();
        return;
      }

      for (let i = 0; i < values.length; i++) {
        const raw = values[i];

        // Normaliza quebras: \r\n / \n / \\n (texto “escapado”) e <br>
        let text = raw == null ? "" : String(raw);
        text = text
          .replace(/\r\n/g, "\n")
          .replace(/\\n/g, "\n")
          .replace(/<br\s*\/?>/gi, "\n");

        const item = document.createElement("div");
        item.className = "cv-item";

        // Garante que as quebras apareçam
        item.style.whiteSpace = "pre-wrap";
        item.style.wordBreak = "break-word";

        // (se tiver a opção de borda:)
        item.style.borderWidth = "1px";
        item.style.borderStyle = "solid";
        item.style.borderColor = showBorder ? borderColor : "transparent";

        // Permitir seleção de texto
        item.style.userSelect = "text";

        item.textContent = text;
        this.list.appendChild(item);

        item.style.cursor = "text";
        item.style.userSelect = "text";
        (item.style as any).webkitUserSelect = "text";
        (item.style as any).msUserSelect = "text";
      }
    }

    private renderEmpty() {
      while (this.list.firstChild) { this.list.removeChild(this.list.firstChild as Node); }
      const empty = document.createElement("div");
      empty.className = "cv-item cv-empty";
      empty.textContent = "Sem dados";
      this.list.appendChild(empty);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
      const instances: VisualObjectInstance[] = [];
      const s = this.settings;

      if (options.objectName === "text") {
        instances.push({
        objectName: "text",
        properties: {
          fontSize: s?.text.fontSize ?? 12,
          color: s?.text.color ?? { solid: { color: "#212121" } },
          fontFamily: s?.text.fontFamily ?? "Segoe UI, Roboto, Arial, sans-serif",
          align: s?.text.align ?? "left"
        },
        selector: {} as any
      } as any);
    }
      
      if (options.objectName === "layout") {
        instances.push({
        objectName: "layout",
        properties: {
          padding: s?.layout.padding ?? 4,
          itemSpacing: s?.layout.itemSpacing ?? 6,
          showBorder: s?.layout.showBorder ?? false,
          borderColor: s?.layout.borderColor ?? { solid: { color: "#C8C8C8" } }
        },
        selector: {} as any
      } as any);
          }
      return instances;
    }
  }
