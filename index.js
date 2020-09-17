document.addEventListener("DOMContentLoaded", _ => {
const bytesperrow = 4
const numrows = 10

const typesSize = {
    'int': 4,
    'char': 1,
}
const pointersSize = 1

class Memory {
    constructor(memsize, tableElement) {
        assert(memsize > 0)
        assert(tableElement instanceof HTMLElement)

        this.table = tableElement
        // addr: memory object
        this.memory = new Array(memsize)
        this.stackpointer = 1
        // identifier: addr
        this.identifiertable = {}
    }

    initialize(identifier, type, value) {
        if (typesSize[type] === undefined) {
            throw new Error(`CompileError: unknown type ${type}`)
        }
        if (this.identifiertable[identifier] !== undefined) {
            throw new Error(`CompileError: ${identifier} already declared`)
        }
        if (this.stackpointer + typesSize[type] > this.memory.length) {
            throw new Error("RuntimeError: out of memory")
        }

        this.identifiertable[identifier] = this.stackpointer

        if (type[type.length - 1] === '*') {
            this.stackpointer += pointersSize
            this.memory[this.identifiertable[identifier]] = {
                type: type,
                bytes: this._getPointerBytes(value)
            }
            return
        }
        this.stackpointer += typesSize[type]

        if (type === 'int') {
            this.memory[this.identifiertable[identifier]] = {
                type: 'int',
                bytes: this._getIntBytes(value),
            }
        } else if (type === 'char') {
            this.memory[this.identifiertable[identifier]] = {
                type: 'int',
                bytes: this._getCharBytes(value),
            }
        } else {
            assert(false)
        }

        // update the visualization

        const x = this.identifiertable[identifier] % bytesperrow
        const y = (this.identifiertable[identifier] - x) / bytesperrow

        let row = this.table.firstElementChild
        for (let i = 0; i < y; i++) {
            row = row.nextElementSibling
            assert(row !== null)
        }

        // select nextElementSibling to ignore the <th>
        let cell = row.firstElementChild.nextElementSibling
        for (let i = 0; i < x; i++) {
            cell = cell.nextElementSibling
        }
        assert(cell !== null)

        const description = document.createElement('span')
        description.classList.add("memory-description")
        const repr = this.repr(type, value)
        description.textContent = `${type} ${identifier} = ${repr}`

        cell.appendChild(description)
        const bytes = this.memory[this.identifiertable[identifier]].bytes
        for (let i = 0; i < bytes.length; i++) {
            if (x + i === bytesperrow) {
                row = row.nextElementSibling
                assert(row !== null)
                cell = row.firstElementChild.nextElementSibling
            }
            assert(cell !== null)
            const textNode = document.createTextNode(bytes[i])
            cell.appendChild(textNode)
            cell = cell.nextElementSibling
        }
    }

    _getPointerBytes(value) {
        assert(isinteger(value))
        return [value.toString(2)]
    }

    _getCharBytes(value) {
        assert(typeof value === "string")
        assert(value.length === 1)
        return [value.charCodeAt(0).toString(2)]
    }

    _getIntBytes(value) {
        throw new Error("how does 2 complement work?")
    }

    repr(type, value) {
        assert(typeof type === "string")
        assert(typesSize[type] !== undefined)
        if (type === "int") {
            return value
        } else if (type === "char") {
            return JSON.stringify(value)
        } else if (type[type.length - 1] === "*") {
            return '0x' + value.toString(16).padStart(4)
        }
        console.error(`type: ${type} value:`, value)
        assert(false)
    }
}

const getMemoryTableRow = (rownum, bytesperrow) => {
    const row = document.createElement('tr')
    const addr = document.createElement('th')
    addr.textContent = "0x" + (rownum * bytesperrow).toString(16).padStart(3, '0')
    row.appendChild(addr)

    for (let i = 0; i < bytesperrow; i++) {
        const cell = document.createElement('td')
        row.appendChild(cell)
    }
    return row
}

const memoryView = select("#memory-view")
const runlineButton = select("#run-line")
const editor = select("#editor")
const editorTextarea = select("#editor-textarea")
const editorView = select("#editor-view")

const memoryTable = document.createElement('table')
memoryTable.classList.add('memory-table')

let activeLineIndex = -1
let sourcecode = editorTextarea.value

const updateEditor = () => {
    assert(activeLineIndex >= -1)
    const lines = sourcecode.split('\n')
    assert(activeLineIndex < lines.length)

    const start = editorTextarea.selectionStart
    const end = editorTextarea.selectionEnd

    let html = sourcecode
    html = html.slice(0, start) + '<span class="cursor"></span>' + html.slice(start)

    html = html.replace(/\n/g, '<br>')
    // html = html.replace(/hello/g, '<b>hello</b>')
    // html = html.replace(/yes/g, '<i>yes</i>')

    editorView.innerHTML = html
}

runlineButton.addEventListener("click", e => {
    e.preventDefault()
    if (sourcecode === "") {
        return
    }

    activeLineIndex++
    const lines = sourcecode.split('\n')
    // ignore empty lines
    while (lines[activeLineIndex].strip() === "")
    assert(activeLineIndex < lines.length)
    runSimpC(lines[activeLineIndex], memory)
})

editorTextarea.addEventListener("input", e => {
    sourcecode = editorTextarea.value
    activeLineIndex = -1

    updateEditor()
})

editorTextarea.addEventListener("select", e => {
    updateEditor()
})
editorTextarea.addEventListener("keydown", e => {
    // motherfucking horrible. But there is no other option
    setTimeout(updateEditor, 50)
})

editorTextarea.addEventListener("click", e => {
    updateEditor()
})

editorTextarea.addEventListener('scroll', e => {
    editorView.scrollTop = editorTextarea.scrollTop
})

updateEditor()

editor.focus()

for (let i = 0; i < numrows; i++) {
    const row = getMemoryTableRow(i, bytesperrow)
    memoryTable.appendChild(row)
}

memoryView.innerHTML = ''
memoryView.appendChild(memoryTable)

const memory = new Memory(numrows * bytesperrow, memoryTable)
// memory.initialize('var1', 'char', 'a')
// memory.initialize('var2', 'char', 'b')
// memory.initialize('var3', 'char', 'c')
// memory.initialize('var4', 'char', 'd')
// memory.initialize('var5', 'char', 'e')
// memory.initialize('var6', 'char', 'f')
// memory.initialize('var7', 'char', 'g')
})