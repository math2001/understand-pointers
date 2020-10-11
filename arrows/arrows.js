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

            this.svgTail = document.createElementNS(XMLNS, "svg")
            this.svgTail.classList.add('svg-arrow')
            document.body.appendChild(this.svgTail)

            this.path = document.createElementNS(XMLNS, "path")
            this.path.setAttributeNS(null, "stroke-width", 4)
            this.svgTail.appendChild(this.path)

            this.svgTip = document.createElementNS(XMLNS, "svg")
            this.svgTip.setAttributeNS(null, "viewBox", `0 0 1 1`)
            this.svgTip.setAttributeNS(null, "width", 16)
            this.svgTip.setAttributeNS(null, "height", 16)
            this.svgTip.style.transform = 'rotate(45deg)'
            this.svgTip.style.transformOrigin = '0 0'
            this.svgTip.classList.add('svg-arrow')
            document.body.appendChild(this.svgTip)

            this.tip = document.createElementNS(XMLNS, "path")
            this.tip.setAttributeNS(null, "d", `
            M 0,0
            L 1,0
            M 0,0
            L 0,1
        `)
            // this.tip.setAttributeNS(null, "fill", "green")
            this.tip.setAttributeNS(null, "stroke", "red")
            this.tip.setAttributeNS(null, "stroke-width", 0.5)
            this.svgTip.appendChild(this.tip)
        }

        hide() {
            this.svgTail.classList.add('hidden')
            this.svgTip.classList.add('hidden')
        }

        show() {
            this.svgTail.classList.remove('hidden')
            this.svgTip.classList.remove('hidden')
        }

        connect(a, b) {
            assert(a !== null)
            assert(b !== null)

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

            this.from.style.left = pointFrom.x - (POINT_SIZE / 2) + 'px'
            this.from.style.top = pointFrom.y - (POINT_SIZE / 2) + 'px'

            this.to.style.left = pointTo.x - (POINT_SIZE / 2) + 'px'
            this.to.style.top = pointTo.y - (POINT_SIZE / 2) + 'px'

            // if we have distance = 0, then we use 1
            const horizontalDistance = Math.abs(pointFrom.x - pointTo.x) || 1;
            const verticalDistance = Math.abs(pointFrom.y - pointTo.y) || 1;

            this.svgTail.setAttributeNS(null, "viewBox", `0 0 ${horizontalDistance} ${verticalDistance}`)
            this.svgTail.setAttributeNS(null, "width", horizontalDistance)
            this.svgTail.setAttributeNS(null, "height", verticalDistance)

            const topleft = {
                x: Math.min(pointFrom.x, pointTo.x),
                y: Math.min(pointFrom.y, pointTo.y)
            }

            this.svgTail.style.left = topleft.x + 'px'
            this.svgTail.style.top = topleft.y + 'px'

            // for some reason, this prevents the svg from being blurry
            this.svgTail.style.overflow = "visible"

            this.path.setAttributeNS(null, "fill", "none")
            this.path.setAttributeNS(null, "stroke", "red")

            // adjustement to leave some empty space
            const adjustment = { x: 0, y: 0 }

            const EMPTY_SPACE = 2
            // 45deg -> pointing towards the top

            if (pointTo.y === rectb.bottom) {
                this.svgTip.style.transform = 'rotate(45deg)'
                adjustment.y += EMPTY_SPACE
            } else if (pointTo.x === rectb.left) {
                this.svgTip.style.transform = 'rotate(135deg)'
                adjustment.x -= EMPTY_SPACE
            } else if (pointTo.y === rectb.top) {
                this.svgTip.style.transform = 'rotate(225deg)'
                adjustment.y -= EMPTY_SPACE
            } else if (pointTo.x === rectb.right) {
                adjustment.x += EMPTY_SPACE
                this.svgTip.style.transform = 'rotate(315deg)'
            } else {
                assert(false)
            }

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
                l ${Math.trunc((svgTo.x - svgFrom.x) / 2)},0
                l 0,${(svgTo.y - svgFrom.y)}
                L ${svgTo.x + adjustment.x * 2},${svgTo.y + adjustment.y * 2}
            `)
            } else if (
                (pointFrom.y === recta.top || pointFrom.y === recta.bottom) &&
                (pointTo.y === rectb.top || pointTo.y === rectb.bottom)
            ) {
                this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${Math.trunc((svgTo.y - svgFrom.y) / 2)}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x + adjustment.x * 2},${svgTo.y + adjustment.y * 2}
            `)
            } else if (pointFrom.y === recta.top || pointFrom.y === recta.bottom) {
                this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l 0,${svgTo.y - svgFrom.y}
                L ${svgTo.x + adjustment.x * 2},${svgTo.y + adjustment.y * 2}
            `)
            } else if (pointFrom.x === recta.left || pointFrom.x === recta.right) {
                this.path.setAttributeNS(null, "d", `
                M ${svgFrom.x},${svgFrom.y}
                l ${svgTo.x - svgFrom.x},0
                L ${svgTo.x + adjustment.x * 2},${svgTo.y + adjustment.y * 2}
            `)
            } else {
                console.error(pointFrom, pointTo)
                throw new Error("unexpected case")
            }

            this.svgTip.style.left = pointTo.x + adjustment.x + 'px'
            this.svgTip.style.top = pointTo.y + adjustment.y + 'px'
        }

        destroy() {
            this.to.parentElement.removeChild(this.to)
            this.from.parentElement.removeChild(this.from)
            this.svgTail.parentElement.removeChild(this.svgTail)
            this.svgTip.parentElement.removeChild(this.svgTip)
        }

        _getRect(elem) {
            return elem.getBoundingClientRect()
            // const rects = elem.getClientRects()
            // assert(rects.length === 1)
            // return rects[0]
        }

        _getConnectPoints(rect) {
            return [
                { x: rect.left + rect.width / 2, y: rect.top },
                { x: rect.left + rect.width / 2, y: rect.bottom },
                { x: rect.left, y: rect.top + rect.height / 2 },
                { x: rect.right, y: rect.top + rect.height / 2 }
            ]
        }
    }
    return Arrow

})()