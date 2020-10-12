const META_KEY = 1
const CTRL_KEY = 2
const ALT_KEY = 4
const SHIFT_KEY = 8

class Editor {
    constructor(element) {
        this.editor = element
        this.glyphsize = this._computeGlyphSize()
        this.content = Array.from(localStorage.getItem('editor-content') || "")

        this.editor.addEventListener("focus", e => {
            this.editor.classList.add("editor-focus")
        })

        this.editor.addEventListener("blur", e => {
            this.editor.classList.remove("editor-focus")
        })

        this.editor.addEventListener("keydown", e => {
            let mods = 0

            if (e.ctrlKey) mods |= CTRL_KEY
            if (e.metaKey) mods |= META_KEY
            if (e.altKey) mods |= ALT_KEY
            if (e.shiftKey) mods |= SHIFT_KEY

            if ((mods === 0 || mods === SHIFT_KEY) && e.key.length == 1) {
                this.inserCharAtCaret(e.key)
            } else if (mods === 0 && e.key == "Enter") {
                this.inserCharAtCaret('\n')
            }

            else if (mods === 0 && e.key == "Backspace") {
                this.removeCharAtCaret()
            } else if (mods === 0 && e.key == "Delete") {
                this.removeCharAfterCaret()
            }

            else if (mods === CTRL_KEY && e.key == "Backspace") {
                this.removeWordAtCaret()
            } else if (mods === CTRL_KEY && e.key == "Delete") {
                this.removeWordAfterCaret()
            }

            else if (mods === 0 && e.key == "ArrowUp") {
                this.origin = null
                this.moveLineUp()
            } else if (mods === 0 && e.key == "ArrowDown") {
                this.origin = null
                this.moveLineDown()
            } else if (mods === 0 && e.key == "ArrowLeft") {
                if (this.origin !== null) {
                    this.caret = Math.min(this.caret, this.origin)
                    this.origin = null
                    this._render()
                } else {
                    this.moveCharLeft()
                }
            } else if (mods === 0 && e.key == "ArrowRight") {
                if (this.origin !== null) {
                    this.caret = Math.max(this.caret, this.origin)
                    this.origin = null
                    this._render()
                } else {
                    this.moveCharRight()
                }
            }

            else if (mods === SHIFT_KEY && e.key == "ArrowUp") {
                if (this.origin === null) this.origin = this.caret
                // otherwise, we *keep* the origin
                this.moveLineUp()
            } else if (mods === SHIFT_KEY && e.key == "ArrowDown") {
                if (this.origin === null) this.origin = this.caret
                this.moveLineDown()
            } else if (mods === SHIFT_KEY && e.key === "ArrowLeft") {
                if (this.origin === null) this.origin = this.caret
                this.moveCharLeft()
            } else if (mods === SHIFT_KEY && e.key === "ArrowRight") {
                if (this.origin === null) this.origin = this.caret
                this.moveCharRight()
            }

            else if (mods === CTRL_KEY && e.key === "ArrowLeft") {
                this.origin = null
                this.moveWordLeft()
            } else if (mods === CTRL_KEY && e.key === "ArrowRight") {
                this.origin = null
                this.moveWordRight()
            }

            else if (mods === CTRL_KEY | SHIFT_KEY && e.key === "ArrowLeft") {
                if (this.origin === null) this.origin = this.caret
                this.moveWordLeft()
            } else if (mods === CTRL_KEY | SHIFT_KEY && e.key === "ArrowRight") {
                if (this.origin === null) this.origin = this.caret
                this.moveWordRight()
            }

            else if (mods === 0 && e.key == "End") {
                this.moveToEndOfLine()
            } else if (mods === 0 && e.key == "Home") {
                this.moveToStartOfLine()
            } else {
                let keys = []
                if (e.metaKey) keys.push("meta")
                if (e.ctrlKey) keys.push("ctrl")
                if (e.altKey) keys.push("alt")
                if (e.shiftKey) keys.push("shift")
                keys.push(e.key)
                console.log(keys.join("+"))
                return
            }
            e.preventDefault()
        })

        let startingMouseSelection = false

        this.editor.addEventListener('mousedown', e => {
            const rect = this.editor.getBoundingClientRect()
            const x = e.pageX - rect.left
            const y = e.pageY - rect.top
            const col = Math.trunc(x / this.glyphsize.width)
            const row = Math.trunc(y / this.glyphsize.height)

            this.caret = this.rowColToIndex(row, col)
            this.origin = this.caret
            this._render()
            startingMouseSelection = true
        })

        document.addEventListener('mouseup', e => {
            if (!startingMouseSelection) return
            startingMouseSelection = false

            const rect = this.editor.getBoundingClientRect()
            const x = e.pageX - rect.left
            const y = e.pageY - rect.top
            // moused up outside the editor
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                return
            }

            const col = Math.trunc(x / this.glyphsize.width)
            const row = Math.trunc(y / this.glyphsize.height)

            this.caret = this.rowColToIndex(row, col)
            if (this.caret === this.origin) {
                this.origin = null
            }
            this._render()
        })

        this.editor.addEventListener('mousemove', e => {
            if (!startingMouseSelection) return
            const rect = this.editor.getBoundingClientRect()
            const x = e.pageX - rect.left
            const y = e.pageY - rect.top
            const col = Math.trunc(x / this.glyphsize.width)
            const row = Math.trunc(y / this.glyphsize.height)

            this.caret = this.rowColToIndex(row, col)
            this._render()
        })

        this.caret = parseInt(localStorage.getItem('editor-caret')) || 0
        this.origin = null // origin of the selection. Setting it to null means no selection

        this._render()
    }

    inserCharAtCaret(char) {
        assert(char.length === 1)
        this.content.splice(this.caret, 0, char)
        this.caret++;
        this._render()
    }

    removeCharAtCaret() {
        if (this.origin !== null) {
            this.removeSelection()
            return
        }
        if (this.caret === 0) return
        this.content.splice(this.caret - 1, 1)
        this.caret--;
        this._render()
    }

    removeCharAfterCaret() {
        if (this.origin !== null) {
            this.removeSelection()
            return
        }
        this.content.splice(this.caret, 1)
        this._render()
    }

    removeSelection() {
        assert(this.origin !== null)
        this.content.splice(Math.min(this.caret, this.origin), Math.abs(this.caret - this.origin))
        this.caret = Math.min(this.caret, this.origin)
        this.origin = null
        this._render()
    }

    moveCharLeft() {
        if (this.caret > 0) {
            this.caret--;
        }
        this._render()
    }

    moveCharRight() {
        if (this.caret < this.content.length) {
            this.caret++;
        }
        this._render()
    }

    moveLineUp() {
        let x = 0;
        while (this.caret - x > 0 && this.content[this.caret - x - 1] != '\n') {
            x++
        }

        // we are the beginning of the content
        if (this.caret - x === 0) {
            this.caret = 0;
            this._render()
            return
        }

        let lengthLineAbove = 0;
        while (this.caret - x - 1 - lengthLineAbove > 0 && this.content[this.caret - x - 1 - lengthLineAbove - 1] != '\n') {
            lengthLineAbove++;
        }

        this.caret -= Math.max(x, lengthLineAbove)
        this.caret -= 1 // subtract the \n
        this._render()
    }

    moveLineDown() {
        if (this.caret === this.content.length) {
            return
        }

        let x = 0;
        while (this.caret - x > 0 && this.content[this.caret - x - 1] != '\n') {
            x++
        }

        let startOfNextLine = this.caret + 1;
        while (startOfNextLine < this.content.length && this.content[startOfNextLine - 1] != '\n') {
            startOfNextLine++
        }

        if (startOfNextLine === this.content.length) {
            this.caret = this.content.length;
            this._render()
            return
        }

        this.caret = startOfNextLine
        for (let i = 0; i < x; i++) {
            if (startOfNextLine + i < this.content.length && this.content[startOfNextLine + i] !== '\n') {
                this.caret++
            } else {
                break
            }
        }

        this._render()
    }

    moveToEndOfLine() {
        let x = 0;
        while (this.caret + x < this.content.length && this.content[this.caret + x] != '\n') {
            x++
        }
        this.caret += x
        this._render()
    }

    moveToStartOfLine() {
        let x = 0;
        while (this.caret - x > 0 && this.content[this.caret - x - 1] != '\n') {
            x++
        }
        this.caret -= x
        this._render()
    }

    moveWordLeft() {
        this.caret = this._getPositionOfWordLeft(this.caret)
        this._render()
    }

    moveWordRight() {
        this.caret = this._getPositionOfWordRight(this.caret);
        this._render()
    }

    removeWordAtCaret() {
        if (this.caret === 0) return
        // consume all the spaces
        let shift = 0;
        while (this.caret - shift > 0 && this.content[this.caret - shift - 1] === " ") {
            shift++
        }

        const negate = !this._isWordChar(this.content[this.caret - shift - 1])

        // if we aren't on a word char, then consume all the non word char
        // otherwise, consume all the word char
        while (this.caret - shift > 0 && (this._isWordChar(this.content[this.caret - shift - 1]) ^ negate)) {
            shift++
        }

        this.content.splice(this.caret - shift, shift)
        this.caret -= shift;
        this._render()
    }

    removeWordAfterCaret() {
        if (this.caret === this.content.length) return
        // consume all the spaces
        let shift = 0;
        while (this.caret + shift < this.content.length && this.content[this.caret + shift] === " ") {
            shift++
        }
        this.caret += shift

        shift = 0

        const negate = !this._isWordChar(this.content[this.caret + shift])

        // if we aren't on a word char, then consume all the non word char
        // otherwise, consume all the word char
        while (this.caret + shift < this.content.length && (this._isWordChar(this.content[this.caret + shift]) ^ negate)) {
            shift++;
        }

        this.content.splice(this.caret, shift)
        this._render()
    }

    _getPositionOfWordLeft(start) {
        assert(start >= 0)
        assert(start <= this.content.length)

        if (start === 0) return start

        // consume all the spaces
        let shift = 0;
        while (start - shift > 0 && this.content[start - shift - 1] === " ") {
            shift++
        }

        if (start - shift === 0) return 0

        const negate = !this._isWordChar(this.content[start - shift - 1])

        // if we aren't on a word char, then consume all the non word char
        // otherwise, consume all the word char
        while (start - shift > 0 && (this._isWordChar(this.content[start - shift - 1]) ^ negate)) {
            shift++
        }
        assert(start - shift >= 0);
        return start - shift;
    }

    _getPositionOfWordRight(start) {
        assert(start >= 0)
        assert(start <= this.content.length)

        if (start === this.content.length) return this.content.length

        // consume all the spaces
        let shift = 0;
        while (start + shift < this.content.length && this.content[start + shift] === " ") {
            shift++
        }

        if (start + shift === this.content.length) return this.content.length

        const negate = !this._isWordChar(this.content[start + shift])

        // if we aren't on a word char, then consume all the non word char
        // otherwise, consume all the word char
        while (start + shift < this.content.length && (this._isWordChar(this.content[start + shift]) ^ negate)) {
            shift++;
        }

        assert(start + shift < this.content.length)
        return start + shift;

    }

    focus() {
        this.editor.focus()
    }

    blur() {
        this.editor.blur()
    }

    rowColToIndex(row, col) {
        // if col is too large for that row, then index just points to the end of that line
        let index = 0;
        while (index < this.content.length && row >= 0 && col >= 0) {
            if (this.content[index] === '\n') {
                if (row > 0) {
                    row--;
                } else {
                    // we reached the end of the line we want to be one, return
                    return index
                }
            }
            if (row === 0) col--
            index++
        }
        return index
    }

    _render() {
        assert(this.caret <= this.content.length)
        let html = ''
        const caretHTML = '<span class="editor-caret"></span>'
        const selectionMin = Math.min(this.origin, this.caret)
        const selectionMax = Math.max(this.origin, this.caret)
        for (let i = 0; i < this.content.length; i++) {
            if (i == this.caret) {
                html += caretHTML
            }

            if (this.content[i] == '\n') {
                html += '<br>'
            } else if (this.origin !== null && selectionMin <= i && i < selectionMax) {
                html += `<span class="editor-selection">${this.content[i]}</span>`
            } else {
                html += this.content[i]
            }


        }
        if (this.caret === this.content.length) html += caretHTML
        this.editor.innerHTML = html

        localStorage.setItem("editor-caret", this.caret.toString(10))
        localStorage.setItem("editor-content", this.content.join(''))
    }

    _isWordChar(char) {
        assert(char.length === 1)
        const code = char.charCodeAt(0)
        return ('A'.charCodeAt(0) <= code && code <= 'Z'.charCodeAt(0)) || ('a'.charCodeAt(0) <= code && code <= 'z'.charCodeAt(0))
    }

    _computeGlyphSize() {
        // assumes monospace font
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const style = window.getComputedStyle(this.editor, null)

        ctx.font = `${style.fontSize} ${style.fontFamily}`
        const width = ctx.measureText("a").width
        const height = parseFloat(style.lineHeight)

        return { width, height }
    }

}