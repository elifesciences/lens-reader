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
  // The content node object
  var node = nodeView.node;

  var frag = document.createDocumentFragment();
  var resourceHeader = $$('.resource-header', {
    children: [
      $$('.name', {text: node.title}),
      $$('.reference-count', {text: "cited once"}),
      $$('.type.figure.publication', {text: "Image"})
    ]
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
  // Renders the all node views and passes the addFocusControls
  // enhancer to the render method

  this.render = function() {

    var frag = document.createDocumentFragment();
    
    var docNodes = this.doc.getNodes();
    _.each(docNodes, function(n) {
      var nodeView = this.nodes[n.id];
      frag.appendChild(nodeView.render().el);
      addResourceHeader(nodeView);
    }, this);

    return frag;
  }
};

ResourceRenderer.Prototype.prototype = Article.Renderer.prototype;
ResourceRenderer.prototype = new ResourceRenderer.Prototype();
ResourceRenderer.prototype.constructor = ResourceRenderer;

module.exports = ResourceRenderer;
