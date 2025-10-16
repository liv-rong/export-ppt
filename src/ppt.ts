import { replacePptJsonText, exportPptFile } from './utils'
import { parsePptMarkdown } from './utils/mdPpt'

export const exportPpt = async (template: string, aiText: string) => {
  const pptSlices = parsePptMarkdown(aiText)

  const aiTextJson = JSON.stringify(pptSlices)

  const resJson = replacePptJsonText(template, aiTextJson)

  const resPpt = await exportPptFile(resJson)

  return resPpt
}
