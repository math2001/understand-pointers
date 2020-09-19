document.addEventListener("DOMContentLoaded", _ => {
const BYTES_PER_ROW = 4
const NUM_ROWS = 10
const MEMORY_SIZE = NUM_ROWS * BYTES_PER_ROW

const typesSize = {
    'int': 2,
    'char': 1,
}
const pointersSize = 1

class Memory {
    constructor(tableElement) {
        assert(tableElement instanceof HTMLElement)

        this.table = tableElement
        // variable: memory object
        this.memory = {}
        this.stackpointer = 1

        for (let i = 0; i < NUM_ROWS; i++) {
            const row = getMemoryTableRow(i, BYTES_PER_ROW)
            memoryTable.appendChild(row)
        }
    }

    initialize(identifier, type, typedvalue) {
        if (type !== typedvalue.type) {
            console.error(`type: ${type}, typedvalue:`, typedvalue)
            throw new Error("mismatching type")
        }
        if (typesSize[type] === undefined) {
            throw new Error(`CompileError: unknown type ${type}`)
        }
        if (this.memory[identifier] !== undefined) {
            throw new Error(`CompileError: ${identifier} already declared`)
        }
        if (this.stackpointer + typesSize[type] > this.memory.length) {
            throw new Error("RuntimeError: out of memory")
        }

        if (type === 'int') {
            this.memory[identifier] = {
                bytes: this._getIntBytes(typedvalue),
            }
        } else {
            assert(false)
        }

        this.memory[identifier].typedvalue = typedvalue
        this.memory[identifier].position = this.stackpointer

        this.stackpointer += typesSize[type]

        // update the visualization

        const x = this.memory[identifier].position % BYTES_PER_ROW
        const y = (this.memory[identifier].position - x) / BYTES_PER_ROW

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
        const bytes = this.memory[identifier].bytes
        assert(bytes !== undefined)

        for (let i = 0; i < bytes.length; i++) {
            if (x + i === BYTES_PER_ROW) {
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
        return this.memory[identifier] !== undefined
    }

    getTypedValue(identifier) {
        assert(this.hasIdentifier(identifier))
        return this.memory[identifier].typedvalue
    }

    setTypedValue(identifier, typedvalue) {
        const old = this.getTypedValue(identifier)
        assert(old.type === typedvalue.type)
        this.memory[identifier].typedvalue = typedvalue
        throw new Error('update visualization')
    }

}

const getMemoryTableRow = (rownum, BYTES_PER_ROW) => {
    const row = document.createElement('tr')
    const addr = document.createElement('th')
    addr.textContent = "0x" + (rownum * BYTES_PER_ROW).toString(16).padStart(3, '0')
    row.appendChild(addr)

    for (let i = 0; i < BYTES_PER_ROW; i++) {
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

const memory = new Memory(memoryTable)

memoryView.innerHTML = ''
memoryView.appendChild(memoryTable)

// memory.initialize('var1', 'char', 'a')
// memory.initialize('var2', 'char', 'b')
// memory.initialize('var3', 'char', 'c')
// memory.initialize('var4', 'char', 'd')
// memory.initialize('var5', 'char', 'e')
// memory.initialize('var6', 'char', 'f')
// memory.initialize('var7', 'char', 'g')
})