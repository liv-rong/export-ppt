export interface BaseType {
  type?: string
  angle?: number
  width?: number
  height?: number
  fill?: string
  opacity?: number
  stroke?: string
  strokeWidth?: number
  top?: number
  left?: number
  z_index?: number
  scaleX?: number
  scaleY?: number
}

export interface TextType extends BaseType {
  data?: string
  strokeWidth?: number
  type?: string
  height?: number
  width?: number
  backgroundColor?: string | undefined
  fill?: string | undefined
  flipX?: boolean
  flipY?: boolean
  angle?: number
  /**
   * Font size (in pixels)
   */
  fontSize?: number | undefined
  /**
   * Font weight (e.g. bold, normal, 400, 600, 800)
   */
  fontWeight?: string | number | undefined
  /**
   * Font family
   */
  fontFamily?: string | undefined
  /**
   * Text decoration underline.
   */
  underline?: boolean | undefined
  /**
   * Text decoration overline.
   */
  overline?: boolean | undefined
  /**
   * Text decoration linethrough.
   */
  linethrough?: boolean | undefined
  /**
   * Text alignment. Possible values: "left", "center", "right", "justify",
   * "justify-left", "justify-center" or "justify-right".
   */
  textAlign?: string | undefined
  /**
   * Font style . Possible values: "", "normal", "italic" or "oblique".
   */
  fontStyle?: '' | 'normal' | 'italic' | 'oblique' | undefined
  /**
   * Line height
   */
  lineHeight?: number | undefined
  /**
   * Superscript schema object (minimum overlap)
   */
  superscript?: { size: number; baseline: number } | undefined
  /**
   * Subscript schema object (minimum overlap)
   */
  subscript?: { size: number; baseline: number } | undefined
  /**
   * Background color of text lines
   */
  textBackgroundColor?: string | undefined
  /**
   * When defined, an object is rendered via stroke and this property specifies its color.
   * <b>Backwards incompatibility note:</b> This property was named "strokeStyle" until v1.1.6
   */
  stroke?: string | undefined
  /**
   * Shadow object representing shadow of this shape.
   * <b>Backwards incompatibility note:</b> This property was named "textShadow" (String) until v1.2.11
   */
  // shadow?: Shadow | string | undefined
  /**
   * additional space between characters
   * expressed in thousands of em unit
   */
  charSpacing?: number | undefined
  /**
   * Object containing character styles - top-level properties -> line numbers,
   * 2nd-level properties - charater numbers
   */
  styles: any
  /**
   * Baseline shift, stlyes only, keep at 0 for the main text object
   */
  deltaY?: number | undefined
  /**
   * Text input direction. supporting RTL languages.
   */
  direction?: 'ltr' | 'rtl' | undefined
  text?: string | undefined
}

export interface ImgType extends BaseType {
  data?: string
  z_index?: number
  content?: any
  position?: { x: number; y: number }
  height?: number
  backgroundColor?: string
  cropX?: number
  cropY?: number
  crossOrigin?: string | undefined
  fill?: string | undefined
  fillRule?: string
  flipX?: boolean
  flipY?: boolean
  originX?: 'left'
  originY?: 'top'
  paintFirst?: string
  scaleX?: number
  scaleY?: number
  shadow?: string | undefined
  skewX?: number
  skewY?: number
  src?: string | null
  strokeDashArray?: any
  strokeDashOffset?: number
  strokeLineCap?: string
  strokeLineJoin?: string
  strokeMiterLimit?: number
  strokeUniform?: boolean
  strokeWidth?: number
  type?: 'image'
  version?: string
  visible?: boolean
}

export interface RectType extends BaseType {}

export interface PathType extends BaseType {
  path?: number[]
  pathOffset?: any
  strokeLineCap?: string
  strokeLineJoin?: string
  strokeDashArray?: any
}

export interface PolygonType extends BaseType {
  path?: number[]
  pathOffset?: any
}

export type ComponentsType = TextType | ImgType | RectType | PathType | PolygonType

export interface DrawingType {
  id?: string
  backgroundColor?: string
  width?: number
  height?: number
  title?: string
  intro?: string[]
  points?: string[]
  coverImg?: string
  objects?: ComponentsType[]
  version?: string
  contents?: string | string[]
}

//操作类型
