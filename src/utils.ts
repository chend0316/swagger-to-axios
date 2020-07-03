import {
  Schema,
  Paths,
  Reference,
  Options,
  Operation,
  RequestBody,
  Parameter,
} from "./types";

export function transformObjectProperties(
  obj: { [key: string]: any },
  options: Options
): string {
  let output = "";

  Object.entries(obj).forEach(([key, value]) => {
    if (value.description) {
      output += `/* ${value.description.trim()} */\n`;
    }
    output += `"${key}": `;
    output += transformSchema(value, options);
    output += ";\n";
  });

  return output;
}

export function transformSchema(
  node: Schema | Reference,
  options: Options
): string {
  if ("$ref" in node) {
    return transformReference(node.$ref, options);
  } else if (node.type === "boolean") {
    return "boolean";
  } else if (node.type === "integer") {
    if (node.enum) {
      return `(${node.enum.join(" | ")})`;
    } else {
      return "number";
    }
  } else if (node.type === "number") {
    return "number";
  } else if (node.type === "string") {
    return "string";
  } else if (node.type === "array") {
    return `${transformSchema(node.items, options)}[]`;
  } else if (node.type === "object") {
    if (!node.properties || !Object.keys(node.properties).length) {
      return "undefined"; // todo: 抛异常？
    }

    return `{ ${transformObjectProperties(node.properties, options)} }`;
  }

  return "";
}

export function transformReference(ref: string, options: Options): string {
  let type = ref.substr("#/components/schemas/".length);
  if (options.schemaNameMapper) {
    const newName = options.schemaNameMapper(type);
    newName && (type = newName);
  }
  return `${type}`;
}

export function exportInterfaceOrType(
  name: string,
  schema: Schema | Reference,
  options: Options
): string {
  if (options.schemaNameMapper && options.schemaNameMapper(name)) {
    name = options.schemaNameMapper(name);
  }
  if (!("$ref" in schema) && schema.type === "object") {
    return `export interface ${name} ${transformSchema(schema, options)}`;
  } else {
    return `export type ${name} = ${transformSchema(schema, options)}`;
  }
}

export function transformRequestBody(
  body: RequestBody | Reference,
  options: Options
): string {
  if (!body) {
    return "void";
  }
  if ("$ref" in body) {
    throw new Error("todo");
  }
  if (!body.content || !body.content["application/json"]) {
    return "void";
  }
  const schema = body.content["application/json"].schema;
  return transformSchema(schema, options) || "void";
}

export function transformParameters(
  params: (Parameter | Reference)[],
  options: Options
): string {
  let res = "";
  res += "{\n";
  params.forEach((param) => {
    if ("$ref" in param) {
      throw new Error("todo");
    }
    res += `${param.name}: ${transformSchema(param.schema, options)};`;
  });
  res += "\n}\n";
  return res;
}

export function transformHttp(
  path: string,
  method: string,
  operation: Operation,
  options: Options
): string {
  let output = "";
  let tags: string[] = [];

  if (operation.tags) {
    tags = operation.tags;
  }

  const pathName = options.pathToName(
    path.replace(/{[^{}]+}/g, "").split("/"),
    tags
  );

  if (operation.summary) {
    output += `/* ${operation.summary} */`;
    output += "\n";
  }
  output += `export const ${method}${pathName} = `;

  let req = "";
  let resp = "";
  switch (method) {
    case "get":
      req = transformParameters(operation.parameters, options);
      resp = transformRequestBody(operation.responses["200"], options);
      break;
    case "post":
    case "put":
    case "delete":
      req = transformRequestBody(operation.requestBody, options);
      resp = transformRequestBody(operation.responses["200"], options);
      break;
    default:
      throw new Error(`unsupport http method: ${method}`);
  }
  output += `http_${method}<
    ${req},
    ${resp}
  >('${path}');\n`;
  return output;
}

export function transformPath(paths: Paths, options: Options): string {
  let output = "";

  Object.keys(paths).forEach((path) => {
    const pathObject = paths[path];
    if (options.pathMapper) {
      const newPath = options.pathMapper(path);
      if (newPath) {
        path = newPath;
      }
    }
    if (pathObject.get) {
      output += transformHttp(path, "get", pathObject.get, options);
    }
    if (pathObject.post) {
      output += transformHttp(path, "post", pathObject.post, options);
    }
    if (pathObject.put) {
      output += transformHttp(path, "put", pathObject.put, options);
    }
    if (pathObject.delete) {
      output += transformHttp(path, "delete", pathObject.delete, options);
    }
  });

  return output;
}
