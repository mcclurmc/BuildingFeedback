var components = { 
    "name": "chilled beams",
    "children":
    [ { "name": "crossed CHW",
	"children": [ { "name": "construction quality", "size": 16} ] },
      { "name": "unrealistic expectations cooling",
	"children": [ { "name": "client brief", "size": 1.333333333},
		      { "name": "training", "size": 1.333333333},
		      { "name": "clent decision", "size": 1.333333333} ] },
      { "name": "dewpoint tracking",
	"children": [ { "name": "system design", "size": 16 } ] },
      { "name": "dewpoint sensor function",
	"children": [ { "name": "construction quality", "size": 16 } ] },
      { "name": "failed dewpoint sensors",
	"children": [ { "name": "component failure", "size": 16 } ] },
      { "name": "users and controls",
	"children": [ { "name": "brief", "size": 1.333333333 },
		      { "name": "system design", "size": 1.333333333 },
		      { "name": "training", "size": 1.333333333 } ] },
      { "name": "open windows condensation",
	"children": [ { "name": "brief", "size": 5.333333333 },
		      { "name": "system design", "size": 5.333333333 },
		      { "name": "training", "size": 5.333333333 } ] },
      { "name": "computer overheating",
	"children": [ { "name": "brief", "size": 1.333333333 },
		      { "name": "system design", "size": 1.333333333 },
		      { "name": "training", "size": 1.333333333 } ] },
      { "name": "night cooling reduction",
	"children": [ { "name": "commissioning", "size": 4 } ] },
      { "name": "weather station",
	"children": [ { "name": "client brief", "size": 5.333333333 },
		      { "name": "system design", "size": 5.333333333 },
		      { "name": "value engineering", "size": 5.333333333 } ] }
    ]
}

var width = 960;
var height = 600;
var radius = Math.min(width, height) / 2 - 20;
var color = d3.scale.category20c();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

var partition = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return 1; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

//d3.json("components.json", function(error, root) {
function doit(root) {
    var path = svg.datum(root).selectAll("path")
	.data(partition.nodes)
	.enter().append("path")
	.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
	.attr("d", arc)
	.style("stroke", "#fff")
	.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
	.style("fill-rule", "evenodd")
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
};

doit(components)

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
