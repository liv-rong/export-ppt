import { PptSliceEnum, type DrawingType, type PptSlice } from '../types'
import { handlePptData } from './replatePpt'

//将模版JSON 中的文本数据替换 替换成真正的文本数据
export const replacePptJsonText = (template: string, aiText: string) => {
  try {
    const templateJson = JSON.parse(template) as DrawingType[]
    const aiTextJson = JSON.parse(aiText) as PptSlice[]
    const templateMap = new Map<PptSliceEnum, string[]>([
      [PptSliceEnum.Cover, []],
      [PptSliceEnum.ContentsZero, []],
      [PptSliceEnum.ContentsFive, []],
      [PptSliceEnum.ContentsSix, []],
      [PptSliceEnum.ContentsSeven, []],
      [PptSliceEnum.ContentsEight, []],
      [PptSliceEnum.ContentsFour, []],
      [PptSliceEnum.ContentsOne, []],
      [PptSliceEnum.ContentsThree, []],
      [PptSliceEnum.ContentsTwo, []],
      [PptSliceEnum.Transition, []],
      [PptSliceEnum.Contents, []],
      [PptSliceEnum.End, []]
    ])
    templateJson.forEach((item: any) => {
      if (item && item.title && templateMap?.has(item.title)) {
        templateMap?.get(item.title)?.push(JSON.stringify(item))
      }
    })

    const res = handlePptData(aiTextJson, templateMap)
    return res
  } catch (error: any) {
    return []
  }
}
