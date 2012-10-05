(function() {
	function init() {
		console.log("Initializing Plumber")

		// chrome fix.
		document.onselectstart = function() {
			return false;
		};


		var p = jsPlumb.getInstance({
			Endpoint: ["Dot",
			{
				radius: 7
			}],
			DragOptions: {
				cursor: "pointer",
				zIndex: 2000
			},
			EndpointStyle: {
				fillStyle: "#225588",
				opacity: 0.5
			},
			PaintStyle: {
				gradient: {
					stops: [
						[0, "#225588"],
						[1, "#558822"]
					]
				},
				strokeStyle: "#558822",
				lineWidth: 4
			},
			Overlays: ["Arrow"]
		});

		var container = $('body');

		var nodetemplate = $('#nodetemplate .node');

		function cloneNode(css) {
			var n = nodetemplate.clone().appendTo('body');
			if(css) {
				n.css(css)
			}
			return n;
		}
		var nodes = []
		nodes.push(cloneNode());
		nodes.push(cloneNode({
			left: '400px',
			top: '200px'
		}))

		function makenode(n) {
			for(var i = 0; i < 5; ++i) {
				$(n).find('.inputs').append("<div class='ep'>Input " + i + "</div");
			}
			for(var i = 0; i < 3; ++i) {
				$(n).find('.outputs').append("<div class='ep'>Output " + i + "</div");
			}
			var height = $(n).height();
			_.each($(n).find('.inputs .ep'), function(ep, i) {
				var e = p.addEndpoint(n, {
					anchor: [0, ($(ep).position().top + $(ep).height() / 2) / height, -1, 0],
					isTarget: true,
					maxConnections: 1
				})
			});
			_.each($(n).find('.outputs .ep'), function(ep, i) {
				var e = p.addEndpoint(n, {
					anchor: [1, ($(ep).position().top + $(ep).height() / 2) / height, 1, 0],
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

	}
	jsPlumb.ready(init);
}())