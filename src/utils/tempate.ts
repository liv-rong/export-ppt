import { getAiPptText, getProjectItem } from '../service'
import { PptSliceEnum } from '../types'
import { handlePptData } from './replatePpt'

// 得到模版与AI文案，两个接口都成功才算成功
export const getPptJson = async (
  id: string,
  value: string
): Promise<
  | { success: true; template: any; aiText: any }
  | { success: false; message: string; status?: number }
> => {
  try {
    const [resTemplate, resText] = await Promise.all([
      getProjectItem(id, 'json'),
      getAiPptText(value)
    ])

    const templateOk = resTemplate?.success === true
    const textOk = resText?.success === true

    if (templateOk && textOk) {
      return {
        success: true,
        template: resTemplate.data,
        aiText: resText.data
      }
    }

    // 统一失败返回（尽量带上更具体的信息）
    const message = resTemplate?.message || resText?.message || '获取数据失败'
    const status = resTemplate?.status ?? resText?.status
    return { success: false, message, status }
  } catch (error: any) {
    return { success: false, message: error?.message || '未知错误' }
  }
}

//将模版JSON 中的文本数据替换 替换成真正的文本数据
export const replacePptJsonText = (template: any, aiText: any) => {
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
  template.forEach((item: any) => {
    if (item && item.title && templateMap?.has(item.title)) {
      templateMap?.get(item.title)?.push(JSON.stringify(item))
    }
  })

  const res = handlePptData(aiText, templateMap)

  return res
}
