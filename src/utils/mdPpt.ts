import type { PptSlice } from '../types'

function trimMd(str: string): string {
  return (str || '')
    .replace(/\r/g, '')
    .replace(/\s*chunks\s*$/i, '') // 去掉尾部流式标记
    .trim()
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

  // 支持两种输入：1) 以 --- 分隔的页面；2) 连续的块，靠标题识别
  const hasSeparators = /\n---\n/.test(content)
  const lines = content.split('\n')

  const sections: string[] = []
  if (hasSeparators) {
    sections.push(...content.split(/\n---\n/g))
  } else {
    // 按标题层级切分：# / ## / ### / ####
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
  }

  const slices: PptSlice[] = []

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

  for (const raw of sections) {
    const s = trimMd(raw)
    if (!s) continue
    const ls = s.split('\n')
    const header =
      ls.find(
        (l) => /^#\s+/.test(l) || /^##\s+/.test(l) || /^###\s+/.test(l) || /^####\s+/.test(l)
      ) || ''

    // 封面页：以 # 开头且不是"谢谢观看"
    if (/^#\s+/.test(header) && !/谢谢观看/.test(header)) {
      const title = header.replace(/^#\s+/, '').trim()
      // 描述：优先取紧随其后的 "- 文本"，否则取下一行非标题文本
      let text = ''
      const idx = ls.findIndex((l) => /^#\s+/.test(l))
      if (idx >= 0) {
        const next = ls[idx + 1]?.trim() || ''
        if (/^-\s+/.test(next)) text = next.replace(/^-\s+/, '').trim()
        else if (next && !/^#/.test(next)) text = next
      }
      slices.push({ type: 'cover', data: { title, ...(text ? { text } : {}) } } as PptSlice)
      continue
    }

    // 目录页
    if (/^##\s*目录页/.test(header)) {
      const items = extractBulletList(ls)
      slices.push({ type: 'contents', data: { items } } as PptSlice)
      continue
    }

    // 章节过渡页：### 标题
    if (/^###\s+/.test(header)) {
      const title = header.replace(/^###\s+/, '').trim()
      let text = ''
      const idx = ls.findIndex((l) => /^###\s+/.test(l))
      if (idx >= 0) {
        const next = ls[idx + 1]?.trim() || ''
        if (/^-\s+/.test(next)) text = next.replace(/^-\s+/, '').trim()
        else if (next && !/^#/.test(next)) text = next
      }
      slices.push({ type: 'transition', data: { title, ...(text ? { text } : {}) } } as PptSlice)
      continue
    }

    // 内容页：#### 标题
    if (/^####\s+/.test(header)) {
      const title = header.replace(/^####\s+/, '').trim()
      const body = ls.slice(ls.findIndex((l) => /^####\s+/.test(l)) + 1)
      // 优先 bullet 对，否则退回编号/加粗解析
      const pairs = extractBulletPairs(body)
      const items = (pairs.length ? pairs : extractNumberedItems(body)).slice(0, 4)
      slices.push({ type: 'content', data: { title, items } } as PptSlice)
      continue
    }

    // 结束页：# 谢谢观看 或 ## 谢谢观看
    if (/^#+\s*谢谢观看/.test(header)) {
      const title = '谢谢观看'
      let text = ''
      const idx = ls.findIndex((l) => /^#+\s*谢谢观看/.test(l))
      if (idx >= 0) {
        const next = ls[idx + 1]?.trim() || ''
        if (next && !/^#/.test(next)) text = next
      }
      slices.push({ type: 'end', data: { title, ...(text ? { text } : {}) } } as PptSlice)
      continue
    }
  }

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
