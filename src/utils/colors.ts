import Color from 'color'

export { Color }

export function alpha(color: string, alpha: number) {
  return Color(color)
    .alpha(alpha)
    .rgb()
    .string()
}

export function lighten(color: string, lumPercentDelta: number) {
  const colorObj = Color(color)
  const lum = colorObj.lightness() + lumPercentDelta
  return colorObj.alpha() === 1
    ? colorObj.lightness(lum).hex()
    : colorObj
        .lightness(lum)
        .rgb()
        .string()
}

export function darken(color: string, lumPercentDelta: number) {
  return lighten(color, -lumPercentDelta)
}

export function desaturate(color: string, satPercentDelta: number) {
  const colorObj = Color(color)
  const sat = colorObj.saturationl() - satPercentDelta
  return colorObj.alpha() === 1
    ? colorObj.saturationl(sat).hex()
    : colorObj
        .saturationl(sat)
        .rgb()
        .string()
}
