'use strict';
Object.defineProperty(Array.prototype, "randomElement", {
  value: function () {
    return this[Math.floor(Math.random() * this.length)];
  },
  writable: false,
  enumerable: false,
  configurable: false
});

Date.parseDotDate = function (date) {
  try {
    return new Date(date.split(".").reverse().join("/"));
  } catch (e) {
    app.debug(e, "error");
  }
};

Date.getValidRange = function (range) {
  var clone = {};
  switch (typeof range) {
    case 'string':
      var matches = range.match(/(\d{2}\.){2}\d{4}/gim);
      if (matches === null || matches.length !== 2) return;
      clone = matches.slice(0).map(Date.parseDotDate); 
      break;
    case 'object':
      for (var key in range) {      
        if (range.hasOwnProperty(key)) clone[key] = Date.parseDotDate(range[key]);
      } 
      break;
    default:
      return;
  }
  
  var start = clone.startDate || clone[0];
  var end = clone.endDate || clone[1]; 

  if (start <= end) {
    return {
      startDate: start,
      endDate: end
    };
  }
};

Date.rangeToString = function (range, format) {
  if (range.startDate && range.endDate) {
    if (typeof format === 'string') {      
      return range.startDate.format(format) + ' — ' + range.endDate.format(format);
    } else {
      return range.startDate + ' — ' + range.endDate;
    }
  }
}


/// ---- from string: ----
/// Date.toRange('month');
/// Date.toRange('01.01.2015');
/// Date.toRange('01.01.2015 - 01.02.2015');
/// ---- from two dates/strings [first, last]: ----
/// Date.toRange(new Date(), new Date());
/// Date.toRange('01.01.2015', '01.02.2015');
/// Date.toRange('01.01.2015', new Date());
/// --- else return null;
Date.toRange = function (start, end) {
  var toDateString = function (date) {
    if (typeof date === 'string') {
      return date;
    } else if (date instanceof Date) {
      return date.format("dotDate");
    } else {
      return null;
    }
  };

  var isValidDateString = function (dateString) {
    var date = Date.parse(dateString);
    return date !== "Invalid Date" && !isNaN(date) && dateString.trim().length === 10;
  };

  if (arguments.length === 1) {
    if (typeof start === 'string') {
      end = new Date();
      switch (start) {
      case 'day':
        start = new Date(end.getFullYear(),
          end.getMonth(), end.getDate() - 1);
        break;
      case 'week':
        start = new Date(end.getFullYear(),
          end.getMonth(), end.getDate() - 7);
        break;
      case 'month':
        start = new Date(end.getFullYear(),
          end.getMonth() - 1, end.getDate());
        break;
      case 'year':
        start = new Date(end.getFullYear() - 1,
          end.getMonth() - 1, end.getDate());
        break;
      default:
        var dates = start.split('-');
        if (dates.length === 2 && isValidDateString(dates[0]) && isValidDateString(dates[1])) {
          return {
            startDate: dates[0].trim(),
            endDate: dates[1].trim()
          };
        } else if (dates.length === 1 && isValidDateString(start)) {
          end = start;
        } else {
          return null;
        }
      }
    } else if (start instanceof Date) {
      end = start;
    } else {
      return null;
    }
  } else if (arguments.length !== 2) {
    return null;
  }

  return {
    startDate: toDateString(start),
    endDate: toDateString(end)
  };
}

Number.prototype.toMoney = function (c, d, t) {
  var number = this,
    c = isNaN(c = Math.abs(c)) ? 0 : c,
    d = d == undefined ? "," : d,
    t = t == undefined ? " " : t,

    sign = number < 0 ? "-" : "",
    i = parseInt(number = Math.abs(+number || 0).toFixed(c)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;

  return sign + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(number - i).toFixed(c).slice(2) : "");

};

if (typeof Number.isFinite !== 'function') {
  Number.isFinite = function isNumeric(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
}

/****************************Library configurated**************************/

$.fn.addCentredMsg = function (msg) {
  if (this.find(".empty-msg > span").text() === msg) return;
  this.html("<div class='centred empty-msg' style='line-height:" + this.height() + "px'><span>" + msg + "</span></div>");
};

$.fn.toString = function() {
  var out = [];
  $.each(this, function(k, v) {
    return out.push($(v)[0].outerHTML);
  });
  return out.join("\n");
};

$.when = _.wrap($.when, function (when, deferreds) {
  return Array.isArray(deferreds) ? when.apply($, deferreds) : when.apply($, [].slice.call(arguments, 1));
});

var ev = new $.Event('remove');
var orig = $.fn.remove;
$.fn.remove = function() {
  $(this).trigger(ev);
  return orig.apply(this, arguments);
}

jQuery.ajaxSettings.traditional = true;

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

_.getType = function (value) {
  return {}.toString.call(value).slice(8, -1).toLowerCase();
};

_.extend(Backbone.View.prototype, {  
  isAddInit: false,
  init: function () {},
  initialize: function () {
    this._subViews = {};
    this.name = this.name || _.uniqueId("unknow" + '_');    
    if (this.isAddInit === true) app.initViews[this.name] = this;  
    
    var remove = this.remove;
    this.remove = function () {
      this.trigger('remove:before');      
      this.removeSubView();
      remove.apply(this, arguments);
      if (app.initViews[this.name]) {
        delete app.initViews[this.name];
      }
    }  

    var render = this.render;

    this.render = function () {      
      if (Array.isArray(this.breadcrumbs)) {
        app.initViews.breadcrumbs.render(this.breadcrumbs);
      }
      this.trigger("beforeRender");
      render.apply(this, arguments);
      this.trigger("rendered");

      return this;
    }

    if (typeof this.destroyComponents === "function") {
      this.on('remove:before', this.destroyComponents, this);
      this.on("rendered", function () {
        if (!(app.initRoute instanceof Backbone.Router)) return;
        this.stopListening(app.initRoute, "route:before");
        this.listenToOnce(app.initRoute, "route:before", this.destroyComponents.bind(this));
      }, this);
    }

    this.init.apply(this, arguments);
  },
  addSubView: function (view, name, isCollection) {
    if (!(view instanceof Backbone.View)) return false;
    if (name) {
      name = isCollection ? _.uniqueId(name + '_') : name;   
    } else {
      name = isCollection ? _.uniqueId(view.name + '_') : view.name; 
    }
    this._subViews[name] = view;
    this._subViews[name].parentView = this;
    return this._subViews[name];
  },
  getSubView: function (name) {
    if (!name || !this._subViews[name]) return;
    return this._subViews[name];
  },
  getSubViews: function () {
    return this._subViews;
  },
  findSubViews: function (name) {
    var views = [];
    for (var key in this._subViews) {
      if (!~key.indexOf(name)) continue;
      views.push(this._subViews[key]);
    }  
    return views;
  },
  setSubView: function (view, name) {
    this.removeSubView(name);
    this.addSubView.apply(this, arguments);
  },
  delegateEventsSubViews: function (ctx) {   
    ctx || (ctx = this);
    ctx.delegateEvents();
    var subViews = ctx.getSubViews();  
    if (!Object.keys(subViews)) return;      
    for (var key in subViews) ctx.delegateEventsSubViews(subViews[key]);
  },
  removeSubView: function (name, isCollection) {
    var removeCollection = function (name) { 
      for (var key in this._subViews) {
        if (name && !~key.indexOf(name)) continue;
        this._subViews[key].remove();
        delete this._subViews[key];  
      } 
    }.bind(this);
    
    if (typeof name === "string") { 
      if (isCollection === true) return removeCollection(name);
      var subView = this.getSubView(name);      
      if (subView) {
        subView.remove();
        delete this._subViews[name]
      }
      return;
    }
    
    removeCollection();
      
  },
  getSubComponent: function (viewName, name, options) {
    if (_.getType(name) === "object" || typeof name === "function") {
      options = name;
      name = viewName;
    } 
    if (typeof name === "undefined") name = viewName;    
    try {
      var isCollection = options.isCollection;
    } catch (e) {}
    var subView = this.getSubView(name);
    if (!subView) subView = this.addSubView(app.getView(viewName, 
      (typeof options === "function" ? options.call(this) : options), isCollection), name);
    return subView;
  },
  isEl: function () {
    for (var i = 0; i < arguments.length; i++) {
      var el = this.$(arguments[i]);
      if (el.length === 1 || el[0] instanceof HTMLElement) return el;
    }
  }
});

_.extend(Backbone.Collection.prototype, {
  sortField: null,
  sortDirection: "asc",
  
  init: function () {},
  
  initialize: function (models, options) {
    this.createNameCollection();   

    options || (options = {});
    if (!options.hasOwnProperty('addInit') || options.addInit) {
      app.initCollections[this.name] = this;
    }

    if (options.rollbackable) {
      this._rollbackable = true;
    }

    this._createDeferred();

    this.init.apply(this, arguments);

    this.on("collection:remove", function () {
      this.remove.apply(this, arguments);
      if (app.initCollections[this.name]) {
        delete app.initCollections[this.name];
      }
    }, this);

  }, 
  _createDeferred: function () {
    this._fetched = $.Deferred();
    this.isFetched = this._fetched.promise();
  },
  createNameCollection: function () {
    if (!this.name || typeof this.name !== 'string') {
      this.name = _.uniqueId('unknown_');
    }
  },
  rollback: function () {
    if (!this._rollbackable) {
      return this;
    }

    for (var model in this.models) {
      this.models[model].rollback();
    }

    return this;
  },
  fetch: _.wrap(Backbone.Model.prototype.fetch, function (fetch, options) {    
    options || (options = {});
    
    if (options.isResetDeferred) this._createDeferred();    
    if (this._rollbackable) {
      options.rollbackable = true;
    }

    var onSuccess = _.isFunction(options.success) ? options.success : function () {};

    options.success = function () {
      this.trigger('fetched');
      this._fetched.resolve();   
      onSuccess.apply(this, arguments);
    }.bind(this);

    fetch.call(this, options);
    return this;
  }),
  save: function (options) {
    var models = [];
    var modelIds = [];
    for (var model in this.models) {
      if (this.models[model].hasChanged()) {
        modelIds.push(model);
        models.push(this.models[model].toJSON());
      }
    }
    var self = this;
    options = options || {};
    if (models.length > 0) {
      $.ajax({
        data: JSON.stringify(models),
        contentType: "application/json",
        url: options.url || this.url,
        type: options.type || 'PUT',
        error: function (collection, err) {
          location.replace("/error?msg=" + encodeURIComponent(err.statusText) + "&c=" + err.status);
        },
        success: function () {
          for (var modelId in modelIds) {
            self.models[modelIds[modelId]]._rollbackAttrs = {};
            self.models[modelIds[modelId]].changed = {};
          }
          if (typeof options.success === 'function') {
            options.success.apply(undefined, arguments);
            self.trigger('sync');
          }
        }
      });
    } else if (typeof options.success === 'function') {
      options.success.call(undefined);
    }
  },  
  reset: _.wrap(Backbone.Collection.prototype.reset, function (reset) {
    this._createDeferred();
    reset.apply(this, [].slice.call(arguments, 1));

    return this;
  }),
  setSortFields: function (field, direction) {
    !field || (this.sortField = field);
    !direction || (this.sortDirection = direction);
    
    return this;
  },
  comparator: function (m) {
    return m.get(this.sortField);
  },
  sortBy: function (iterator, context) {    
    var obj = this.models,
      direction = this.sortDirection;

    return _.pluck(_.map(obj, function (value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function (left, right) {
      var a = direction === "asc" ? left.criteria : right.criteria,
        b = direction === "asc" ? right.criteria : left.criteria;

      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  },
  sort: _.wrap(Backbone.Collection.prototype.sort, function (sort, options) {
    options || (options = {});
    this.setSortFields(options.field, options.direction);   
    sort.call(this, options);
  })
});

_.extend(Backbone.Model.prototype, {
  init: function () {},
  initialize: function (attrs, options) {
    options || (options = {});
    if (options.addInit) {
      this.createNameModel();
      app.initModels[this.name] = this;
    }

    if (options.rollbackable) {
      this._rollbackable = true;
      this._rollbackAttrs = {};
      this.on('change', function (model) {
        for (var attr in model.changed) {
          if (typeof this._rollbackAttrs[attr] !== 'undefined') {
            continue;
          }
          this._rollbackAttrs[attr] = model._previousAttributes[attr];
        }
      }, this);
    }

    this._createDeferred();

    this.init.apply(this, arguments);

    this.on("model:remove", function () {
      this.remove.apply(this, arguments);
      if (app.initModels[this.name]) {
        delete app.initModels[this.name];
      }
    }, this);
  },
  _createDeferred: function () {
    this._fetched = $.Deferred();
    this.isFetched = this._fetched.promise();
  },
  createNameModel: function () {
    if (!this.name || typeof this.name !== 'string') {
      this.name = _.uniqueId('unknown_');
    }
  },
  rollback: function () {
    if (!this._rollbackable) {
      return this;
    }

    for (var attr in this._rollbackAttrs) {
      this.attributes[attr] = this._rollbackAttrs[attr];
      delete this.changed[attr];
    }
    this._rollbackAttrs = {};

    return this;
  },
  fetch: _.wrap(Backbone.Model.prototype.fetch, function (fetch, options) {    
    var self = this;
    options || (options = {});    
    if (options.isResetDeferred) self._createDeferred();
    
    var onSuccess = _.isFunction(options.success) ? options.success : function () {};

    if (!this._rollbackable) {
      options.success = function () {
        self._fetched.resolve();
        onSuccess.apply(fetch, arguments);
      }
      fetch.call(this, options);
      return this;
    }

    options.success = function () {
      self._rollbackAttrs = {};
      self._fetched.resolve();
      onSuccess.apply(fetch, arguments);
    }

    fetch.call(this, options);
    return this;
  }),
  save: _.wrap(Backbone.Model.prototype.save, function (save, attrs, options) {
    if (!this._rollbackable) {
      save.call(this, attrs, options);
      return this;
    }

    var self = this;
    options || (options = {});
    var onSuccess = _.isFunction(options.success) ? options.success : function () {};

    options.success = function () {
      self._rollbackAttrs = {};
      onSuccess.apply(save, arguments);
    }

    save.call(this, attrs, options);
    return this;
  }),
  reset: _.wrap(Backbone.Model.prototype.reset, function (reset) {
    this._createDeferred();
    reset.apply(this, [].slice.call(arguments, 1));

    return this;
  })
});

Backbone.Router.extend = _.wrap(Backbone.Router.extend, function (extend, protoProps) {
  var parent = this;
  protoProps.constructor = function () {
    var router = this;
    this.on("route:before", function () {
      app.debug(["route:before", arguments]);
    });
    Backbone.history.route = _.wrap(Backbone.history.route, function (historyRoute, route, cb) {
      var callback = cb;
      cb = function (fragment) {
        router.trigger("route:before", fragment, route);
        callback.apply(router, arguments);
      }
      historyRoute.call(this, route, cb);
    });
    return parent.apply(this, arguments);
  };

  return extend.apply(this, [].slice.call(arguments, 1));
});


Backbone.sync = _.wrap(Backbone.sync, function (sync, method, model, options) {
  var success = options.success;
  var error = options.error;
  var url = _.isFunction(model.url) ? model.url() : _.isString(model.url) ? model.url : _.isFunction(model.urlRoot) ? model.urlRoot() : _.isString(model.urlRoot) ? model.urlRoot : "unknow url";

  if (model.loading && model.loading.method == method) {
    onStopRender.call(model);
  }

  function onStopRender() { 
    if ("xhr" in this.loading) this.loading.xhr.abort();    
    xhrComplete();
  }

  function xhrComplete() {
    model.off("xhrAbort", onStopRender, model);
    if (model.loading && model.loading.method == method) {
      delete model.loading;
    }
  }

  options.success = function () {
    app.debug('Запрос на "' + url + '"', "info");
    xhrComplete();
    success.apply(model || this, arguments);
  }

  options.error = function (err) {
    if (err.statusText === "abort") {
      app.debug('Запрос на "' + url + '" отменен.', "warn");
      return;
    }
    app.debug('Запрос на "' + url + '". Oшибка запроса: ' + err.statusText + '.', "error");
    xhrComplete();
    error.apply(model || this, arguments);
  };  

  model.loading = {
    method: method,
    xhr: sync.apply(model, [].slice.call(arguments, 1))
  }  
  
  model.on("xhrAbort", onStopRender, model);
});

if (navigator.browserDetect.browser === "Explorer") {
  ["log","info","warn","error","assert","dir","clear","profile","profileEnd", "debug"].forEach(function (method) {     
      console[method] = console[method] ? this.bind(console[method], console) : this.bind(console.log, console);
  }, Function.prototype.call);
}
/************************************************************************/

module.exports = require('./index.json');
