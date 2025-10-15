const TEMPLATE_NET_URL = 'https://mock-mongodb.jova.bio/api'
const API_KEY = 'app-NoTrEdOm9BHuZYOO7SPg0GoZ'
const AI_NET_URL = 'https://ai.dev.helixlife.app/v1'
/**
 * 通用 fetch 封装
 */
async function aiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  try {
    const response = await fetch(`${url}`, {
      headers: {
        'x-api-key': `helix`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      return {
        success: false,
        message: (data as any)?.error || response.statusText,
        status: response.status
      }
    }

    return { success: true, data, status: response.status }
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.name === 'TypeError') {
      // 网络错误 / 断网
      return { success: false, message: '网络连接失败', status: 0 }
    }
    return { success: false, message: error.message || '未知错误', status: -1 }
  }
}

/**
 * 获取项目下特定 JSON 条目
 * GET /:projectKey/:itemKey
 */
export async function getProjectItem<T = any>(
  projectKey: string,
  itemKey: string
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  return aiFetch<T>(`${TEMPLATE_NET_URL}/${projectKey}/${itemKey}`, { method: 'GET' })
}

/**
 * 获取AI 生成的PPT 文本数据
 * POST
 */
export async function getAiPptText<T = any>(
  value: string
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  return aiFetch<T>(`${AI_NET_URL}/completion-messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      response_mode: 'blocking',
      query: value || '',
      inputs: {}
    })
  })
}

// 错误处理工具
export const handleApiError = (error: any) => {
  console.error('API Error:', error)
  if (error.response) {
    // 服务器响应错误
    return {
      success: false,
      message: error.response.data?.error || '服务器错误',
      status: error.response.status
    }
  } else if (error.request) {
    // 网络错误
    return {
      success: false,
      message: '网络连接失败',
      status: 0
    }
  } else {
    // 其他错误
    return {
      success: false,
      message: error.message || '未知错误',
      status: -1
    }
  }
}
