import type { Box } from './Box.js';

export type BoxFilter<T = any> = (box: Box<T>) => boolean;
