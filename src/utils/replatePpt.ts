import { v4 as uuidv4 } from 'uuid'
import type { ComponentsType, DrawingType, PptSlice } from '../types'
import { PptSliceEnum, sliceTypeMap, CustomTitleType } from '../types'

export const handlePptData = (jsonData: PptSlice[], templateData: Map<PptSliceEnum, string[]>) => {
  const value: DrawingType[] = []
  jsonData.forEach((item) => {
    let objects: ComponentsType[] = []
    const id = uuidv4()
    let title: PptSliceEnum = item.type
    if (item.type === PptSliceEnum.Content) {
      const itemsLength = item.data.items.length
      if (itemsLength === 1) {
        title = PptSliceEnum.ContentsOne
      }
      if (itemsLength === 2) {
        title = PptSliceEnum.ContentsTwo
      }
      if (itemsLength === 3) {
        title = PptSliceEnum.ContentsThree
      }
      if (itemsLength === 4) {
        title = PptSliceEnum.ContentsFour
      }
    }
    let temp = templateData.get(title)

    // 如果是Content类型且当前模板为空，则进行降级查找
    const isContent = item.type === PptSliceEnum.Content
    if (isContent) {
      if (!temp || (Array.isArray(temp) && temp.length <= 0)) {
        const itemsLength = item.data.items.length
        const result = findSuitableTemplate(itemsLength, templateData)
        if (result) {
          temp = result.temp
          title = result.title
        }
      }
    }

    if (!temp || temp.length <= 0) {
      console.warn(`未找到合适的模板：${title}，跳过此项目`)
      return
    }

    const randomIndex = Math.floor(Math.random() * temp.length)
    const selectedTemplate = temp[randomIndex]

    if (!selectedTemplate) {
      console.warn(`模板数据为空：${title}，跳过此项目`)
      return
    }

    if (item.type === PptSliceEnum.Cover || item.type === PptSliceEnum.End) {
      try {
        const templateData = JSON.parse(selectedTemplate)
        objects = templateData.objects
          .map((obj: any) => {
            if (obj.type === 'textbox') {
              if ('text' in obj && obj?.data === CustomTitleType.H1) {
                return {
                  ...obj,
                  text: item.data.title
                }
              }
              if ('text' in obj && obj?.data === CustomTitleType.P) {
                return {
                  ...obj,
                  text: item.data.text
                }
              }
            }
            return obj
          })
          .filter((obj: any) => {
            if (obj.type === 'textbox') {
              if (!obj.text) return false
            }
            return true
          })
      } catch (error) {
        console.error(`解析模板数据失败：${title}`, error)
        return
      }
    } else if (item.type === PptSliceEnum.Contents) {
      let templateObjects
      try {
        templateObjects = JSON.parse(selectedTemplate).objects
      } catch (error) {
        console.error(`解析模板数据失败：${title}`, error)
        return
      }

      // 找出模板中所有的 H2 类型文本框
      const h2Objects = templateObjects.filter(
        (obj: any) => obj.type === 'textbox' && 'text' in obj && obj.data === CustomTitleType.H2
      )

      // 以最短长度为标准
      const minLength = Math.min(item.data.items.length, h2Objects.length)

      // 创建 H2 索引映射
      let h2Index = 0

      objects = templateObjects
        .map((obj: any) => {
          if (obj.type === 'textbox') {
            // item.data 类型 string[]
            if ('text' in obj && obj.data === CustomTitleType.H2) {
              // 如果 H2 数量超过了最短长度，则跳过这个 H2
              if (h2Index >= minLength) {
                return null // 标记为删除
              }

              const result = {
                ...obj,
                text: `${h2Index + 1}. ${item.data.items[h2Index]}`
              }
              h2Index++
              return result
            }
          }
          return obj
        })
        .filter((obj: any) => {
          if (obj === null) return false
          if (obj.type === 'textbox') {
            if (!obj.text) return false
          }
          return true
        })
    } else if (item.type === PptSliceEnum.Transition) {
      try {
        const templateData = JSON.parse(selectedTemplate)
        objects = templateData.objects
          .map((obj: any) => {
            if (obj.type === 'textbox') {
              if ('text' in obj && obj.data === CustomTitleType.H1) {
                return {
                  ...obj,
                  text: item.data.title
                }
              }
              if ('text' in obj && obj.data === CustomTitleType.P) {
                return {
                  ...obj,
                  text: item.data.text
                }
              }
            }
            return obj
          })
          .filter((obj: any) => {
            if (obj.type === 'textbox') {
              if (!obj.text) return false
            }
            return true
          })
      } catch (error) {
        console.error(`解析模板数据失败：${title}`, error)
        return
      }
    } else if (item.type === PptSliceEnum.Content) {
      let templateObjects
      try {
        templateObjects = JSON.parse(selectedTemplate).objects
      } catch (error) {
        console.error(`解析模板数据失败：${title}`, error)
        return
      }

      // 构建索引：成对匹配 H2 与 P（允许一对缺一边）
      const idToObj: Record<string, any> = {}
      const h2List: any[] = []
      const pList: any[] = []
      templateObjects.forEach((o: any) => {
        if (o && o.id) idToObj[o.id] = o
        if (o?.type === 'textbox' && o.data === CustomTitleType.H2) h2List.push(o)
        if (o?.type === 'textbox' && o.data === CustomTitleType.P) pList.push(o)
      })

      // 构建配对：先以 H2 为主配 P（不重复占用 P），再把剩余独立 P 也作为一对补充
      const usedPIds = new Set<string>()
      const pairs: Array<{ h2: any | null; p: any | null }> = []
      h2List.forEach((h2) => {
        let p: any | null = null
        if (h2.linkId && idToObj[h2.linkId] && idToObj[h2.linkId].data === CustomTitleType.P) {
          p = idToObj[h2.linkId]
          usedPIds.add(p.id)
        } else {
          p = pList.find((pp) => !usedPIds.has(pp.id) && pp.linkId === h2.id) || null
          if (p) usedPIds.add(p.id)
        }
        pairs.push({ h2, p })
      })
      // 将未被占用的 P 作为独立对追加
      pList.forEach((pp) => {
        if (!usedPIds.has(pp.id)) {
          pairs.push({ h2: null, p: pp })
        }
      })

      const dataItems: Array<{ title: string; text?: string }> = item.data.items
      const keepCount = Math.min(dataItems.length, pairs.length)
      // 映射：对象 id → 数据项索引
      const h2IdToIndex = new Map<string, number>()
      const pIdToIndex = new Map<string, number>()
      for (let i = 0; i < keepCount; i++) {
        const pair = pairs[i]
        if (pair.h2) h2IdToIndex.set(pair.h2.id, i)
        if (pair.p) pIdToIndex.set(pair.p.id, i)
      }

      // 生成对象：
      // - 仅保留 map 中的成对对象；根据各自索引替换文本
      objects = templateObjects
        .map((obj: any) => {
          if (obj?.type === 'textbox') {
            if (obj.data === CustomTitleType.H2) {
              const idx = h2IdToIndex.get(obj.id)
              if (idx === undefined) return null
              return {
                ...obj,
                text: dataItems[idx]?.title || ''
              }
            }
            if (obj.data === CustomTitleType.P) {
              const idx = pIdToIndex.get(obj.id)
              if (idx === undefined) return null
              return {
                ...obj,
                text: dataItems[idx]?.text || ''
              }
            }
            if (obj.data === CustomTitleType.H1) {
              return {
                ...obj,
                text: item.data.title || ''
              }
            }
          }
          return obj
        })
        .filter((obj: any) => obj !== null)
    }
    // 现在 有个问题 思考
    // 模版JSON中的 H2和P 是成对出现的 H2的linkId记录p的id  然后P 的linkId 记录H2的id (一对中可能只有h2或者只有p)
    // 现在需要根据这个逻辑，来把模版中的文本 替换成数据项中的文本
    if (objects.length > 0) {
      value.push({
        objects: objects,
        id,
        title
      })
    }
  })

  return value
}

/**
 * 查找合适的模板，如果当前模板不存在则进行降级查找
 * @param itemsLength 数据项长度
 * @param templateData 模板数据映射
 * @returns 找到的模板数据和对应的模板类型
 */
const findSuitableTemplate = (
  itemsLength: number,
  templateData: Map<PptSliceEnum, string[]>
): { temp: string[] | undefined; title: PptSliceEnum } | null => {
  // 边界条件：如果长度小于等于0，返回null
  if (itemsLength <= 0) {
    return null
  }

  const name = sliceTypeMap[itemsLength]
  const temp = templateData.get(name)

  if (temp && temp.length > 0) {
    return { temp, title: name }
  } else {
    // 递归降级查找
    const res = findSuitableTemplate(itemsLength - 1, templateData)
    if (res && res.temp && res.temp.length > 0) {
      return { temp: res.temp, title: res.title }
    }
  }

  return null
}
