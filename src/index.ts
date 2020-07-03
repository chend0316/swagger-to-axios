import { OpenAPI, Options, Schema, Schemas, Paths } from "./types";
import prettier from "prettier";
import { HEAD_STRING, defaultOptions } from "config";
import { exportInterfaceOrType, transformPath } from "./utils";

class SwaggerToAxios {
  public options: Options;
  private openapi: OpenAPI;
  private output = "";
  private schemaDict: { [key: string]: Schema } = {};

  constructor(openapi: OpenAPI, options?: Options) {
    if (!openapi.components || !openapi.components.schemas) {
      throw new Error(
        ` 'components' missing from schema https://swagger.io/specification`
      );
    }
    this.openapi = openapi;
    this.options = options || defaultOptions;
    this.output += HEAD_STRING;
  }

  setOptions(options: Options): SwaggerToAxios {
    this.options = options;
    return this;
  }

  genSchema(schemas?: Schemas): SwaggerToAxios {
    if (!schemas) {
      schemas = this.openapi.components.schemas;
    }

    this.output += Object.keys(schemas)
      .map((type) => {
        return exportInterfaceOrType(
          type,
          (schemas as Schemas)[type],
          this.options
        );
      })
      .join("\n");
    return this;
  }

  genPath(paths?: Paths): SwaggerToAxios {
    if (!paths) {
      paths = this.openapi.paths;
    }
    this.output += transformPath(paths, this.options);
    return this;
  }

  gen(): SwaggerToAxios {
    this.genSchema();
    this.genPath();
    return this;
  }

  getOutput(): string {
    return this.output;
  }

  // todo
  // writeToFileSync(filename: string): boolean {}

  prettier(): SwaggerToAxios {
    const prettierOptions: prettier.Options = { parser: "typescript" };
    prettier.format(this.output, prettierOptions);
    return this;
  }
}

export default function swaggerToTS(schema: OpenAPI, options: Options): string {
  const parser = new SwaggerToAxios(schema, options);
  return parser.gen().prettier().getOutput();
}
