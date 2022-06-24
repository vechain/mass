// Warning: This list needs to be kept updated to chain-scanner's
export enum AssetType {
    VET = 0,
    VTHO,
    PLA,
    SHA,
    EHrT,
    DBET,
    TIC,
    OCE,
    SNK,
    JUR,
    AQD,
    YEET,
    HAI,
    MDN,
    VEED,
    VPU,
    MVG,
    WoV,
    GEMS,
    VEX,
    VEUSD,
    DHN,
    UNION,
    VST,
    PPR,
    DRAGON
}

export interface Token {
    name: string
    address: string
    symbol: string
    decimals: number
}