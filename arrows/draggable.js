document.addEventListener("DOMContentLoaded", _ => {
    let dragging = null;
    const draggables = Array.from(document.querySelectorAll(".draggable"))

    for (let draggable of draggables) {
        draggable.addEventListener("mousedown", e => {
            e.preventDefault()
            const rect = e.target.getClientRects()[0]
            dragging = {
                element: e.target,
                origin: {
                    x: e.clientX - rect.x,
                    y: e.clientY - rect.y
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
        dragging = null
    })

    document.addEventListener("mousemove", e => {
        if (dragging === null) {
            return
        }
        dragging.element.style.left = (e.clientX - dragging.origin.x) + 'px'
        dragging.element.style.top = (e.clientY - dragging.origin.y) + 'px'
    })

})
