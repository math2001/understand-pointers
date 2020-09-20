document.addEventListener("DOMContentLoaded", _ => {
    let dragging = null;
    const draggables = Array.from(document.querySelectorAll(".draggable"))

    for (let draggable of draggables) {
        draggable.addEventListener("mousedown", e => {
            e.preventDefault()
            const originalRect = e.target.getBoundingClientRect()
            const mouse = {
                x: e.clientX - originalRect.x,
                y: e.clientY - originalRect.y,
            }
            e.target.style.left = '0'
            e.target.style.top = '0'
            const rect = e.target.getBoundingClientRect()
            e.target.style.left = (originalRect.x - rect.x) + 'px'
            e.target.style.top = (originalRect.y - rect.y) + 'px'
            dragging = {
                element: e.target,
                origin: {
                    x: rect.x + mouse.x,
                    y: rect.y + mouse.y
                }
            }
            e.target.classList.add('dragged')
            e.target.style.zIndex = '10'
        })
    }

    document.addEventListener("mouseup", e => {
        if (dragging === null) {
            return
        }
        e.preventDefault()
        dragging.element.classList.remove('dragged')
        dragging.element.style.zIndex = '1'

        let draggablesPosition = localStorage.getItem("draggables")
        if (draggablesPosition) {
            draggablesPosition = JSON.parse(draggablesPosition)
        } else {
            draggablesPosition = {}
        }

        draggablesPosition[dragging.element.getAttribute('id')] = {
            left: dragging.element.style.left,
            top: dragging.element.style.top,
        }

        localStorage.setItem("draggables", JSON.stringify(draggablesPosition))

        dragging = null
    })

    document.addEventListener("mousemove", e => {
        if (dragging === null) {
            return
        }
        dragging.element.style.left = (e.clientX - dragging.origin.x) + 'px'
        dragging.element.style.top = (e.clientY - dragging.origin.y) + 'px'
    })

    let draggablesPosition = localStorage.getItem("draggables")
    if (draggablesPosition) {
        draggablesPosition = JSON.parse(draggablesPosition)
        for (let id in draggablesPosition) {
            const element = document.getElementById(id)
            if (!element) continue
            element.style.left = draggablesPosition[id].left
            element.style.top = draggablesPosition[id].top
        }
    }


})
