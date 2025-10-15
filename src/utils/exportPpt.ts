import type { DrawingType, ComponentsType, TextType, ImgType, PathType } from '../types'
import pptxgen from 'pptxgenjs'

// 类型守卫函数
function isImageObject(obj: ComponentsType): obj is ImgType {
  return obj.type === 'image' && typeof (obj as ImgType).src === 'string'
}
// 类型守卫函数，判断是否为 PathType
function isPathType(obj: ComponentsType): obj is PathType {
  return obj.type === 'path' && Array.isArray((obj as PathType)?.path)
}

function isTextObject(obj: ComponentsType): obj is TextType {
  return (
    ['textbox', 'text', 'i-text'].includes(obj.type || '') &&
    typeof (obj as TextType).text === 'string'
  )
}

const isBase64Image = (src: string) => {
  return /^data:image\/[a-zA-Z]+;base64,/.test(src)
}

// http 图片转 base64
const httpToBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const CANVAS_W = 800
const CANVAS_H = 450
const PPT_DPI = 96 // PowerPoint 基础 DPI，用于像素转英寸

// 将 fabric.Path 的 path 数组转为 SVG 的 d 字符串
function buildSvgPathData(pathCommands: any[] = [], offset = { x: 0, y: 0 }) {
  try {
    return pathCommands
      .map((seg: any[]) => {
        if (!Array.isArray(seg) || seg.length === 0) return ''
        const [cmd, ...nums] = seg
        // 对所有数字做偏移
        const nums2 = nums.map((n: number, i: number) =>
          i % 2 === 0 ? n - offset.x : n - offset.y
        )
        return [cmd, ...nums2].join(' ')
      })
      .join(' ')
  } catch {
    return ''
  }
}

// 颜色解析工具：支持 #RGB/#RRGGBB/#RRGGBBAA/rgba()
function parseColorToRgba(color: string | undefined): string {
  if (!color) return 'rgba(0,0,0,1)'
  if (color.startsWith('rgba')) return color
  if (color.startsWith('#')) {
    let hex = color.slice(1)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((x) => x + x)
        .join('')
    }
    let r = 0,
      g = 0,
      b = 0,
      a = 255
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
      a = parseInt(hex.slice(6, 8), 16)
    }
    const alpha = +(a / 255).toFixed(3)
    return `rgba(${r},${g},${b},${alpha})`
  }
  // 其它格式直接返回
  return color
}

// 计算未旋转时的左上角位置与原始尺寸
// PowerPoint 中旋转是围绕形状中心进行的，因此需要传入“未旋转”宽高与左上角，
// 同时设置 rotate，才能与画布效果一致。
function calculateTopLeftAndSize(obj: ComponentsType) {
  const angle = obj.angle || 0

  // 获取对象的原始尺寸和缩放
  const scaleX = (obj as any).scaleX ?? 1
  const scaleY = (obj as any).scaleY ?? 1
  const width = (obj.width || 0) * scaleX
  const height = (obj.height || 0) * scaleY

  // 获取旋转中心点
  const originX = (obj as any).originX || 'center' // 默认使用center作为旋转中心
  const originY = (obj as any).originY || 'center'

  // 计算对象中心点位置
  const objCenterX = obj?.left || 0
  const objCenterY = obj.top || 0

  // 根据originX/originY调整中心点
  let centerOffsetX = 0
  let centerOffsetY = 0

  if (originX === 'left') centerOffsetX = width / 2
  else if (originX === 'right') centerOffsetX = -width / 2

  if (originY === 'top') centerOffsetY = height / 2
  else if (originY === 'bottom') centerOffsetY = -height / 2

  // 计算旋转后的实际左上角位置
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // 根据旋转计算实际位置
  const rotatedX = objCenterX + centerOffsetX * cos - centerOffsetY * sin - width / 2
  const rotatedY = objCenterY + centerOffsetX * sin + centerOffsetY * cos - height / 2

  return {
    left: rotatedX,
    top: rotatedY,
    width,
    height,
    angle
  }
}

export const exportPpt = async (canvasList: DrawingType[]) => {
  const pptx = new pptxgen()
  for (const item of canvasList) {
    const { objects } = item
    if (!objects || !Array.isArray(objects)) return

    const slide = pptx.addSlide({})
    for (const obj of objects) {
      // objects.forEach(async (obj: ComponentsType) => {

      // 计算未旋转时的左上角与尺寸（用于 PowerPoint 定位），旋转由 rotate 控制
      const pos = calculateTopLeftAndSize(obj)

      // 处理图片对象
      src: if (isImageObject(obj)) {
        const xywh = {
          x: `${((pos.left || 0) / CANVAS_W) * 100}%`,
          y: `${((pos.top || 0) / CANVAS_H) * 100}%`,
          w: `${((pos.width || 100) / CANVAS_W) * 100}%`,
          h: `${((pos.height || 100) / CANVAS_H) * 100}%`
        }
        const { src } = obj
        if (!src) return
        let srcData = src
        //只需要判断是否包含base 64 不包含的话 需要转为base64

        if (!isBase64Image(src)) {
          srcData = await httpToBase64(src)
        }

        slide.addImage({
          data: srcData,
          ...xywh,

          transparency: Math.max(0, Math.min(100, (1 - Number((obj as any)?.opacity ?? 1)) * 100)),
          rotate: pos.angle,
          flipH: obj.flipX || false,
          flipV: obj.flipY || false
        } as any)
      }

      // 处理文本对象
      if (isTextObject(obj)) {
        // 将 px 转换为 pt (1px ≈ 0.75pt，但为了更准确，使用 0.8 的系数)
        const fontSize = (obj?.fontSize || 16) * 0.9

        const resText = slide.addText(obj.text || '', {
          isTextBox: true,

          // 位置用百分比，尺寸用英寸（避免放大变糊）
          x: `${((pos.left || 0) / CANVAS_W) * 100}%`,
          y: `${((pos.top || 0) / CANVAS_H) * 100}%`,
          w: `${((pos.width || 100) / CANVAS_W) * 100}%`,
          h: `${((pos.height || 100) / CANVAS_H) * 100}%`,

          fontSize: fontSize,
          fontFace: obj.fontFamily || 'Arial',
          color: (obj.fill as string) || '#000000',
          bold:
            obj.fontWeight === 'bold' ||
            (typeof obj.fontWeight === 'number' && obj.fontWeight >= 600),
          italic: obj.fontStyle === 'italic' || obj.fontStyle === 'oblique',
          underline: obj.underline
            ? { style: 'sng', color: (obj.fill as string) || '#000000' }
            : undefined,

          // 对齐方式
          align: (obj.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left',
          valign: 'middle',

          // 字符和行间距
          lineSpacing: obj.lineHeight ? obj.lineHeight * (obj?.fontSize || 12) : undefined,

          // 文本装饰
          strike: obj.linethrough ? 'sngStrike' : undefined,
          subscript: obj.subscript ? true : undefined,
          superscript: obj.superscript ? true : undefined,

          // 文本框属性：固定宽高，禁止自动收缩，保证旋转中心稳定
          wrap: true,
          margin: [0, 0, 0, 0],
          autoFit: false,

          // 变换属性
          rotate: pos.angle,
          flipH: obj.flipX || false,
          flipV: obj.flipY || false,

          // 样式属性
          highlight: obj.textBackgroundColor ?? undefined,
          transparency: Math.max(0, Math.min(100, (1 - Number((obj as any)?.opacity ?? 1)) * 100))
        } as any)
      }

      // 处理 path 对象：拼接 SVG path，并根据 pathOffset 做平移，兼容无 toSVG 的版本
      if (isPathType(obj)) {
        const posPath = calculateTopLeftAndSize(obj)
        const pathOffset = obj?.pathOffset || { x: 0, y: 0 }
        const svgD = buildSvgPathData(obj.path, pathOffset)
        // 可以是这样的要求都能显示出来颜色"#999"
        const stroke =
          parseColorToRgba(typeof obj?.stroke === 'string' ? obj.stroke : undefined) ||
          'rgba(0,0,0,1)'
        const strokeWidth = (obj?.strokeWidth || 0) * 1.5

        //fill: "#5f6af4a2"

        const fill =
          parseColorToRgba(typeof obj?.fill === 'string' ? obj.fill : undefined) || 'none'
        const strokeLinecap = obj?.strokeLineCap || 'butt'
        const strokeLinejoin = obj?.strokeLineJoin || 'miter'
        const dashArray = obj?.strokeDashArray as number[] | undefined
        const opacity = typeof obj.opacity === 'number' ? obj.opacity : 1
        const dashAttr =
          dashArray && dashArray.length ? ` stroke-dasharray="${dashArray.join(' ')}"` : ''

        // 用原始宽高做viewBox，缩放后宽高做width/height，path/stroke-width用原始值
        const origW = obj.width || 0
        const origH = obj.height || 0
        const scaledW = obj.scaleX === 0 ? 0 : origW * ((obj.scaleX ?? 1) || 1)
        const scaledH = obj.scaleY === 0 ? 0 : origH * ((obj.scaleY ?? 1) || 1)

        // 考虑描边宽度，扩展 viewBox 确保描边完全显示
        const strokePadding = strokeWidth / 2
        const viewBoxW = origW + strokeWidth
        const viewBoxH = origH + strokeWidth
        const viewBoxX = -strokePadding
        const viewBoxY = -strokePadding

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scaledW + strokeWidth}" height="${
          scaledH + strokeWidth
        }" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}">
  <path d="${svgD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}"${dashAttr} opacity="${opacity}" vector-effect="non-scaling-stroke" />
</svg>`

        slide.addImage({
          data: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`,
          x: `${((posPath.left - strokeWidth / 4) / CANVAS_W) * 100}%`,
          y: `${((posPath.top - strokeWidth / 4) / CANVAS_H) * 100}%`,
          w: `${((scaledW + strokeWidth) / CANVAS_W) * 100}%`,
          h: `${((scaledH + strokeWidth) / CANVAS_H) * 100}%`,
          rotate: posPath.angle,
          line: { type: 'none' }
        } as any)
      }
    }
  }

  pptx.writeFile({
    fileName: 'index.pptx',
    compression: true
  })
}
