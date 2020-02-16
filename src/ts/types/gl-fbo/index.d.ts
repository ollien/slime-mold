// Type definitions for gl-fbo 2.0
// Project: https://github.com/stackgl/gl-fbo
// Definitions by: Nick Krichevsky <https://github.com/ollien>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// This was submitted to DefinitelyTyped as a PR, but has not been approved yet, so it is in my package for now.

import texture2D = require('gl-texture2d');

type Texture = ReturnType<typeof texture2D>;

// eslint-disable-next-line no-unused-vars
declare class FrameBuffer {
    shape: [number, number];
    gl: WebGLRenderingContext;
    handle: WebGLFramebuffer;
    color: Texture[];
    depth: Texture|null;

    bind(): void;
    dispose(): void;
}

interface FrameBufferOptions {
    preferFloat?: boolean;
    float?: boolean;
    color?: number;
    depth?: boolean;
    stencil?: boolean;
}

 declare function glFBO(
     gl: WebGLRenderingContext,
     shape: [number, number],
     options?: FrameBufferOptions
 ): FrameBuffer;

 export = glFBO;
