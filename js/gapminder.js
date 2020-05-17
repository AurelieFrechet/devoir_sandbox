import * as d3 from "d3";

/*
README :
We answered questions 1,2,3,4 and 6
You can search for (ctrl + F) "Q1" for example in order to check where we coded to answer it. 
We made some bonuses: the reinitialize button works, the footer stick in the bottom (CSS), the y axis fit to the minimum value of the data. Enjoy !
*/

/* selection of HTML and SVG elements */
let section = d3.select("#content"),
  graph = d3.select("#my_graph"),
  container = d3.select("#countries"),
  yaxis_button = d3.select("#y-axis-button"),
  play_button = d3.select("#play"),
  pause_button = d3.select("#pause"),
  reinitialize = d3.select("#reinitialize"),
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
  which_var = yaxis_button.property("value"),
  year_min = +slider.property("min"),
  year_current = +slider.property("value"),
  year_max = +slider.property("max"),
  year_index = year_current - year_min;

/* scale definition */

const compute_scales = function(countries_svg) {
  let data = countries_svg.data();

  let xMax = d3.max(data.map(d => d.income).flat()),
    xMin = d3.min(data.map(d => d.income).flat()),
    yMin = d3.min(
      //Bonus
      data
        .map(d =>
          which_var === "co2_emissions" ? d.co2_emissions : d.life_expectancy
        )
        .flat()
    ),
    yMax = d3.max(
      data
        .map(d =>
          which_var === "co2_emissions" ? d.co2_emissions : d.life_expectancy
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
      .nice(),
    y: d3
      .scaleLinear()
      .domain([yMin, yMax]) //Bonus
      .range([height - margin, margin])
      .unknown(height - outer_margin - inner_margin / 2),
    r: d3
      .scaleSqrt()
      .domain([0, rMax])
      .range([0, radius]),
    o: d3
      .scaleOrdinal()
      .domain(["asia", "americas", "europe", "africa"])
      .range(["#6EBB87", "#DA94CE", "#DE9D6C", "#2CB8EA"])
  };
};

/* graph construction */
// function that draws the y axis
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
    which_var === "co2_emissions"
      ? "CO² Emissions (tons/year)"
      : which_var === "life_expectancy"
      ? "Life Expectancy (years)"
      : "" // Q3
  );

  y_axis.call(d3.axisLeft().scale(y));
}
// function that draws the x axis
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

// Q2 : Instanciates the year in botton right
var year_to_display = graph
  .append("text")
  .attr("x", width / 1.5)
  .attr("y", height / 1.5)
  .text(year_current) // initial value
  .attr("fill", "#A0A0A0")
  .attr("id", ",year");

// Q6 : Gets text width to fit country name inside dot if possible
function textsize(country) {
  let c = document.createElement("canvas");
  var ctx = c.getContext("2d");
  return {
    width: ctx.measureText(country).width,
    height: ctx.measureText(country).height
  };
}

// function that draws the countries
function draw_countries({ countries_svg, x, y, r, o }) {
  let transition = d3.transition().duration(t_duration);

  countries_svg.transition(transition).attr("fill", d => o(d.region));
  // Q3 : If Y-axis is None :
  if (which_var === "None") {
    let annee = year_index;
    countries_svg
      .select("circle")
      .transition(transition)
      .attr("cx", d => x(d.income[annee]))
      .attr("cy", d => 300) // centers the countries on an arbitrary axis
      .attr("r", d => 2 * r(d.population[year_index]));

    // Draws the country names :
    countries_svg
      .select("text")
      .transition(transition)
      .style("text-anchor", "middle")
      .attr("x", d => x(d.income[year_index]) + spacing)
      .attr(
        "y",
        d =>
          textsize(d.name).width < 2 * r(d.population[year_index]) + spacing // if text width is small enough :
            ? 300 // fit it inside the dot
            : 300 + 4 * r(d.population[year_index]) //else : put it below
      )
      .attr("fill", "#070B19")
      .text(d => d.name);
    // Q3 : If Y-axis is different from None :
  } else {
    countries_svg
      .select("circle")
      .transition(transition)
      .attr("cx", d => x(d.income[year_index]))
      .attr("cy", d => y(d[which_var][year_index]))
      .attr("r", d => 2 * r(d.population[year_index]))
      .attr("stroke", d => o(d.region));

    countries_svg.sort((a, b) => b.population - a.population); // So the small dots are in front

    // Q6 : Draws the country names :
    countries_svg
      .select("text")
      .transition(transition)
      .style("text-anchor", "middle")
      .attr("x", d => x(d.income[year_index]) + spacing)
      .attr(
        "y",
        d =>
          textsize(d.name).width < 2 * r(d.population[year_index]) + spacing // if text width is small enough :
            ? y(d[which_var][year_index]) // fit it inside the dot
            : y(d[which_var][year_index]) + 4 * r(d.population[year_index]) //else : put it below
      )
      .attr("fill", "#070B19")
      .text(d => d.name);

    year_to_display.text(+slider.property("value")); //Q2

    t_duration = 250;
  }
  return { countries_svg, x, y, r, o };
}

/* action */
function toggle_selected() {
  this.classList.toggle("selected");
}

let t;

function start_timer() {
  // Q1 : releases the pause button
  document.getElementById("pause").disabled = false;
  // Q1 : blocks the play button
  document.getElementById("play").disabled = true;
  document.getElementById("reinitialize").disabled = false; //Bonus
  if (year_current === year_max) {
    // resets slider
    year_current = year_min;
    year_index = 0;
    slider.property("value", year_min);
  }

  t = d3.interval(increment, time_pace); // timer
}

function pause_timer() {
  // Q1 : block the pause button
  document.getElementById("pause").disabled = true;
  // Q1 : release the play button
  document.getElementById("play").disabled = false;
  document.getElementById("reinitialize").disabled = false; //Bonus
  t.stop();
}

function reset_timer() {
  year_current = year_min;
  year_index = 0;
  slider.property("value", year_min);
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

// Q4 : initiates the min, max, current and index years with countries data
function update_year_variables(countries_data) {
  let min = null;
  let max = null;
  for (let i in countries_data) {
    let years = countries_data[i].year;
    for (let y in years) {
      let year = years[y];
      if (max == null || year > max) {
        max = year;
      }
      if (min == null || year < min) {
        min = year;
      }
    }
  }

  year_min = min;
  year_current = year_min;
  year_max = max;
  year_index = year_current - year_min;
}

// Q4 : updates the value of the years in the html (input field)
function update_years_in_html() {
  slider.property("min", year_min);
  slider.property("value", year_current);
  slider.property("max", year_max);

  document.getElementById("year-min").innerHTML = String(year_min);
  document.getElementById("year-max").innerHTML = String(year_max);
}

/* data */

d3.json("data/countries.json").then(countries_json => {
  let countries_svg = container
    .selectAll("g")
    .data(countries_json)
    .join("g");

  // Q4: definition of the max and min years

  update_year_variables(countries_json);
  update_years_in_html();

  countries_svg.append("circle");
  countries_svg.append("text");

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
});

function set_up_listeners({ countries_svg, x, y, r, o }) {
  countries_svg.on("click", toggle_selected);
  play_button.on("click", start_timer);
  pause_button.on("click", pause_timer);
  reinitialize.on("click", reset_timer);

  slider.on("input", function() {
    year_current = +slider.property("value");
    year_index = year_current - year_min;
    draw_countries({ countries_svg, x, y, r, o });
  });

  yaxis_button.on("change", function() {
    which_var = yaxis_button.property("value");
    let params = compute_scales(countries_svg);

    draw_countries(params);
    draw_yaxis(params);
  });
}
