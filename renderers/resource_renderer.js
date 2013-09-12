var Article = require("lens-article");
var ArticleRenderer = Article.Renderer;
var nodes = require("lens-article/nodes");
var $$ = require("substance-application").$$;



// Renders the content view
// --------
//
// Provides focus toggles by overriding the default NodeView's renderer

var ResourceRenderer = function(doc) {
  console.log('RENDERER DOC CONTROLLER?', doc);
  ArticleRenderer.call(this, doc);
};

ResourceRenderer.Prototype = function() {


  // Enhances the default node views
  // --------
  // 
  // .resource-header
  //   .name
  //   .reference-count
  //   .type.image

  this.addResourceHeader = function(nodeView) {
    var node = nodeView.node;
    var typeDescr = node.constructor.description;

    // Don't render resource headers in info panel (except for person nodes)
    if (this.doc.view === "info" && node.type !== "person") {
      return;
    }

    var children = [
      $$('a.name', {
        href: "#",
        text: node.header ,
        "sbs-click": "toggleResource("+node.id+")"
      }),
      // $$('.reference-count', {text: "cited x times"}),
      // $$('.type.figure.publication', {text: typeDescr.name}),
    ];

    var config = node.constructor.config;
    if (config && config.zoomable) {
      children.push($$('a.toggle-fullscreen', {
        "href": "#",
        "html": "<i class=\"icon-resize-full\"></i><i class=\"icon-resize-small\"></i>",
        "sbs-click": "toggleFullscreen("+node.id+")"
      }));
    }

    var resourceHeader = $$('.resource-header', {
      children: children
    });
    nodeView.el.insertBefore(resourceHeader, nodeView.content);
  };

  // Render
  // --------
  // 

  this.render = function() {

    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });

    var frag = document.createDocumentFragment();

    var docNodes = this.doc.container.getTopLevelNodes();
    _.each(docNodes, function(n) {
      var nodeView = this.createView(n);
      frag.appendChild(nodeView.render().el);
      this.addResourceHeader(nodeView);
      this.nodes[n.id] = nodeView;
    }, this);

    return frag;
  };
};

ResourceRenderer.Prototype.prototype = Article.Renderer.prototype;
ResourceRenderer.prototype = new ResourceRenderer.Prototype();
ResourceRenderer.prototype.constructor = ResourceRenderer;

module.exports = ResourceRenderer;
