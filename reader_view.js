"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var Surface = require("substance-surface");
var Outline = require("lens-outline");
var View = require("substance-application").View;
var ContentRenderer = require("./renderers/content_renderer");
var ResourceRenderer = require("./renderers/resource_renderer");
var $$ = require("substance-application").$$;

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

  var contextToggles = $$('.context-toggles', {
    children: [
      $$('.context-toggle.toc', {
        'sbs-click': 'switchContext(toc)',
        'html': '<i class="icon-align-left"></i><span> Contents</span>'
      }),
      $$('.context-toggle.figures', {
        'sbs-click': 'switchContext(figures)',
        'html': '<i class="icon-camera"></i><span> Figures</span>'
      }),
      $$('.context-toggle.citations', {
        'sbs-click': 'switchContext(citations)',
        'html': '<i class="icon-link"></i><span> References</span>'
      }),
      $$('.context-toggle.info', {
        'sbs-click': 'switchContext(info)',
        'html': '<i class="icon-info-sign"></i><span> Article Info</span>'
      })
    ]
  });

  // Prepare resources view
  // --------

  var resourcesView = $$('.resources');
  resourcesView.appendChild(contextToggles);
  resourcesView.appendChild(reader.figuresView.render().el);
  resourcesView.appendChild(reader.citationsView.render().el);

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

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  this.figuresView = new Surface(this.doc.figures, {
    editable: false,
    renderer: ResourceRenderer
  });

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  this.citationsView = new Surface(this.doc.citations, {
    editable: false,
    renderer: ResourceRenderer
  });

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.doc, "state-changed", this.updateState);

  // Outline
  // --------

  this.outline = new Outline(this.contentView);
};

ReaderView.Prototype = function() {

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

  // Switch context
  // --------
  //

  this.switchContext = function(context) {
    // this.doc.switchContext(context);
    this.doc.modifyState({
      context: context
    });
  };

  // Update Reader State
  // --------

  this.updateState = function() {
    var state = this.doc.state;

    console.log('Updating le state', state);
    // Update Context Toggles
    // -------

    this.$('.context-toggle.active').removeClass('active');
    this.$('.context-toggle.'+state.context).addClass('active');

    // According to the current context show active resource panel
    // -------

    this.$('.resources .surface').removeClass('active');
    this.$('.resources .surface.'+state.context).addClass('active');


    // According to the current context show active resource panel
    // -------
    this.updateResource();
  };

  // Based on the current application state, highlight the current resource
  // -------
  // 

  this.updateResource = function() {
    var state = this.doc.state;
    this.$('.resources .content-node.active').removeClass('active');

    if (state.resource) {
      // console.log('showing the resource');
      // Show selected resource
      this.$('#'+state.resource).addClass('active');

      // Update outline
      
    } else {
      // Hide all resources
    }

    this.updateOutline();
  };

  // Whenever the app state changes
  // update the Outline accordingly.
  // --------

  this.updateOutline = function() {
    var state = this.doc.state;

    console.log('STATE:RESOURCE', state.resource);
    // Find all annotations
    // TODO: this is supposed to be slow -> optimize
    var annotations = _.filter(this.doc.content.getAnnotations(), function(a) {
      return a.target === state.resource;
    }, this);

    var nodes = _.uniq(_.map(annotations, function(a) {
      return a.path[0];
    }));

    console.log('selectedNode', state.node);
    console.log('highlightedNodes', nodes);
    // Some testing
    this.outline.update({
      selectedNode: state.node,
      highlightedNodes: nodes
    });
  };

  // Clear selection
  // --------
  //

  this.clear = function() {

  };

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
    var that = this;

    this.el.appendChild(new Renderer(this));

    // After rendering make reader reflect the app state
    this.updateState();

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
      // Update width for .document .content-node elements
      that.outline.render(); //renderOutline();
      // that.updateOutline();
      that.updateLayout();
    }, 3);

    $(window).resize(lazyOutline);
    
    return this;
  };

  // Recompute Layout properties
  // --------
  // 
  // This fixes some issues that can't be dealth with CSS

  this.updateLayout = function() {
    var docWidth = this.$('.document').width();
    this.contentView.$('.content-node').css('width', docWidth-15);
  },


  // Free the memories, ahm.. memory.
  // --------
  //

  this.dispose = function() {
    this.contentView.dispose();
    this.figuresView.dispose();
    this.citationsView.dispose();
    this.stopListening();
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();

module.exports = ReaderView;
