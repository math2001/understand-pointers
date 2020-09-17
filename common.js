const assert = (condition) => {
    if (typeof condition !== "boolean") {
        console.error(condition, typeof condition)
        throw new Error("expected boolean")
    }
    if (!condition) {
        throw new Error('assertion error')
    }
}

const isdigit = char => {
    assert(char.length === 1)
    return c.charCodeAt(0) >= '0'.charCodeAt(0) && c.charCodeAt(0) <= '9'.charCodeAt(0)
}

const isletter = char => {
    assert(char.length === 1)
    return (
        (c.charCodeAt(0) >= 'a'.charCodeAt(0) && c.charCodeAt(0) <= 'z'.charCodeAt(0)) ||
        (c.charCodeAt(0) >= 'A'.charCodeAt(0) && c.charCodeAt(0) <= 'Z'.charCodeAt(0))
    )
}

const isinteger = (n) => {
    assert(typeof n === "number")
    return n === Math.trunc(n)
}