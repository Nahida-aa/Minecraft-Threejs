export class ResourceLocation0 {
  private readonly namespace: string;
  private readonly path: string;
  constructor(namespace: string, path: string) {
      this.namespace = namespace;
      this.path = path;
  }

  public static isValidPath(value: string): boolean {
        for (let i = 0; i < value.length; i++) {
            if (!this.validPathChar(value.charAt(i))) {
                return false;
            }
        }
        return true;
    }
  public static isValidNamespace(value: string): boolean {
        for (let i = 0; i < value.length; i++) {
            if (!this.validNamespaceChar(value.charAt(i))) {
                return false;
            }
        }
        return true;
    }
  public static validPathChar(char: string): boolean {
    return char === '_' || 
            char === '-' || 
            (char >= 'a' && char <= 'z') || 
            (char >= '0' && char <= '9') || 
            char === '/' || 
            char === '.';
  }
  public static validNamespaceChar(char: string): boolean {
    return char === '_' || char === '-' || 
            (char >= 'a' && char <= 'z') || 
            (char >= '0' && char <= '9') || 
            char === '.';
  }

  toString(): string {
      return `${this.namespace}:${this.path}`;
  }

  // equals(other: ResourceLocation): boolean {
  //     return this.namespace === other.namespace && this.path === other.path;
  // }
}

export class ResourceLocation {
  private readonly namespace: string;
  private readonly path: string;
  constructor(namespace: string, path: string) {
    this.namespace = namespace;
    this.path = path;
    if (!ResourceLocation.isValidNamespace(namespace)) {
        throw new Error(`Invalid namespace: ${namespace}`);
    }
    if (!ResourceLocation.isValidPath(path)) {
        throw new Error(`Invalid path: ${path}`);
    }
  }

    public static withDefaultNamespace(path: string): ResourceLocation {
        return new ResourceLocation(
            "mc",
            ResourceLocation.assertValidPath(
                "mc", 
                path
            )
        );
    }

    // ================ 路径验证方法 ================
    private static assertValidPath(namespace: string, path: string): string {
        if (!this.isValidPath(path)) {
            throw new Error(
                `Non [a-z0-9/._-] character in path of location: ${namespace}:${path}`
            );
        }
        return path;
    }

    public static isValidPath(value: string): boolean {
        for (let i = 0; i < value.length; i++) {
            if (!this.validPathChar(value.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    public static validPathChar(char: string): boolean {
        return char === '_' || char === '-' || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '/' || char === '.';
    }

    // ================ 命名空间验证 ================
    public static isValidNamespace(value: string): boolean {
        for (let i = 0; i < value.length; i++) {
            if (!this.validNamespaceChar(value.charAt(i))) {
                return false;
            }
        }
        return true;
    }

    public static validNamespaceChar(char: string): boolean {
        return char === '_' || char === '-' || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char === '.';
    }

    // ================ 实用方法 ================
    public toString(): string {
        return `${this.namespace}:${this.path}`;
    }
    
    public toDebugFileName(): string {
        return this.toString().replace(/\//g, '_').replace(/:/g, '_');
    }

    public equals(other: ResourceLocation): boolean {
        return this.namespace === other.namespace && this.path === other.path;
    }
}