
class Editor {
    constructor(element) {
        this.content = Array.from(localStorage.getItem('editor-content') || "")
        this.editor = element
        this.editor.addEventListener("focus", e => {
            this.editor.classList.add("editor-focus")
        })
        this.editor.addEventListener("blur", e => {
            this.editor.classList.remove("editor-focus")
        })

        this.editor.addEventListener("keydown", e => {
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return
            }

            if (e.key.length == 1) {
                this.inserCharAtCaret(e.key)
            } else if (e.key == "Enter") {
                this.inserCharAtCaret('\n')
            } else if (e.key == "Backspace") {
                this.removeCharAtCaret()
            } else if (e.key == "Delete") {
                this.removeCharAfterCaret()
            } else if (e.key == "ArrowUp") {
                this.moveLineUp()
            } else if (e.key == "ArrowDown") {
                this.moveLineDown()
            } else if (e.key == "ArrowLeft") {
                this.moveCharLeft()
            } else if (e.key == "ArrowRight") {
                this.moveCharRight()
            } else if (e.key == "End") {
                this.moveToEndOfLine()
            } else if (e.key == "Home") {
                this.moveToStartOfLine()
            } else {
                console.log(e.key)
            }

        })
        this.caret = parseInt(localStorage.getItem('editor-caret')) || 0

        this._render()
    }

    inserCharAtCaret(char) {
        assert(char.length === 1)
        this.content.splice(this.caret, 0, char)
        this.caret++;
        this._render()
    }

    removeCharAtCaret() {
        if (this.caret === 0) return
        this.content.splice(this.caret - 1, 1)
        this.caret--;
        this._render()
    }
    removeCharAfterCaret() {
        this.content.splice(this.caret, 1)
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

    focus() {
        this.editor.focus()
    }

    _render() {
        assert(this.caret <= this.content.length)
        let html = ''
        const caretHTML = '<span class="editor-caret"></span>'
        for (let i = 0; i < this.content.length; i++) {
            if (i == this.caret) {
                html += caretHTML
            }
            if (this.content[i] == '\n') {
                html += '<br>'
            } else {
                html += this.content[i]
            }
        }
        if (this.caret === this.content.length) html += caretHTML
        this.editor.innerHTML = html

        localStorage.setItem("editor-caret", this.caret.toString(10))
        localStorage.setItem("editor-content", this.content.join(''))
    }

}