"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var Surface = require("substance-surface");
var Outline = require("lens-outline");
var View = require("substance-application").View;


// Lens.Reader.View
// ==========================================================================
//
// The Substance Article Editor / Viewer

var ReaderView = function(controller) {
  View.call(this);

  this.$el.addClass('article');
  
  // Controllers
  // --------

  this.controller = controller;
  this.writer = controller.writer;

  // Surfaces
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.surface = new Surface(this.controller.writer, {
    editable: false,
    context: "content"
  });

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  this.figures = new Surface(this.controller.figures, {
    editable: false,
    context: "resources"
  });

  // A Surface for the figures view
  // Uses the figures writer, provided by the controller
  this.citations = new Surface(this.controller.citations, {
    editable: false,
    context: "resources"
  });

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  // this.listenTo(this.controller, "state:changed", this.updateState);

  // Outline
  // --------

  this.outline = new Outline(this.surface);
};

ReaderView.Prototype = function() {

  // Clear selection
  // --------
  //

  this.clear = function() {

  };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type) {
    this.writer.annotate(type);
    return false;
  };

  // Rendering
  // --------
  //

  this.render = function() {
    var that = this;

    this.$el.html(html.tpl('article', this.controller));
    this.$('.document').html(this.surface.render().el);

    _.delay(function() {
      // Render outline that sticks on this.surface
      that.$('.document').append(that.outline.render().el);

      // Initial outline update
      that.updateOutline();
    }, 100);

    // Figures
    this.$('.resources').append(this.figures.render().el);

    // Citations
    // this.$('.resources').append(this.citations.render().el);

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

  // Whenever the app state changes
  // update the Outline accordingly.
  // --------

  this.updateOutline = function() {
    var state = this.controller.state;

    // Find all annotations
    // TODO: this is supposed to be slow -> optimize
    var annotations = _.filter(this.writer.getAnnotations(), function(a) {
      return a.target === "image_fig2";
    });

    var nodes = _.uniq(_.map(annotations, function(a) {
      return a.path[0];
    }));

    // Some testing
    this.outline.update({
      selectedNode: state.node,
      highlightedNodes: nodes
    });
  };

  // Recompute Layout properties
  // --------
  // 
  // This fixes some issues that can't be dealth with CSS

  this.updateLayout = function() {
    var docWidth = this.$('.document').width();
    this.surface.$('.content-node').css('width', docWidth-15);
  },

  // Mark Active Heading
  // -------------
  // 
  // Used for auto-selecting current heading based
  // on current scroll position

  // markActiveHeading: function() {
  //   var that = this;
  //   var scrollTop = $('#container .content').scrollTop();

  //   var headings = _.filter(that.model.document.views.content, function(n) {
  //     return that.model.document.nodes[n].type === "heading";
  //   });

  //   function getActiveNode() {
  //     var active = _.first(headings);
  //     $('#document .document .content-node.heading').each(function() {
  //       if (scrollTop >= $(this).position().top + CORRECTION) {
  //         active = _.nodeId(this.id);
  //       }
  //     });

  //     var contentHeight = $('.nodes').height();
  //     // Edge case: select last item (once we reach the end of the doc)
  //     if (scrollTop + $('#container .content').height() >= contentHeight) {
  //       // Find last heading
  //       active = _.last(headings);
  //     }
  //     return active;
  //   }

  //   var activeNode = getActiveNode();
  //   var tocEntry = $('.resources .headings a[data-node="'+activeNode+'"]');
  //   $('.resources .headings a.highlighted').removeClass('highlighted');
  //   tocEntry.addClass('highlighted');
  // },


  // Free the memories, ahm.. memory.
  // --------
  //

  this.dispose = function() {
    this.surface.dispose();
    this.figures.dispose();
    this.citations.dispose();

    this.stopListening();
  };
};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();

module.exports = ReaderView;
