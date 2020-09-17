const runSimpC = (function() {
    const types = ['int', 'char']

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

    class TokenStream {
        constructor(tokens) {
            this.tokens = tokens
            this.i = 0
        }
        consume() {
            assert(!this.done())
            return this.tokens[this.i++]
        }
        peek() {
            assert(!this.done())
            return this.tokens[this.i]
        }
        done() {
            assert(this.i >= 0)
            assert(this.i <= this.tokens.length)
            return this.i === this.token.length
        }
    }

    const parseTokens = (line) => {
        const chars = new TokenStream(line)
        // token types: word, number, operator

        const tokens = []
        const buffer = []
        while (!chars.done()) {
            const c = chars.consume()
            assert(c.length === 1)

            // TODO: support *, /, &, |, &&, ||, ^, etc
            if (c === "+" || c === "(" || c === ")" || c === "-" || c === '=') {
                tokens.push({
                    type: 'operator',
                    value: c,
                })
            } else if (isdigit(c)) {
                buffer.push(c)
                while (isdigit(chars.peek())) {
                    buffer.push(chars.consume())
                }
                tokens.push({
                    type: 'number',
                    value: parseInt(buffer.join(''), 10)
                })
                buffer.length = 0 // clear the buffer
            } else if (isletter(c)) {
                buffer.push(c)
                while (isletter(chars.peek()) || isdigit(chars.peek())) {
                    buffer.push(chars.consume())
                }
                tokens.push({
                    type: 'word',
                    value: buffer.join('')
                })
                buffer.length = 0
            } else if (c === ' ') {

            } else if (c === ';') {
                tokens.push({
                    type: 'semicolon',
                    value: ';'
                })
                if (chars.done()) {
                    console.error(`line: '${line}'`)
                    throw new Error(`nothing should come after ;`)
                }
            } else {
                console.error(`line: '${line}'`)
                throw new Error(`unknown char '${c}'`)
            }
        }
        return new TokenStream(tokens)
    }

    const istype = word => {
        return (
            word === "int" ||
            word === "char" ||
        )
    }

    return (line, memory) => {
        // the kind of lines we can get
        //   int a = 10;
        //   a = a + 20;
        //   int p = &a;

        const tokenline = parseTokens(line)
        const first = tokenline.consume()
        if (first.type !== 'word') {
            console.error(token)
            throw new Error("SyntaxError: invalid first token")
        }
        if (istype(first.value)) {
            // declare new variable
            // int a = 10;
            let type = first.value;
            if (tokenline.peek().type === 'operator' && tokenline.peek().value === "*") {
                tokeline.consume()
                type = first.value + '*'
            }
            const identifier = tokenline.consume()
            if (identifier.type !== "word") {
                console.error(identifier)
                throw new Error("SyntaxError: expected identifer (type word)")
            }
            const equal = tokenline.consume()
            if (equal.type === 'semicolon') {
                assert(tokenline.done())
                return
            }

            if (equal.type !== "operator" || equal.value !== "=") {
                console.error(equal)
                throw new Error("SyntaxError: expected equal token")
            }
            const value = parseExpr(tokenline)
            memory.initialize(identifier, value)
        }
    }
})();