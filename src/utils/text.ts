interface CalculateTextHeightOptions {
  text: string
  fontSize?: number
  lineHeight?: number
  maxWidth?: number
}

/**
 * 计算文本高度（精确版 - 基于实际渲染测试优化）
 * @param options 参数对象
 * @param options.text 文本内容
 * @param options.fontSize 字体大小，默认 24
 * @param options.lineHeight 行高倍数，默认 1.2
 * @param options.maxWidth 最大宽度，默认 668
 * @returns 计算后的高度
 */
export const calculateTextHeightAccurate = ({
  text,
  fontSize = 24,
  lineHeight = 1.2,
  maxWidth = 668
}: CalculateTextHeightOptions): number => {
  if (!text) return fontSize * lineHeight

  // 基于实际测试优化的字符宽度比例
  const charWidthMap: Record<string, number> = {
    chinese: 1.0,
    english: 0.8, // 进一步增加英文宽度，减少换行
    space: 0.4, // 进一步增加空格宽度
    punctuation: 0.7, // 进一步增加标点符号宽度
    number: 0.8 // 进一步增加数字宽度
  }

  const getCharType = (char: string): string => {
    if (/[\u4e00-\u9fa5]/.test(char)) return 'chinese'
    if (/[a-zA-Z]/.test(char)) return 'english'
    if (/[0-9]/.test(char)) return 'number'
    if (/\s/.test(char)) return 'space'
    if (/[，。！？；：""''（）【】《》]/.test(char)) return 'punctuation'
    if (/[,.!?;:"'()\[\]<>]/.test(char)) return 'punctuation'
    return 'english'
  }

  let currentLineWidth = 0
  let lineCount = 1

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const charType = getCharType(char)
    const charWidth = fontSize * charWidthMap[charType]

    if (currentLineWidth + charWidth > maxWidth) {
      lineCount++
      currentLineWidth = charWidth
    } else {
      currentLineWidth += charWidth
    }
  }

  // 基础高度计算
  const baseHeight = lineCount * fontSize * lineHeight

  // 精确的误差补偿
  let compensation = 0

  if (lineCount === 1) {
    // 单行文本补偿
    compensation = 8
  } else if (lineCount === 2) {
    // 两行文本补偿
    compensation = 12
  } else {
    // 多行文本补偿
    compensation = 18
  }

  // 根据文本长度微调补偿
  if (text.length > 30) {
    compensation += 3
  }
  if (text.length > 50) {
    compensation += 3
  }

  // 根据字体大小微调补偿
  if (fontSize >= 24) {
    compensation += 3
  }
  if (fontSize >= 32) {
    compensation += 3
  }

  // 考虑行高的微调补偿
  const lineHeightCompensation = Math.max(0, (lineHeight - 1.0) * fontSize * 0.6)
  compensation += lineHeightCompensation

  // 添加基础补偿
  compensation += fontSize * 0.2

  return Math.round(baseHeight + compensation)
}
