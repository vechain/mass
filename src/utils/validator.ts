export function isHexString(val: string) {
    return typeof val === 'string' && /^0x[0-9a-f]+$/.test(val)
}

export function isHexBytes(val: string, n?: number) {
    if (typeof val !== 'string' || !/^0x[0-9a-f]*$/.test(val)) {
        return false
    }
    return n ? val.length === n * 2 + 2 : val.length % 2 === 0
}

export function isUInt(val: number) {
    if (val < 0 || !Number.isInteger(val)) {
        return false
    }
    return true
}

export function isDate(val:string) {
    return /^(19|20)\d{2}-(0[1-9]|1[0-2])-([0-2][1-9]|[1-3][0-1])$/.test(val) && !isNaN(Date.parse(val))
}
