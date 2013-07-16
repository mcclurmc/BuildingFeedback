function layouts() {

    this.init = init;
    this.do_chord = do_chord;
    this.do_component = do_component;

    var width = 1200;
    var height = 900;

    // initialise svg with chord diagram
    function init() {
	// Event handlers
	window.addEventListener("popstate", function(event) {
	    console.log("** window.onpopstate event handler called: state is " + currentState);
	    if (currentState != "chord") {
		console.log("*** switching layout");
		do_chord();
	    }
	});
	console.log("** setting window.onpopstate event handler: state is " + layouts.current);

	// Initial layout
	do_chord();
    }

    // Draw the chord diagram after parsing data
    function do_chord() {
	console.log(" * do_chord");

	d3.csv("data/components.csv", function(data) {
	    console.log(" * do_chord inside csv callback");
	    var component_matrix = []
	    var labels = []

	    currentState = "chord";

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

	    var chord = d3.layout.chord()
		.padding(.05)
		.sortSubgroups(d3.descending)
		.matrix(component_matrix);

	    // var width = 1200;
	    // var height = 900;
	    var innerRadius = Math.min(width, height) * .25;
	    var outerRadius = innerRadius * 1.1;

	    var fill = d3.scale.category20()

	    // Is there a better way to do this than removing svg?
	    $('svg').remove();

	    this.svg = d3.select("body").append("svg")
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
		.on("click", function() {
		    console.log("** window.history.pushState()");
		    window.history.pushState({page: 2}, "Component");
		    do_component();
		});

	    var ticks = svg.append("g").selectAll("g")
		.data(chord.groups)
		.enter().append("g").selectAll("g")
		.data(groupTicks(labels))
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
		.style("text-anchor", function(d) {
		    return d.angle > Math.PI ? "end" : null; })
		.text(function(d) { return d.label; });

	    svg.append("g")
		.attr("class", "chord")
		.selectAll("path")
		.data(chord.chords)
		.enter().append("path")
		.attr("d", d3.svg.chord().radius(innerRadius))
		.style("fill", function(d) { return fill(d.target.index); })
		.style("opacity", 1);
	});
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

    // Returns an array of tick angles and labels, given a group.
    function groupTicks(labels) {
	return function(d) {
	    var k = (d.endAngle - d.startAngle)
	    return [ {
		angle: k * .5 + d.startAngle,
		label: labels[d.index]
	    } ] ;
	};
    }

    function do_component() {
	var radius = Math.min(width, height) / 2 - 150;
	var color = d3.scale.category20c();

	currentState = "sunburst";

	$('svg').remove();

	svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

	var partition = d3.layout.partition()
	    .sort(null)
	    .size([2 * Math.PI, radius * radius])
	    .value(function(d) { return d.size; }); // was return 1;

	var arc = d3.svg.arc()
	    .startAngle(function(d) { return d.x; })
	    .endAngle(function(d) { return d.x + d.dx; })
	    .innerRadius(function(d) { return Math.sqrt(d.y); })
	    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

	d3.json("data/components.json", function(error, root) {
	    // Show name in middle of sunburst. We could make this look better.
	    svg.append("text")
		.attr("text-anchor", "middle")
		.attr("class", "component")
		.text(function(d){ return root.name; })
		.on("click", function() {
		    console.log("** window.history.pushState()");
		    do_chord();
		});

	    var path = svg.datum(root).selectAll("path")
		.data(partition.nodes)
		.enter().append("path")
		.on("click", function() {
		    console.log("** window.history.pushState()");
		    do_chord();
		})
		.attr("display", function(d) {
		    return d.depth ? null : "none"; }) // hide inner ring
		.attr("d", arc)
		.style("stroke", "#fff")
		.style("fill", function(d) {
		    return color((d.children ? d : d.parent).name); })
		.style("fill-rule", "evenodd")
		.append("title")
		.text(function(d) { return d.name; })
		.each(stash);

	    d3.selectAll("input").on("change", function change() {
		var value = this.value === "count"
		    ? function() { return 1; }
		: function(d) { return d.size; };

		path
		    .data(partition.value(value).nodes)
		    .transition()
		    .duration(1500)
		    .attrTween("d", arcTween);
	    });
	});

	// Stash the old values for transition.
	function stash(d) {
	    d.x0 = d.x;
	    d.dx0 = d.dx;
	}

	// Interpolate the arcs in data space.
	function arcTween(a) {
	    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
	    return function(t) {
		var b = i(t);
		a.x0 = b.x;
		a.dx0 = b.dx;
		return arc(b);
	    };
	}

	d3.select(self.frameElement).style("height", height + "px");
    }

}

var l = new layouts();

l.init();
