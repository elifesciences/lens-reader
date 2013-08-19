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

  // Current explicitly set context
  this.currentContext = "toc";
};

ReaderController.Prototype = function() {

  this.createView = function() {
    this.view = new ReaderView(this);
    return this.view;
  };

  // Explicit context switch
  // --------
  // 

  this.switchContext = function(context) {
    this.currentContext = context;
    this.modifyState({
      context: context,
      node: null,
      resource: null
    });
  };

  this.modifyState = function(state) {
    // console.log('patched modifystate');
    Controller.prototype.modifyState.call(this, state);
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
