import { Registries } from "../core/registries/Registries";
import type { Registry } from "../core/Registry";
import type { Item } from "../world/item/Item";
import type { Block } from "../world/level/block/Block";
import { ResourceLocation } from "./ResourceLocation";

// 使用 WeakRef 和 FinalizationRegistry 实现高效缓存
class ResourceKeyCache {
    private static readonly cache = new Map<string, WeakRef<ResourceKey<any>>>();
    private static readonly registry = new FinalizationRegistry((key: string) => {
        ResourceKeyCache.cache.delete(key);
    });

    static get<T>(registry: ResourceLocation, location: ResourceLocation): ResourceKey<T> | undefined {
        const key = this.getCacheKey(registry, location);
        const ref = this.cache.get(key);
        return ref?.deref() as ResourceKey<T> | undefined;
    }

    static set<T>(registry: ResourceLocation, location: ResourceLocation, instance: ResourceKey<T>) {
        const key = this.getCacheKey(registry, location);
        this.cache.set(key, new WeakRef(instance));
        this.registry.register(instance, key, instance);
    }

    private static getCacheKey(registry: ResourceLocation, location: ResourceLocation): string {
        return `${registry.toString()}|${location.toString()}`;
    }
}

// 注册表键类
export class ResourceKey<T> {
    private readonly registry: ResourceLocation;
    private readonly location: ResourceLocation;

    private constructor(registry: ResourceLocation, location: ResourceLocation) {
      this.registry = registry;
      this.location = location;
    }

    // ============= 工厂方法 =============
    static create<T>(registryKey: ResourceKey<Registry<any>>, location: ResourceLocation): ResourceKey<T> {
        return this.createInternal(registryKey.location, location);
    }
    // 创建注册表本身的资源键
    static createRegistryKey<T>(registryLocation: ResourceLocation): ResourceKey<Registry<T>> {
        return this.createInternal<T>(Registries.ROOT_REGISTRY_NAME, registryLocation);
    }

    private static createInternal<T>(registryLocation: ResourceLocation, resourceLocation: ResourceLocation): ResourceKey<T> {
        // 尝试从缓存获取
        const cached = ResourceKeyCache.get(registryLocation, resourceLocation);
        if (cached) return cached;

        // 创建新实例并缓存
        const newKey = new ResourceKey(registryLocation, resourceLocation);
        ResourceKeyCache.set(registryLocation, resourceLocation, newKey);
        return newKey;
    }

    // ============= 类型安全方法 =============
    isFor(registryKey: ResourceKey<Registry<any>>): boolean {
        return this.registry.equals(registryKey.location);
    }

    cast<E>(targetRegistry: ResourceKey<Registry<E>>): ResourceKey<E> | null {
        return this.isFor(targetRegistry) ? this as unknown as ResourceKey<E> : null;
    }

    // ============= 序列化支持 =============
    static codec<T>(registryKey: ResourceKey<Registry<T>>): Codec<ResourceKey<T>> {
        return {
            encode: (key: ResourceKey<T>) => key.location,
            decode: (location: ResourceLocation) => this.create(registryKey, location)
        };
    }

    // ============= 实用方法 =============
    toString(): string {
        return `ResourceKey[${this.registry} / ${this.location}]`;
    }

    getLocation(): ResourceLocation {
        return this.location;
    }

    registryKey(): ResourceKey<Registry<T>> {
        return ResourceKey.createRegistryKey<T>(this.registry);
    }
}

// ============= 辅助类型和常量 =============
interface Codec<T> {
    encode(value: T): ResourceLocation;
    decode(location: ResourceLocation): T;
}


// 根注册表常量
// const ROOT_REGISTRY = new ResourceLocation("minecraft", "root_registry");

// ============= 使用示例 =============

// 1. 创建注册表键
const ITEM_REGISTRY_KEY = ResourceKey.createRegistryKey<Item>(
    new ResourceLocation("minecraft", "item")
);

// 2. 创建资源键
const DIAMOND_KEY = ResourceKey.create<Item>(
    ITEM_REGISTRY_KEY,
    new ResourceLocation("minecraft", "diamond")
);

// 3. 类型安全验证
console.log(DIAMOND_KEY.isFor(ITEM_REGISTRY_KEY)); // true

// 4. 安全类型转换
const BLOCK_REGISTRY_KEY = ResourceKey.createRegistryKey<Block>(
    new ResourceLocation("minecraft", "block")
);
const casted = DIAMOND_KEY.cast(BLOCK_REGISTRY_KEY);
console.log(casted); // null (类型不匹配)

// 5. 序列化/反序列化
const itemCodec = ResourceKey.codec(ITEM_REGISTRY_KEY);
const serialized = itemCodec.encode(DIAMOND_KEY);
console.log(serialized.toString()); // "minecraft:diamond"

const deserialized = itemCodec.decode(serialized);
console.log(deserialized === DIAMOND_KEY); // true (相同实例)

// 6. 缓存验证
const anotherDiamond = ResourceKey.create<Item>(
    ITEM_REGISTRY_KEY,
    new ResourceLocation("minecraft", "diamond")
);
console.log(anotherDiamond === DIAMOND_KEY); // true (相同实例)