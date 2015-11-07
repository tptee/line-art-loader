import jsdom from 'jsdom';
import fs from 'fs';

export default function lineArtLoader(source) {
    this.cacheable();
    const cb = this.async();
    jsdom.env(source, [], (err, window) => {
        if (err) { throw err; }

        const art = new Pathformer(
            window.document.querySelector('svg'), window
        ).scan().outerHTML;
        cb(null, art);
    });
};

// TODO: move to test
// fs.readFile('./test.svg', (err, file) => lineArtLoader(file.toString()));

// Adapted from https://github.com/maxwellito/vivus/blob/master/src/pathformer.js
class Pathformer {
    constructor(element, window) {
        this.TYPES = ['line', 'ellipse', 'circle', 'polygon', 'polyline', 'rect'];
        this.ATTR_WATCH = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];
        this.element = element;
        this.window = window;
    }

    scan() {
        const svg = this.element;

        // jsdom doesn't like QSA for some reason
        const elements = this.TYPES.map((type) => {
            return Array.from(svg.getElementsByTagName(type));
        }).reduce((acc, list) => acc.concat(list));

        // This mutates the original svg
        Array.from(elements).forEach((element) => {
            const fn = this[element.tagName.toLowerCase() + 'ToPath'].bind(this);
            const pathData = fn(this.parseAttr(element.attributes));
            const pathDom = this.pathMaker(element, pathData);
            element.parentNode.replaceChild(pathDom, element);
        });

        return svg;
    }

    lineToPath(element) {
        const newElement = {};
        newElement.d = 'M' + element.x1 + ',' + element.y1 + 'L' + element.x2 + ',' + element.y2;
        return newElement;
    }

    rectToPath(element) {
        const newElement = {};
        const x = parseFloat(element.x) || 0;
        const y = parseFloat(element.y) || 0;
        const width = parseFloat(element.width) || 0;
        const height = parseFloat(element.height) || 0;
        newElement.d = 'M' + x + ' ' + y + ' ';
        newElement.d += 'L' + (x + width) + ' ' + y + ' ';
        newElement.d += 'L' + (x + width) + ' ' + (y + height) + ' ';
        newElement.d += 'L' + x + ' ' + (y + height) + ' Z';
        return newElement;
    }

    polylineToPath(element) {
        // TODO: refactor
        var i;
        var path;
        var newElement = {};
        var points = element.points.trim().split(' ');

        // Reformatting if points are defined without commas
        if (element.points.indexOf(',') === -1) {
            var formattedPoints = [];
            for (i = 0; i < points.length; i += 2) {
                formattedPoints.push(points[i] + ',' + points[i + 1]);
            }

            points = formattedPoints;
        }

        // Generate the path.d value
        path = 'M' + points[0];
        for (i = 1; i < points.length; i++) {
            if (points[i].indexOf(',') !== -1) {
                path += 'L' + points[i];
            }
        }

        newElement.d = path;
        return newElement;
    }

    polygonToPath(element) {
        const newElement = this.polylineToPath(element);
        newElement.d += 'Z';
        return newElement;
    }

    ellipseToPath(element) {
        const startX = element.cx - element.rx;
        const startY = element.cy;
        const endX = parseFloat(element.cx) + parseFloat(element.rx);
        const endY = element.cy;

        const newElement = {};
        newElement.d = 'M' + startX + ',' + startY +
                       'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + endX + ',' + endY +
                       'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + startX + ',' + endY;
        return newElement;
    }

    circleToPath(element) {
        const newElement = {};
        const startX = element.cx - element.r;
        const startY = element.cy;
        const endX = parseFloat(element.cx) + parseFloat(element.r);
        const endY = element.cy;
        newElement.d =  'M' + startX + ',' + startY +
                        'A' + element.r + ',' + element.r + ' 0,1,1 ' + endX + ',' + endY +
                        'A' + element.r + ',' + element.r + ' 0,1,1 ' + startX + ',' + endY;
        return newElement;
    }

    pathMaker(element, pathData) {
        // TODO: refactor
        var i;
        var attr;
        var pathTag = this.window.document.createElementNS('http://www.w3.org/2000/svg', 'path');

        for (i = 0; i < element.attributes.length; i++) {
            attr = element.attributes[i];
            if (this.ATTR_WATCH.indexOf(attr.name) === -1) {
                pathTag.setAttribute(attr.name, attr.value);
            }
        }

        for (i in pathData) {
            if (pathData.hasOwnProperty(i)) {
                pathTag.setAttribute(i, pathData[i]);
            }
        }

        return pathTag;
    }

    parseAttr(element) {
        // TODO: refactor
        var attr;
        const output = {};
        for (var i = 0; i < element.length; i++) {
            attr = element[i];

            // Check if no data attribute contains '%', or the transformation is impossible
            if (this.ATTR_WATCH.indexOf(attr.name) !== -1 && attr.value.indexOf('%') !== -1) {
                throw new Error('Pathformer [parseAttr]: a SVG shape got values in percentage. This cannot be transformed into \'path\' tags. Please use \'viewBox\'.');
            }

            output[attr.name] = attr.value;
        }

        return output;
    }
}
