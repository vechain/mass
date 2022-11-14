export enum Network {
    MainNet = '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a',
    TestNet = '0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127'
}

export interface ForkConfig {
    VIP220: number;
}

export const getForkConfig = (net: Network): ForkConfig => {
    if (net === Network.TestNet) {
        return {
            VIP220: 13086360
        }
    }

    // mainnet
    return {
        VIP220: 13815000
    }
}
