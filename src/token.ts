export interface TokenConfig {
    [index: string]: {
        type: number // this type is a number that defined by the backend which indicates the index/type of the token
        decimals: number
    }
}

// token config requires to be setup before using
// it is required to be setup at the server startup
let config: TokenConfig | null = null
const symbols = new Map<string, string>()
const typeToSymbol = new Map<number, string>()

export const normalizeAsset = (asset: string): string | null => {
    const key = asset.toLowerCase()
    if (symbols.has(key)) {
        return symbols.get(key)!
    }
    return null
}

export const getAssetDecimals = (symbol: string): number => { 
    if (config) {
        const token = config[symbol]
        if (token) {
            return token.decimals
        }
    }

    return 18
}

export const getAssetType = (symbol: string): number => { 
    if (config) {
        const token = config[symbol]
        if (token) {
            return token.type
        }
    }

    return -1
}

export const getAssetSymbol = (type: number): string => { 
    if (typeToSymbol.has(type)) {
        return typeToSymbol.get(type)!
    }

    return 'N/A'
}

export const setupToken = (conf: TokenConfig) => { 
    config = conf
    for (const symbol in conf) {
        const token = conf[symbol]
        symbols.set(symbol.toLowerCase(), symbol)
        typeToSymbol.set(token.type, symbol)
    }
}
