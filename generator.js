// Styling
const graph_stylesheet = `
polyline {
  fill:none;
  stroke-width:1;
  stroke: lightgrey;
}
polygon {
  fill:green;
}
text {
  font-size: 10px;
}
.linegraph {
  stroke-width: 0.5;
  stroke: blue;
}
.tickmark {
    font-size: 2px;
    font-family: monospace;
}
.cordinate-line {
    stroke-width: 0.5;
    stroke: lightgray;
    stroke-dasharray: 1,1;
}
`;

// Dictionary to XML converters
function treeToXML(tree) { //converts dict/json to xml string
    if ((typeof tree) === "string") {
        return tree;
    } else if ((typeof tree) === "object") {
        // validation
        if (!("prefix" in tree)) {
            tree["prefix"] = "";
        }
        // oneliner
        return `${tree["prefix"]}<${tree["tag"]} ${attributeDictToXML(tree["attributes"])}>${contentToXML(tree["content"])}</${tree["tag"]}>`
    } else {
        Error("treeToXML was passed a wrong type argument.")
    }
}

function attributeDictToXML(dict) {
    let output_str = "";
    for (let key in dict) {
        if (key === "style" && typeof dict["style"] === "object") {
            output_str += `${key}="${styleDictToCSS(dict[key])}" `
        } else {
            output_str += `${key}="${dict[key]}" `
        }
    }
    return output_str;
}

function contentToXML(content) {
    let output_str = "";
    for (let tree of content) {
        output_str += treeToXML(tree);
    }
    return output_str;
}

function styleDictToCSS(dict) {
    let output_str = "";
    for (let key in dict) {
        output_str += `${key}:${dict[key]};`;
    }
    return output_str;
}

// Graphers
function lineGraph(points, style) {
    let pointString = "";
    for (let point of points) {
        pointString += `${point[0]},${point[1]} `;
    }
    return {
        "tag": "polyline",
        "attributes": {
            "class": 'dataset linegraph',
            "points": pointString,
            "style": style,
        },
        "content": []
    };
}

function areaGraph(points, dataBox, style = "") {
    let pointString = `${dataBox[0]},${dataBox[3]} `;
    for (let point of points) {
        pointString += `${point[0]},${point[1]} `;
    }
    pointString += `${dataBox[2]},${dataBox[3]}`;
    return {
        "tag": "polygon",
        "attributes": {
            "points": pointString,
            "style": style,
            "class": "dataset areagraph"
        },
        "content": []
    };
}

function scatterPlot(points) {
    let ploted_points = {
        "tag": "g",
        "attributes": {
            "class": "dataset scatterplot"
        },
        "content": []
    };
    for (let point of points) {
        ploted_points["content"].push(pointCircle(point));
    }
    return ploted_points;
}

function pointCircle(point, radius = 1, style = "") {
    let circle = {
        "tag": "circle",
        "attributes": {
            "cx": point[0],
            "cy": point[1],
            "r": radius,
        },
        "content": []
    };
    if (style !== "") {
        circle["attributes"]["style"] = style;
    }
    return circle;
}

// Random data generator
function random_points(n, x_lim = 50) {
    let points = [];
    let x = -50;
    while (x < x_lim) {
        points.push([x, Math.random() * 100 - 50]);
        x += Math.random() * (x_lim / n * 2);
    }
    return points;
}

// Data Preperation

function dataBox_finder(datasets, zero_x = false, zero_y = false) {
    let min_x = Infinity;
    let min_y = Infinity;
    let max_x = -Infinity;
    let max_y = -Infinity;
    for (let points of datasets) {
        for (let point of points) {
            min_x = min_x > point[0] ? point[0] : min_x;
            min_y = min_y > point[1] ? point[1] : min_y;
            max_x = max_x < point[0] ? point[0] : max_x;
            max_y = max_y < point[1] ? point[1] : max_y;
        }
    }
    // zeroing of axies
    if (zero_y && min_y > 0) {
        min_y = 0;
    }
    if (zero_y && max_y < 0) {
        max_y = 0;
    }
    if (zero_x && min_x > 0) {
        min_x = 0;
    }
    if (zero_x && max_x < 0) {
        max_x = 0;
    }
    return [min_x, min_y, max_x, max_y];
}

// Displaying

function flipcontainer(dataBox) {
    return {
        "tag": "g",
        "attributes": {
            "id": "flipcontainer-for-data",
            "transform": "scale(1,-1)",
            "transform-origin": `${dataBox[0]} ${(dataBox[1]+dataBox[3])/2}`
        },
        "content": []
    };
}

function tickMarkPlacer(dataBox) {
    let tickmarks = {
        "tag": "g",
        "attributes": {
            "id": "tickmarks"
        },
        "content": []
    };

    let tickmarks_x = {
        "tag": "g",
        "attributes": {
            "id": "tickmarks-x"
        },
        "content": []
    };
    let x_range = dataBox[2] - dataBox[0];
    for (let x = dataBox[0]; x < dataBox[2]; x += x_range / 10) {
        tickmarks_x['content'].push(
            `<text class="tickmark" x="${x}" y="${dataBox[3]+4}">${Math.round(x)}</text>`
        )
    }
    tickmarks['content'].push(tickmarks_x);

    let tickmarks_y = {
        "tag": "g",
        "attributes": {
            "id": "tickmarks-y"
        },
        "content": []
    };
    let y_range = dataBox[3] - dataBox[1];
    for (let y = 0; y < y_range; y += y_range / 10) {
        tickmarks_y['content'].push(
            `<text class="tickmark" x="${dataBox[0]-6}" y="${dataBox[1]+y+1}">${Math.round(dataBox[3]-y)}</text>`
        )
    }
    tickmarks['content'].push(tickmarks_y);
    // x axis line
    if (dataBox[0] < 0 != dataBox[2] < 0) {
        tickmarks['content'].push(cordinateLineDrawer(dataBox[0], 0, dataBox[2], 0));
    }
    // y axis line
    if (dataBox[1] < 0 != dataBox[3] < 0) {
        tickmarks['content'].push(cordinateLineDrawer(0, dataBox[1], 0, dataBox[3]));
    }
    return tickmarks;
}

function cordinateLineDrawer(x1, y1, x2, y2) {
    return `<line class="cordinate-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`
}

// Data
function buildGraph(data, zero_x = false, zero_y = false) {
    const svg = {
        "prefix": "\t",
        "tag": "svg",
        "attributes": {
            "xmlns": "http://www.w3.org/2000/svg",
            "version": "2.0",
            "viewBox": "0 0 100 100", // left top width height
            "width": "400",
            "height": "400",
        },
        "content": [],
    }
    svg["content"].push(`<style>${graph_stylesheet}</style>`);

    let dataBox = dataBox_finder([data], zero_x, zero_y);
    let fc = flipcontainer(dataBox);
    fc['content'].push(scatterPlot(data));
    svg['content'].push(fc)

    // axies
    svg["content"].push(`<polyline points="${dataBox[0]-1},${dataBox[1]} ${dataBox[0]-1},${dataBox[3]+1} ${dataBox[2]},${dataBox[3]+1}"/>`);

    let viewPort = [
        Math.round(dataBox[0] - 15),
        Math.round(dataBox[1] - 10),
        Math.round(dataBox[2] + 10),
        Math.round(dataBox[3] + 15)
    ]; // two cordinate points
    svg["attributes"]["viewBox"] = `${viewPort[0]} ${viewPort[1]} ${viewPort[2] - viewPort[0]} ${viewPort[3] - viewPort[1]}`;

    let svgSize = [viewPort[2] - viewPort[0], viewPort[3] - viewPort[1]];
    let size_ratio = 400 / Math.min(...svgSize);
    svg["attributes"]["width"] = `${svgSize[0]*size_ratio}`;
    svg["attributes"]["height"] = `${svgSize[1]*size_ratio}`;

    // axies titles
    svg["content"].push(`<text x="${dataBox[0]}" y="${viewPort[3]}">X-axis</text>`)
    svg["content"].push(`<text x="${dataBox[0]-5}" y="${dataBox[3]-2}" transform="rotate(-90)" transform-origin="${dataBox[0]-5} ${dataBox[3]}" >Y-axis</text>`)

    // tickmarks
    svg['content'].push(tickMarkPlacer(dataBox))

    // Output
    let graph = treeToXML(svg);
    return graph;
}