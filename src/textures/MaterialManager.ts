import { MeshLambertMaterial, NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three"
import grass from "./resources/grass.png"
import grassSide from "./resources/grass_side.png"
import dirt from "./resources/dirt.png"
import glass from "./resources/glass.png"
import stone from "./resources/stone.png"
import plank from "./resources/plank.png"
import bedrock from "./resources/bedrock.png"
import log from "./resources/log.jpg"
import type { BlockKey } from "../world/level/block/Block"

// const textureLoader = new TextureLoader();
// async function loadTexture(url: string) {
//   return new Promise<Texture>((resolve, reject) => {
//     const texture = textureLoader.load(url, resolve, undefined, reject);
//     texture.magFilter = NearestFilter; 
//     texture.colorSpace = SRGBColorSpace; 
//     // resolve(texture);
//   });
// } 
//1. 创建一个新的TextureLoader, 这是three.js提供的工具, 用于加载纹理
const textureLoader = new TextureLoader();
//2. 调用loadTexture(url)加载材质
function loadTexture(url: string) {
  const texture = textureLoader.load(url);
  if (texture) {
    texture.magFilter = NearestFilter; // 设置纹理的放大过滤器为 NearestFilter
    texture.colorSpace = SRGBColorSpace; // 设置纹理的颜色空间为 sRGB
  }
  return texture;
}
// 并行加载
// export async function loadTextures() {
//   const textures = await Promise.all([
//     loadTexture(grass),
//     loadTexture(grass_side),
//     loadTexture(dirt),
//     loadTexture(glass),
//     loadTexture(stone)
//   ]);
//   return {
//     grass: textures[0],
//     grassSide: textures[1],
//     dirt: textures[2],
//     glass: textures[3],
//     stone: textures[4]
//   };
// }

const grassTexture = loadTexture(grass);
const grassSideTexture = loadTexture(grassSide);
const dirtTexture = loadTexture(dirt);
const plankTexture = loadTexture(plank);
const logTexture = loadTexture(log);
const stoneTexture = loadTexture(stone);
const glassTexture = loadTexture(glass);
const bedrockTexture = loadTexture(bedrock);

export type Textures = {
  [key: string]: Texture
}
// export const textures: Textures = await loadTextures();
const textures: Textures = {
  grass: grassTexture,
  grassSide: grassSideTexture,
  dirt: dirtTexture,
  plank: plankTexture,
  log: logTexture,
  stone: stoneTexture,
  glass: glassTexture,
  bedrock: bedrockTexture
};

export function getMaterials(name: BlockKey): MeshLambertMaterial | MeshLambertMaterial[] {
  switch (name) {
    case "grass":
      return [
        new MeshLambertMaterial({ map: textures.grassSide }), // 右
        new MeshLambertMaterial({ map: textures.grassSide }), // 左
        new MeshLambertMaterial({ map: textures.grass }), // 上
        new MeshLambertMaterial({ map: textures.dirt }), // 下
        new MeshLambertMaterial({ map: textures.grassSide }), // 前
        new MeshLambertMaterial({ map: textures.grassSide }) // 后
      ]
    case "glass":
      return new MeshLambertMaterial({ map: textures["glass"], transparent: true, opacity: 0.6 }) // 透明材质
    default:
      return new MeshLambertMaterial({  map: textures[name] }) // 返回对应名称的材质
  }
  return new MeshLambertMaterial({ map: textures[name] }) // 返回对应名称的
}

export class MaterialManager {

}