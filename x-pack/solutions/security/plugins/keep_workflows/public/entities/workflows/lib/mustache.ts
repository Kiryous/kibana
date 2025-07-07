export const MUSTACHE_REGEX = /\{\{\s*(.*?)\s*\}\}/g;
export const ALLOWED_MUSTACHE_VARIABLE_REGEX = /^[a-zA-Z0-9._-\s]+$/;

/**
 * Extracts all mustache variables from a string.
 * @param yamlString - The string to extract mustache variables from.
 * @returns An array of mustache variables.
 *
 */
export function extractMustacheVariables(yamlString: string): string[] {
  // matchAll returns an iterator, so we convert it to an array. E.g. for string '{{ var }}', match[1] would be 'var'
  return [...yamlString.matchAll(MUSTACHE_REGEX)]
    .map((match) => match[1])
    .filter(
      (variable) =>
        (variable.length > 0 && !variable.endsWith(".")) || variable === "."
    );
}
