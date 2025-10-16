# export-ppt

Generate PPTX files by combining a saved template with AI-generated text. Works in browser and Node.js.

## Features

- ✅ Simple API: `exportPpt(id, content)` → `{ loading: false, pptUrl: string }`
- ✅ Browser ESM and Node CJS/ESM supported
- ✅ Bundled for browser usage (no extra config)

## Installation

```bash
# npm
npm i export-ppt

# pnpm
pnpm add export-ppt

# yarn
yarn add export-ppt
```

## Usage

### Browser (bundlers or plain ESM)

```ts
import { exportPpt } from 'export-ppt'

const pptUrl = await exportPpt('your-project-id', '请生成 AI 文案...')
```

### Node.js

```ts
import { exportPpt } from 'export-ppt'

async function run() {
  const pptUrl = await exportPpt('your-project-id', 'Generate AI content')
  console.log('PPT URL:', pptUrl)
}

run()
```

## API

```ts
export declare function exportPpt(templateJson: string, textJson: string): Promise<{ pptUrl }>
```

- **id**: Template project id from your storage/API
- **content**: Prompt text for AI text generation
- Returns: `{ loading: false, pptUrl }` where `pptUrl` is a downloadable URL

## Example Page

This repo includes a simple browser example:

## License

MIT
