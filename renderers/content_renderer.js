var Article = require("lens-article");
var ArticleRenderer = Article.Renderer;
var nodes = require("lens-article/nodes");
var $$ = require("substance-application").$$;

var modes = {
  "node": {
    "icon": "icon-anchor"
  },
  "figure": {
    "icon": "icon-camera"
  },
  "citation": {
    "icon": "icon-link"
  }
};

var modeAssignments = {
  "formula": ["node"],
  "heading": ["node"],
  "paragraph": ["node"],
  "list": ["node"]
};


// The DOM fragment generated here gets added to any content node
// --------
// 
// .content-node
//   .focus
//     .focus-citation
//     .focus-figure
//     .stripe

var addFocusControls = function(doc, nodeView) {

  // The content node object
  var node = nodeView.node;

  var modesForType = modeAssignments[node.type] || [];
  if (modesForType.length === 0) return; // skip

  // Per mode
  var focusToggles = [];

  _.each(modesForType, function(key) {
    var mode = modes[key];

    // TODO: this should move outside -> logic-less rendering, you know.
    var refs = doc.getAnnotations({
      node: node.id,
      filter: function(a) {
        return a.type === key+'_reference';
      }
    });

    var refCount = Object.keys(refs).length;
    if (refCount > 0 || key === "node") {
      
      var context = key === "node" ? "toc" : key+"s";

      focusToggles.push($$('div', {
        "sbs-click": 'toggleNode('+context+','+node.id+')',
        class: "focus-mode "+ key,
        html: '<div class="arrow"></div><i class="'+mode.icon+'"></i>'+ (refCount > 0 ? refCount : ""),
        title: "Show relevant"+ key
      }));
    }
  });

  var focus = $$('div.focus', {
    children: focusToggles
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

    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });

    var frag = document.createDocumentFragment();

    var docNodes = this.doc.container.getTopLevelNodes();
    _.each(docNodes, function(n) {
      var nodeView = this.createView(n);
      frag.appendChild(nodeView.render().el);
      addFocusControls(this.doc, nodeView);
      this.nodes[n.id] = nodeView;
    }, this);

    return frag;
  };
};

ContentRenderer.Prototype.prototype = Article.Renderer.prototype;
ContentRenderer.prototype = new ContentRenderer.Prototype();
ContentRenderer.prototype.constructor = ContentRenderer;

module.exports = ContentRenderer;
