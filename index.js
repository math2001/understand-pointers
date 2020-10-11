document.addEventListener("DOMContentLoaded", _ => {
    const BYTES_PER_ROW = 4
    const NUM_ROWS = 10
    const MEMORY_SIZE = NUM_ROWS * BYTES_PER_ROW
    const POINTER_SIZE = 1

    const typesSize = {
        'int': 2,
        'char': 1,
        'null-pointer': POINTER_SIZE
    }

    class Memory {
        constructor(tableElement) {
            assert(tableElement instanceof HTMLElement)

            this.table = tableElement
            // identifier: memory object
            this.memory = {}
            // position: identifier
            this.symbols = {}
            this.stackpointer = 1

            for (let i = 0; i < NUM_ROWS; i++) {
                const row = getMemoryTableRow(i, BYTES_PER_ROW)
                memoryTable.appendChild(row)
            }
        }

        isvalidtype(type) {
            let length = type.length;
            while (type[length - 1] === '*') {
                length--;
            }
            return typesSize[type.slice(0, length)] !== undefined
        }

        initialize(identifier, type, typedvalue) {
            this.assertMatchingType(type, typedvalue)

            if (!this.isvalidtype(type)) {
                throw new Error(`unknown type ${type}`)
            }

            if (this.memory[identifier] !== undefined) {
                throw new Error(`CompileError: ${identifier} already declared`)
            }
            if (this.stackpointer + typesSize[type] > this.memory.length) {
                throw new Error("RuntimeError: out of memory")
            }

            this.memory[identifier] = {
                typedvalue: typedvalue,
                position: this.stackpointer,
                pointerArrow: undefined,
            }

            this.symbols[this.stackpointer] = identifier

            if (type.endsWith("*")) {
                this.stackpointer += POINTER_SIZE
                this.memory[identifier].pointerArrow = null
            } else if (typesSize[type] !== undefined) {
                this.stackpointer += typesSize[type]
            } else {
                console.error(type)
                assert(false)
            }

            this._updateVisualization(identifier)
        }

        _getCellElement(position) {
            const x = position % BYTES_PER_ROW
            const y = (position - x) / BYTES_PER_ROW

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

            return cell
        }

        _updateVisualization(identifier) {
            const position = this.memory[identifier].position
            assert(!isNaN(position))

            let cell = this._getCellElement(position)

            let description = cell.querySelector(".memory-description")
            if (description === null) {
                description = document.createElement('span')
                description.classList.add("memory-description")
                cell.appendChild(description)

                description.addEventListener('mouseenter', () => {
                    this.memory[identifier].pointerArrow.show()
                })
                description.addEventListener('mouseleave', () => {
                    this.memory[identifier].pointerArrow.hide()
                })
            }

            const typedvalue = this.memory[identifier].typedvalue
            const repr = this.getRepr(typedvalue)
            description.textContent = `${typedvalue.type} ${identifier} = ${repr}`

            let bytes
            if (typedvalue.type === "int") {
                bytes = this._getIntBytes(typedvalue)
            } else if (typedvalue.type.endsWith("*")) {
                bytes = this._getPointerBytes(typedvalue.value)
            } else {
                console.error(typedvalue.type)
                assert(false)
            }

            let row = cell.parentElement
            for (let i = 0; i < bytes.length; i++) {
                if (cell === null) {
                    row = row.nextElementSibling
                    assert(row !== null)
                    cell = row.firstElementChild.nextElementSibling
                }
                assert(cell !== null)

                let byte = cell.querySelector(".byte")
                if (byte === null) {
                    byte = document.createElement('span')
                    byte.classList.add('byte')
                    cell.appendChild(byte)
                }
                byte.textContent = bytes[i]

                cell = cell.nextElementSibling
            }

            if (typedvalue.type.endsWith("*")) {
                this._connectPointerArrow(identifier)
            }
        }

        _connectPointerArrow(identifier) {
            assert(this.memory[identifier] !== undefined)
            assert(this.memory[identifier].pointerArrow !== undefined)

            if (this.memory[identifier].typedvalue.value === null) {
                // null pointer
                return
            }

            if (this.memory[identifier].pointerArrow === null) {
                this.memory[identifier].pointerArrow = new Arrow()
            }
            const pointerCell = this._getCellElement(this.memory[identifier].position)
            const pointerDescription = pointerCell.querySelector('.memory-description')
            assert(pointerDescription !== null)

            const targetCell = this._getCellElement(this.memory[identifier].typedvalue.value)
            const targetDescription = targetCell.querySelector('.memory-description')
            assert(targetDescription !== null)

            this.memory[identifier].pointerArrow.connect(pointerDescription, targetDescription)
            this.memory[identifier].pointerArrow.show()
            setTimeout(() => this.memory[identifier].pointerArrow.hide(), 500)
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
            for (let name in this.memory) {
                if (this.memory[name].pointerArrow) {
                    this.memory[name].pointerArrow.destroy()
                    delete this.memory[name].pointerArrow
                }
                delete this.memory[name]
            }
            this.stackpointer = 1
            this.symbols = {}
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

        _getPointerBytes(address) {
            if (address === null) {
                address = 0
            } else {
                assert(address > 0)
            }
            return [address.toString(2).padStart(8, '0')]
        }

        getRepr(typedvalue) {
            assert(typedvalue !== undefined)
            assert(typeof typedvalue.type === "string")
            assert(this.isvalidtype(typedvalue.type))

            if (typedvalue.type === "int") {
                return typedvalue.value
            } else if (typedvalue.type === "char") {
                assert(typedvalue.value.length === 1)
                return JSON.stringify(typedvalue.value)
            } else if (typedvalue.type[typedvalue.type.length - 1] === "*") {
                if (typedvalue.value === null) {
                    return 'NULL'
                }
                return '0x' + typedvalue.value.toString(16).padStart(2, "0")
            }

            console.error(`type: ${typedvalue.type} value:`, typedvalue.value)
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
            this.assertMatchingType(old.type, typedvalue)
            this.memory[identifier].typedvalue = typedvalue
            this._updateVisualization(identifier)
        }

        setTypedValueDereference(identifier, dereferenceCount, typedvalue) {
            // sneaky but works
            assert(typedvalue.type + '*'.repeat(dereferenceCount) === this.memory[identifier].typedvalue.type)

            let head = identifier
            while (dereferenceCount > 0) {
                assert(this.memory[head] !== undefined)
                assert(this.memory[head].typedvalue.type.endsWith('*'))
                head = this.symbols[this.memory[head].typedvalue.value]
                assert(head !== undefined)
                dereferenceCount--
            }
            this.assertMatchingType(this.memory[head].typedvalue.type, typedvalue)
            this.memory[head].typedvalue.value = typedvalue.value
            this._updateVisualization(head)
        }

        getDereferencedTypedValue(identifier, dereferenceCount) {
            let head = identifier
            while (dereferenceCount > 0) {
                assert(this.memory[head] !== undefined)
                assert(this.memory[head].typedvalue.type.endsWith('*'))
                head = this.symbols[this.memory[head].typedvalue.value]
                assert(head !== undefined)
                dereferenceCount--
            }
            assert(this.memory[head] !== undefined)
            return this.memory[head].typedvalue
        }

        getTypedPointerTo(identifier) {
            assert(this.hasIdentifier(identifier))
            return {
                type: this.memory[identifier].typedvalue.type + "*",
                value: this.memory[identifier].position
            }
        }

        assertMatchingType(oldtype, newtypedvalue) {
            if (oldtype === newtypedvalue.type)
                return

            console.error(`type: ${oldtype}, typedvalue:`, newtypedvalue)
            throw new Error(`mismatching type: variable is ${oldtype}, expression is ${newtypedvalue.type} (value: ${newtypedvalue.value})`)
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
        updateEditor()
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

    document.querySelector('#reset-exec').addEventListener('click', e => {
        e.preventDefault()
        resetExecution()
    })

    updateEditor()

    editor.focus()

    const memory = new Memory(memoryTable)

    memoryView.innerHTML = ''
    memoryView.appendChild(memoryTable)


})