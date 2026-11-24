# ClearCut AI — Background Remover

A responsive Machine Learning assignment web app for Crescent Institute of Science and Technology. It adapts the Hugging Face `remove-background-webgpu` example and runs MODNet in the browser with Transformers.js, producing a downloadable transparent PNG.

## Team
- Aashika — 240201601003
- Rifa Akthar — 2402016010

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The MODNet model downloads from Hugging Face the first time a user processes an image. The model is reused for subsequent images in the same page session.

## Build for Vercel

This is a static Vite application. Import the project into Vercel with the default settings:
- Build command: `npm run build`
- Output directory: `dist`

## Notes
- Upload limit: 100 MB per image, validated in the browser before processing.
- Image processing happens on the user's device. There is no upload API or server-side image storage.
- WebGPU is used when available; the app selects Transformers.js WASM mode when WebGPU is unavailable. Processing speed and the ability to handle very large images depend on the user's browser and device memory.
- A transparent PNG is created from the MODNet foreground matte.
- The original Hugging Face example and MODNet model are documented in the references below.

## Reference
- [Hugging Face Transformers.js background removal example](https://github.com/huggingface/transformers.js-examples/tree/main/remove-background-webgpu)
- [Xenova MODNet model](https://huggingface.co/Xenova/modnet)
