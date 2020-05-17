import * as d3 from "d3";

/* selection of HTML and SVG elements */
let section = d3.select("#content"),
  graph = d3
    .select("#my_graph")
    .attr("width", 500)
    .attr("height", 150)
    .call(responsivefy),
  container = d3.select("#countries"),
  yaxis_button = d3.select("#y-axis-button"),
  play_button = d3.select("#play"),
  pause_button = d3.select("#pause"),
  slider = d3.select("#year");

/* display parameters */
const radius = 20,
  spacing = 3,
  time_pace = 500,
  height = 400, // section.node().getBBox().height, // height of display zone
  width = section.node().offsetWidth, // getBBox().width,  // width  of display zone
  inner_margin = 30, // margin between axes and first dot
  outer_margin = 30, // margin between axis and exterior of the display zone
  margin = inner_margin + outer_margin;

/* interaction variables */
let t_duration = 0,
  which_var_value = yaxis_button.property("value"),
  which_var_axis = yaxis_button.property("value"),
  year_min = +slider.property("min"),
  year_current = +slider.property("value"),
  year_max = +slider.property("max"),
  year_index = year_current - year_min;

document.getElementById("year-max").innerHTML = year_max; /* Task 4 */
document.getElementById("year-min").innerHTML = year_min; /* Task 4 */
document.getElementById("current_year").innerHTML = year_current; /* Task 4 */

/* scale definition */

const compute_scales = function(countries_svg) {
  let data = countries_svg.data();

  let xMax = d3.max(data.map(d => d.income).flat()),
    xMin = d3.min(data.map(d => d.income).flat()),
    yMax = d3.max(
      data
        .map(d =>
          which_var_axis === "co2_emissions"
            ? d.co2_emissions
            : which_var_axis === "life_expectancy"
            ? d.life_expectancy
            : 20
        )
        .flat()
    ),
    rMax = d3.max(data.map(d => d.population).flat());

  return {
    countries_svg: countries_svg,
    x: d3
      .scaleLog()
      .domain([xMin, xMax])
      .range([margin, width - margin])
      .nice(), // .nice().tickFormat(5)
    y: d3
      .scaleLinear()
      .domain([0, yMax])
      .range([height - margin, margin])
      .unknown(height - outer_margin - inner_margin / 2),
    r: d3
      .scaleSqrt()
      .domain([0, rMax])
      .range([0, radius]),
    o: d3
      .scaleOrdinal()
      .domain(["asia", "americas", "europe", "africa"])
      .range(["#6EBB87", "#DA94CE", "#DE9D6C", "#2CB8EA"]),
    yMax
  };
};

/* graph construction */

function draw_yaxis({ countries_svg, x, y, r, o }) {
  graph.select("#y-axis").remove();

  let y_axis = graph
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", "translate(" + outer_margin + ",0)");

  let y_label = y_axis
    .append("text")
    .attr("text-anchor", "end")
    .attr("fill", "grey")
    .attr("x", -margin)
    .attr("y", 10)
    .attr("transform", "rotate(-90)");

  y_label.text(
    which_var_value === "co2_emissions"
      ? "CO² Emissions (tons/year)"
      : which_var_value === "life_expectancy"
      ? "Life Expectancy (years)"
      : "Unknokwn variable :("
  );

  y_axis
    .transition()
    .duration(1000)
    .call(d3.axisLeft().scale(y));
}

function draw_xaxis({ countries_svg, x, y, r, o }) {
  graph.select("#x-axis").remove();

  let x_axis = graph
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + (height - outer_margin) + ")");

  x_axis
    .append("text")
    .attr("fill", "grey")
    .attr("text-anchor", "end")
    .attr("x", width - margin)
    .attr("y", -3)
    .text(
      "Income per inhabitant at purchasing power parity " +
        "(dollars, logarithmic scale)"
    );

  x_axis.call(
    d3
      .axisBottom()
      .scale(x)
      .tickFormat(x.tickFormat(10, d3.format(",d")))
  );

  x_axis
    .attr("text-anchor", "beginning")
    .selectAll(".tick > text")
    .attr("dx", "-10")
    .filter(function(d, i, nodes) {
      return i === nodes.length - 1;
    })
    .attr("text-anchor", "end")
    .attr("dx", "10");
}

function draw_countries({ countries_svg, x, y, r, o }) {
  let transition = d3.transition().duration(t_duration);

  countries_svg.transition(transition).attr("fill", d => o(d.region));

  countries_svg
    .select("circle")
    .transition(transition)
    .attr("cx", d => x(d.income[year_index]))
    .attr("cy", d =>
      which_var_value === "co2_emissions" ||
      which_var_value === "life_expectancy"
        ? y(d[which_var_value][year_index])
        : 200
    )
    .attr("r", d => r(d.population[year_index]))
    .attr("stroke", d => o(d.region));

  countries_svg.sort((a, b) => b.population - a.population);

  countries_svg
    .select("text")
    .transition(transition)
    .attr("x", d => x(d.income[year_index]) - r(d.population[year_index]))
    .attr("y", d =>
      getTextWidth(d.name) > 2 * r(d.population[year_index])
        ? which_var_value === "co2_emissions" ||
          which_var_value === "life_expectancy"
          ? y(d[which_var_value][year_index]) + 20
          : 220
        : which_var_value === "co2_emissions" ||
          which_var_value === "life_expectancy"
        ? y(d[which_var_value][year_index])
        : 200
    )
    .text(d => d.name);

  t_duration = 250;

  return { countries_svg, x, y, r, o };
}

/*function draw_path({ countries_svg, x, y, r, o }) {
  var valueline = d3
    .line()
    .x(function(d) {
      return d => d.income[year_index];
    })
    .y(function(d) {
      return d =>
        which_var_value === "co2_emissions"
          ? d[which_var_value][year_index]
          : which_var_value === "life_expectancy"
          ? d[which_var_value][year_index]
          : 200;
    });

  countries_svg
    .append("path")
    .attr("class", "line")
    .attr("d", valueline)
    .attr("stroke", d => o(d.region));

  return { countries_svg, x, y, r, o };
}*/

/* action */
function toggle_selected() {
  this.classList.toggle("selected");
}

let t;

function start_timer() {
  if (year_current === year_max) {
    // remise à zéro
    year_current = year_min;
    year_index = 0;
    slider.property("value", year_min);
  }

  t = d3.interval(increment, time_pace); // timer
  document.getElementById("play").disabled = true;
  document.getElementById("pause").disabled = false;
}

function pause_timer() {
  t.stop();
  document.getElementById("pause").disabled = true;
  document.getElementById("play").disabled = false;
}

function increment() {
  if (year_current === year_max) {
    t.stop();
  } else {
    year_current += 1;
    year_index = year_current - year_min;

    slider.property("value", year_current);
    slider.dispatch("input");
  }
}

/* data */

d3.json("data/countries.json").then(countries_json => {
  let countries_svg = container
    .selectAll("g")
    .data(countries_json)
    .join("g");

  countries_svg.append("circle");
  countries_svg.append("text");
  /*countries_svg.append("path");*/

  container.dispatch("data_ready", {
    detail: countries_svg
  });
});

/* subscriptions */

container.on("data_ready", function() {
  let countries_svg = d3.event.detail;
  let detail = compute_scales(countries_svg);
  container.dispatch("scale_ready", { detail: detail });
});

container.on("scale_ready", function() {
  let params = d3.event.detail;
  draw_xaxis(params);
  draw_yaxis(params);
  let detail = draw_countries(params);
  container.dispatch("countries_ready", { detail: detail });
});

container.on("countries_ready", function() {
  let countries_svg = d3.event.detail;
  set_up_listeners(countries_svg);
  /*antiColliding(countries_svg);*/
});

function set_up_listeners({ countries_svg, x, y, r, o }) {
  let list_y_already = ["life_expectancy"];
  countries_svg.on("click", toggle_selected);
  play_button.on("click", start_timer);
  pause_button.on("click", pause_timer);

  slider.on("input", function() {
    year_current = +slider.property("value");
    year_index = year_current - year_min;
    draw_countries({ countries_svg, x, y, r, o });
    /*draw_path({ countries_svg, x, y, r, o });*/
    document.getElementById("current_year").innerHTML = year_current;
  });

  yaxis_button.on("change", function() {
    list_y_already.push(yaxis_button.property("value"));

    function whichAxis() {
      if (list_y_already.includes("co2_emissions")) {
        return "co2_emissions";
      } else {
        return "life_expectancy";
      }
    }

    which_var_axis = whichAxis();
    which_var_value = yaxis_button.property("value");

    let params = compute_scales(countries_svg);

    draw_countries(params);
    /*draw_path(params);*/
    draw_yaxis(params);
  });
}

function responsivefy(svg) {
  // container will be the DOM element
  // that the svg is appended to
  // we then measure the container
  // and find its aspect ratio
  const container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style("width"), 10),
    height = parseInt(svg.style("height"), 10),
    aspect = width / height;

  // set viewBox attribute to the initial size
  // control scaling with preserveAspectRatio
  // resize svg on inital page load
  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMid")
    .call(resize);

  // add a listener so the chart will be resized
  // when the window resizes
  // multiple listeners for the same event type
  // requires a namespace, i.e., 'click.foo'
  // api docs: https://goo.gl/F3ZCFr
  d3.select(window).on("resize." + container.attr("id"), resize);

  // this is the code that resizes the chart
  // it will be called on load
  // and in response to window resizes
  // gets the width of the container
  // and resizes the svg to fill it
  // while maintaining a consistent aspect ratio
  function resize() {
    const w = parseInt(container.style("width"));
    svg.attr("width", w);
    svg.attr("height", Math.round(w / aspect));
  }
}

/* Tache 6 */
function getTextWidth(country_name) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  ctx.font = "12px times new roman"; /* la même font que définie dans le css */
  return ctx.measureText(country_name).width;
}

/* Tache 7 
function colorRandom() {
  var randomNumber = Math.floor(Math.random() * 100);
  var circleElements = container.nodes()[0].selectAll("circle");
  var randomCountry = circleElements.select(function(d, i) {
    return i === randomNumber ? this : null;
  }); */

  randomCountry
    .transition() // first transition
    .attr("stroke", "red")
    .delay(500)
    .duration(1500)
    .on("end", function() {
      // on end of transition...
      d3.select(this)
        .transition() // second transition
        .attr("stroke", this.stroke) // second x
        .delay(200) // second delay
        .duration(1500); // second ease
    });
  setTimeout(colorRandom, 10000);
}

//colorRandom();

/* Tache 10

function antiColliding({ countries_svg, x, y, r, o }) {
  var numNodes = 195;
  var nodes = d3.range(numNodes).map(function(d) {
    return { radius: 7 };
  });

  var simulation = d3
    .forceSimulation(nodes)
    .force(
      "x",
      d3.forceX().x(function(d) {
        return x(countries_svg.selectAll("circle").cx);
      })
    )
    .force(
      "y",
      d3.forceY().y(function(d) {
        return y(countries_svg.selectAll("circle").cy);
      })
    )
    .force(
      "collision",
      d3.forceCollide().radius(function(d) {
        return d.radius;
      })
    );

  simulation.on("tick", ticked);

  function ticked() {
    var u = d3
      .select("svg")
      .selectAll("circle")
      .data(nodes);

    u.enter()
      .append("circle")
      .attr("r", function(d) {
        return d.radius;
      })
      .merge(u)
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });

    u.exit().remove();
  }
}
*/
