/// <reference types="vite/client" />

import type { FavellaApi } from '../../preload/index'

declare global {
  interface Window {
    favella: FavellaApi
  }
}

export {}
