const buildExpressionTree = (function () {
    const reachedEnd = tokenline => {
        return tokenline.done() || tokenline.peek().type === "semicolon"
    }

    const getBindingPower = operator => {
        if (operator === "+" || operator === "-") {
            return 10
        } else if (operator === "*" || operator === "/") {
            return 20
        }
        console.error('unknown operator', operator)
        assert(false)
    }

    const nud = tokenline => {
        assert(!tokenline.done())
        const token = tokenline.consume()
        if (token.type === "bracket" && token.value === "(") {
            return parseExpr(tokenline, 0)
        } if (token.type === 'operator' && token.value === "-") {
            if (reachedEnd(tokenline)) {
                throw new Error("unexpected end of expression")
            }
            const number = tokenline.consume()
            if (number.type !== "number") {
                throw new Error("expected number of negative sign")
            }

            return {
                type: 'number',
                value: -1 * number.value
            }
        }
        assert(token.type === "number" || token.type === "word")
        return token
    }

    const led = (left, tokenline) => {
        const operator = tokenline.consume()
        if (operator.type !== "operator") {
            console.error(operator)
            throw new Error("CompileError: expected operator")
        }
        if (tokenline.done()) {
            throw new Error("CompileError: unexpected eol")
        }

        const right = parseExpr(tokenline, getBindingPower(operator.value))
        return {
            left: left,
            operator: operator.value,
            right: right
        }
    }

    const parseExpr = (tokenline, bindingpower) => {
        let left = nud(tokenline)
        while (
            !reachedEnd(tokenline) &&
            !(tokenline.peek().type === "bracket" && tokenline.peek().value === ")") &&
            getBindingPower(tokenline.peek().value) > bindingpower) {

            left = led(left, tokenline)
        }

        if (!reachedEnd(tokenline) && tokenline.peek().type === "bracket" && tokenline.peek().value === ")") {
            tokenline.consume()
        }

        return left
    }

    return tokenline => parseExpr(tokenline, 0)
})()

const evalExpressionTree = (function() {
    const requireMatchingType = (left, right) => {
        assert(typeof left.type === "string")
        assert(typeof right.type === "string")
        if (left.type !== right.type) {
            console.error(left, right)
            throw new Error("dismatching types")
        }
    }

    return (node, memory) => {
        assert(node !== undefined)
        assert(memory !== undefined)

        if (node.left === undefined || node.right === undefined || node.operator === undefined) {
            assert(node.left === undefined)
            assert(node.right === undefined)
            assert(node.operator === undefined)

            // it's not a node, but an actual value
            if (node.type === "word") {
                // identifier
                if (!memory.hasIdentifier(node.value)) {
                    throw new Error(`unknown variable ${node.value}`)
                }

                return memory.getTypedValue(node.value)
            }

            assert(node.type === "number")
            // we could handle constants like go does, but i'm taking the easy
            // route here
            assert(isinteger(node.value))
            return {
                type: 'int',
                value: node.value
            }
        }

        const left = evalExpressionTree(node.left, memory)
        const right = evalExpressionTree(node.right, memory)

        if (node.operator === "+") {
            requireMatchingType(left, right)
            if (left.type === "int") {
                return {
                    type: 'int',
                    value: left.value + right.value
                }
            } else {
                throw new Error(`operator '+' not implemented for '${left.type}'`)
            }
        } else if (node.operator === "-") {
            requireMatchingType(left, right)
            if (left.type === "int") {
                return {
                    type: 'int',
                    value: left.value - right.value
                }
            } else {
                throw new Error(`operator '-' not implemented for '${left.type}'`)
            }
        } else if (node.operator === "*") {
            requireMatchingType(left, right)
            if (left.type === "int") {
                return {
                    type: 'int',
                    value: left.value * right.value
                }
            } else {
                throw new Error(`operator '*' not implemented for '${left.type}'`)
            }
        } else if (node.operator === "/") {
            requireMatchingType(left, right)
            if (left.type === "int") {
                return {
                    type: 'int',
                    value: Math.trunc(left / right)
                }
            } else {
                throw new Error(`operator '/' not implemented for '${left.type}'`)
            }
        } else {
            throw new Error(`'unknown operator: ${node.operator}`)
        }
    }
})()