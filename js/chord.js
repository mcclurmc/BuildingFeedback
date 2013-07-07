d3.csv("data/components.csv", function(data) {
    var component_matrix = []
    var labels = []

    // extract labels from csv
    for (var l in data[0]) {
	labels.push(l);
    }

    // parse component matrix
    component_matrix = data.map(function(d) {
	var array = [];
	for (var e in d) {
	    array.push(parseInt(d[e]));
	}
	return array;
    })

    // Draw the chord diagram after parsing data
    do_chord(component_matrix, labels);
});

function do_chord(component_matrix, labels) {

    var chord = d3.layout.chord()
	.padding(.05)
	.sortSubgroups(d3.descending)
	.matrix(component_matrix);

    var width = 1200;
    var height = 900;
    var innerRadius = Math.min(width, height) * .25;
    var outerRadius = innerRadius * 1.1;

    var fill = d3.scale.category20()

    var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.append("g").selectAll("path")
	.data(chord.groups)
	.enter().append("path")
	.style("fill", function(d) { return fill(d.index); })
	.style("stroke", function(d) { return fill(d.index); })
	.attr("d", d3.svg.arc().innerRadius(innerRadius)
              .outerRadius(outerRadius))
	.on("mouseover", fade(.1))
	.on("mouseout", fade(1))
	.on("click", function() { window.alert("do transition!");});

    var ticks = svg.append("g").selectAll("g")
	.data(chord.groups)
	.enter().append("g").selectAll("g")
	.data(groupTicks)
	.enter().append("g")
	.attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
		+ "translate(" + outerRadius + ",0)";
	});

    ticks.append("line")
	.attr("x1", 1)
	.attr("y1", 0)
	.attr("x2", 5)
	.attr("y2", 0)
	.style("stroke", "#000");

    ticks.append("text")
	.attr("x", 8)
	.attr("dy", ".35em")
	.attr("transform", function(d) {
	    return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
	})
	.style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
	.text(function(d) { return d.label; });

    svg.append("g")
	.attr("class", "chord")
	.selectAll("path")
	.data(chord.chords)
	.enter().append("path")
	.attr("d", d3.svg.chord().radius(innerRadius))
	.style("fill", function(d) { return fill(d.target.index); })
	.style("opacity", 1);

    // Returns an array of tick angles and labels, given a group.
    function groupTicks(d) {
	var k = (d.endAngle - d.startAngle)
	return [ {
            angle: k * .5 + d.startAngle,
            label: labels[d.index]
	} ] ;
    }

    // Returns an event handler for fading a given chord group.
    function fade(opacity) {
	return function(g, i) {
            svg.selectAll(".chord path")
		.filter(function(d) { return d.source.index != i && d.target.index != i; })
		.transition()
		.style("opacity", opacity);
	};
    }
}

