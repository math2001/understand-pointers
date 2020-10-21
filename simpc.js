const evalSimpC = (function () {
  class TokenStream {
    constructor(tokens) {
      this.tokens = tokens;
      this.i = 0;
    }
    consume() {
      if (this.done()) {
        throw new Error("no more tokens");
      }
      return this.tokens[this.i++];
    }
    peek() {
      if (this.done()) {
        throw new Error("no more tokens");
      }
      return this.tokens[this.i];
    }
    done() {
      assert(this.i >= 0);
      assert(this.i <= this.tokens.length);
      return this.i === this.tokens.length;
    }

    view() {
      return this.tokens.slice(this.i);
    }
  }

  const parseTokens = (line) => {
    const chars = new TokenStream(line);
    // token types: word, number, operator, bracket

    let negativeNumber = false;
    const tokens = [];
    const buffer = [];
    while (!chars.done()) {
      const c = chars.consume();
      assert(c.length === 1);

      if (c === "/" && chars.peek() === "/") {
        while (!chars.done()) {
          // consume the comment
          chars.consume();
        }
      } else if (
        c === "+" ||
        c === "-" ||
        c === "=" ||
        c === "*" ||
        c === "/" ||
        c === "&"
      ) {
        // TODO: support |, &&, ||, ^, etc
        tokens.push({
          type: "operator",
          value: c,
        });
      } else if (c === "(" || c === ")") {
        tokens.push({
          type: "bracket",
          value: c,
        });
      } else if (isdigit(c)) {
        buffer.push(c);
        while (!chars.done() && isdigit(chars.peek())) {
          buffer.push(chars.consume());
        }
        tokens.push({
          type: "number",
          value: parseInt(buffer.join("")) * (negativeNumber ? -1 : 1),
        });
        buffer.length = 0; // clear the buffer
        negativeNumber = false;
      } else if (isletter(c)) {
        buffer.push(c);
        while (
          !chars.done() &&
          (isletter(chars.peek()) || isdigit(chars.peek()))
        ) {
          buffer.push(chars.consume());
        }
        tokens.push({
          type: "word",
          value: buffer.join(""),
        });
        buffer.length = 0;
      } else if (c === " ") {
      } else if (c === ";") {
        tokens.push({
          type: "semicolon",
          value: ";",
        });
      } else if (c === "'") {
        tokens.push({
          type: "single-quote",
        });
      } else {
        throw new SimpCError(`unknown char '${c}'`);
      }
    }

    return new TokenStream(tokens);
  };

  const istype = (word) => {
    return word === "int" || word === "char";
  };

  const noeol = (tokenline, hint) => {
    if (tokenline.done()) {
      if (hint !== undefined) {
        console.error("hint:", hint);
      }
      throw new SimpCError("CompileError: unexpected end of line");
    }
  };

  const evalExpr = (tokenline, memory) => {
    noeol(tokenline, "expected expression");
    const tree = buildExpressionTree(tokenline);
    const typedvalue = evalExpressionTree(tree, memory);

    noeol(tokenline, "forgot semicolon");
    const semicolon = tokenline.consume();
    assert(semicolon.type === "semicolon");

    return typedvalue;
  };

  return (line, memory) => {
    // the kind of lines we can get
    //   int a = 10;
    //   a = a + 20;
    //   int* p = &a;

    line = line.trim();

    const tokenline = parseTokens(line);
    if (tokenline.done()) {
      return false;
    }

    const first = tokenline.consume();

    // **p = &a;
    if (first.type === "operator" && first.value === "*") {
      // dereferencing a pointer
      let dereferenceCount = 1;
      while (
        tokenline.peek().type === "operator" &&
        tokenline.peek().value === "*"
      ) {
        tokenline.consume();
        dereferenceCount++;
      }

      const identifier = tokenline.consume();
      if (identifier.type !== "word") {
        throw new SimpCError("SyntaxError: expected word");
      }

      const equal = tokenline.consume();
      if (equal.type !== "operator" || equal.value !== "=") {
        throw new SimpCError("SyntaxError: expected equal");
      }

      const typedvalue = evalExpr(tokenline, memory);

      memory.setTypedValueDereference(
        identifier.value,
        dereferenceCount,
        typedvalue
      );

      return true;
    }

    if (first.type !== "word") {
      console.error(first);
      throw new SimpCError("SyntaxError: invalid first token");
    }

    if (istype(first.value)) {
      // declare new variable
      // int a;
      // int a = 10;
      let type = first.value;
      while (
        tokenline.peek().type === "operator" &&
        tokenline.peek().value === "*"
      ) {
        tokenline.consume();
        type = type + "*";
      }
      noeol(tokenline);

      const identifier = tokenline.consume();
      if (identifier.type !== "word") {
        console.error(identifier);
        throw new SimpCError("SyntaxError: expected identifier (type word)");
      }

      noeol(tokenline);

      const equal = tokenline.consume();
      if (equal.type === "semicolon") {
        assert(tokenline.done());
        memory.declare(identifier.value, type);
        return true;
      }
      noeol(tokenline);

      if (equal.type !== "operator" || equal.value !== "=") {
        console.error(equal);
        throw new SimpCError("SyntaxError: expected equal token");
      }
      const typedvalue = evalExpr(tokenline, memory);

      if (typedvalue.type === "null-pointer" && type.endsWith("*")) {
        typedvalue.type = type;
      }

      memory.initialize(identifier.value, type, typedvalue);
      return true;
    }

    if (first.type === "word") {
      noeol(tokenline, "a single word isn't a valid statement");

      const equal = tokenline.consume();
      assert(equal.type === "operator");
      assert(equal.value === "=");
      if (!memory.hasIdentifier(first.value)) {
        throw new SimpCError(`unknown variable ${first.value}`);
      }

      const typedvalue = evalExpr(tokenline, memory);
      const old = memory.getTypedValue(first.value);

      if (typedvalue.type === "null-pointer" && old.type.endsWith("*")) {
        typedvalue.type = old.type;
      }

      memory.setTypedValue(first.value, typedvalue);
      return true;
    }

    assert(false);
  };
})();
