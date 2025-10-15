export enum PptSliceEnum {
  End = 'end', // 结束
  Content = 'content', // 内容
  Transition = 'transition', //过渡 标题
  Contents = 'contents', // 目录
  Cover = 'cover', // 封面
  ContentsZero = 'contents-0',
  ContentsFive = 'contents-5',
  ContentsSix = 'contents-6',
  ContentsSeven = 'contents-7',
  ContentsEight = 'contents-8',
  ContentsOne = 'contents-1',
  ContentsTwo = 'contents-2',
  ContentsThree = 'contents-3',
  ContentsFour = 'contents-4'
}

export const sliceTypeMap: Record<number, PptSliceEnum> = {
  0: PptSliceEnum.ContentsZero,
  1: PptSliceEnum.ContentsOne,
  2: PptSliceEnum.ContentsTwo,
  3: PptSliceEnum.ContentsThree,
  4: PptSliceEnum.ContentsFour,
  5: PptSliceEnum.ContentsFive,
  6: PptSliceEnum.ContentsSix,
  7: PptSliceEnum.ContentsSeven,
  8: PptSliceEnum.ContentsEight
}

// 基础页面接口
export interface BasePptSlice {
  type: PptSliceEnum
}

// 封面页面
export interface CoverSlice extends BasePptSlice {
  type: PptSliceEnum.Cover
  data: {
    title: string
    text?: string
  }
}

// 目录页面
export interface ContentsSlice extends BasePptSlice {
  type: PptSliceEnum.Contents
  data: {
    items: string[]
  }
}
// 过渡页面
export interface TransitionSlice extends BasePptSlice {
  type: PptSliceEnum.Transition
  data: {
    title: string
    text?: string
  }
}

// 内容页面项目
export interface ContentItem {
  title: string
  text?: string
}

// 内容页面
export interface ContentSlice extends BasePptSlice {
  type: PptSliceEnum.Content
  data: {
    title: string
    items: ContentItem[]
  }
}

// 结束页面
export interface EndSlice extends BasePptSlice {
  type: PptSliceEnum.End
  data: {
    title: string
    text?: string
  }
}

// 所有PPT页面的联合类型
export type PptSlice = CoverSlice | ContentsSlice | TransitionSlice | ContentSlice | EndSlice

//标题类型
export enum CustomTitleType {
  H1 = 'h1_custom',
  H2 = 'h2_custom',
  H3 = 'h3_custom',
  H4 = 'h4_custom',
  H5 = 'h5_custom',
  P = 'p_custom'
}
