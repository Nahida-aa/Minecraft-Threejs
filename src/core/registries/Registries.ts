import  { ResourceKey } from "../../resources/ResourceKey";
import { ResourceLocation } from "../../resources/ResourceLocation";
import  { Registry } from "../Registry";

export class Registries {
  public static readonly ROOT_REGISTRY_NAME: ResourceLocation = ResourceLocation.withDefaultNamespace("root");

  private static createRegistryKey<T>(string: string): ResourceKey<Registry<T>> {
    return ResourceKey.createRegistryKey(ResourceLocation.withDefaultNamespace(string));
  }
}