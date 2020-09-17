document.addEventListener("DOMContentLoaded", _ => {

const assert = (condition) => {
    if (typeof condition !== "boolean") {
        console.error(condition, typeof condition)
        throw new Error("expected boolean")
    }
    if (!condition) {
        throw new Error('assertion error')
    }
}

const bytesperrow = 4
const numrows = 10

const typesSize = {
    'int': 4,
    'char': 1,
}
const pointersSize = 1

const memory = {}

const getMemoryObject = (type, bytesValues, reprValue, variableName) => {
    assert(typeof type === "string")
    assert(bytesValues !== undefined)
    assert(typeof reprValue === "string")
    assert(typeof variableName === "string")

    if (type[type.length - 1] === '*') {
        assert(bytesValues.length === pointersSize)
    } else {
        assert(typesSize[type] !== undefined)
        assert(typesSize[type] === bytesValues.length)
    }

    return {
        type: type,
        bytes: bytesValues,
        repr: reprValue,
        var: variableName,
    }
}

const getCharMemoryObject = (variable, char) => {
    assert(char.length === 1)
    assert(char.charCodeAt(0) < 128)
    return getMemoryObject(
        'char',
        [char.charCodeAt(0).toString(2).padStart('8', 0)],
        JSON.stringify(char),
        variable,
    )
}

const addMemoryObject = (addr, memobj) => {
    assert(addr > 0)
    assert(addr + memobj.bytes.length <= numrows * bytesperrow)

    assert(memobj !== undefined)

    const x = addr % bytesperrow
    const y = (addr - x) / bytesperrow

    let row = memoryTable.firstElementChild
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
    description.textContent = `${memobj.type} ${memobj.var} = ${memobj.repr}`

    cell.appendChild(description)

    for (let i = 0; i < memobj.bytes.length; i++) {
        if (x + i === bytesperrow) {
            row = row.nextElementSibling
            assert(row !== null)
            cell = row.firstElementChild.nextElementSibling
        }
        assert(cell !== null)
        const textNode = document.createTextNode(memobj.bytes[i])
        cell.appendChild(textNode)
        cell = cell.nextElementSibling
    }


    memory[addr] = memobj
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

const memoryView = document.querySelector("#memory-view")
const memoryTable = document.createElement('table')
memoryTable.classList.add('memory-table')

for (let i = 0; i < numrows; i++) {
    const row = getMemoryTableRow(i, bytesperrow)
    memoryTable.appendChild(row)
}

memoryView.innerHTML = ''
memoryView.appendChild(memoryTable)

addMemoryObject(0x1, getCharMemoryObject('var1', 'a'))
addMemoryObject(0x2, getCharMemoryObject('var2', 'b'))
addMemoryObject(0x3, getCharMemoryObject('var3', 'c'))
addMemoryObject(0x16, getCharMemoryObject('var8', 'd'))

})