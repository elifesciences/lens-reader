"use strict";

var Document = require("substance-document");
var Controller = require("substance-application").Controller;
var ReaderView = require("./reader_view");
var util = require("substance-util");

// Reader.Controller
// -----------------
//
// Controls the Reader.View

var ReaderController = function(doc, state) {

  // Private reference to the document
  this.__document = doc;

  // Reader state
  // -------

  this.content = new Document.Controller(doc, {view: "content"});
  
  // this.toc = new TOC();

  this.figures = new Document.Controller(doc, {view: "figures"});
  this.citations = new Document.Controller(doc, {view: "citations"});

  this.state = state;
};

ReaderController.Prototype = function() {

  this.createView = function() {
    this.view = new ReaderView(this);
    return this.view;
  };

  // Switching the reader context
  // --------
  // 
  // ['toc', 'figure', 'citation', 'toc']

  this.switchContext = function(context) {
    this.state.context = context;
    this.updateState(context, this.state);
  };

  // TODO: Transition to ao new solid API
  // --------
  // 

  this.getActiveControllers = function() {
    var result = [];
    result.push(["article", this]);
    result.push(["reader", this.content]);
    return result;
  };
};

ReaderController.Prototype.prototype = Controller.prototype;
ReaderController.prototype = new ReaderController.Prototype();

module.exports = ReaderController;
