import glShader from 'gl-shader';
import glFBO from 'gl-fbo';
// gl-texture2d isn't actually directly depended on, we just need its types. Until TS 3.8, we an't only import its types
// eslint-disable-next-line import/no-extraneous-dependencies
import texture2D from 'gl-texture2d';

export type Texture = ReturnType<typeof texture2D>
export type Framebuffer = ReturnType<typeof glFBO>
export type Shader = ReturnType<typeof glShader>
