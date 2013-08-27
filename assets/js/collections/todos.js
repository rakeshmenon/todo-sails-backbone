/*global Backbone */
var app = app || {};

(function() {
  'use strict';

  var SailsCollection = Backbone.Collection.extend({
    sailsCollection: "",
    socket: null,
    sync: function(method, model, options) {
      var where = {};
      if (options.where) {
        where = {
          where: options.where
        }
      }
      if (typeof this.sailsCollection === "string" && this.sailsCollection !== "") {
        this.socket = io.connect();
        this.socket.on("connect", _.bind(function() {
          this.socket.request("/" + this.sailsCollection, where, _.bind(function(users) {
            this.set(users);
          }, this));

          this.socket.on("message", _.bind(function(msg) {
            var m = msg.verb;
            if (m === "create") {
              this.add(msg.data);
            } else if (m === "update") {
              this.get(msg.id).set(msg.data);
            } else if (m === "destroy") {
              this.get(msg.id).destroy();
            }
          }, this));
        }, this));
      } else {
        console.log("Error: Cannot retrieve models because property 'sailsCollection' not set on collection");
      }
    }
  });

  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  var Todos = SailsCollection.extend({
    // Reference to this collection's model.
    sailsCollection: 'todo',
    model: app.Todo,

    // Save all of the todo items under the `"todos"` namespace.
    // localStorage: new Backbone.LocalStorage('todos-backbone'),
    url: "/todo/",
    //urlRoot: "todo",
    //noIoBind: false,

    // Filter down the list of all todo items that are finished.
    completed: function() {
      return this.filter(function(todo) {
        return todo.get('completed');
      });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.completed());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) {
        return 1;
      }
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }
  });

  // Create our global collection of **Todos**.
  app.todos = new Todos({
    collection: 'todo'
  });
})();