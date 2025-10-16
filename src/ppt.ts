import { getPptJson, replacePptJsonText, exportPptFile } from './utils'

export const exportPpt = async (template: string, aiText: string) => {
  const resJson = replacePptJsonText(template, aiText)

  const resPpt = await exportPptFile(resJson)

  return resPpt
}
