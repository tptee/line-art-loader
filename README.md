# line-art-loader
A Webpack loader that inlines SVG files, converting all of its nodes to paths. Useful for line art animations in React components.

## Usage
`npm install --save line-art-loader`

The first loader handles all SVG files with the pattern *.lineart.svg. The second (optional) loader handles all other SVG files.

```javascript
module: {
    loaders: [
        {
            test: /\.lineart.svg$/,
            loader: 'svg-inline-loader!line-art-loader',
        },
        {
            test: /^(?!.*lineart\.svg$).*\.svg$/i,
            loader: YOUR_LOADER_HERE,
        }
    ]
}
```

## React Component
This loader integrates easily with the `<IconSVG />` component from svg-inline-loader (https://github.com/sairion/svg-inline-loader), which is included as a dependency. Use it like so:

```jsx
import lineArt from 'test.lineart.svg';

// later, in render()
<IconSVG src={lineArt} />
```

## Inspiration and Prior Art
- vivus: https://github.com/maxwellito/vivus
- Animated Line Drawing in SVG: https://jakearchibald.com/2013/animated-line-drawing-svg/
- Codrops SVG Drawing Animation: http://tympanus.net/codrops/2013/12/30/svg-drawing-animation/
- *The original:* Polygon: PS4 Review: http://www.polygon.com/a/ps4-review/video_review
