export interface Options {
  schemaNameMapper?: (name: string) => string;
  pathMapper?: (path: string) => string;
  pathToName: (pathArray: string[], tags?: string[]) => string;
}

export * from "./OpenAPI";
