/**
 * This is subset of Swagger OpenAPI Specification: https://swagger.io/specification/
 * Defined only the parts swagger-to-axios need.
 */

interface Info {
  title: string;
  description?: string;
  version: string;
}

export interface Paths {
  [path: string]: PathItem;
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  parameters: (Parameter | Reference)[];
  requestBody: RequestBody | Reference;
  responses: Responses;
}

export interface RequestBody {
  content: {
    "application/json": MediaType;
    "text/json": MediaType;
  };
}

interface Responses {
  [httpStatusCode: string]: Response | Reference;
}

export interface Response {
  description: string;
  content: {
    "application/json": MediaType;
    "text/json": MediaType;
  };
}

interface MediaType {
  schema: Reference | Schema;
}

export interface Reference {
  $ref: string;
}

export interface Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description: string;
  schema: Schema | Reference;
}

interface BooleanSchema {
  type: "boolean";
  description: string;
}

interface IntegerSchema {
  type: "integer";
  format?: "int32" | "int64";
  enum?: number[];
}

interface NumberSchema {
  type: "number";
  format?: "float" | "double";
}

interface StringSchema {
  type: "string";
  format?: "byte" | "binary" | "date" | "date-time" | "password";
}

interface ArraySchema {
  type: "array";
  items: Schema | Reference;
  description: string;
}

interface ObjectSchema {
  type: "object";
  properties: Schema | Reference;
}

export type Schema =
  | BooleanSchema
  | IntegerSchema
  | NumberSchema
  | StringSchema
  | ArraySchema
  | ObjectSchema;

export interface Schemas {
  [key: string]: Schema | Reference;
}

interface Components {
  schemas: Schemas;
}

interface Tag {
  name: string;
  description?: string;
}

export interface OpenAPI {
  openapi: string;
  info: Info;
  paths: Paths;
  components: Components;
  tags: Tag[];
}
