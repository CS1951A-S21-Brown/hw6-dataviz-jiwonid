// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 210};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH), graph_2_height = 600; //275
let graph_3_width = (MAX_WIDTH / 2) - 100, graph_3_height = 250;

// Set up SVG object with width, height and margin
let svg = d3.select("#graphs")
    .append("svg")
    .attr("width", graph_1_width)
    .attr("height", graph_1_height)
    .append("g")
    .attr("transform", "translate("+margin.left+", "+margin.top+")");    // HINT: transform

let svg3 = d3.select("#graphs")
    .append("svg")
    .attr("width", graph_3_width)
    .attr("height", graph_3_height)
    .append("g")
    .attr("transform", "translate("+margin.left+","+margin.top+")");

let svg2 = d3.select("#graphs")
    .append("svg")
    .attr("width", graph_2_width)
    .attr("height", graph_2_height)
    .append("g")
    .attr("transform", "translate(0, "+80+")");

function compareValues(a, b) {
  if (a['Global_Sales'] > b['Global_Sales']) {
    return -1;
  }
  if (a['Global_Sales'] < b['Global_Sales']) {
    return 1;
  }
  else {
    return 0;
  }
}

let donut_title = svg3.append("text")
    .attr("transform", "translate("+((graph_3_width-margin.left-margin.right)/2)+", "+-15+")")
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("Leading Publishers by Genre");

//make a new arrays/dictionaries where the key is genre and the value is the count
function countGenres(data) {
    total_genres = []
    for (var row in data) {
      curr_genres = data[row]['listed_in'] //list of genres this given movie is of
      for (var genre in curr_genres) {
        let genre_name = curr_genres[genre]
        if (genre_name in total_genres) {
          total_genres[genre_name] += 1
        }
        else {
          total_genres[genre_name] = 1
        }
      }
    }
    return total_genres
}

// Create a linear scale for the x axis (sales of game)
let x = d3.scaleLinear()
    .range([0, graph_1_width-margin.left-margin.right]);

// Create a scale band for the y axis (video game)
let y = d3.scaleBand()
    .range([0, graph_1_height-margin.top-margin.bottom])
    .padding(0.1);  // Improves readability

// Set up reference to count SVG group
let countRef = svg.append("g");
let pieRef = svg3.append("g")
  .attr("transform", "translate("+(graph_3_width/2-150)+","+(graph_3_height/2-15)+")");

// Set up reference to y axis label to update text in setData
let y_axis_label = svg.append("g");


// Add x-axis label
svg.append("text")
    .attr("transform", "translate("+((graph_1_width-margin.left-margin.right)/2)+", "+(graph_1_height-margin.top-15)+")")
    .style("text-anchor", "middle")
    .text("Global Sales in Millions (Copies)")
    .style("font-size", 12);

// Add y-axis label
let y_axis_text = svg.append("text")
    .attr("transform", "translate("+(-margin.left/2)+", "+((graph_1_height-margin.top-margin.bottom)/2)+")")
    .style("text-anchor", "middle");

// Add chart title
let title = svg.append("text")
    .attr("transform", "translate("+((graph_1_width-margin.left-margin.right)/2)+", "+-15+")")       // HINT: Place this at the top middle edge of the graph
    .style("text-anchor", "middle")
    .style("font-size", 15);

// Define color scale
let color = d3.scaleOrdinal()
    .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), 10)); //Consider changing 10 to a local variable

const formatTime = d3.timeFormat('%e %B');

let map_title = svg2.append("text")
    .attr("transform", "translate("+((graph_2_width-margin.left-margin.right)/2+100)+", "+20+")")
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("Most Popular Genre of Games by Region (Millions of Copies Sold)");

//number of sales per publisher per genre
numSales_publisher_genre = {}

// Load the artists CSV file into D3 by using the d3.csv() method
d3.csv("../data/video_games.csv").then(function(data) {
    // split and trim column data for barplot
    var data = cleanData(data)
    data.sort(compareValues)
    var top10_data = data.slice(0,10)
    setData(data, 'Global_Sales', "All Years")
    var years = []
    for (var i in data) {
      if (!years.includes(data[i]['Year'])) {
        years.push(data[i]['Year'])
      }
    }
    years.sort().reverse()
    var dropdown = d3.select("#graph1")
      .insert("select", "svg")
      .on("change", dropdownChange) // figure out how to put in specific parameters
      .attr("transform", "translate("+(margin.left+100)+", "+0+")");
    years.shift() // gets rid of NaN category
    years.shift() // gets rid of 2020
    years.shift() // gets rid of 2017
    years.unshift("All Years")
    dropdown.selectAll("option")
        .data(years)
      .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
          return d
        });
    function dropdownChange() {
      var year = d3.select(this).property('value')
      if (year !== "All Years") {
        year = parseInt(year)
        setData(data, 'Year', year)
      }
      else {
        setData(data, 'Global_Sales', "All Years")
      }
    }
    // split it up into separate data set, one for each region
    // filter by genres, sum up total sale
    organizedByGenre = organizeByGenre(data)
    delete organizedByGenre.undefined;

    most_popular_in_NA = findMaxGenre(organizedByGenre, 'NA_Sales')
    most_popular_in_EU = findMaxGenre(organizedByGenre, 'EU_Sales')
    most_popular_in_JP = findMaxGenre(organizedByGenre, 'JP_Sales')
    most_popular_in_Other = findMaxGenre(organizedByGenre, 'Other_Sales')
    most_popular_in_Global = findMaxGenre(organizedByGenre, 'Global_Sales')


    //Object with key as the region name and values can be those variables themselves
    most_popular = {
      'North America': most_popular_in_NA,
      'Europe': most_popular_in_EU,
      'Japan': most_popular_in_JP,
      'Other': most_popular_in_Other,
      'Global': most_popular_in_Global
    }

    genre_list = Object.keys(organizedByGenre)
    genre_list = genre_list.sort()
    numSales_publisher_genre = organizeSalesForPublisher(genre_list, data)
    setPieData(numSales_publisher_genre, 'Action')
    var dropdown_pie = d3.select("#graph3")
      .insert("select", "svg")
      .on("change", dropdownChangePie);
    dropdown_pie.selectAll("option")
        .data(genre_list)
      .enter().append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) {
          return d
        });

    function dropdownChangePie() {
      var genre = d3.select(this).property('value')
        setPieData(numSales_publisher_genre, genre) // might change the variable "data" to something else later
    }

    function setPieData(pie_data, genre) {
      top_pie_data = filterTopEnd(pie_data[genre], 10)
      data_ready = pie(d3.entries(top_pie_data))

      // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
      let allSlices = pieRef.selectAll('path')
      .data(data_ready)
      allSlices.enter()
        .append('path')
        .merge(allSlices)
        .transition()
        .duration(1000)
      allSlices
        .attr('d', arc)
        .attr('fill', function(d){ return(pie_color(d.data.key)) })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)

      // Add the polylines between chart and labels:
      let allPolyLines = pieRef.selectAll('polyline')
      .data(data_ready)
      allPolyLines.enter()
        .append('polyline')
        .merge(allPolyLines)
        .transition()
        .duration(1000)
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
          var posA = arc.centroid(d) // line insertion in the slice
          var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
          var posC = outerArc.centroid(d); // Label position = almost the same as posB
          var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
          posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
        return [posA, posB, posC]
      })

      let allLabels = pieRef.selectAll("text")
      .data(data_ready);
      allLabels.enter()
        .append('text')
        .merge(allLabels)
        .transition()
        .duration(1000)
        .text( function(d) { return d.data.key } )
        .attr("font-size", 10)
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
          .style('text-anchor', function(d) {
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
              return (midangle < Math.PI ? 'start' : 'end')
          })
    }

    d3.json('final.json')
    .then(function(map_data) {
      genre_map.set(data.code, +data.pop)
      let mouseOver = function(d) {
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", .5)
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .style("stroke", "black")
        div
          .transition()
          .duration(200)
          .style('opacity', 0.9);
        div
          .html(d.properties.continent + '<br/>' +
          most_popular[d.properties.continent][1] + '<br/>' +
          roundToHundredth(most_popular[d.properties.continent][0]))
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY - 28 + 'px');
      }
      let mouseLeave = function(d) {
        d3.selectAll(".Country")
          .transition()
          .duration(200)
          .style("opacity", .8)
        d3.select(this)
          .transition()
          .duration(200)
          .style("stroke", "transparent")
        div
          .transition()
          .duration(500)
          .style('opacity', 0);
      }

      // Draw the map
      svg2.append("g")
        .selectAll("path")
        .data(map_data.features)
        .enter()
        .append("path")
          // draw each country
          .attr("d", d3.geoPath()
            .projection(projection)
          )
          // set the color of each country
          .attr("fill", function (d) {
            d.total = genre_map.get(d.id) || 10000000;
            return colorScale(d.total);
          })
          .style("stroke", "transparent")
          .attr("class", function(d){ return "Country" } )
          .style("opacity", .8)
          .on("mouseover", mouseOver )
          .on("mouseleave", mouseLeave )
    });
});

function organizeSalesForPublisher(genre_list, data) {
    sales_by_genre = {}
    for (var i in genre_list) {
      sales_by_genre[genre_list[i]] = {} // sales_by_genre is loaded with all the genres as key with empty JSON object as a value
    }
    for (var i in data) {
      currGenre = data[i]["Genre"]
      publisher = data[i]["Publisher"]
      global_sales = data[i]["Global_Sales"]
      if (publisher === undefined) {

      }
      else if (publisher in sales_by_genre[currGenre]) {
        sales_by_genre[currGenre][publisher] += global_sales
      }
      else {
        sales_by_genre[currGenre][publisher] = global_sales
      }
    }
    return sales_by_genre
}

function setData(data, columnName, year) {
    let relevantData = []
    if (columnName === 'Global_Sales') {
      relevantData = data
    }
    else { // columnName === 'Year'
      certainYear = []
      for (var i in data) {
          if (data[i][columnName] === year) {
            nameArray = certainYear.map(d=>d['Name'])
            indexOfName = nameArray.indexOf(data[i]['Name'])
            if (indexOfName >= 0) {
              maxOfTwoSales = (data[i]['Global_Sales'] + certainYear[indexOfName]['Global_Sales'])
              certainYear[indexOfName]['Global_Sales'] = maxOfTwoSales
            }
            else {
              certainYear.push(data[i])
            }
          }
      }
      relevantData = certainYear
    }
    relevantData.sort(compareValues)
    top10_data = relevantData.slice(0,10)
    x.domain([0, d3.max(top10_data, datapoint => datapoint['Global_Sales'])])
    y.domain(top10_data.map(datapoint => datapoint['Name']))
    y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    color.domain(top10_data.map(function(d) { return d['Name'] }))
    let bars = svg.selectAll("rect").data(top10_data);
    bars.enter()
      .append("rect")
      .merge(bars)
      .transition()
      .duration(1000)
      .attr("fill", function(d) { return color(d['Name']) })
      .attr("x", x(0))
      .attr("y", function(datapoint) { return y(datapoint['Name']) })
      // attribute y expects us to put the starting data point, which in this case is y(datapoint['Name'])
      .attr("width", d => x(d['Global_Sales']))
      .attr("height", y.bandwidth());  // y.bandwidth() makes a reasonable display height
    let global_sales = countRef.selectAll("text").data(top10_data);
    global_sales.enter()
      .append("text")
      .merge(global_sales)
      .transition()
      .duration(1000)
      .attr("x", d => x(d['Global_Sales'])+5)
      .attr("y", d => y(d['Name'])+y.bandwidth()*0.75)
      .style("text-anchor", "start")
      .text(d => roundToHundredth(d['Global_Sales']))
      .style("font", "10px arial");
    title.text("Top 10 Most Sold Games in "+year);
}

// Tokenize strings for a given column
function cleanData(data) {
  for (var i in data) { // i = row number index
    data[i]["Rank"] = parseInt(data[i]["Rank"])
    data[i]['Year'] = parseInt(data[i]['Year'])
    data[i]['NA_Sales'] = parseFloat(data[i]['NA_Sales'])
    data[i]['EU_Sales'] = parseFloat(data[i]['EU_Sales'])
    data[i]['JP_Sales'] = parseFloat(data[i]['JP_Sales'])
    data[i]['Other_Sales'] = parseFloat(data[i]['Other_Sales'])
    data[i]['Global_Sales'] = parseFloat(data[i]['Global_Sales'])
  }
  return data
}

const roundToHundredth = (value) => {
  return Number(value.toFixed(2));
};

function organizeByGenre(data) {
  sales_by_genre = {}
  for (var i in data) {
    currGenre = data[i]["Genre"]
    if (currGenre in sales_by_genre) { // if genre exists
      sales_by_genre[currGenre]["NA_Sales"] += data[i]["NA_Sales"]
      sales_by_genre[currGenre]["EU_Sales"] += data[i]["EU_Sales"]
      sales_by_genre[currGenre]["JP_Sales"] += data[i]["JP_Sales"]
      sales_by_genre[currGenre]["Other_Sales"] += data[i]["Other_Sales"]
      sales_by_genre[currGenre]["Global_Sales"] += data[i]["Global_Sales"]
    }
    else {
      sales_by_genre[currGenre] = {}
      sales_by_genre[currGenre]["NA_Sales"] = data[i]["NA_Sales"]
      sales_by_genre[currGenre]["EU_Sales"] = data[i]["EU_Sales"]
      sales_by_genre[currGenre]["JP_Sales"] = data[i]["JP_Sales"]
      sales_by_genre[currGenre]["Other_Sales"] = data[i]["Other_Sales"]
      sales_by_genre[currGenre]["Global_Sales"] = data[i]["Global_Sales"]
    }
  }
  organizedByGenre = sales_by_genre
  return organizedByGenre
}

function findMaxGenre(organizedByGenre, regionSales) {
  max_sum = Math.max.apply(Math, Object.keys(organizedByGenre).map(function(genre, index){
    return organizedByGenre[genre][regionSales];}))
  max_genre = Object.keys(organizedByGenre).map(function(genre, index){
    return organizedByGenre[genre][regionSales] === max_sum ? genre:"";
  })

  // get "Action" extracted from this thing
  var most_popular_genre = max_genre.reduce(function(a, b){
      return a + b;
  }, "");
  return [max_sum, most_popular_genre]
}

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()
  .scale(graph_2_width/10)
  .center([0,20])
  .translate([graph_2_width / 2, graph_2_height / 2 + 100]);

// Data and color scale
// Have to pre-process data so that it is already grouped by regions and
// their counts
// Take care of spacings for the map!
var genre_map = d3.map();
var colorScale = d3.scaleThreshold()
  .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
  .range(d3.schemeBlues[7]);

// Define the div for the tooltip
const div = d3
  .select('graphs')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

// Donut
var pie_margin = 40
var radius = Math.min(graph_3_width, graph_3_height) / 2 - pie_margin
var pie_data = {a: 9, b: 20, c:30, d:8, e:12, f:3, g:7, h:14, i: 10, j: 32, k: 10}

// set the color scale
var pie_color = d3.scaleOrdinal()
  .domain(["a", "b", "c", "d", "e", "f", "g", "h"]) // change to genre_list later
  .range(d3.schemeDark2);

function filterTopEnd(genre_data, n) {
  output = Object.entries(genre_data).sort((a,b)=>b[1]-a[1])
  sliced_output = output.slice(0, n)
  remaining_output = output.slice(n)
  sum_of_remaining = remaining_output.map(d => d[1]).reduce((a, b) => a+b, 0)
  sliced_output.push(["Other", sum_of_remaining])
  backToObject = Object.fromEntries(sliced_output)

  return backToObject
}

// Compute the position of each group on the pie:
var pie = d3.pie()
  .value(function(d) {return d.value; })
top_pie_data = filterTopEnd(pie_data, 10)
var data_ready = pie(d3.entries(top_pie_data))

// The arc generator
var arc = d3.arc()
  .innerRadius(radius * 0.5)         // This is the size of the donut hole
  .outerRadius(radius * 0.8)

// Another arc that won't be drawn. Just for labels positioning
var outerArc = d3.arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.9)

let allSlices = pieRef.selectAll('path')
  .data(data_ready)
allSlices.enter()
  .append('path')
allSlices
  .attr('d', arc)
  .attr('fill', function(d){ return(pie_color(d.data.key)) })
  .attr("stroke", "white")
  .style("stroke-width", "2px")
  .style("opacity", 0.7)
