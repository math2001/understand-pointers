const Arrow = (function () {

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

const squareDistance = (a, b) => {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)
}

class Arrow {
    constructor() {
        this.from = document.createElement('div')
        this.from.classList.add('point', 'from')
        document.body.appendChild(this.from)

        this.to = document.createElement('div')
        this.to.classList.add('point', 'to')
        document.body.appendChild(this.to)

        this.svg = document.createElementNS(XMLNS, "svg")
        this.svg.classList.add('svg-arrow')

        this.path = document.createElementNS(XMLNS, "path")
        this.svg.appendChild(this.path)
        document.body.appendChild(this.svg)

    }

    connect(a, b) {
        const recta = this._getRect(a)
        const rectb = this._getRect(b)

        const connectPointsA = this._getConnectPoints(recta)
        const connectPointsB = this._getConnectPoints(rectb)

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

        // const from = document.createElement('div')
        // const to = document.createElement('div')
        // from.classList.add('point', 'from')
        // to.classList.add('point', 'to')

        this.from.style.left = pointFrom.x - (POINT_SIZE / 2) + 'px'
        this.from.style.top = pointFrom.y - (POINT_SIZE / 2) + 'px'

        this.to.style.left = pointTo.x - (POINT_SIZE / 2) + 'px'
        this.to.style.top = pointTo.y - (POINT_SIZE / 2) + 'px'

        const horizontalDistance = Math.abs(pointFrom.x - pointTo.x)
        const verticalDistance = Math.abs(pointFrom.y - pointTo.y)

        // create a new svg element
        this.svg.setAttributeNS(null, "viewbox", `0 0 ${horizontalDistance} ${verticalDistance}`)
        this.svg.setAttributeNS(null, "width", horizontalDistance)
        this.svg.setAttributeNS(null, "height", verticalDistance)

        const topleft = {
            x: Math.min(pointFrom.x, pointTo.x),
            y: Math.min(pointFrom.y, pointTo.y)
        }

        this.svg.style.left = topleft.x + 'px'
        this.svg.style.top = topleft.y + 'px'

        // for some reason, this prevents the svg from being blurry
        this.svg.style.overflow = "visible"

        this.path.setAttributeNS(null, "fill", "none")
        this.path.setAttributeNS(null, "stroke", "red")

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
            this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l ${(svgTo.x - svgFrom.x) / 2},0
                l 0,${(svgTo.y - svgFrom.y)}
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (
            (pointFrom.y === recta.top || pointFrom.y === recta.bottom) &&
            (pointTo.y === rectb.top || pointTo.y === rectb.bottom)
        ) {
            this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${(svgTo.y - svgFrom.y) / 2}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (pointFrom.y === recta.top || pointFrom.y === recta.bottom) {
            this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${svgTo.y - svgFrom.y}
                L ${svgTo.x},${svgTo.y}
            `)
        } else if (pointFrom.x === recta.left || pointFrom.x === recta.right) {
            this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x},${svgTo.y}
            `)
        } else {
            console.error(pointFrom, pointTo)
            throw new Error("unexpected case")
        }
    }

    _getRect(elem) {
        const rects = elem.getClientRects()
        assert(rects.length === 1)
        return rects[0]
    }

    _getConnectPoints(rect) {
        return [
            {x: rect.left + rect.width / 2, y: rect.top},
            {x: rect.left + rect.width / 2, y: rect.bottom},
            {x: rect.left, y: rect.top + rect.height / 2},
            {x: rect.right, y: rect.top + rect.height / 2}
        ]
    }
}
return Arrow

})()