// ====================================================================
//  La cache delle tele precalcolate: ogni scena ne è padrona di una parte
//  (c.alba, c.terra, …). Si riempie una volta sola, a pezzi, mentre girano
//  i loghi (vedi paesaggi.ts → preparaTutto), poi si legge soltanto.
// ====================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cache = Record<string, any>;

export const cacheTrailer: Cache = {};
