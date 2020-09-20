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

const getConnectPoints = rect => {
    return [
        {x: rect.left + rect.width / 2, y: rect.top},
        {x: rect.left + rect.width / 2, y: rect.bottom},
        {x: rect.left, y: rect.top + rect.height / 2},
        {x: rect.right, y: rect.top + rect.height / 2}
    ]
}

const squareDistance = (a, b) => {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)
}

return {
    connect: (a, b) => {
        const recta = getRect(a)
        const rectb = getRect(b)

        const connectPointsA = getConnectPoints(recta)
        const connectPointsB = getConnectPoints(rectb)

        // only 16 possibilities, that's quick
        let mindistancepoints = [connectPointsA[0], connectPointsB[0]]
        for (let i = 0; i < connectPointsA.length; i++) {
            for (let j = 0; j < connectPointsB.length; j++) {
                const distance = squareDistance(connectPointsA[i], connectPointsB[j])
                const mindistance = squareDistance(mindistancepoints[0], mindistancepoints[1])

                if (distance < mindistance) {
                    mindistancepoints[0] = connectPointsA[i]
                    mindistancepoints[1] = connectPointsB[j]
                }
            }
        }

        const pointFrom = mindistancepoints[0]
        const pointTo = mindistancepoints[1]

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


        const horizontalDistance = Math.abs(pointFrom.x - pointTo.x)
        const verticalDistance = Math.abs(pointFrom.y - pointTo.y)

        // create a new svg element
        const svg = document.createElementNS(XMLNS, "svg")
        svg.setAttributeNS(null, "viewbox", `0 0 ${horizontalDistance} ${verticalDistance}`)
        svg.setAttributeNS(null, "width", horizontalDistance)
        svg.setAttributeNS(null, "height", verticalDistance)

        const topleft = {
            x: Math.min(pointFrom.x, pointTo.x),
            y: Math.min(pointFrom.y, pointTo.y)
        }

        svg.classList.add('svg-arrow')
        svg.style.left = topleft.x + 'px'
        svg.style.top = topleft.y + 'px'

        // set it from JavaScript because otherwise nothing works, and I've got
        // a feeling this would be a source of headache
        svg.style.overflow = "visible"

        const path = document.createElementNS(XMLNS, "path")
        path.setAttributeNS(null, "fill", "none")
        path.setAttributeNS(null, "stroke", "red")

        const svgFrom = {
            x: pointFrom.x - topleft.x,
            y: pointFrom.y - topleft.y
        }
        const svgTo = {
            x: pointTo.x - topleft.x,
            y: pointTo.y - topleft.y
        }
        if (
            (pointFrom.x === recta.left || pointFrom.x === recta.right) &&
            (pointTo.x === rectb.left || pointTo.x === rectb.right)
        ) {
            path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l ${(svgTo.x - svgFrom.x) / 2},0
                l 0,${(svgTo.y - svgFrom.y)}
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (
            (pointFrom.y === recta.top || pointFrom.y === recta.bottom) &&
            (pointTo.y === rectb.top || pointTo.y === rectb.bottom)
        ) {
            path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${(svgTo.y - svgFrom.y) / 2}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (pointFrom.y === recta.top || pointFrom.y === recta.bottom) {
            path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${svgTo.y - svgFrom.y}
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (pointFrom.x === recta.left || pointFrom.x === recta.right) {
            path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x},${svgTo.y}
            `)
        } else {
            console.error(pointFrom, pointTo)
            throw new Error("unexpected case")
        }

        svg.appendChild(path)
        document.body.appendChild(svg)
    },

    update: (arrow, a, b) => {
        throw new Error("not implemented")
    }
}

})()