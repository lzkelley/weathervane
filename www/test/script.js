/*
 *
 *
 *
 */

/*    ========    SETTINGS    =========    */


// var UPDATE_INTERVAL = 5000;
var MOUSE_TRACK_ENABLED = true;

var PAD_TEXT = 5;
var INVIS = -100;

var AVE_LINE_KEY = "ave_line";
var CONF_FILL_KEY = "conf_fill";

// T,R,B,L
var margin = 60;
// margin = [margin, margin, margin, margin];
margin = {top: margin, right: margin, bottom: margin, left: margin}
var pad = 10;

// var AXIS_TYPE = [
//     {
//         key: 'day',
//         label: 'day of year',
//     },
//     {
//         key: 'hour',
//         label: 'hour of day',
//     },
// ]


/* ========    FUNCTIONS    ========= */

function setMousePoint(svgPlot, xx, yy) {
    // `xx` and `yy` are both in pixels!

    let left = [margin.left, yy];
    let bottom = [xx, contHeight - margin.bottom];
    let xlabel, xval, xpad, ylabel, yval, ypad;
    let xanchor = "middle";
    let yalign = "bottom";  // alignment-baseline
    let active = true;

    if ((xx == null) || (yy == null)) {
        xx = INVIS, yy = INVIS;
        left = [INVIS, INVIS];
        bottom = [INVIS, INVIS];
        active = false;
    } else {
        xval = svgPlot.xscale.invert(xx - margin.left);   // convert from pixels to data value

        if (svgPlot.xaxisType == 'day') {
            if (xval > 300) {
                xanchor = "end";
                xpad = - PAD_TEXT;
            } else {
                xanchor = "start";
                xpad = + PAD_TEXT;
            }

            let [month, days] = daysToMonthDays(xval);
            xlabel = month.name.substring(0, 3) + ", " + `${days}`;
            yval = svgPlot.yscale.invert(yy - margin.top);
            ylabel = `${yval.toFixed(1)} F`
        } else if (svgPlot.xaxisType == 'hour') {
            if (xval > 8) {
                xanchor = "end";
                xpad = - PAD_TEXT;
            } else {
                xanchor = "start";
                xpad = + PAD_TEXT;
            }

            let [hrs, mins] = hoursToHoursMins(xval);
            xlabel = `${("0" + hrs).slice(-2)}:${("0" + mins).slice(-2)}`;
            yval = svgPlot.yscale.invert(yy - margin.top);
            ylabel = `${yval.toFixed(1)} F`
        } else {
            throw `Unrecognized 'xaxisType' = '${svgPlot.xaxisType}'!`
        }
    }

    let circle = svgPlot.select("#mouseCircle");
    if (circle.empty())
        circle = svgPlot.append("circle").attr("id", "mouseCircle");
    circle.attr("cx", xx).attr("cy", yy).attr("r", 3.5);

    let line = svgPlot.select("#mouseLineV");
    if (line.empty())
        line = svgPlot.append("line").attr("class", "target").attr("id", "mouseLineV");
    line.attr("x1", xx).attr("y1", bottom[1]).attr("x2", xx).attr("y2", yy);

    line = svgPlot.select("#mouseLineH");
    if (line.empty())
        line = svgPlot.append("line").attr("class", "target").attr("id", "mouseLineH");
    line.attr("x1", left[0]).attr("y1", yy).attr("x2", xx).attr("y2", yy);

    let text = svgPlot.select("#mouseTextX");
    if (text.empty())
        text = svgPlot.append("text")
            .attr("class", "target")
            .attr("id", "mouseTextX")
            .attr("alignment-baseline", "bottom")
    text.attr("x", xx + xpad)
        .attr("y", contHeight - margin.bottom - PAD_TEXT)
        .text(xlabel)
        .attr("text-anchor", xanchor);

    setTextBackgroundBox(svgPlot, text, "mouseTextX", active ? text.node().getBBox() : null)

    text = svgPlot.select("#mouseTextY");
    if (text.empty())
        text = svgPlot.append("text")
            .attr("class", "target")
            .attr("id", "mouseTextY")
    text.attr("x", xx + xpad)
        .attr("y", yy - PAD_TEXT)
        .text(ylabel)
        .attr("alignment-baseline", yalign)
        .attr("text-anchor", xanchor);

    setTextBackgroundBox(svgPlot, text, "mouseTextY", active ? text.node().getBBox() : null)

}

function click(svgPlot, event) {
    console.log("click()");
    // toggleMouseTracking();
    svgPlot.MOUSE_TRACK_ENABLED = svgPlot.MOUSE_TRACK_ENABLED ? false : true;
}

function setTextBackgroundBox(svgPlot, text, textKey, bbox) {
    // let bbox = text.node().getBBox();
    let boxKey = textKey + "Box"
    let textBox = svgPlot.select("#" + boxKey);

    if (textBox.empty())
        textBox = svgPlot.insert("rect", "#" + textKey)
            .attr("class", "textbg")
            .attr("id", boxKey)

    if (bbox == null) {
        textBox.attr("x", INVIS).attr("y", INVIS).attr("width", 0).attr("height", 0)
    } else {
        textBox
            .attr("x", bbox.x - PAD_TEXT/2)
            .attr("y", bbox.y - PAD_TEXT/2)
            .attr("width", bbox.width + PAD_TEXT)
            .attr("height", bbox.height + PAD_TEXT);
    }
}

function initPlot(svgPlot, xlab, ylab, mouseMoved) {

    // ---- Add rectangle for detecting mouse events, always on top! ----
    svgPlot.append("rect")
        .attr("class", "action")
        .attr("id", "action")
        .attr("width", contWidth)
        .attr("height", contHeight)
        .on("mousemove", function(event) { console.log("calling mouseMoved()"); mouseMoved(svgPlot, event); })
        .on("click", function() { click(svgPlot, this); });

    // ---- Override the 'append' function to prepend before the action rectangle ----
    svgPlot.append = function(value) {
        return svgPlot.insert(value, "#action");
    };

    // == Scales and Axes == //
    let xscale = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([0.0, plotWidth]);
    let yscale = d3.scaleLinear()
        .domain([50.0, 100.0])
        .range([plotHeight, 0.0]);

    let xaxis = d3.axisBottom(xscale);
    let yaxis = d3.axisLeft(yscale);  // .ticks(5);

    // == Lines and Generators == //
    // lineGenM1 = d3.line()
    //     .x(function(d) { return xscale(d[0]); })
    //     .y(function(d) { return yscale(d[1]); });
    // lineGenM2 = d3.line()
    //     .x(function(d) { return xscale(d[0]); })
    //     .y(function(d) { return yscale(d[2]); });

    // pathStringM1 = lineGenM1(masses);
    // pathStringM2 = lineGenM2(masses);

    var xtrans = "translate(" + margin.left + ", " + (contHeight - margin.bottom) + ")";
    var ytrans = "translate(" + margin.left + ", " + margin.top + ")";

    // Add x & y axes
    svgPlot.append("g")
        .attr("class", "axis")
        .attr("id", "xaxis")
        .attr("transform", xtrans)
        .call(xaxis);

    svgPlot.append("g")
        .attr("class", "axis")
        .attr("id", "yaxis")
        .attr("transform", ytrans)
        .call(yaxis);

    svgPlot.xaxis = xaxis;
    svgPlot.xscale = xscale;
    svgPlot.yaxis = yaxis;
    svgPlot.yscale = yscale;

    // text labels axes
    svgPlot.append("text")
        // .attr("transform", "rotate(-90)")
        .attr("y", contHeight - pad - (margin.bottom - pad)/2)
        .attr("x", (contWidth / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(xlab);

    svgPlot.append("text")
        .attr("y", pad)
        .attr("x", - contHeight/2)
        .attr("transform", "rotate(-90)")
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(ylab);


    // add the X gridlines
    svgPlot.append("g")
        .attr("class", "grid")
        .attr("id", "xgrid")
        .attr("transform", xtrans)
        .call(d3.axisBottom(xscale)
            .ticks(6)
            .tickSize(-plotHeight)
            .tickFormat("")
        )

    // add the Y gridlines
    svgPlot.append("g")
        .attr("class", "grid")
        .attr("id", "ygrid")
        .attr("transform", ytrans)
        .call(d3.axisLeft(yscale)
            .ticks(6)
            .tickSize(-plotWidth)
            .tickFormat("")
        )


    svgPlot.append("path")
        .attr("class", "fill")
        .attr("id", CONF_FILL_KEY + "_1")
        .attr("transform", ytrans)
        .attr("d", "");

    svgPlot.append("path")
        .attr("class", "fill")
        .attr("id", CONF_FILL_KEY + "_2")
        .attr("transform", ytrans)
        .attr("d", "");

    svgPlot.append("path")
        .attr("class", "curve")
        .attr("id", AVE_LINE_KEY)
        .attr("transform", ytrans)
    	.attr('d', "");

    setMousePoint(svgPlot);

    if (svgPlot.xaxisType == 'day')
        addMonthsAxis(svgPlot);

}

function addMonthsAxis(svgPlot) {
    let xscale = d3.scaleLinear()
        .domain([0, 365])
        .range([0.0, plotWidth]);

    let xticks = Array(MONTHS.length);
    for(let ii = 0; ii < MONTHS.length; ii++) {
        xticks[ii] = MONTHS[ii].end;
    }

    //
    let xaxis = d3.axisTop(xscale)
        .tickValues(xticks)
        .tickFormat((dd, ii) => MONTHS[ii].name.substring(0, 3));

    //
    let xtrans = "translate(" + margin.left + ", " + margin.top + ")";

    svgPlot.append("g")
        .attr("class", "axis")
        .attr("id", "x2axis")
        .attr("transform", xtrans)
        .call(xaxis)
        .selectAll('.tick')
        .each(function(days, ii) {
            let prev = (ii == 0) ? 0.0 : MONTHS[ii-1].end;
            days = (days - prev) / 2;
            tick = d3.select(this);
            tick.select('text').attr('transform', 'translate(' + -xscale(days) + ',0)');
        });

}

function plotDataFromFile(fname, svgPlot) {
    // let lineNum = 0;
    // let keys, sizes;

    // d3.text(fname, function(text) {
    //     d3.csvParseRows(text, function(line) {
    //         // console.log(lineNum, line);
    //         if(lineNum == 0) {
    //             let comps = line.toString().trim().split(' ');
    //             sizes = comps.map(x => x.split('=')[1]);
    //             keys = comps.map(x => x.split('=')[0]);
    //         } else {
    //             if(line.length != sizes[lineNum-1]) {
    //                 console.log(`ERROR: expecting size ${sizes[lineNum-1]}, got ${line.length}!`);
    //             }
    //             let kk = keys[lineNum-1];
    //             data[kk] = line.map(x => +x);
    //         }
    //         lineNum++;
    //     });
    // });

    // d3.csv(fname, function(data) {
    //     console.log("data = ", data);
    //     data.forEach(function(d) {
    //         console.log("d = ", d);
    //         for(let key in d){
    //             d[key.trim()] = +d[key];
    //             if(key.trim() != key) {
    //                 delete d[key];
    //             }
    //         };
    //     });

    d3.csv(fname).then(function(data) {
        // console.log("data = ", data);
        data.forEach(function(d) {
            // console.log("d = ", d);
            for(let key in d){
                d[key.trim()] = +d[key];
                if(key.trim() != key) {
                    delete d[key];
                }
            };
        });

        let xaxis = svgPlot.xaxis;
        let yaxis = svgPlot.yaxis;
        let xscale = svgPlot.xscale;
        let yscale = svgPlot.yscale;

        xscale.domain(d3.extent(data, function(d) { return +d.x; }));
        let ylo = d3.extent(data, function(d) { return +d.conf0; });
        let yhi = d3.extent(data, function(d) { return +d.conf100; });
        yscale.domain([0.9*ylo[0], 1.1*yhi[1]]);

        xaxis.scale(xscale);
        yaxis.scale(yscale);
        svgPlot.select("#xaxis").call(xaxis);
        svgPlot.select("#yaxis").call(yaxis);

        var key = '#xgrid';
        svgPlot.select(key)
            .call(d3.axisBottom(xscale)
                .ticks(6)
                .tickSize(-plotHeight)
                .tickFormat("")
            )

        var key = '#ygrid';
        svgPlot.select(key)
            .call(d3.axisLeft(yscale)
                .ticks(6)
                .tickSize(-plotWidth)
                .tickFormat("")
            )

        var key = '#' + AVE_LINE_KEY;
        svgPlot.select(key)
            .datum(data)
            .attr("d", d3.line()
                .x(function(d) { return xscale(d.x); })
                .y(function(d) { return yscale(d.ave); })
            );

        var key = '#' + CONF_FILL_KEY + "_1";
        svgPlot.select(key)
            .datum(data)
            .attr("d", d3.area()
                .x(function(d) { return xscale(d.x) })
                .y0(function(d) { return yscale(d.conf20) })
                .y1(function(d) { return yscale(d.conf80) })
            );

        var key = '#' + CONF_FILL_KEY + "_2";
        svgPlot.select(key)
            .datum(data)
            .attr("d", d3.area()
                .x(function(d) { return xscale(d.x) })
                .y0(function(d) { return yscale(d.conf40) })
                .y1(function(d) { return yscale(d.conf60) })
            );

    });
    return
};

function mouseMoved(svg, event) {
  if (svg.MOUSE_TRACK_ENABLED == false)
      return

  let mouse = d3.pointer(event);
  if ((mouse[0] < margin.left) || (mouse[0] > (contWidth - margin.right))) {
      setMousePoint(svg);
      return;
  }
  if ((mouse[1] < margin.top) || (mouse[1] > (contHeight - margin.bottom))) {
      setMousePoint(svg);
      return;
  }

  console.log("mouseMoved() :: ", mouse);

  var key = '#' + AVE_LINE_KEY;
  let sel = svg.select(key).data()[0];

  var yy = closestXPoint(sel, svg.xscale.invert(mouse[0] - margin.left));
  setMousePoint(svg, mouse[0], svg.yscale(yy) + margin.top);
}

function closestXPoint(lineData, xx) {
  let lo = 0;
  while ((lo < lineData.length) && (lineData[lo].x < xx))
      lo++;

  hi = lo + 1;
  if (hi == lineData.length) {
      hi--;
      lo--;
  }

  let slope = (lineData[hi].ave - lineData[lo].ave) / (lineData[hi].x - lineData[lo].x);
  let yy = lineData[lo].ave + slope * (xx - lineData[lo].x);
  return yy;
}

function daysToMonthDays(days) {
    /*
     Arguments
     ---------
     `days` : [0, 365] day of year

     Returns
     -------
     `month` : (dict), current month
     `rem` : [0, 31] day of month

     */

    // ---- Find the month this `days` belongs in
    let guess = Math.min(Math.floor(days / 30), 11);
    // Correct right
    while ((MONTHS[guess].end < days) && (guess + 1 < MONTHS.length))
        guess++;
    // Correct left
    while ((guess > 0) && (MONTHS[guess-1].end > days))
        guess--;
    let month = MONTHS[guess];

    // ---- Subtract days at end of last month, get remaining days in *this* month
    let rem = (guess > 0) ? MONTHS[guess-1].end : 0;
    rem = Math.round(days - rem);
    return [month, rem];
}

function hoursToHoursMins(hrs, round = 15) {
    /*
     Arguments
     ---------
     `hrs` : (scalar), [0.0, 24.0], hour of day

     Returns
     -------
     `hrs` : (int), [0, 24]
     `min` : (int), [0, 59]

    */

    let min = 60 * (hrs - Math.round(Math.floor(hrs)));
    min = Math.floor(min / round) * round;
    hrs = Math.floor(hrs);
    return [hrs, min];
}

// function format(num) { return num.toExponential(2); }
// function update(tt) { console.log("update", tt); }


/* ===========================  SCRIPT  ============================ */


var svgLeft = d3.select('#plotLeft');
var svgRight = d3.select('#plotRight');

svgLeft.MOUSE_TRACK_ENABLED = true;
svgRight.MOUSE_TRACK_ENABLED = true;



// These are strings
var contWidth = svgLeft.style("width");
var contHeight = svgLeft.style("height");
// Convert to floats
contWidth = parseFloat(contWidth.replace("px", ""));
contHeight = parseFloat(contHeight.replace("px", ""));
// calculate plot dimensions
var plotWidth = contWidth - margin.left - margin.right;
var plotHeight = contHeight - margin.top - margin.bottom;

// initPlot(svgLeft, 'day of year', 'temperature [F]', mouseMovedLeft);
// initPlot(svgRight, 'hour of day', 'temperature [F]', mouseMovedRight);
svgLeft.xaxisType = 'day';
initPlot(svgLeft, 'day of year', 'temperature [F]', mouseMoved);
svgRight.xaxisType = 'hour';
initPlot(svgRight, 'hour of day', 'temperature [F]', mouseMoved);

// NOTE: this requires a local webserver running locally
// RUN `python3 -m http.server` in this directory, and access `index.html` through that!
//
let fname = 'http://localhost:8000/temp-ave_vs-day.csv';
plotDataFromFile(fname, svgLeft);

fname = 'http://localhost:8000/temp-ave_vs-hr.csv';
plotDataFromFile(fname, svgRight);

// Loop
// var interval = d3.interval(update, UPDATE_INTERVAL);


function empty() {

    /*    ========    INITIALIZE OBJECTS    =========    */

    // These are set in `initPlots()`
    // var xmin, xmax, ymin, ymax, xscale, yscale, xAxis, yAxis;

    // counterData = [
    //     {name: "Particles", num: NUM_PARTICLES, x: 0, y: 20},
    //     {name: "Consumed", num: 0, x: 0, y: 40},
    //     {name: "Created", num: 0, x: 0, y: 60}
    // ]

    // These are set in `initSliders()`
    // var sliderScaleM1, sliderM1, sval, handle;

    // Storage for definitions, 'defs' tells SVG they are resources
    // var defs = svgSim.append("defs");

    // var gradientRadial = defs  // selectAll("radialGradient").data(binary).enter()
    // 	.append("radialGradient")
    // 	.attr("id", "radialGradient")
    // 	.attr("cx", "30%")
    // 	.attr("cy", "30%")
    // 	.attr("r", "80%");
    //
    // // Append the color stops
    // gradientRadial.append("stop")
    // 	.attr("offset", "0%")
    // 	.attr("stop-color", function(d) { return d3.rgb(BH_COLOR).brighter(2); });
    // gradientRadial.append("stop")
    // 	.attr("offset", "50%")
    // 	.attr("stop-color", function(d) { return BH_COLOR; });
    // gradientRadial.append("stop")
    // 	.attr("offset",  "100%")
    // 	.attr("stop-color", function(d) { return d3.rgb(BH_COLOR).darker(1.5); });


    // == Plot / Figure Stuff == //

    // function binaryPosition(bin){
    //     rad = separation * (bhMassTotal - bin.mass)/bhMassTotal
    //     vals = [
    //         0.5*simWidth + rad*Math.cos(2*Math.PI*bin.phase),
    //         0.5*simHeight + rad*Math.sin(2*Math.PI*bin.phase)
    //     ];
    //     if(THREE_D){
    //         vals.push(simDepth*0.5);
    //     }
    //     return vals;
    // }
    //
    // function updateBinary() {
    //     var selection = svgSim.selectAll(".bh")
    //     	.data(binary);
    //
    //     // Remove old
    //     olds = selection.exit();
    //     olds.remove();
    //
    //     // Add new elements
    //     news = selection.enter();
    //     news.append("circle")
    //         .attr("id", function(d){ return "bh-" + d.name; })
    //     	.attr("class", "bh")
    //     	.attr("r", function(d) { return bhSize(d.mass); })
    //     	.style("fill", function(d) { return "url(#radialGradient)"; })
    //         .attr("cx", function(d, i) { return binaryPosition(d)[0]; })
    //         .attr("cy", function(d, i) { return binaryPosition(d)[1]; });
    //
    //     // Update elements
    //     selection.attr("cx", function(d, i) { return binaryPosition(d)[0]; })
    //         .attr("cy", function(d, i) { return binaryPosition(d)[1]; })
    //         .attr("r", function(d) { return bhSize(d.mass); });
    // }
    //
    // function addParticles(num) {
    //     if( num < 1 ) return;
    //
    //     news = d3.range(num).map(function(i) {
    //         var vals = new Array(3*NDIM);
    //         for(var ii = 0; ii < NDIM; ii++) {
    //             // Positions
    //             // vals[ii] = bounds[ii] * Math.random();
    //             //   Put new particles at one of the boundaries
    //             vals[ii] = bounds[ii] * 2*(Math.random() > 0.5) - 1;
    //             // Velocities
    //             vals[ii + NDIM] = 2*(Math.random() - 0.5);
    //             // Accelerations
    //             vals[ii + NDIM*2] = 0.0;
    //         }
    //         return vals;
    //     });
    //     particles = particles.concat(news);
    //     counterData[2].num += num;
    // }
    //
    // function updateParticles(particles) {
    //     var selection = svgSim.selectAll(".particleCircle")
    //         .data(particles);
    //     counterData[0].num = selection.size()
    //
    //     // Update elements
    //     selection.attr("cx", function(d, i) { return d[0]; })
    //         .attr("cy", function(d, i) { return d[1]; })
    //         .attr("r", function(d) { return pSize(d); })
    //
    //     // Remove deleted elements
    //     var dels = selection.exit();
    //     dels.remove();
    //     counterData[1].num += dels.size();
    //
    //     // Add new elements
    //     var adds = selection.enter();
    //     counterData[0].num += adds.size()
    //     adds.append("circle")
    //         .attr("id", function(d){ return "particleCircle-" + d.name; })
    //         .attr("class", "particleCircle")
    //         // .attr("r", PARTICLE_RADIUS)
    //         .attr("r", function(d) { return pSize(d); })
    //         .style("fill", STAR_COLOR)
    //         .style("opacity", 0.75)
    //         .attr("cx", function(d, i) { return d[0]; })
    //         .attr("cy", function(d, i) { return d[1]; })
    //
    // };
    //
    //
    // function store(tt) {
    //     masses.push([tt/XUNITS, binary[0].mass, binary[1].mass]);
    // }
    //

    // function initCounters() {
    //     var texts = svgSim.selectAll("text.counters")
    //         .data(counterData).enter();
    //
    //     texts.append("rect")
    //         .attr("id", function(d){ return d.name; })
    //         .attr("class", "counters")
    //         .attr("x", function (d, i) { return d.x; })
    //         .attr("y", function (d, i) { return d.y - 20; });
    //
    //     texts.append("text")
    //         .attr("id", function(d){ return d.name; })
    //         .attr("class", "counters")
    //         .attr("text-anchor", "left")
    //         .attr("x", function (d, i) { return d.x; })
    //         .attr("y", function (d, i) { return d.y; });
    // }
    //
    // function updateCounters() {
    //
    //     texts = svgSim.selectAll("text.counters");
    //
    //     texts.text(function(d) { return d.name + ": " + d.num; });
    //
    //     // get bounding box of text field and store it in texts array
    //     texts.each(function(d, i) { d.bb = this.getBBox(); });
    //
    //     svgSim.selectAll("rect.counters")
    //         .attr("x", function(d) { return d.x - padLR/2; })
    //         .attr("y", function(d) { return d.y + padTB/2 - 20;  })
    //         .attr("simWidth", function(d) { return d.bb.width + padLR; })
    //         .attr("simHeight", function(d) { return d.bb.height + padTB; });
    // }

    function initButtons() {
        // On/Off Button
        svgSim.append("rect")
            .attr("class", "button")
            .attr("id", "stateRect")
            .on("click", toggleState);

        svgSim.append("text")
            .attr("class", "button")
            .attr("id", "stateText")
            .attr("text-anchor", "end")
            .attr("x", "98%")
            .attr("y", "2%")
            .text("Start")
            .on("click", toggleState);

        // Reset Button
        svgSim.append("rect")
            .attr("class", "button")
            .attr("id", "resetRect")
            .on("click", runReset);

        svgSim.append("text")
            .attr("class", "button")
            .attr("id", "resetText")
            .attr("text-anchor", "end")
            .attr("x", "98%")
            .attr("y", "4%")
            .text("Reset")
            .on("click", runReset);

        // Scale Button
        svgLeft.append("rect")
            .attr("class", "button")
            .attr("id", "scaleRect")
            .on("click", toggleScale);

        if( LOG_SCALE ){
            var scaleText = "Linear";
        } else {
            var scaleText = "Log";
        }
        svgLeft.append("text")
            .attr("class", "button")
            .attr("id", "scaleText")
            .attr("text-anchor", "end")
            .attr("x", "98%")
            .attr("y", "4%")
            .text(scaleText)
            .on("click", toggleScale);

    }

    function updateButtons() {

        // == State Button == //
        stateText = svgSim.selectAll("#stateText");
        textBB = stateText.node().getBBox();
        var yy = 0.02*simHeight + textBB.height;
        stateText.attr("y", yy);

        stateText.text(function (d) {
            if (!STATE_RUN) {
                return "Start";
            } else {
                return "Stop";
            }
        });

        // Have to update the BBox
        textBB = stateText.node().getBBox();
        stateRect = svgSim.selectAll("#stateRect")
            .style("x", textBB.x - BUTTON_PAD_X)
            .style("y", textBB.y - BUTTON_PAD_Y)
            .style("width", textBB.width + 2*BUTTON_PAD_X)
            .style("height", textBB.height + 2*BUTTON_PAD_Y);

        // == Reset Button == //
        rectBB = stateRect.node().getBBox();
        resetText = svgSim.selectAll("#resetText");
        // textBB = stateText.node().getBBox();
        var yy = 0.02*simHeight + textBB.height + rectBB.height;
        resetText.attr("y", yy);

        // Have to update the BBox
        textBB = resetText.node().getBBox();
        resetRect = svgSim.selectAll("#resetRect")
            .style("x", textBB.x - BUTTON_PAD_X)
            .style("y", textBB.y - BUTTON_PAD_Y)
            .style("width", textBB.width + 2*BUTTON_PAD_X)
            .style("height", textBB.height + 2*BUTTON_PAD_Y);

            // == State Button == //
            stateText = svgSim.selectAll("#stateText");
            textBB = stateText.node().getBBox();
            var yy = 0.02*simHeight + textBB.height;
            stateText.attr("y", yy);

            stateText.text(function (d) {
                if (!STATE_RUN) {
                    return "Start";
                } else {
                    return "Stop";
                }
            });

        // == Scale Button == //
        scaleText = svgLeft.selectAll("#scaleText");
        textBB = scaleText.node().getBBox();
        var yy = 0.02*simHeight + textBB.height;
        scaleText.attr("y", yy);

        scaleText.text(function (d) {
            if (LOG_SCALE) {
                return "Linear";
            } else {
                return "Log";
            }
        });

        // Have to update the BBox
        textBB = scaleText.node().getBBox();
        stateRect = svgLeft.selectAll("#scaleRect")
            .style("x", textBB.x - BUTTON_PAD_X)
            .style("y", textBB.y - BUTTON_PAD_Y)
            .style("width", textBB.width + 2*BUTTON_PAD_X)
            .style("height", textBB.height + 2*BUTTON_PAD_Y);

    }


    // function updatePlots(reset=false) {
    //
    //     // == Update Axes == //
    //
    //     // Update xaxes
    //     lastTime = masses.slice(-1)[0][0];
    //     xmax = xscale.domain()[1];
    //     if(lastTime > 0.8*xmax || reset){
    //         xmin = xscale.domain()[0];
    //         if (reset) {
    //             newEdge = XEDGE_INIT;
    //         } else {
    //             if(LOG_SCALE) {
    //                 newEdge =  3.14 * xmax;
    //             } else {
    //                 newEdge = 2.0 * xmax;
    //             }
    //         }
    //         xscale.domain([xmin, newEdge]);
    //
    //         svgLeft.select("#xaxis")
    //             .transition().duration(500).ease(d3.easeSinInOut)
    //             .call(xAxis);
    //     }
    //
    //     // Update yaxes
    //     lastMass = masses.slice(-1)[0];
    //     lastMass = Math.max(lastMass[1], lastMass[2]);
    //     ymax = yscale.domain()[1];
    //     if(lastMass > 0.8*ymax || reset){
    //         ymin = yscale.domain()[0];
    //         if (reset) {
    //             newEdge = YEDGE_INIT;
    //         } else {
    //             if(LOG_SCALE) {
    //                 newEdge = 3.14 * ymax;
    //             } else {
    //                 newEdge = 1.5 * ymax;
    //             }
    //         }
    //         yscale.domain([ymin, newEdge]);
    //
    //         svgLeft.select("#yaxis")
    //             .transition().duration(500).ease(d3.easeSinInOut)
    //             .call(yAxis);
    //     }
    //
    //     // == Update Lines == //
    //
    //     // SVG string specification for the line
    //     var pathStringM1 = lineGenM1(masses);
    //     var pathStringM2 = lineGenM2(masses);
    //
    //     svgLeft.select("#m1")
    //     	.attr('d', pathStringM1);
    //
    //     svgLeft.select("#m2")
    //     	.attr('d', pathStringM2);
    // }

    // == Sliders == //

    // function slide1(sval) {
    //     binary[0].mass = sliderScaleM1.invert(sval);
    //     handleM1.attr("cx", sliderScaleM1(binary[0].mass));
    //     bhMassTotal = binary[0].mass + binary[1].mass;
    //     updateBinary();
    // }
    //
    // function slide2(sval) {
    //     binary[1].mass = sliderScaleM2.invert(sval);
    //     handleM2.attr("cx", sliderScaleM2(binary[1].mass));
    //     bhMassTotal = binary[0].mass + binary[1].mass;
    //     updateBinary();
    // }
    //
    // function slideR(sval) {
    //     separation = sliderScaleR.invert(sval);
    //     handleR.attr("cx", sliderScaleR(separation));
    //     updateBinary();
    // }
    //
    // function slideF(sval) {
    //     feed_rate = sliderScaleF.invert(sval);
    //     handleF.attr("cx", sliderScaleF(feed_rate));
    // }
    //
    // function initSliders() {
    //     var ypos = 18;
    //
    //     // == Primary Mass == //
    //     sliderScaleM1 = d3.scaleLinear()
    //         .domain([0.1, 2.0])
    //         .range([0, 0.5*simWidth])
    //         .clamp(true);
    //
    //     sliderM1 = svgSim.append("g")
    //         .attr("class", "slider")
    //         .attr("transform", "translate(" + 0.25*simWidth + "," + ypos + ")");
    //
    //     var drag1 = d3.drag()
    //         .on("start.interrupt", function() { sliderM1.interrupt(); })
    //         .on("start drag", function() { slide1(d3.event.x); });
    //
    //     sliderM1.append("line")
    //         .attr("class", "track")
    //         .attr("x1", sliderScaleM1.range()[0])
    //         .attr("x2", sliderScaleM1.range()[1])
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-inset")
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-overlay")
    //         .call(drag1);
    //
    //     sliderM1.append("text")
    //         .attr("class", "label")
    //         .attr("id", "sliderM1Text")
    //         .attr("text-anchor", "right")
    //         .attr("x", -30)
    //         .attr("y", 5)
    //         .text("M1");
    //
    //     handleM1 = sliderM1.insert("circle", ".track-overlay")
    //         .attr("class", "handle")
    //         .attr("id", "handleM1")
    //         .attr("r", 9)
    //         .attr("cx", sliderScaleM1(binary[0].mass));
    //
    //
    //     // == Secondary Mass == //
    //
    //     sliderScaleM2 = d3.scaleLinear()
    //         .domain([0.1, 2.0])
    //         .range([0, 0.5*simWidth])
    //         .clamp(true);
    //
    //     sliderM2 = svgSim.append("g")
    //         .attr("class", "slider")
    //         .attr("transform", "translate(" + 0.25*simWidth + "," + 2*ypos + ")");
    //
    //     var drag2 = d3.drag()
    //         .on("start.interrupt", function() { sliderM2.interrupt(); })
    //         .on("start drag", function() { slide2(d3.event.x); });
    //
    //     sliderM2.append("line")
    //         .attr("class", "track")
    //         .attr("x1", sliderScaleM2.range()[0])
    //         .attr("x2", sliderScaleM2.range()[1])
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-inset")
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-overlay")
    //         .call(drag2);
    //
    //     sliderM2.append("text")
    //         .attr("class", "label")
    //         .attr("id", "sliderM2Text")
    //         .attr("text-anchor", "right")
    //         .attr("x", -30)
    //         .attr("y", 5)
    //         .text("M2");
    //
    //     handleM2 = sliderM2.insert("circle", ".track-overlay")
    //         .attr("class", "handle")
    //         .attr("id", "handleM2")
    //         .attr("r", 9)
    //         .attr("cx", sliderScaleM2(binary[1].mass));
    //
    //     // == Binary Separation == //
    //
    //     sliderScaleR = d3.scaleLinear()
    //         .domain([MIN_SEPARATION, MAX_SEPARATION])
    //         .range([0, 0.5*simWidth])
    //         .clamp(true);
    //
    //     sliderR = svgSim.append("g")
    //         .attr("class", "slider")
    //         .attr("transform", "translate(" + 0.25*simWidth + "," + 3*ypos + ")");
    //
    //     var dragR = d3.drag()
    //         .on("start.interrupt", function() { sliderR.interrupt(); })
    //         .on("start drag", function() { slideR(d3.event.x); });
    //
    //     sliderR.append("line")
    //         .attr("class", "track")
    //         .attr("x1", sliderScaleR.range()[0])
    //         .attr("x2", sliderScaleR.range()[1])
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-inset")
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-overlay")
    //         .call(dragR);
    //
    //     sliderR.append("text")
    //         .attr("class", "label")
    //         .attr("id", "sliderRText")
    //         .attr("text-anchor", "right")
    //         .attr("x", -23)
    //         .attr("y", 5)
    //         .text("R");
    //
    //     handleR = sliderR.insert("circle", ".track-overlay")
    //         .attr("class", "handle")
    //         .attr("id", "handleR")
    //         .attr("r", 9)
    //         .attr("cx", sliderScaleR(separation));
    //
    //     // == Feeding Rate == //
    //
    //     sliderScaleF = d3.scaleLinear()
    //         .domain([0.0, 100.0])
    //         .range([0, 0.5*simWidth])
    //         .clamp(true);
    //
    //     sliderF = svgSim.append("g")
    //         .attr("class", "slider")
    //         .attr("transform", "translate(" + 0.25*simWidth + "," + (simHeight - ypos) + ")");
    //
    //     var dragF = d3.drag()
    //         .on("start.interrupt", function() { sliderF.interrupt(); })
    //         .on("start drag", function() { slideF(d3.event.x); });
    //
    //     sliderF.append("line")
    //         .attr("class", "track")
    //         .attr("x1", sliderScaleF.range()[0])
    //         .attr("x2", sliderScaleF.range()[1])
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-inset")
    //       .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    //         .attr("class", "track-overlay")
    //         .call(dragF);
    //
    //     // sliderF.append("text")
    //     //     .attr("class", "label")
    //     //     .attr("id", "sliderFText")
    //     //     .attr("text-anchor", "right")
    //     //     .attr("x", -23)
    //     //     .attr("y", 5)
    //     //     .text("F");
    //
    //     handleF = sliderF.insert("circle", ".track-overlay")
    //         .attr("class", "handle")
    //         .attr("id", "handleF")
    //         .attr("r", 9)
    //         .attr("cx", sliderScaleF(feed_rate));
    //
    // }
}
