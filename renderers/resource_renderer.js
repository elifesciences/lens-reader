var Article = require("lens-article");
var ArticleRenderer = Article.Renderer;
var nodes = require("lens-article/nodes");
var $$ = require("substance-application").$$;

// Enhances the default node views
// --------
// 
// .resource-header
//   .name
//   .reference-count
//   .type.image

var addResourceHeader = function(nodeView) {
  var node = nodeView.node;
  var typeDescr = node.constructor.description;
  var frag = document.createDocumentFragment();

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
  return frag;
};

// Renders the content view
// --------
//
// Provides focus toggles by overriding the default NodeView's renderer

var ResourceRenderer = function(doc) {
  ArticleRenderer.call(this, doc);
};

ResourceRenderer.Prototype = function() {

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
      addResourceHeader(nodeView);
      this.nodes[n.id] = nodeView;
    }, this);

    return frag;
  };
};

ResourceRenderer.Prototype.prototype = Article.Renderer.prototype;
ResourceRenderer.prototype = new ResourceRenderer.Prototype();
ResourceRenderer.prototype.constructor = ResourceRenderer;

module.exports = ResourceRenderer;
