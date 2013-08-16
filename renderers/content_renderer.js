var Article = require("lens-article");
var ArticleRenderer = Article.Renderer;
var nodes = require("lens-article/nodes");
var $$ = require("substance-application").$$;


var modes = {
  "node": {
    "icon": "icon-bookmark"
  },
  "figure": {
    "icon": "icon-camera"
  },
  "citation": {
    "icon": "icon-link"
  }
};

var modeAssignments = {
  "heading": ["node"],
  "paragraph": ["figure", "citation"],
};

// The DOM fragment generated here gets added to any content node
// --------
// 
// .content-node
//   .focus
//     .focus-citation
//     .focus-figure
//     .stripe

var addFocusControls = function(nodeView) {
  // The content node object
  var node = nodeView.node;

  var modesForType = modeAssignments[node.type] || [];
  if (modesForType.length === 0) return; // skip

  var focus = $$('div.focus', {
    children: _.map(modesForType, function(key) {
      var mode = modes[key];
      return $$('div', {
        class: "focus-mode "+ key,
        text: "2",
        title: "Show relevant"+ key,
        children: [$$('i', {class: mode.icon}) ]
      });
    })
  });

  // Add stripe
  focus.appendChild($$('.stripe'));
  nodeView.el.appendChild(focus);
};

// Renders the content view
// --------
//
// Provides focus toggles by overriding the default NodeView's renderer

var ContentRenderer = function(doc) {
  ArticleRenderer.call(this, doc);
};

ContentRenderer.Prototype = function() {

  // Renders the all node views and 
  // enhances them by adding focusControls

  this.render = function() {
    var frag = document.createDocumentFragment();
    
    var docNodes = this.doc.getNodes();
    _.each(docNodes, function(n) {
      var nodeView = this.nodes[n.id];
      frag.appendChild(nodeView.render().el);
      addFocusControls(nodeView);
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
