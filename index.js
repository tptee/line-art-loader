'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jsdom = require('jsdom');

var _jsdom2 = _interopRequireDefault(_jsdom);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var lineArtLoader = function lineArtLoader(source) {
    undefined.cacheable();
    var cb = undefined.async();
    _jsdom2['default'].env(source, [], function (err, window) {
        var art = new Pathformer(window.document.querySelector('svg'), window).scan().outerHTML;
        cb(null, art);
    });
};

// TODO: move to test
// fs.readFile('./test.svg', (err, file) => lineArtLoader(file.toString()));

// Adapted from https://github.com/maxwellito/vivus/blob/master/src/pathformer.js

var Pathformer = (function () {
    function Pathformer(element, window) {
        _classCallCheck(this, Pathformer);

        this.TYPES = ['line', 'ellipse', 'circle', 'polygon', 'polyline', 'rect'];
        this.ATTR_WATCH = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];
        this.element = element;
        this.window = window;
    }

    _createClass(Pathformer, [{
        key: 'scan',
        value: function scan() {
            var _this = this;

            var svg = this.element;

            // jsdom doesn't like QSA for some reason
            var elements = this.TYPES.map(function (type) {
                return Array.from(svg.getElementsByTagName(type));
            }).reduce(function (acc, list) {
                return acc.concat(list);
            });

            // This mutates the original svg
            Array.from(elements).forEach(function (element) {
                var fn = _this[element.tagName.toLowerCase() + 'ToPath'];
                var pathData = fn(_this.parseAttr(element.attributes));
                var pathDom = _this.pathMaker(element, pathData);
                element.parentNode.replaceChild(pathDom, element);
            });

            return svg;
        }
    }, {
        key: 'lineToPath',
        value: function lineToPath(element) {
            var newElement = {};
            newElement.d = 'M' + element.x1 + ',' + element.y1 + 'L' + element.x2 + ',' + element.y2;
            return newElement;
        }
    }, {
        key: 'rectToPath',
        value: function rectToPath(element) {
            var newElement = {};
            var x = parseFloat(element.x) || 0;
            var y = parseFloat(element.y) || 0;
            var width = parseFloat(element.width) || 0;
            var height = parseFloat(element.height) || 0;
            newElement.d = 'M' + x + ' ' + y + ' ';
            newElement.d += 'L' + (x + width) + ' ' + y + ' ';
            newElement.d += 'L' + (x + width) + ' ' + (y + height) + ' ';
            newElement.d += 'L' + x + ' ' + (y + height) + ' Z';
            return newElement;
        }
    }, {
        key: 'polylineToPath',
        value: function polylineToPath(element) {
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
    }, {
        key: 'polygonToPath',
        value: function polygonToPath(element) {
            var newElement = this.polylineToPath(element);
            newElement.d += 'Z';
            return newElement;
        }
    }, {
        key: 'ellipseToPath',
        value: function ellipseToPath(element) {
            var startX = element.cx - element.rx;
            var startY = element.cy;
            var endX = parseFloat(element.cx) + parseFloat(element.rx);
            var endY = element.cy;

            var newElement = {};
            newElement.d = 'M' + startX + ',' + startY + 'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + endX + ',' + endY + 'A' + element.rx + ',' + element.ry + ' 0,1,1 ' + startX + ',' + endY;
            return newElement;
        }
    }, {
        key: 'circleToPath',
        value: function circleToPath(element) {
            var newElement = {};
            var startX = element.cx - element.r;
            var startY = element.cy;
            var endX = parseFloat(element.cx) + parseFloat(element.r);
            var endY = element.cy;
            newElement.d = 'M' + startX + ',' + startY + 'A' + element.r + ',' + element.r + ' 0,1,1 ' + endX + ',' + endY + 'A' + element.r + ',' + element.r + ' 0,1,1 ' + startX + ',' + endY;
            return newElement;
        }
    }, {
        key: 'pathMaker',
        value: function pathMaker(element, pathData) {
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
                pathTag.setAttribute(i, pathData[i]);
            }

            return pathTag;
        }
    }, {
        key: 'parseAttr',
        value: function parseAttr(element) {
            // TODO: refactor
            var attr;
            var output = {};
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
    }]);

    return Pathformer;
})();

