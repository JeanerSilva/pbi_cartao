import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
export declare class Visual implements IVisual {
    private host;
    private root;
    private list;
    private settings;
    private ctxMenu;
    private copyItem;
    private _lastContextTarget?;
    constructor(options?: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private renderEmpty;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[];
}
