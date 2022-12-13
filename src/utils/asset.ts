/* this file is generated by scripts/load-token */
import { AssetType, Token } from '../types'

const tokens: { [index: string]: Token } = {"PLA":{"name":"Plair","symbol":"PLA","address":"0x89827f7bb951fd8a56f8ef13c5bfee38522f2e1f","decimals":18},"SHA":{"name":"Safe Haven","symbol":"SHA","address":"0x5db3c8a942333f6468176a870db36eef120a34dc","decimals":18},"EHrT":{"name":"Eight Hours Token","symbol":"EHrT","address":"0xf8e1faa0367298b55f57ed17f7a2ff3f5f1d1628","decimals":18},"DBET":{"name":"Decent.bet","symbol":"DBET","address":"0x1b8ec6c2a45cca481da6f243df0d7a5744afc1f8","decimals":18},"TIC":{"name":"TicTalk","symbol":"TIC","address":"0xa94a33f776073423e163088a5078feac31373990","decimals":18},"OCE":{"name":"OceanEx","symbol":"OCE","address":"0x0ce6661b4ba86a0ea7ca2bd86a0de87b0b860f14","decimals":18},"SNK":{"name":"SneakerCoin","symbol":"SNK","address":"0x540768b909782c430cc321192e6c2322f77494ec","decimals":18},"JUR":{"name":"Jur","symbol":"JUR","address":"0x46209d5e5a49c1d403f4ee3a0a88c3a27e29e58d","decimals":18},"AQD":{"name":"Aqua Diamond Token","symbol":"AQD","address":"0xf9fc8681bec2c9f35d0dd2461d035e62d643659b","decimals":18},"YEET":{"name":"Yeet Coin","symbol":"YEET","address":"0xae4c53b120cba91a44832f875107cbc8fbee185c","decimals":18},"HAI":{"name":"HackenAI","symbol":"HAI","address":"0xacc280010b2ee0efc770bce34774376656d8ce14","decimals":8},"MDN":{"name":"Madini","symbol":"MDN","address":"0x1b44a9718e12031530604137f854160759677192","decimals":18},"VEED":{"name":"VIMworld","symbol":"VEED","address":"0x67fd63f6068962937ec81ab3ae3bf9871e524fc9","decimals":18},"VPU":{"name":"VPunks Token","symbol":"VPU","address":"0xb0821559723db89e0bd14fee81e13a3aae007e65","decimals":18},"MVG":{"name":"Mad Viking Games","symbol":"MVG","address":"0x99763494a7b545f983ee9fe02a3b5441c7ef1396","decimals":18},"WoV":{"name":"WorldOfV","symbol":"WoV","address":"0x170f4ba8e7acf6510f55db26047c83d13498af8a","decimals":18},"GEMS":{"name":"GEMS","symbol":"GEMS","address":"0x28c61940bdcf5a67158d00657e8c3989e112eb38","decimals":18},"VEX":{"name":"Vexchange","symbol":"VEX","address":"0x0bd802635eb9ceb3fcbe60470d2857b86841aab6","decimals":18},"VEUSD":{"name":"VeUSD","symbol":"VEUSD","address":"0x4e17357053da4b473e2daa2c65c2c949545724b8","decimals":6},"VVET":{"name":"Veiled VET","symbol":"VVET","address":"0x45429a2255e7248e57fce99e7239aed3f84b7a53","decimals":18},"DHN":{"name":"Dohrnii","symbol":"DHN","address":"0x8e57aadf0992afcc41f7843656c6c7129f738f7b","decimals":18},"UNION":{"name":"UNION token","symbol":"UNION","address":"0x34109fc2a649965eecd953d31802c67dcc183d57","decimals":18},"VST":{"name":"VeStacks","symbol":"VST","address":"0xb9c146507b77500a5cedfcf468da57ba46143e06","decimals":18},"PPR":{"name":"Paper Token","symbol":"PPR","address":"0x2f10726b240d7efb08671f4d5f0a442db6f29416","decimals":18},"DRAGON":{"name":"Dragon Coin","symbol":"DRAGON","address":"0x107a0b0faeb58c1fdef97f37f50e319833ad1b94","decimals":18},"VSEA":{"name":"VeSea Token","symbol":"VSEA","address":"0x23368c20c16f64ecbb30164a08666867be22f216","decimals":18},"BANANA":{"name":"BananaCoin","symbol":"BANANA","address":"0xf01069227b814f425bad4ba70ca30580f2297ae8","decimals":18},"GOLD":{"name":"GOLD Coin","symbol":"GOLD","address":"0xff3bc357600885aaa97506ea6e24fb21aba88fbd","decimals":18},"LGCT":{"name":"LEGACY TOKEN","symbol":"LGCT","address":"0xb28a08d4e0fd0a7bdbe7461188f0ba5183f95298","decimals":18}}

const AssetLiterals = Object.keys(AssetType).filter(x => x !== parseFloat(x).toString())
const AssetMap = new Map<string, string>()
for (let asset of AssetLiterals) {
    AssetMap.set(asset.toLowerCase(), asset)
}

export const normalizeAsset = (asset: string): string | null => {
    const key = asset.toLowerCase()
    if (AssetMap.has(key)) {
        return AssetMap.get(key)!
    }
    return null
}

export const getAssetDecimals = (symbol: keyof typeof AssetType): number => {
    if (symbol === 'VET' || symbol === 'VTHO') {
        return 18
    }

    return tokens[symbol].decimals
}
