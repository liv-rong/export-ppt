import type { PptSlice } from '../types'
import { PptSliceEnum } from '../types'

function trimMd(str: string): string {
  let s = (str || '')
    .replace(/\uFEFF/g, '') // 去除 BOM
    .replace(/\r/g, '')
    .replace(/\\n/g, '\n') // 将 \n 转义字符转换为真正的换行符
    .replace(/\s*chunks\s*$/i, '') // 去掉尾部流式标记
    .trim()
  // 去除整段包裹的成对引号（'...' 或 "...")
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

function extractBulletList(lines: string[]): string[] {
  const items: string[] = []
  for (const line of lines) {
    const m = line.match(/^\s*-\s+(.*)$/)
    if (m) items.push(m[1].trim())
  }
  return items
}

function extractNumberedItems(lines: string[]): { title: string; text?: string }[] {
  const items: { title: string; text?: string }[] = []
  for (const raw of lines) {
    const line = raw.trim()
    // 兼容多种写法：
    // 1) 1. **小标题** - 说明文本
    // 2) 1. **小标题**（无描述）
    // 3) **小标题**- 说明文本（无编号，连字符无空格）
    // 4) **小标题** - 说明文本（无编号，连字符有空格）
    let m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[-：:]\s*(.+)$/)
    if (m) {
      items.push({ title: m[1].trim(), text: m[2].trim() })
      continue
    }
    let m2 = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*$/)
    if (m2) {
      items.push({ title: m2[1].trim() })
      continue
    }
    let m3 = line.match(/^\*\*(.+?)\*\*\s*[-：:]\s*(.+)$/)
    if (m3) {
      items.push({ title: m3[1].trim(), text: m3[2].trim() })
      continue
    }
    let m4 = line.match(/^\*\*(.+?)\*\*\s*$/)
    if (m4) {
      items.push({ title: m4[1].trim() })
      continue
    }
  }
  return items
}

export function parsePptMarkdown(md: string): PptSlice[] {
  const content = trimMd(md)
  if (!content) return []

  const lines = content.split('\n')
  const slices: PptSlice[] = []

  // 按标题层级切分：# / ## / ### / ####
  const sections: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (
      /^#\s+/.test(line) ||
      /^##\s+/.test(line) ||
      /^###\s+/.test(line) ||
      /^####\s+/.test(line)
    ) {
      if (current.length) sections.push(current.join('\n'))
      current = [line]
    } else {
      current.push(line)
    }
  }
  if (current.length) sections.push(current.join('\n'))

  // 提取 bullet 对（- 标题 /   - 说明）
  const extractBulletPairs = (ls: string[]): { title: string; text?: string }[] => {
    const items: { title: string; text?: string }[] = []
    for (let i = 0; i < ls.length; i++) {
      const line = ls[i]
      const m = line.match(/^\s*-\s+(.+)$/)
      if (m) {
        const title = m[1].trim()
        let text: string | undefined
        const next = i + 1 < ls.length ? ls[i + 1] : ''
        const m2 = next.match(/^\s{2,}-\s+(.+)$/)
        if (m2) {
          text = m2[1].trim()
          i++
        }
        if (title) items.push({ title, ...(text ? { text } : {}) })
      }
    }
    return items
  }

  // 定位：首个单 # 为封面，最后一个单 # 为结束
  const headers = sections.map((sec) => {
    const first = trimMd(sec).split('\n')[0] || ''
    return first
  })
  const singleHashIndexes = headers.map((h, i) => (/^#\s+/.test(h) ? i : -1)).filter((i) => i >= 0)
  const coverIndex = singleHashIndexes.length > 0 ? singleHashIndexes[0] : -1
  let endIndex = singleHashIndexes.length > 1 ? singleHashIndexes[singleHashIndexes.length - 1] : -1
  // 如果没有找到“最后一个单 #”作为结束，则回退到最后一个“# 或 ## 谢谢观看”作为结束
  if (endIndex === -1) {
    for (let i = headers.length - 1; i >= 0; i--) {
      if (/^#{1,2}\s*谢谢观看/.test(headers[i])) {
        endIndex = i
        break
      }
    }
  }

  for (let idx = 0; idx < sections.length; idx++) {
    const raw = sections[idx]
    const s = trimMd(raw)
    if (!s) continue
    const ls = s.split('\n')
    const header = ls[0] || ''

    // 位置优先：首个单 # 为封面
    if (idx === coverIndex) {
      const title = header.replace(/^#\s+/, '').trim()
      // 描述：取紧随其后的首个非空且非标题行；若以 "- " 开头则去掉前缀
      let text = ''
      if (ls.length > 1) {
        // 找到标题后的第一个非空且非标题行
        const nextLine =
          ls
            .slice(1)
            .map((l) => (l || '').trim())
            .find((l) => l.length > 0 && !/^#/.test(l)) || ''
        if (nextLine) {
          text = (/^-\s+/.test(nextLine) ? nextLine.replace(/^-\s+/, '') : nextLine).trim()
        }
      }
      slices.push({
        type: PptSliceEnum.Cover,
        data: { title, ...(text ? { text } : {}) }
      } as PptSlice)
      continue
    }

    // 位置优先：最后一个单 # 为结束
    if (idx === endIndex && endIndex !== coverIndex) {
      const title = header.replace(/^#\s+/, '').trim() || '谢谢观看'
      // 描述：取紧随其后的文本（非标题行）
      let text = ''
      if (ls.length > 1) {
        const next = ls[1]?.trim() || ''
        if (next && !/^#/.test(next)) {
          text = next
        }
      }
      slices.push({
        type: PptSliceEnum.End,
        data: { title, ...(text ? { text } : {}) }
      } as PptSlice)
      continue
    }

    // 以下为非首/末单 # 的常规解析
    // 目录页：## 目录页
    if (/^##\s*目录页/.test(header)) {
      const items = extractBulletList(ls)
      slices.push({ type: PptSliceEnum.Contents, data: { items } } as PptSlice)
      continue
    }

    // 章节过渡页：### 标题
    if (/^###\s+/.test(header)) {
      const title = header.replace(/^###\s+/, '').trim()
      // 描述：取紧随其后的首个非空且非标题行；若以 "- " 开头则去掉前缀
      let text = ''
      if (ls.length > 1) {
        const nextLine =
          ls
            .slice(1)
            .map((l) => (l || '').trim())
            .find((l) => l.length > 0 && !/^#/.test(l)) || ''
        if (nextLine) {
          text = (/^-\s+/.test(nextLine) ? nextLine.replace(/^-\s+/, '') : nextLine).trim()
        }
      }
      slices.push({
        type: PptSliceEnum.Transition,
        data: { title, ...(text ? { text } : {}) }
      } as PptSlice)
      continue
    }

    // 内容页：#### 标题
    if (/^####\s+/.test(header)) {
      const title = header.replace(/^####\s+/, '').trim()
      const body = ls.slice(1) // 跳过标题行
      const items = extractBulletPairs(body).slice(0, 4) // 最多4个要点
      slices.push({ type: PptSliceEnum.Content, data: { title, items } } as PptSlice)
      continue
    }
  }

  console.log('parsed slices:', slices)
  return slices
}

// 增量解析辅助：从缓冲区中提取“完整的页面块”，并返回剩余未完成部分
export function takeCompleteSections(buffer: string): { sections: string[]; rest: string } {
  const content = trimMd(buffer)
  if (!content) return { sections: [], rest: '' }

  // 优先按 --- 分段
  if (/\n---\n/.test(content)) {
    const parts = content.split(/\n---\n/g)
    const sections = parts.slice(0, -1).filter(Boolean)
    const rest = parts[parts.length - 1] || ''
    return { sections, rest }
  }

  // 按标题层级切分（# / ## / ### / ####），最后一块作为 rest
  const lines = content.split('\n')
  const sections: string[] = []
  let current: string[] = []
  const isHeader = (l: string) =>
    /^#\s+/.test(l) || /^##\s+/.test(l) || /^###\s+/.test(l) || /^####\s+/.test(l)
  for (const line of lines) {
    if (isHeader(line)) {
      if (current.length) sections.push(current.join('\n'))
      current = [line]
    } else {
      current.push(line)
    }
  }
  const rest = current.join('\n')
  return { sections, rest }
}
