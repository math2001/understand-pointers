const arrows = (function () {

const XMLNS = "http://www.w3.org/2000/svg"
const POINT_SIZE = 16

const assert = (condition) => {
    if (typeof condition !== "boolean") {
        console.error(condition, typeof condition)
        throw new Error("expected boolean")
    }
    if (!condition) {
        throw new Error('assertion error')
    }
}

const getRect = elem => {
    const rects = elem.getClientRects()
    assert(rects.length === 1)
    return rects[0]
}

return {
    connect: (a, b) => {
        const recta = getRect(a)
        const rectb = getRect(b)

        const horizontalDistance = Math.min(
            Math.abs(recta.right - rectb.left),
            Math.abs(recta.left - rectb.right),
        )

        const verticalDistance = Math.min(
            Math.abs(recta.top - rectb.bottom),
            Math.abs(recta.bottom - rectb.top),
        )

        let pointFrom, pointTo
        if (horizontalDistance >= verticalDistance) {
            if (Math.abs(recta.right - rectb.left) <= Math.abs(recta.left - rectb.right)) {
                pointFrom = {x: recta.right}
                pointTo = {x: rectb.left}
            } else {
                pointFrom = {x: recta.left}
                pointTo = {x: rectb.right}
            }
            pointFrom.y = recta.top + (recta.height / 2)
            pointTo.y = rectb.top + (rectb.height / 2)
        } else {
            if (Math.abs(recta.bottom - rectb.top) <= Math.abs(recta.top - rectb.bottom)) {
                pointFrom = {y: recta.bottom}
                pointTo = {y: rectb.top}
            } else {
                pointFrom = {y: recta.top}
                pointTo = {y: rectb.bottom}
            }
            pointFrom.x = recta.left + (recta.width / 2)
            pointTo.x = rectb.left + (rectb.height / 2)
        }

        const totalDx = pointTo.x - pointFrom.x
        const totalDy = pointTo.y - pointFrom.y

        const from = document.createElement('div')
        const to = document.createElement('div')
        from.classList.add('point', 'from')
        to.classList.add('point', 'to')

        from.style.left = pointFrom.x - (POINT_SIZE / 2) + 'px'
        from.style.top = pointFrom.y - (POINT_SIZE / 2) + 'px'

        to.style.left = pointTo.x - (POINT_SIZE / 2) + 'px'
        to.style.top = pointTo.y - (POINT_SIZE / 2) + 'px'
        document.body.appendChild(from)
        document.body.appendChild(to)

        // create a new svg element
        const svg = document.createElementNS(XMLNS, "svg")
        svg.setAttributeNS(null, "viewbox", `0 0 ${totalDx} ${totalDy}`)
        svg.setAttributeNS(null, "width", Math.abs(totalDx))
        svg.setAttributeNS(null, "height", Math.abs(totalDy))

        svg.classList.add('svg-arrow')
        svg.style.left = pointFrom.x + 'px'
        svg.style.top = pointFrom.y + 'px'
        // set it from JavaScript because otherwise nothing works, and I've got
        // a feeling this would be a source of headache
        svg.style.overflow = "visible"

        const path = document.createElementNS(XMLNS, "path")
        path.setAttributeNS(null, "fill", "none")
        path.setAttributeNS(null, "stroke", "red")

        if (horizontalDistance >= verticalDistance) {
            path.setAttributeNS(null, "d", `
                M 0,0
                L ${totalDx / 2},0
                L ${totalDx / 2},${totalDy}
                L ${totalDx},${totalDy}
            `)
        } else {
            path.setAttributeNS(null, "d", `
                M 0,0
                L 0,${totalDy / 2}
                L ${totalDx},${totalDy / 2}
                L ${totalDx},${totalDy}
            `)
        }
        svg.appendChild(path)

        document.body.appendChild(svg)

    },
    update: (arrow, a, b) => {
        throw new Error("not implemented")
    }
}

})()