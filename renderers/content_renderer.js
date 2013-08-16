var Article = require("lens-article");
var ArticleRenderer = Article.Renderer;
var nodes = require("lens-article/nodes");
var $$ = require("substance-application").$$;

// Custom node type implementations

// Render focus controls
// --------
// 
// .content-node
//   .focus
//     .focus-citation
//     .focus-figure
//     .stripe

// this.renderFocusControls = function() {
//   var modes = this.node.constructor.focusModes;
//   if (!modes) return; // Skip focus stuff

//   $focus = $('<div class="focus">');

//   _.each(modes, function(mode, key) {
//     // .content-node.focus
//     $('<div>').addClass('focus-mode '+key)
//     .attr({
//       "data-type": key,
//       title: "Show relevant "+key
//     })
//     // Add icon
//     .html('<i class="'+mode.icon+'"></i> 2')
//     // Inject
//     .appendTo($focus);
//   });

//   $focus.append('<div class="stripe">');
//   this.$el.append($focus);
// };

var ContentNodeRenderer = function() {
  var frag = document.createDocumentFragment();
  frag.appendChild($$('div.foo', {text: "XXXXX"}));
  return frag;
};

// var nodeRenderers = {
//   "node": ContentNodeRenderer
// };


console.log('NODES', nodes);

// Renders the content view
// --------
//
// Provides focus toggles by overriding the default NodeView's renderer

var ContentRenderer = function(doc) {
  ArticleRenderer.call(this, doc);

  // Adjust node types
  this.nodeTypes = Article.nodeTypes;
  this.renderers = {
    "heading": ContentNodeRenderer
  };
  console.log('NODE_TYPES', this.nodeTypes);
};

ContentRenderer.Prototype = function() {

  this.render = function() {
    var frag = document.createDocumentFragment();
    
    var docNodes = this.doc.getNodes();
    _.each(docNodes, function(n) {
      var renderer = this.renderers[n.type];
      frag.appendChild(this.nodes[n.id].render(renderer).el);
    }, this);

    return frag;

    // var frag = ArticleRenderer.prototype.render.call(this);
    // // Add additional renderer specific stuff
    // // Just frag.appendChild(...);
    // return frag;
  }
};

ContentRenderer.Prototype.prototype = Article.Renderer.prototype;
ContentRenderer.prototype = new ContentRenderer.Prototype();
ContentRenderer.prototype.constructor = ContentRenderer;

module.exports = ContentRenderer;
