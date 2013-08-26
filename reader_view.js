"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var Surface = require("substance-surface");
var Outline = require("lens-outline");
var View = require("substance-application").View;
var ContentRenderer = require("./renderers/content_renderer");
var ResourceRenderer = require("./renderers/resource_renderer");
var TOC = require("substance-toc");
var Data = require("substance-data");
var Index = Data.Graph.Index;
var $$ = require("substance-application").$$;

var CORRECTION = -100; // Extra offset from the top

// Renders the reader view
// --------
// 
// .document
// .context-toggles
//   .toggle-toc
//   .toggle-figures
//   .toggle-citations
//   .toggle-info
// .resources
//   .toc
//   .surface.figures
//   .surface.citations
//   .info

var Renderer = function(reader) {

  var frag = document.createDocumentFragment();

  // Prepare doc view
  // --------

  var docView = $$('.document');
  docView.appendChild(reader.contentView.render().el);

  // Prepare context toggles
  // --------

  var children = [
    $$('.context-toggle.toc', {
      'sbs-click': 'switchContext(toc)',
      'html': '<i class="icon-align-left"></i><span> Contents</span>'
    })
  ];

  if (reader.figuresView) {
    children.push($$('.context-toggle.figures', {
      'sbs-click': 'switchContext(figures)',
      'html': '<i class="icon-camera"></i><span> Figures</span>'
    }));
  }

  if (reader.citationsView) {
    children.push($$('.context-toggle.citations', {
      'sbs-click': 'switchContext(citations)',
      'html': '<i class="icon-link"></i><span> References</span>'
    }));
  }

  if (reader.infoView) {
    children.push($$('.context-toggle.info', {
      'sbs-click': 'switchContext(info)',
      'html': '<i class="icon-info-sign"></i><span> Article Info</span>'
    }));
  }

  var contextToggles = $$('.context-toggles', {
    children: children
  });

  // Prepare resources view
  // --------

  var resourcesView = $$('.resources');
  resourcesView.appendChild(contextToggles);

  // Add TOC
  // --------

  resourcesView.appendChild(reader.tocView.render().el);

  if (reader.figuresView) {
    resourcesView.appendChild(reader.figuresView.render().el);
  }
  
  if (reader.citationsView) {
    resourcesView.appendChild(reader.citationsView.render().el);
  }

  frag.appendChild(docView);
  frag.appendChild(resourcesView);
  return frag;
};


// Lens.Reader.View
// ==========================================================================
//
// The Substance Article Editor / Viewer

var ReaderView = function(doc) {
  View.call(this);

  this.$el.addClass('article');
  
  // Controllers
  // --------

  this.doc = doc;

  // Surfaces
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.contentView = new Surface(this.doc.content, {
    editable: false,
    renderer: ContentRenderer
  });

  // Table of Contents 
  // --------
  // 

  this.tocView = new TOC(this.doc);
  this.tocView.$el.addClass('resource-view');

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  if (this.doc.figures) {
    this.figuresView = new Surface(this.doc.figures, {
      editable: false,
      renderer: ResourceRenderer
    });
    this.figuresView.$el.addClass('resource-view');
  }

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  if (this.doc.citations) {
    this.citationsView = new Surface(this.doc.citations, {
      editable: false,
      renderer: ResourceRenderer
    });
    this.citationsView.$el.addClass('resource-view');
  }

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.doc, "state-changed", this.updateState);


  this.resources = new Index(this.doc.__document, {
    types: ["figure_reference", "citation_reference", "person_reference"],
    property: "target"
  });

  // DOM Events
  // --------
  // 

  this.contentView.$el.on('scroll', _.bind(this.onContentScroll, this));

  // Resource references
  this.contentView.$el.on('click', '.annotation.figure_reference', _.bind(this.toggleFigureReference, this));
  this.contentView.$el.on('click', '.annotation.citation_reference', _.bind(this.toggleCitationReference, this));
  this.contentView.$el.on('click', '.annotation.person_reference', _.bind(this.togglePersonReference, this));
  this.contentView.$el.on('click', '.annotation.cross_reference', _.bind(this.followCrossReference, this));

  // Outline
  // --------

  this.outline = new Outline(this.contentView);
};


ReaderView.Prototype = function() {

  // Toggle Resource Reference
  // --------
  //

  this.toggleFigureReference = function(e) {
    this.toggleResourceReference('figures', e);
  };

  this.toggleCitationReference = function(e) {
    this.toggleResourceReference('citations', e);
  };

  this.togglePersonReference = function(e) {
    this.toggleResourceReference('info', e);
  };

  this.toggleResourceReference = function(context, e) {
    var state = this.doc.state;
    var aid = $(e.currentTarget).attr('id');
    var a = this.doc.__document.get(aid);
    var nodeId = a.path[0];
    var resourceId = a.target;

    if (resourceId === state.resource) {
      this.doc.modifyState({
        context: this.doc.currentContext,
        node: null,
        resource:  null
      });
    } else {
      this.doc.modifyState({
        context: context,
        node: nodeId,
        resource: resourceId
      });

      this.jumpToResource(resourceId);
    }
  };

  // Follow cross reference
  // --------
  //

  this.followCrossReference = function(e) {
    console.log('follow cross reference...');

    var aid = $(e.currentTarget).attr('id');
    var a = this.doc.__document.get(aid);
    this.jumpToNode(a.target);
  };


  // Toggle on-off a resource
  // --------
  //

  this.onContentScroll = function() {
    var scrollTop = this.contentView.$el.scrollTop();
    this.outline.updateVisibleArea(scrollTop);
    this.markActiveHeading(scrollTop);
  };


  // Clear selection
  // --------
  //

  this.markActiveHeading = function(scrollTop) {
    var contentHeight = $('.nodes').height();

    // No headings?
    if (this.tocView.headings.length === 0) return;

    // Use first heading as default
    var activeNode = _.first(this.tocView.headings).id;

    this.contentView.$('.content-node.heading').each(function() {
      if (scrollTop >= $(this).position().top + CORRECTION) {
        activeNode = this.id;
      }
    });

    // Edge case: select last item (once we reach the end of the doc)
    if (scrollTop + this.contentView.$el.height() >= contentHeight) {
      activeNode = _.last(this.tocView.headings).id;
    }
    this.tocView.setActiveNode(activeNode);
  };

  // Toggle on-off a resource
  // --------
  //

  this.toggleResource = function(id) {
    var state = this.doc.state;

    // Toggle off if already on
    if (state.resource === id) id = null;

    this.doc.modifyState({
      resource: id
    });
  };

  // Jump to the given node id
  // --------
  //

  this.jumpToNode = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;
      this.contentView.$el.scrollTop(topOffset);
    }
  };

  // Jump to the given resource id
  // --------
  //

  this.jumpToResource = function(nodeId) {
    var $n = $('#'+nodeId);
    if ($n.length > 0) {
      var topOffset = $n.position().top+CORRECTION;

      // TODO: Brute force for now
      // Make sure to find out which resource view is currently active
      this.figuresView.$el.scrollTop(topOffset);
      this.citationsView.$el.scrollTop(topOffset);
    }
  };


  // Toggle on-off node focus
  // --------
  //

  this.toggleNode = function(context, nodeId) {
    var state = this.doc.state;

    if (state.node === nodeId && state.context === context) {
      // Toggle off -> reset, preserve the context
      this.doc.modifyState({
        context: this.doc.currentContext,
        node: null,
        resource: null
      });
    } else {
      this.doc.modifyState({
        context: context,
        node: nodeId,
        resource: null
      });
    }
  };

  // Explicit context switch
  // --------
  //

  this.switchContext = function(context) {
    this.doc.switchContext(context);
  };

  // Update Reader State
  // --------
  // 

  this.updateState = function(options) {
    options = options || {};
    var state = this.doc.state;
    var that = this;

    console.log('Updating le state', state);

    // Set context on the reader view
    // -------

    this.$el.removeClass('toc figures citations info');
    this.contentView.$('.content-node.active').removeClass('active');
    this.$el.addClass(state.context);

    // Update focus node
    // console.log('jumping to '+ state.node);
    // _.delay(function() {
    //   that.jumpToNode(state.node);
    // }, 200)
  
    if (state.node) {
      this.contentView.$('#'+state.node).addClass('active');
    }

    // According to the current context show active resource panel
    // -------
    this.updateResource();

    if (!options.silent) this.updatePath();
  };


  // Update URL Fragment
  // -------
  // 
  // This will be obsolete once we have a proper router vs app state 
  // integration.

  this.updatePath = function() {
    // This should be moved outside
    var state = this.doc.state;
    var path = [state.collection, this.doc.__document.id];

    path.push(state.context);

    if (state.node) {
      path.push(state.node);
    } else {
      path.push('all');
    }

    if (state.resource) {
      path.push(state.resource);
    }

    window.app.router.navigate(path.join('/'), {
      trigger: false,
      replace: false
    });
  },  

  // Based on the current application state, highlight the current resource
  // -------
  // 
  // Triggered by updateState

  this.updateResource = function() {
    var state = this.doc.state;
    this.$('.resources .content-node.active').removeClass('active');
    this.contentView.$('.annotation.active').removeClass('active');
    
    if (state.resource) {
      // Show selected resource
      this.$('#'+state.resource).addClass('active');

      // Mark all annotations that reference the resource
      var annotations = this.resources.get(state.resource);
      
      _.each(annotations, function(a) {
        this.contentView.$('#'+a.id).addClass('active');
      }, this);

      // Update outline
    } else {
      // Hide all resources
    }

    this.updateOutline();
  };

  // Whenever the app state changes
  // --------
  // 
  // Triggered by updateResource.

  this.updateOutline = function() {
    var state = this.doc.state;

    // Find all annotations
    // TODO: this is supposed to be slow -> optimize
    var annotations = _.filter(this.doc.content.getAnnotations(), function(a) {
      return a.target && a.target === state.resource;
    }, this);

    var nodes = _.uniq(_.map(annotations, function(a) {
      return a.path[0];
    }));

    // Some testing
    this.outline.update({
      context: state.context,
      selectedNode: state.node,
      highlightedNodes: nodes
    });
  };

  // Clear selection
  // --------
  //

  // this.clear = function() {

  // };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type) {
    this.doc.content.annotate(type);
    return false;
  };

  // Rendering
  // --------
  //

  this.render = function() {
    var state = this.doc.state;

    var that = this;

    this.el.appendChild(new Renderer(this));

    // After rendering make reader reflect the app state
    this.updateState({silent: true});

    _.delay(function() {
      // Render outline that sticks on this.surface
      that.$('.document').append(that.outline.render().el);

      // Initial outline update
      that.updateOutline();
    }, 100);

    // Wait a second
    _.delay(function() {
      MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
      // Show doc when typesetting math is done
      // MathJax.Hub.Queue(displayDoc);
    }, 20);

    // TODO: Make this an API and trigger from outside
    // --------

    var lazyOutline = _.debounce(function() {
      // Consider outline.recalibrate instead of a full rerender
      that.outline.render(); //renderOutline();
      that.updateLayout();
    }, 200);


    // Jump marks for teh win
    if (state.node) {
      _.delay(function() {
        that.jumpToNode(state.node);
        if (state.resource) {
          console.log('jumping to resource');
          that.jumpToResource(state.resource);
        }
      }, 100);
    }

    $(window).resize(lazyOutline);
    
    return this;
  };

  // Recompute Layout properties
  // --------
  // 
  // This fixes some issues that can't be dealth with CSS

  this.updateLayout = function() {
    // console.log('updating layout');
    // var docWidth = this.$('.document').width();
    // this.contentView.$('.content-node').css('width', docWidth - 15);
  },

  // Free the memory.
  // --------
  //

  this.dispose = function() {
    this.contentView.dispose();
    if (this.figuresView) this.figuresView.dispose();
    if (this.citationsView) this.citationsView.dispose();
    this.stopListening();
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();

module.exports = ReaderView;
