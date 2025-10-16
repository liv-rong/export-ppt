import * as pptxgenjs from 'pptxgenjs';

declare const exportPpt: (template: string, aiText: string) => Promise<pptxgenjs.default | undefined>;

declare enum PptSliceEnum {
    End = "end",// 结束
    Content = "content",// 内容
    Transition = "transition",//过渡 标题
    Contents = "contents",// 目录
    Cover = "cover",// 封面
    ContentsZero = "contents-0",
    ContentsFive = "contents-5",
    ContentsSix = "contents-6",
    ContentsSeven = "contents-7",
    ContentsEight = "contents-8",
    ContentsOne = "contents-1",
    ContentsTwo = "contents-2",
    ContentsThree = "contents-3",
    ContentsFour = "contents-4"
}
interface BasePptSlice {
    type: PptSliceEnum;
}
interface CoverSlice extends BasePptSlice {
    type: PptSliceEnum.Cover;
    data: {
        title: string;
        text?: string;
    };
}
interface ContentsSlice extends BasePptSlice {
    type: PptSliceEnum.Contents;
    data: {
        items: string[];
    };
}
interface TransitionSlice extends BasePptSlice {
    type: PptSliceEnum.Transition;
    data: {
        title: string;
        text?: string;
    };
}
interface ContentItem {
    title: string;
    text?: string;
}
interface ContentSlice extends BasePptSlice {
    type: PptSliceEnum.Content;
    data: {
        title: string;
        items: ContentItem[];
    };
}
interface EndSlice extends BasePptSlice {
    type: PptSliceEnum.End;
    data: {
        title: string;
        text?: string;
    };
}
type PptSlice = CoverSlice | ContentsSlice | TransitionSlice | ContentSlice | EndSlice;

declare function parsePptMarkdown(md: string): PptSlice[];

export { exportPpt, parsePptMarkdown };
