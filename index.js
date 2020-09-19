document.addEventListener("DOMContentLoaded", _ => {
const bytesperrow = 4
const numrows = 10

const typesSize = {
    'int': 2,
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

    initialize(identifier, type, typedvalue) {
        if (type !== typedvalue.type) {
            console.error(`type: ${type}, typedvalue:`, typedvalue)
            throw new Error("mismatching type")
        }
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
                bytes: this._getPointerBytes(typedvalue)
            }
            return
        }
        this.stackpointer += typesSize[type]

        if (type === 'int') {
            this.memory[this.identifiertable[identifier]] = {
                bytes: this._getIntBytes(typedvalue),
            }
        } else if (type === 'char') {
            this.memory[this.identifiertable[identifier]] = {
                bytes: this._getCharBytes(typedvalue),
            }
        } else {
            assert(false)
        }

        this.memory[this.identifiertable[identifier]].typedvalue = typedvalue

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
        const repr = this.getRepr(typedvalue)
        description.textContent = `${type} ${identifier} = ${repr}`

        cell.appendChild(description)
        const bytes = this.memory[this.identifiertable[identifier]].bytes
        assert(bytes !== undefined)
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

    clear() {
        let row = this.table.firstElementChild
        while (row !== null) {
            // we skip the address cell
            let cell = row.firstElementChild.nextElementSibling
            while (cell !== null) {
                cell.innerHTML = ''
                cell = cell.nextElementSibling
            }
            row = row.nextElementSibling
        }
        for (let i = 0; i < this.memory.length; i++) {
            delete this.memory[i]
        }
        for (let key in this.identifiertable) {
            delete this.identifiertable[key]
        }
        this.stackpointer = 1
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

    _getIntBytes(typedvalue) {
        assert(typedvalue !== undefined)
        assert(typedvalue.type === "int")
        assert(typeof typedvalue.value === "number")

        assert(typedvalue.value <= 1 << (8 * typesSize['int'] - 1) - 1)
        assert(typedvalue.value >= -(1 << (8 * typesSize['int'] - 1)))

        let bits;
        if (typedvalue.value >= 0) {
            bits = typedvalue.value.toString(2)
        } else {
            bits = ((1 << (8 * typesSize['int'])) + typedvalue.value).toString(2)
        }

        bits = bits.padStart(8 * typesSize['int'], "0")
        const bytes = []
        for (let i = 0; i < typesSize['int']; i++) {
            bytes.push(bits.slice(i * 8, (i + 1) * 8))
        }
        return bytes
    }

    getRepr(typedvalue) {
        assert(typedvalue !== undefined)
        assert(typeof typedvalue.type === "string")
        assert(
            typesSize[typedvalue.type] !== undefined ||
            (
                typedvalue.type[type.length - 1] === "*" &&
                typesSize[typedvalue.type.slice(0, -1)] !== undefined
            )
        )

        if (typedvalue.type === "int") {
            return typedvalue.value
        } else if (typedvalue.type === "char") {
            assert(typedvalue.value.length === 1)
            return JSON.stringify(typedvalue.value)
        } else if (typedvalue.type[type.length - 1] === "*") {
            return '0x' + value.toString(16).padStart(4, "0")
        }

        console.error(`type: ${type} value:`, value)
        assert(false)
    }

    hasIdentifier(identifier) {
        return this.identifiertable[identifier] !== undefined
    }

    getTypedValue(identifier) {
        assert(this.hasIdentifier(identifier))
        return this.memory[this.identifiertable[identifier]].typedvalue
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

    const start = editorTextarea.selectionStart
    const end = editorTextarea.selectionEnd

    let html = sourcecode
    html = html.slice(0, start) + '<span class="cursor"></span>' + html.slice(start)

    const lines = html.split('\n')
    assert(activeLineIndex <= lines.length)

    if (activeLineIndex < lines.length) {
        for (let i = 0; i < lines.length; i++) {
            if (i === activeLineIndex) {
                lines[i] = '<span class="highlight line">' + lines[i] + '</span>'
            }
        }
    }

    html = lines.join('<br/>')

    editorView.innerHTML = html
}

const resetExecution = () => {
    sourcecode = editorTextarea.value
    activeLineIndex = -1
    memory.clear()
}

const runSimpC = (line, memory) => {
    try {
        return evalSimpC(line, memory)
    } catch (e) {
        console.error(`line: '${line}'`)
        console.error(e)
        return true // just ran a meaningful line (stop execution)
    }
}

runlineButton.addEventListener("click", e => {
    e.preventDefault()

    activeLineIndex++
    const lines = sourcecode.split('\n')
    if (activeLineIndex >= lines.length) {
        activeLineIndex = lines.length - 1
        console.warn("no more lines to run")
        return
    }

    // runSimpC returns true if a meaningful line of code was run
    while (activeLineIndex < lines.length && !runSimpC(lines[activeLineIndex], memory)) {
        activeLineIndex++
    }

    updateEditor()
})

editorTextarea.addEventListener("input", e => {
    resetExecution()
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