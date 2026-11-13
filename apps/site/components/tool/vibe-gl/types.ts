export interface IVibeShader {
  frag: string;
  // Share of the CSS pixel size the scene is drawn at; soft scenes look the same at half size and cost a quarter.
  scale: number;
}
