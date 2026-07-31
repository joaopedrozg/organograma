declare module 'd3-org-chart' {
  export class OrgChart<T = any> {
    constructor();
    container(selector: string | HTMLElement): this;
    data(data: T[]): this;
    nodeId(fn: (d: T) => string | number): this;
    parentNodeId(fn: (d: T) => string | number | null | undefined): this;
    nodeWidth(fn: (node: any) => number): this;
    nodeHeight(fn: (node: any) => number): this;

    // Métodos de espaçamento declarados explicitamente:
    siblingsMargin(fn: (node?: any) => number): this;
    childrenMargin(fn: (node?: any) => number): this;
    compactMarginBetween(fn: (node?: any) => number): this;
    compactMarginPair(fn: (node?: any) => number): this;
    linkUpdate(fn: (d: any, i: number, arr: any[]) => void): this;
    neightborMargin(fn: (node?: any) => number): this;
    layout(direction: 'left' | 'right' | 'top' | 'bottom'): this;

    nodeContent(fn: (node: { data: T; [key: string]: any }) => string): this;
    render(): this;
    expandAll(): this;
    collapseAll(): this;
    fit(): this;
    zoomIn(): this;
    zoomOut(): this;
    [key: string]: any;
  }
}
