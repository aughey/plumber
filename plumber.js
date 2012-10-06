(function() {
	var inputcolor = '#558822'
	var outputcolor = '#225588'

	function newNode(p) {
		var node = cloneNode();
		p.draggable(node);
		var inputs = {};
		var outputs = {}

		function fix() {
			var height = node.height();

			function f(value) {
				value.endpoint.anchor.y = (value.dom.position().top + value.dom.height() / 2) / height;
			}
			_.each(inputs, f);
			_.each(outputs, f);
		}
		var a = {
			dom: node,
			setXY: function(x, y) {
				node.css({
					left: x,
					top: y
				})
				return a;
			},
			setTitle: function(t) {
				node.find(".title").html(t);
				return a;
			},
			getInput: function(name) {
				if(!inputs[name]) {
					a.addInput(name);
				}
				return inputs[name].endpoint;
			},
			getOutput: function(name) {
				if(!outputs[name]) {
					a.addOutput(name);
				}
				return outputs[name].endpoint;
			},
			addInput: function(name) {
				var ep = $("<div class='ep'></div>");
				ep.html(name);
				node.find(".inputs").append(ep);

				var e = p.addEndpoint(node, {
					anchor: [0, (ep.position().top + ep.height() / 2) / node.height(), -1, 0],
					isTarget: true,
					paintStyle: {
						fillStyle: inputcolor
					},
					maxConnections: 1
				})
				inputs[name] = {
					dom: ep,
					endpoint: e
				};
				fix();
				return a;
			},
			addOutput: function(name) {
				var ep = $("<div class='ep'></div>");
				ep.html(name);
				node.find(".outputs").append(ep);

				var e = p.addEndpoint(node, {
					anchor: [1, (ep.position().top + ep.height() / 2) / node.height(), 1, 0],
					paintStyle: {
						fillStyle: outputcolor
					},
					isSource: true,
					maxConnections: -1
				})
				outputs[name] = {
					dom: ep,
					endpoint: e
				};;
				fix();

				return a;
			}
		}
		return a;
	}

	var container = null;

	function cloneNode(css) {
		var nodetemplate = $('#nodetemplate .nodetemplate');
		var n = nodetemplate.clone();
		n.removeClass("nodetemplate");
		n.addClass('node');
		n.appendTo(container);
		if(css) {
			n.css(css)
		}
		return n;
	}

	function load_test(name, p, inputs, outputs) {
		console.log("Loading " + name)
		$.get(name, null, function(data) {
			data = $(data);

			var filenodes = data.find("nodes > node");
			if(filenodes.length == 0) return;
			var minx = filenodes[0].getAttribute('x');
			var maxx = minx;
			var miny = filenodes[0].getAttribute('y');
			var maxy = miny;
			_.each(filenodes, function(n) {
				var x = parseFloat(n.getAttribute('x'));
				var y = parseFloat(n.getAttribute('y'));
				if(x < minx) minx = x;
				if(x > maxx) maxx = x;
				if(y < miny) miny = y;
				if(y > maxy) maxy = y;
			});

			var nodes = {}
			_.each(filenodes, function(node) {
				var n = newNode(p).setXY(parseFloat(node.getAttribute('x')) - minx + 300, parseFloat(node.getAttribute('y')) - miny + 100).setTitle(node.getAttribute('kind'));
				nodes[node.getAttribute('name')] = n;
				$(node).find("param").each(function(index, param) {
					n.addInput(param.getAttribute('name'))
				});
			})
			data.find("connections > connection").each(function(index, connection) {
					var fromnode = nodes[connection.getAttribute('fromname')];
					var tonode = nodes[connection.getAttribute('toname')];
					var fromport = fromnode.getOutput(connection.getAttribute("fromport"));
					var toport = tonode.getInput(connection.getAttribute("toport"));
					p.connect({
						source: fromport,
						target: toport
					});
			})
			var useexp = false;
			data.find("exports > input").each(function(index, i) {
				var node = nodes[i.getAttribute('name')];
				var port = node.getInput(i.getAttribute('port'));
				if(useexp) {
					var exp = $("<div class='exportnode'></div>")
					exp.html("Export");
					container.append(exp);
					var ep = p.addEndpoint(exp);
					var setpos = function() {
						var xy = port.anchor.getCurrentLocation();
						exp.css({
							left: xy[0] - exp.width()-50,
							top: xy[1]
							})
					}
					window.ep = ep;
					setpos();

					node.dom.bind("drag", setpos);

					p.connect({
						source: ep,
						target: port
					})
				} else {
					p.connect({
						source: inputs,
						target: port
					})
				}
			})
			data.find("exports > output").each(function(index, i) {
				var node = nodes[i.getAttribute('name')];
				var port = node.getOutput(i.getAttribute('port'));
				if(useexp) {
					var exp = $("<div class='exportnode'></div>")
					exp.html("Export");
					container.append(exp);
					xy = port.anchor.getCurrentLocation();
					exp.css({
						left: xy[0] + 50,
						top: xy[1]
						})

					p.connect({
						source: port,
						target: exp
					})
				} else {
					p.connect({
						source: port,
						target: outputs
					})
				}
			})
		})
	}

	function init() {
		console.log("Initializing Plumber")

		container = $('#workarea')

		// chrome fix.
		document.onselectstart = function() {
			return false;
		};


		var p = jsPlumb.getInstance({
			Endpoint: ["Dot",
			{
				radius: 7
			}],
			//Connector: ["Flowchart"],
			Connector: ["Bezier", {curviness: 50}],
			DragOptions: {
				cursor: "pointer",
				zIndex: 2000
			},
			PaintStyle: {
				gradient: {
					stops: [
						[0, outputcolor],
						[1, inputcolor]
					]
				},
				strokeStyle: outputcolor,
				lineWidth: 4
			},
			Overlays: ["PlainArrow"]
		});


		var nodes = []
		/*
		nodes.push(cloneNode({
			left: '300px'
		}));
		nodes.push(cloneNode({
			left: '500px',
			top: '200px'
		}))
*/

		function makenode(n) {
			for(var i = 0; i < 5; ++i) {
				$(n).find('.inputs').append("<div class='ep'>Input " + i + "</div>");
			}
			for(var i = 0; i < 3; ++i) {
				$(n).find('.outputs').append("<div class='ep'>Output " + i + "</div?>");
			}
			var height = $(n).height();
			_.each($(n).find('.inputs .ep'), function(ep, i) {
				var e = p.addEndpoint(n, {
					anchor: [0, ($(ep).position().top + $(ep).height() / 2) / height, -1, 0],
					isTarget: true,
					paintStyle: {
						fillStyle: inputcolor
					},
					maxConnections: 1
				})
			});
			_.each($(n).find('.outputs .ep'), function(ep, i) {
				var e = p.addEndpoint(n, {
					anchor: [1, ($(ep).position().top + $(ep).height() / 2) / height, 1, 0],
					paintStyle: {
						fillStyle: outputcolor
					},
					isSource: true,
					maxConnections: -1
				})
			});
			p.draggable(n);
		}

		_.each(nodes, makenode)

		container.dblclick(function(e) {
			var n = cloneNode({
				left: e.pageX,
				top: e.pageY,
			})
			makenode(n);
			return true;
		});

		p.makeSource($('.inputarea'), {
			anchor: "Continuous",
			endpoint: ["Rectangle",
			{
				width: 40,
				height: 20
			}]
		});
		p.makeTarget($('.outputarea'), {
			anchor: "Continuous",
			endpoint: ["Rectangle",
			{
				width: 40,
				height: 20
			}]
		});

		function load(name) {
			$("body > h1").html(name);
			p.deleteEveryEndpoint();
			$('.node').remove();
			$('.exportnode').remove();
			load_test(name, p, $('.inputarea'), $('.outputarea'));
		}

		load("SuperSin.xml");

		var loadwin = $("<div class='loadwin'><div class='showhide'>Show/Hide</div><ul></ul></div>");
		container.append(loadwin);
		//loadwin.hide();
		loadwin.find('.showhide').click(function() {
			loadwin.find("ul").toggle('slow');
		})
		loadwin.find("ul").hide();
		$.getJSON("nodes.json", {}, function(nodes) {
			var ul = loadwin.find("ul");
			_.each(nodes, function(node) {
				var li = $("<li>" + node + "</li>");
				ul.append(li);
				li.click(function() {
					load("newGraphEditor/" + node);
					loadwin.find("ul").hide('slow');
				})
			})
		})

		$(window).keypress(function(e) {
			if(e.charCode == 47) {
				loadwin.find("ul").toggle('slow');
			}
		})
	}
	jsPlumb.ready(init);
}())