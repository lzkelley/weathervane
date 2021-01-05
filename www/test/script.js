/*
 *
 *
 *
 */

/*    ========    SETTINGS    =========    */


var UPDATE_INTERVAL = 2000;
// var BINARY_MOTION = true;
// var NUM_PARTICLES = 400;

var svgPlot = d3.select('#plotContainer');

var FILL_OPACITY = 0.25;
var FILL_COLOR = "steelblue";
var LINE_COLOR = "steelblue";

// T,R,B,L
var TOP = 0;
var RIGHT = 1;
var BOTTOM = 2;
var LEFT = 3;
var margin = 80;
margin = [margin, margin, margin, margin];

// These are strings
var contWidth = svgPlot.style("width");
var contHeight = svgPlot.style("height");
// Convert to floats
contWidth = parseFloat(contWidth.replace("px", ""));
contHeight = parseFloat(contHeight.replace("px", ""));
console.log(contWidth, contHeight);
// calculate plot dimensions
var plotWidth = contWidth - margin[LEFT] - margin[RIGHT];
var plotHeight = contHeight - margin[TOP] - margin[BOTTOM];

/*    ========    INITIALIZE OBJECTS    =========    */
// These are all set in `reset()`
// var phaseInit, binary, particles, bhMassRatio, bhMassTotal, masses, separation;

// These are set in `initPlots()`
// var pathStringM1, pathStringM2, lineGenM1, lineGenM2;
var xmin, xmax, ymin, ymax, xscale, yscale, xAxis, yAxis;

// counterData = [
//     {name: "Particles", num: NUM_PARTICLES, x: 0, y: 20},
//     {name: "Consumed", num: 0, x: 0, y: 40},
//     {name: "Created", num: 0, x: 0, y: 60}
// ]

// These are set in `initSliders()`
// var sliderScaleM1, sliderM1, sval, handle;

// Storage for definitions, 'defs' tells SVG they are resources
// var defs = svgSim.append("defs");

// function bhSize(mass) {
//     return mass*BH_RADIUS;
// }
//
// if(THREE_D){
//     var pSizeScale = d3.scaleLinear()
//     	.domain([0, simDepth])
//     	.range([0.5*PARTICLE_RADIUS, 1.5*PARTICLE_RADIUS]);
//     var pSize = function(pVec) { return pSizeScale(pVec[2]); }
// } else {
//     var pSize = function(pVec) { return PARTICLE_RADIUS; }
// }

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

// == Integration Variables ==
// var br = 0.0, bhRad = 0.0, soft = 0.0, distCubed = 0.0, pRad = 0.0;
// var dr = new Array(NDIM);
// var t0 = 0.0;
// var t1 = 0.0;
// var rad = 0.0, vals, feed_num, news, olds;
// var lastTime = 0.0, edge = 0.0, newEdge = 0.0;

/*    ========    FUNCTIONS    =========    */

// var dataTempVsDay = {};
// var dataTempVsHour = {};

var AVE_LINE_KEY = "ave_line";
var CONF_FILL_KEY = "conf_fill";

function loadData() {
    // NOTE: this requires a local webserver running locally
    // RUN `python3 -m http.server` in this directory, and access `index.html` through that!
    //
    let fname = 'http://localhost:8000/temp-ave_vs-day.csv';
    loadDataFromFile(fname);

    // fname = 'http://localhost:8000/temp-ave_vs-hr.csv';
    // loadDataFromFile(fname);
}

function loadDataFromFile(fname) {
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

    console.log(d3.csv(fname));

    d3.csv(fname).then(function(data) {
        console.log("data = ", data);
        data.forEach(function(d) {
            console.log("d = ", d);
            for(let key in d){
                d[key.trim()] = +d[key];
                if(key.trim() != key) {
                    delete d[key];
                }
            };
        });


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

        console.log(data[0]);
        var key = '#' + AVE_LINE_KEY;
        svgPlot.select(key)
            .datum(data)
            .attr("d", d3.line()
                .x(function(d) { console.log("X"); return xscale(d.x); })
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


        // svgPlot.append("path")
        //     .datum(data)
        //     .attr("fill", "none")
        //     .attr("stroke", "steelblue")
        //     .attr("stroke-width", 1.5)
        //     .attr("d", d3.line()
        //         .x(function(d) { return xscale(d.x); })
        //         .y(function(d) { return yscale(d.ave); })
        //     );

    });
    return
};


function format(num) {
    return num.toExponential(2);
}

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

function update(tt) {
    console.log("update", tt);

    // console.log(dataTempVsDay);
    // size =

    // Show confidence interval
    // svgPlot.append("path")
    //   .datum(data)
    //   .attr("fill", "#cce5df")
    //   .attr("stroke", "none")
    //   .attr("d", d3.area()
    //     .x(function(d) { return x(d.x) })
    //     .y0(function(d) { return y(d.CI_right) })
    //     .y1(function(d) { return y(d.CI_left) })
    //     )
    //
    // // Add the line
    // svgPlot.append("path")
    //   .datum(data)
    //   .attr("fill", "none")
    //   .attr("stroke", "steelblue")
    //   .attr("stroke-width", 1.5)
    //   .attr("d", d3.line()
    //     .x(function(d) { return x(d.x) })
    //     .y(function(d) { return y(d.y) })
    //     )



}


// function evolve(tt) {
//     if(!STATE_RUN) {
//         return;
//     }
//
//     t0 = t1;
//     t1 = tt;
//     dt = (t1 - t0) * (t0 > 0 && t1 > 0);
//     sim_time += dt;
//     store_time += dt;
//     feed_time += dt;
//
//     if(store_time > store_time_interval){
//         store_time = 0.0;
//         store(sim_time);
//     }
//
//     if(PARTICLE_MOTION) {
//         integrateParticles(particles, dt);
//         if (feed_rate > 0.0) {
//             feed_num = Math.floor(feed_time*feed_rate/1000.0);
//             addParticles(feed_num);
//             feed_time -= feed_num * 1000 / feed_rate;
//         }
//         updateParticles(particles);
//     }
//
//     if(BINARY_MOTION) {
//         integrateBinary(binary, dt);
//         updateBinary();
//     }
//
//     updatePlots();
//     updateCounters();
// }

function reset() {
    // separation = Math.random()*(MAX_SEPARATION - MIN_SEPARATION) + MIN_SEPARATION
    // bhMassTotal = 1.0;
    // bhMassRatio = Math.random();
    // m1 = bhMassTotal/(1.0 + bhMassRatio);
    // m2 = bhMassTotal - m1;
    // // console.log("m1 = ", format(m1), "; m2 = ",
    // //             format(m2), "; mu = ", format(m2/m1), "; M = ", format(m1+m2));
    //
    // phaseInit = Math.random();
    // binary = [
    // 	{name: "a", phase: phaseInit, mass: m1},
    // 	{name: "b", phase: phaseInit + 0.5, mass: m2}
    // ];
    //
    // particles = d3.range(NUM_PARTICLES).map(function(i) {
    //     var vals = new Array(3*NDIM);
    //     for(var ii = 0; ii < NDIM; ii++) {
    //         // Positions
    //         vals[ii] = bounds[ii] * Math.random();
    //         // Velocities
    //         vals[ii + NDIM] = 2*(Math.random() - 0.5);
    //         // Accelerations
    //         vals[ii + NDIM*2] = 0.0;
    //     }
    //     return vals;
    // });
    //
    // counterData[0].num = NUM_PARTICLES;
    // counterData[1].num = 0;
    // counterData[2].num = 0;
    //
    // sim_time = 0.0;
    // store_time = 0.0;
    // feed_time = 0.0;
    // masses = [[xedge_log_min, m1, m2]];
    // yedge_log_min = Math.min(0.5*m2, 0.1);
}

// function runReset() {
//     reset();
//     updateCounters();
//     updateParticles(particles);
//     updateBinary();
//     updatePlots(true);
// }

// == Plot / Figure Stuff == //

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
    svgPlot.append("rect")
        .attr("class", "button")
        .attr("id", "scaleRect")
        .on("click", toggleScale);

    if( LOG_SCALE ){
        var scaleText = "Linear";
    } else {
        var scaleText = "Log";
    }
    svgPlot.append("text")
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
    scaleText = svgPlot.selectAll("#scaleText");
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
    stateRect = svgPlot.selectAll("#scaleRect")
        .style("x", textBB.x - BUTTON_PAD_X)
        .style("y", textBB.y - BUTTON_PAD_Y)
        .style("width", textBB.width + 2*BUTTON_PAD_X)
        .style("height", textBB.height + 2*BUTTON_PAD_Y);

}

// function toggleState(d, i) {
//     STATE_RUN = !STATE_RUN
//     updateButtons();
//     t0 = t1 = 0.0;
// }
//
// function toggleScale() {
//     LOG_SCALE = !LOG_SCALE;
//
//     initPlotScales();
//     updateButtons();
//     updatePlots(true);
// }


function initPlots() {

    // == Scales and Axes == //
    xscale = d3.scaleLinear()
        .domain([0.0, 356])
        .range([0.0, plotWidth]);
        // .range([margin[LEFT], margin[LEFT] + plotWidth]);
    yscale = d3.scaleLinear()
        // .domain([24.0, 0.0])
        .domain([50.0, 100.0])
        // .range([contHeight - margin[BOTTOM], margin[TOP]]);
        // .range([plotHeight, 0.0]);
        .range([plotHeight, 0.0]);

    xaxis = d3.axisBottom(xscale);
    yaxis = d3.axisLeft(yscale);  // .ticks(5);

    // == Lines and Generators == //
    // lineGenM1 = d3.line()
    //     .x(function(d) { return xscale(d[0]); })
    //     .y(function(d) { return yscale(d[1]); });
    // lineGenM2 = d3.line()
    //     .x(function(d) { return xscale(d[0]); })
    //     .y(function(d) { return yscale(d[2]); });

    // pathStringM1 = lineGenM1(masses);
    // pathStringM2 = lineGenM2(masses);
    //
    // // == Add to Figure == //
    // svgPlot.append("path")
    //     .attr("class", "line")
    //     .attr("id", "m1")
    //     .attr("transform", "translate(50, 10)")
    // 	.attr('d', pathStringM1);
    //
    // svgPlot.append("path")
    //     .attr("class", "line")
    //     .attr("id", "m2")
    //     .attr("transform", "translate(50, 10)")
    // 	.attr('d', pathStringM2);

    var xtrans = "translate(" + margin[LEFT] + ", " + (contHeight - margin[BOTTOM]) + ")";
    var ytrans = "translate(" + margin[LEFT] + ", " + margin[BOTTOM] + ")";

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
        .attr("opacity", FILL_OPACITY)
        .attr("fill", FILL_COLOR)
        .attr("stroke", "none")
        .attr("transform", ytrans)
        .attr("d", "");

    svgPlot.append("path")
        .attr("class", "fill")
        .attr("id", CONF_FILL_KEY + "_2")
        .attr("opacity", FILL_OPACITY)
        .attr("fill", FILL_COLOR)
        .attr("stroke", "none")
        .attr("transform", ytrans)
        .attr("d", "");

    svgPlot.append("path")
        .attr("class", "line")
        .attr("id", AVE_LINE_KEY)
        .attr("fill", "none")
        .attr("stroke", LINE_COLOR)
        .attr("stroke-width", 1.5)
        .attr("transform", ytrans)
    	.attr('d', "");

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
//         svgPlot.select("#xaxis")
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
//         svgPlot.select("#yaxis")
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
//     svgPlot.select("#m1")
//     	.attr('d', pathStringM1);
//
//     svgPlot.select("#m2")
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


/*    ========    RUN SIMULATION    =========    */



// reset();

initPlots();

loadData();



// updateParticles(particles);
// updateBinary();
//
// initSliders();

// Call this after particles and binaries so that counters are on top.
// initCounters();
// updateCounters();
//
// initButtons();
// updateButtons();

// Loop
var interval = d3.interval(update, UPDATE_INTERVAL);
