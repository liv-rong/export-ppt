import {
  PptSliceEnum,
  type ComponentsType,
  type DrawingType,
  type PptSlice,
  TextType
} from '../types'
import { handlePptData } from './replatePpt'
import { calculateTextHeightAccurate } from './text'

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
    console.log(res, 'res')
    const res1 = res.map((item: DrawingType) => {
      const { objects = [], ...rest } = item
      const newObjects = objects.map((obj: ComponentsType) => {
        if (obj?.type === 'textbox') {
          const textObj = obj as TextType
          const height = calculateTextHeightAccurate({
            text: textObj?.text ?? '',
            fontSize: textObj?.fontSize ?? 24,
            lineHeight: textObj?.lineHeight ?? 1.2,
            maxWidth: textObj?.width ?? 668
          })
          return {
            ...obj,
            height
          }
        }
        return obj
      })
      return {
        ...rest,
        objects: newObjects
      }
    })
    return res1
  } catch (error: any) {
    return []
  }
}
