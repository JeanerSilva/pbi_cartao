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
  private host: powerbi.extensibility.visual.IVisualHost;
  private root: HTMLDivElement;
  private list: HTMLElement;
  private settings!: VisualSettings; // será setado no update()
  private ctxMenu!: HTMLDivElement;
  private copyItem!: HTMLDivElement;
  private _lastContextTarget?: HTMLElement;

  constructor(options?: VisualConstructorOptions) {
  // Em runtime, o host passa opções válidas; isto é só para satisfazer o tipo do SDK
  this.host = (options?.host as any) ?? ({} as any);

  this.root = document.createElement("div");
  this.root.className = "cv-root";
  this.root.style.setProperty("--item-gap", "6px");
  this.root.style.setProperty("--item-padding", "4px");
  this.root.style.overflowY = "auto";
  this.root.style.overflowX = "hidden";
  this.root.style.userSelect = "text";

  // Context menu: deixa o do navegador, bloqueia o do host
  this.root.addEventListener(
    "contextmenu",
    (e) => {
      e.stopPropagation();
    },
    { capture: true }
  );

  ["click", "dblclick", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend"].forEach((evt) =>
    this.root.addEventListener(
      evt,
      (e) => {
        e.stopPropagation();
      },
      { capture: true }
    )
  );

  this.list = document.createElement("div");
  this.list.className = "cv-list";
  this.root.appendChild(this.list);

  // Se options existir, anexamos ao DOM do visual (normal)
  // Se não, seguimos sem anexar (apenas para satisfazer o tipo em build)
  options?.element?.appendChild?.(this.root);
}

  public update(options: VisualUpdateOptions) {
    const dataView = options.dataViews && options.dataViews[0];
    const viewport: IViewport = options.viewport;

    this.root.style.width = viewport.width + "px";
    this.root.style.height = viewport.height + "px";

    // ✅ SEMPRE parsear as configurações se houver dataView
    if (dataView) {
      this.settings = parseSettings(dataView);
    }

    // Se não há dados categóricos, renderiza “vazio” mas já com settings carregado
    if (!dataView || !dataView.categorical || !dataView.categorical.categories || dataView.categorical.categories.length === 0) {
      this.renderEmpty();
      return;
    }

    const category = dataView.categorical.categories[0];
    const values = category.values;

    // Leitura das configs (sem sobrescrever)
    const fontSize = ((this.settings?.text?.fontSize ?? 12)) + "px";
    const color = this.settings?.text?.color?.solid?.color || "#212121";
    const fontFamily = this.settings?.text?.fontFamily || "Segoe UI, Roboto, Arial, sans-serif";
    const align = this.settings?.text?.align || "left";

    const itemPadding = (this.settings?.layout?.padding ?? 4) + "px";
    const itemSpacing = this.settings?.layout?.itemSpacing ?? 6;
    const showBorder = !!this.settings?.layout?.showBorder;
    const borderColor = this.settings?.layout?.borderColor?.solid?.color || "#C8C8C8";

    // Limpa lista
    while (this.list.firstChild) this.list.removeChild(this.list.firstChild as Node);

    // Estilos base aplicados no container
    this.list.setAttribute("style", [
      `display:flex`,
      `flex-direction:column`,
      `gap:${itemSpacing}px`,
      `padding:${itemPadding}`,
      `font-family:${fontFamily}`,
      `color:${color}`,
      `text-align:${align}`,
      `font-size:${fontSize}`
    ].join(";"));

    // Render dos itens
    for (let i = 0; i < values.length; i++) {
      const text = values[i] == null ? "" : String(values[i]);
      const item = document.createElement("div");
      item.className = "cv-item";
      item.style.display = "block";
      item.style.lineHeight = "1.3";
      item.style.wordBreak = "break-word";
      item.style.borderWidth = "1px";
      item.style.borderStyle = "solid";
      item.style.borderColor = showBorder ? borderColor : "transparent";
      item.style.userSelect = "text";
      item.style.cursor = "text";

      item.textContent = text;
      this.list.appendChild(item);

      // Compatibilidade (edge/ie antigos)
      (item.style as any).webkitUserSelect = "text";
      (item.style as any).msUserSelect = "text";
    }
  }

  private renderEmpty() {
    while (this.list.firstChild) this.list.removeChild(this.list.firstChild as Node);
    const empty = document.createElement("div");
    empty.className = "cv-item cv-empty";
    empty.textContent = "Sem dados";
    empty.style.userSelect = "text";
    this.list.appendChild(empty);
  }

  public enumerateObjectInstances(
  options: EnumerateVisualObjectInstancesOptions
): VisualObjectInstance[] {
  const instances: VisualObjectInstance[] = [];
  const s = this.settings;

  if (options.objectName === "text") {
    instances.push({
      objectName: "text",
      properties: {
        fontSize: s?.text?.fontSize ?? 12,
        color: s?.text?.color ?? { solid: { color: "#212121" } },
        fontFamily: s?.text?.fontFamily ?? "Segoe UI, Roboto, Arial, sans-serif",
        align: s?.text?.align ?? "left",
      },
      // SDK exige 'selector'; para escopo do visual use undefined (hack seguro)
      selector: undefined as any,
    } as any);
  }

  if (options.objectName === "layout") {
    instances.push({
      objectName: "layout",
      properties: {
        padding: s?.layout?.padding ?? 4,
        itemSpacing: s?.layout?.itemSpacing ?? 6,
        showBorder: s?.layout?.showBorder ?? false,
        borderColor: s?.layout?.borderColor ?? { solid: { color: "#C8C8C8" } },
      },
      selector: undefined as any,
    } as any);
  }

  return instances;
} // <= fecha o método, não a classe
// (depois disto, só vem o fechamento da classe)
}