import * as d3 from "d3";

/* selection of HTML and SVG elements */
let section = d3.select("#content"),
  container = d3.select("#countries"),
  yaxis_button = d3.select("#y-axis-button"),
  play_button = d3.select("#play"),
  pause_button = d3.select("#pause"),
  slider = d3.select("#year");

/* Amélioration n° 1 */
d3.select("#pause").style("display", "none"); // Au lancement de l'appli, le bouton pause n'est pas affiché.

/* display parameters */
const radius = 20,
  spacing = 3,
  time_pace = 500,
  height = 400,
  width = section.node().offsetWidth,
  inner_margin = 30,
  outer_margin = 30,
  margin = inner_margin + outer_margin,
  yNone = 50; // On défini ICI la valeur yNone qui servira à aligner les données dans le cas ou la variable NONE est sélectionnée

/* Amélioration n°5*/

let graph = d3
  .select("#my_graph")
  .attr("viewBox", "0 0 " + width + " " + height); // On utilise l'attribut viewBox afin de conserver le ratio longeur / largeur
// Width et Height sont la largeur et la longueur de l'aire dans laquelle apparaîtra le grpahique

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
          which_var === "co2_emissions"
            ? d.co2_emissions
            : which_var === "life_expectancy "
            ? d.life_expectancy
            : 100
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

  let y_label = y_axis
    .append("text")
    .attr("text-anchor", "end")
    .attr("fill", "grey")
    .attr("x", -margin)
    .attr("y", 10)
    .attr("transform", "rotate(-90)");

  y_label.text(
    which_var === "co2_emissions"
      ? "COÂ² Emissions (tons/year)"
      : which_var === "life_expectancy"
      ? "Life Expectancy (years)"
      : "Unknokwn variable :("
  );

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

  countries_svg.transition(transition).attr("fill", d => o(d.region));

  /* Amélioration n°3 : On aligne les données sur la variable none est sélectionnée */
  if (which_var === "none") {
    countries_svg
      .select("circle")
      .transition(transition)
      .attr("cx", d => x(d.income[year_index]))
      .attr("cy", d => y(yNone)) // Y prend une constante pour tous les pays si la variable NONE est sélectionnée
      .attr("r", d => r(d.population[year_index]))
      .attr("stroke", d => o(d.region));
  } else {
    countries_svg
      .select("circle")
      .transition(transition)
      .attr("cx", d => x(d.income[year_index]))
      .attr("cy", d => y(d[which_var][year_index]))
      .attr("r", d => r(d.population[year_index]))
      .attr("stroke", d => o(d.region));
  }

  countries_svg.sort((a, b) => b.population - a.population);

  let centrage = 0;

  /* Amélioration n°6 : On pose une condition : il faut que le nom du pays rentre dans la bulle (c'est à dire dans 2 fois son rayon) */
  // Pour cela, on considère que un caractère fait la même largeur que 2 unités de rayon (choisi à tatons)

  if (
    2 * countries_svg.select("circle").attr("r") >=
    countries_svg.select("text").text().length * 2
  ) {
    centrage = 2 * countries_svg.select("circle").attr("r") + spacing;
  } else {
    centrage = 0;
  }

  if (which_var === "none") {
    countries_svg
      .select("text")
      .transition(transition)
      .attr(
        "x",
        d =>
          x(d.income[year_index]) +
          r(d.population[year_index]) +
          spacing -
          centrage
      )
      .attr("y", d => y(yNone + 5))
      .text(d => d.name);
  } else {
    countries_svg
      .select("text")
      .transition(transition)
      .attr(
        "x",
        d =>
          x(d.income[year_index]) +
          r(d.population[year_index]) +
          spacing -
          centrage // Puis on soustrait la variable centrage dans la coordonnée Y du label pour le faire rentrer dans la bulle
      )
      .attr("y", d => y(d[which_var][year_index]) + 5)
      .text(d => d.name);
  }

  t_duration = 250;

  return { countries_svg, x, y, r, o };
}

/* action */
function toggle_selected() {
  this.classList.toggle("selected");
}

let t;

function start_timer() {
  if (year_current === year_max) {
    // remise Ã  zÃ©ro
    year_current = year_min;
    year_index = 0;
    slider.property("value", year_min);
  }

  /* Amélioration n°1*/
  t = d3.interval(increment, time_pace); //timer

  d3.select("#play").style("display", "none"); // Le bouton play disparait lorsque l'on clique dessus
  d3.select("#pause").style("display", "inline-block"); // ...Et le bouton pause apparait alors

  d3.select("#play").attr("disabled", "disabled"); // Le bouton play est également désactivé par prévaution
  d3.select("#pause").attr("disabled", null); // ...Et le bouton pause et ré-activé
}

function pause_timer() {
  t.stop();

  d3.select("#pause").style("display", "none"); // Le bouton pause disparait lorsque l'on clique dessus
  d3.select("#play").style("display", "inline-block"); // ..Et le bouton play apparait.

  d3.select("#pause").attr("disabled", "disabled"); // Le bouton pause est également désactivé par prévaution
  d3.select("#play").attr("disabled", null); // ...Et le bouton play est également désactivé par prévaution
}
/* Fin de l'amélioration n°1 */

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
    .join("g")
    .attr("width", width)
    .attr("height", height);

  countries_svg.append("circle");
  countries_svg.append("text");

  container.dispatch("data_ready", {
    detail: countries_svg
  });

  /* Amélioration n°4 : On généralise le code */
  // Calcul des années min et max des données
  let MaxY = d3.max(
      countries_svg
        .data()
        .map(d => d.year)
        .flat()
    ),
    MinY = d3.min(
      countries_svg
        .data()
        .map(d => d.year)
        .flat()
    );
  slider.property("min", MinY); // Définition des min et max sur le slider
  slider.property("max", MaxY);
  d3.select("#year-min").text(MinY); // Affichage des min et max sur le slider
  d3.select("#year-max").text(MaxY);
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

  /* Amélioration n°7 : On active des bulles au hasard à intervalle régulier */
  // Ici, il n'y a pas d'aléatoire, les bulles s'activeront dans un ordre identique à chaque fois
  d3.selectAll("circle")
    .transition()
    .delay(function(d, i) {
      return i * 20000 + 5000; // On fixe un delay de 20 sec entre chaque cercle + 5 seconde avant le premier cercle
    })
    .on("start", function repeat() {
      d3.active(this) // Activation d'une bulle
        .attr(
          "r",
          d => r(d.population[year_index]) + 5 // On augmente alors le rayon du cercle de 5
        )
        .style(
          "fill-opacity", // On fixe l'opacité de la bulle à 1
          1
        )
        .transition()
        .delay(
          10000
        ) /* On met un delay de 10 seconde avant de repasser à l'état initial */
        .attr("r", d => r(d.population[year_index]))
        .style("fill-opacity", 0.5); /* retour à l'opacité initiale */
    });

  /* FIN Improvement 6*/
}
