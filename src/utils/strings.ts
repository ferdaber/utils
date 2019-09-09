export function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

export function kebabCaseToCamelCase(str: string) {
  return str
    .split('-')
    .map(capitalize)
    .join('')
}
