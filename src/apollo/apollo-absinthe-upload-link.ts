import {
  HttpLink,
  ApolloLink,
  concat,
  parseAndCheckHttpResponse,
  Observable,
  HttpOptions,
  selectURI,
} from "@apollo/client/core";
import { print } from "graphql/language/printer";

const isObject = (value: unknown) =>
  value !== null && typeof value === "object";

const isFileList = (value: unknown) =>
  typeof FileList !== "undefined" && value instanceof FileList;

export const isUploadFile = (value: unknown) =>
  (typeof File !== "undefined" && value instanceof File) ||
  (typeof Blob !== "undefined" && value instanceof Blob);

const extractFiles = (variables: Record<string, any>) => {
  const files: { file: File; name: string }[] = [];
  const walkTree = (
    tree: Record<string, any>,
    path: string | string[] = []
  ) => {
    const mapped = Array.isArray(tree) ? tree : Object.assign({}, tree);
    Object.keys(mapped).forEach((key) => {
      const value = mapped[key];
      const name = [...path, key].join(".");
      if (isUploadFile(value) || isFileList(value)) {
        const file = isFileList(value)
          ? Array.prototype.slice.call(value)
          : value;
        files.push({ file, name });
        mapped[key] = name;
      } else if (isObject(value)) {
        mapped[key] = walkTree(value, name);
      }
    });

    return mapped;
  };

  return {
    files,
    variables: walkTree(variables),
  };
};

export const createUploadMiddleware = ({
  uri: fetchURI,
  headers,
  fetch: customFetch,
  credentials,
}: Pick<HttpOptions, "uri" | "headers" | "fetch" | "credentials">) =>
  new ApolloLink((operation, forward) => {
    if (typeof FormData !== "undefined" && isObject(operation.variables)) {
      const { variables, files } = extractFiles(operation.variables);

      if (files.length > 0) {
        const context = operation.getContext();
        const { headers: contextHeaders } = context;
        const formData = new FormData();

        formData.append("query", print(operation.query));
        formData.append("variables", JSON.stringify(variables));
        files.forEach(({ name, file }) => formData.append(name, file));

        let options: RequestInit = {
          method: "POST",
          headers: Object.assign({}, contextHeaders, headers),
          body: formData,
          credentials: credentials as RequestCredentials,
        };

        // add context.fetchOptions to fetch options
        options = Object.assign(context.fetchOptions || {}, options);

        const runtimeFetch = customFetch || fetch;

        const uri = selectURI(operation, fetchURI);

        return new Observable((observer) => {
          console.log(options);
          runtimeFetch(uri, options)
            .then((response) => {
              operation.setContext({ response });
              return response;
            })
            .then(parseAndCheckHttpResponse(operation))
            .then((result) => {
              // we have data and can send it to back up the link chain
              observer.next(result);
              observer.complete();
              return result;
            })
            .catch((err) => {
              if (err.result && err.result.errors && err.result.data) {
                observer.next(err.result);
              }
              observer.error(err);
            });
        });
      }
    }

    return forward(operation);
  });

export const createLink = (httpOptions: HttpOptions): ApolloLink =>
  concat(createUploadMiddleware(httpOptions), new HttpLink(httpOptions));
