import { ResourceLocation } from "../../../resources/ResourceLocation";
import type { ResourceManager } from "../../../server/packs/resources/ResourceManager";
import type { AbstractTexture } from "./AbstractTexture";

// 纹理管理器, Texture: 纹理,贴图; Material: 材质
export class TextureManager {
  public static readonly INTENTIONAL_MISSING_TEXTURE: ResourceLocation = ResourceLocation.withDefaultNamespace("");
  // 存储所有已注册的纹理，k:纹理的资源位置（ResourceLocation）, v: AbstractTexture
  private textures: Map<ResourceLocation, AbstractTexture> = new Map();
  private readonly resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
  }

  public register(resourceLocation: ResourceLocation, abstractTexture: AbstractTexture): void {

  }
}

