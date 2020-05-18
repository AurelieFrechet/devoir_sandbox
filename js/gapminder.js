/* 

Modifications apportées :
  - Amélioration 1 complète
  - Amélioration 2 complète
  - Amélioration 3 complète
  - Amélioration 4 complète
  - Amélioration 5 complète
  - Amélioration 6 : les labels sont bien mis en dessous des cercles mais
    l'option mettre les labels dans les cercles n'a pas été faite"
  - Amélioration 7 : l'animation des points toutes les 30 secondes fonctionne, 
    mais les points ne reviennent pas à leur position initiale.

*/

import * as d3 from "d3";
import { forceManyBody } from "d3";

/* selection of HTML and SVG elements */
let body = d3.select("body"),
  section = d3.select("#content"),
  graph = d3.select("#my_graph"),
  container = d3.select("#countries"),
  yaxis_button = d3.select("#y-axis-button"),
  play_button = d3.select("#play"),
  pause_button = d3.select("#pause"),
  slider = d3.select("#year"),
  reinitialize = d3.select("#reinitialize");

/* display parameters */
const radius = 20,
  spacing = 3,
  time_pace = 500,
  height = 400, // section.node().getBBox().height, // height of display zone
  inner_margin = 30, // margin between axes and first dot
  outer_margin = 30, // margin between axis and exterior of the display zone
  margin = inner_margin + outer_margin,
  time_pace_hint = 30000; //le temps au bout duquel l'utilisateur sera alerté
//La largeur de la fenêtre n'est plus une constante, c'est une variable maintenant
let width = section.node().offsetWidth; // getBBox().width,  // width  of display zone

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
      .range(["#6EBB87", "#DA94CE", "#DE9D6C", "#2CB8EA"])
  };
};

/* graph construction */

function draw_yaxis({ countries_svg, x, y, r, o }) {
  graph.select("#y-axis").remove();

  let y_axis = graph
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", "translate(" + outer_margin + ",0)");

  //Si la variable which_var n'est pas égal à none on montre l'axe des y comme précédemment
  if (which_var && which_var !== "none") {
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
        : "Unknokwn variable :("
    );
    //Si la variable which_var est none, on cache l'axe des y
  } else {
    document.getElementById("y-axis").style.display = "none";
  }

  y_axis.call(d3.axisLeft().scale(y));
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

  //On modifie la valeur de l'année correspondant au graphique à l'aide de la variable year_current
  document.getElementById("year_print").innerHTML = year_current;

  countries_svg.transition(transition).attr("fill", d => o(d.region));

  countries_svg
    .select("circle")
    .transition(transition)
    .attr("cx", d => x(d.income[year_index]))
    //Si la variable y n'est pas none on donne la valeur des y comme avant,
    //Sinon, on la fixe à 50 pour toutes les valeurs de x
    .attr("cy", d => y(d[which_var] ? d[which_var][year_index] : 50))
    .attr("r", d => r(d.population[year_index]))
    .attr("stroke", d => o(d.region));

  countries_svg.sort((a, b) => b.population - a.population);

  countries_svg
    .select("text")
    .transition(transition)
    .attr(
      "x",
      d => x(d.income[year_index]) //+ r(d.population[year_index]) + spacing
    )
    //L'ordonée du texte = l'ordonnée du cercle - son rayon/2 + 5.
    //Cela positionne le texte en dessous du cercle auquel il correspond
    .attr(
      "y",
      d =>
        y(
          d[which_var]
            ? d[which_var][year_index] - r(d.population[year_index] / 2)
            : 50 - r(d.population[year_index] / 2)
        ) + 5
    )
    .text(d => d.name);

  t_duration = 250;

  return { countries_svg, x, y, r, o };
}

/* action */
function toggle_selected() {
  this.classList.toggle("selected");
}

//Fonction pour réninitialiser le slider
const reinitializer = function() {
  year_current = year_min;
  year_index = 0;
  slider.property("value", year_min);
};

let t;

function start_timer() {
  //On désactive le bouton play lorsqu'il est déja activé
  document.getElementById("play").disabled = true;
  document.getElementById("pause").disabled = false;

  if (year_current === year_max) {
    reinitializer();
  }

  t = d3.interval(increment, time_pace); // timer

  //On réinitialise le slider quand le bouton reinitialize est cliqué
  reinitialize.on("click", reinitializer);
}

function pause_timer() {
  t.stop();
  //On désactive le bouton pause lorsqu'il est déja activé
  document.getElementById("pause").disabled = true;
  document.getElementById("play").disabled = false;
  console.log(document.getElementById("pause"));
  //document.getElementById("play").disabled = false;
}

function increment() {
  if (year_current === year_max) {
    pause_timer();
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

function slider_min_max(countries_svg) {
  let data = countries_svg.data();

  let slider_min = d3.min(data.map(d => d.year).flat()),
    slider_max = d3.max(data.map(d => d.year).flat());

  //Eciture des valeur minimale et maximale d'année dans le navigateur
  body
    .select("#sidepannel")
    .selectAll("div")
    .select("#controls")
    .selectAll(".control-unit")
    .select("#year-min")
    .text(slider.property("min"));

  body
    .select("#sidepannel")
    .selectAll("div")
    .select("#controls")
    .selectAll(".control-unit")
    .select("#year-max")
    .text(slider.property("max"));

  return {
    slider_min: slider_min,
    slider_max: slider_max
  };
}

function set_up_listeners({ countries_svg, x, y, r, o }) {
  slider.property("max", slider_min_max(countries_svg).slider_max); //définition de la valeur maximale de l'input
  slider.property("min", slider_min_max(countries_svg).slider_min); //définition de la valeur minimale de l'input

  //Fonction pour animer un point sélectionné au hasard

  function bounce() {
    let size_data = 195;
    let transition = d3.transition().duration(5000);

    //Un nombre est est aléatoirement choisi
    //Ce nombre sera le rang du pays à sélectionner pour l'animation

    let selected_country_index = Math.floor(Math.random() * size_data);

    //le groupe correspondant au pays choisi est sélectionné
    let selected = d3.select(countries_svg._groups[0][selected_country_index]);

    //animation du cercle du pays choisi et de son label
    //Le cercle bouge mais ne revient pas à sa position initiale...
    selected
      .select("circle")
      .transition(transition)
      .attr("cy", 20)
      .transition(transition)
      .attr("cy", (height - outer_margin) / 2);

    selected
      .select("text")
      .transition(transition)
      .attr("y", 20)
      .transition(transition)
      .attr("y", (height - outer_margin) / 2);
  }
  //timer pour alerter l'utilisateur chaque time_pace_hint ms
  let hint_timer = d3.interval(bounce, time_pace_hint);
  //bounce();
  year_min = +slider.property("min");
  year_current = +slider.property("value");
  year_max = +slider.property("max");

  countries_svg.on("click", toggle_selected);
  play_button.on("click", start_timer);
  pause_button.on("click", pause_timer);

  slider.on("input", function() {
    hint_timer.stop();
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

  //C'est ici qu'on change la variable pour la largeur de la fenêtre d'affichage
  window.addEventListener("resize", function() {
    width = section.node().offsetWidth; //Redéfinition de la largeur du graphique
    let params = compute_scales(countries_svg); //Redéfinition des paramètres
    draw_countries(params); //On réécrit les points des données
    draw_xaxis(params); //On réécrit l'axe x
  });
  //Maintenant, dès qu'on modifie la largeur de la fenêtre, l'axe des x s'élargit ou se rétrécit
}
