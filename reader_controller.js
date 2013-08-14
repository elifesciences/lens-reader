"use strict";

var Document = require("substance-document");
var Controller = require("substance-application").Controller;
var ReaderView = require("./reader_view");
var util = require("substance-util");

// Reader.Controller
// -----------------
//
// Controls the Reader.View

var ReaderController = function(document, state) {

  // Private reference to the document
  this.__document = document;

  // Reader state
  // -------

  this.state = state;
};

ReaderController.Prototype = function() {

  this.createView = function() {
    // Remove when transition has completed
    this.writer = new Document.Writer(this.__document);

    this.content = new Document.Writer(this.__document, {view: "content"});
    
    // this.toc = new TOC();

    this.figures = new Document.Writer(this.__document, {view: "figures"});
    this.citations = new Document.Writer(this.__document, {view: "citations"});

    var view = new ReaderView(this);
    this.view = view;
    var surface = view.surface;

    return view;
  };

  this.getActiveControllers = function() {
    var result = [];
    result.push(["article", this]);
    result.push(["writer", this.writer]);
    return result;
  };
};

ReaderController.Prototype.prototype = Controller.prototype;
ReaderController.prototype = new ReaderController.Prototype();

module.exports = ReaderController;
