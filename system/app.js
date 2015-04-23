'use strict';
module.exports = function () {
  var App = (function () {
    var instance;
    return function Constructor() {
      if (instance) {
        return instance;
      }
      if (this && this.constructor === Constructor) {
        instance = this;
      } else {
        return new Constructor();
      }

      var fixed = 'fixedComponents';
      var theme = 'theme';

      this.config = require('./config');
      this.errors = require('./errors');

      try {
        this[fixed] = localStorage[fixed].split(',');
        if (this[fixed].length === 1 && this[fixed][0] == "") this[fixed].length = 0;
      } catch (e) {
        this[fixed] = [];
      }

      this
        .dataBinding(this[fixed], function () {
          localStorage[fixed] = this[fixed];
          if (this.initViews.systemConfig) {
            this.initViews.systemConfig.trigger('fixed', this[fixed]);
          }
        })
        .defineVariable(theme, localStorage[theme] || this.config.defaultTheme, function (newTheme, oldTheme) {
          var $body = $(document.body);
          if (newTheme === oldTheme && $body.hasClass(theme + '-' + newTheme)) return;
          if (!~this.config.themes.indexOf(newTheme)) {
            this[theme] = this.config.defaultTheme;
            return;
          }

          $body.removeClass(function (i, className) {
            return className.split(" ").filter(function (n) {
              return ~n.indexOf(theme);
            }).join(" ");
          }).addClass(theme + '-' + newTheme);
        })
        .defineVariable('isMinSidebar', localStorage.isMinSidebar || this.config.isMinSideBar, function (value) {
          if (typeof value !== "boolean") return;
          app.events.trigger('sidebar', value);
        })
        .defineVariable('select2Inverted', localStorage.select2Inverted || this.config.select2Inverted)
        .defineVariable('select2Checkboxed', localStorage.select2Checkboxed || this.config.select2Checkboxed);

      this[theme] = localStorage[theme];
    }
  }());

  App.prototype.addComponents = function () {
    //Static classes
    App.Collection = {};
    App.Collection.Chart = require('./collections/chart-parent');

    App.View = {};
    App.View.Parent = require('./views/parent');
    App.View.Wall = require('./views/wall');
    App.View.FixedWall = require('./views/fixedWall');
    App.View.Chart = require('./views/chart');
    App.View.WidgetChart = require('./views/widgets/chart');
    App.View.StaffDetailsChart = require('./views/staffDetails/chart');

    // App components
    this.mainView = $('#main-view');

    this.initViews = {};
    this.initModels = {};
    this.initCollections = {};
    this.events = _.extend({}, Backbone.Events);

    this.models = {
      Account: require('./models/account'),
      AutoReport: require('./models/auto-report'),
      DataReport: require('./models/reports/data'),
      DynamicPriceCities: require('./models/staff/dynamic-price-cities'),
      DynamicPriceCompanies: require('./models/staff/dynamic-price-companies'),
      ExistsReport: require('./models/reports/exists'),
      Feedback: require('./models/feedback'),
      Filter: require('./models/filter'),
      Language: require('./models/language'),
      MatchingCity: require('./models/matching-city'),
      MatchingDestName: require('./models/matching-dest-name'),
      MatchingDetails: require('./models/matching-details'),
      MatchingSourceName: require('./models/matching-source-name'),
      PercentRatio: require('./models/percent-ratio'),
      Sku: require('./models/statistics/sku'),
      Staff: require('./models/staff'),
      StaffDetails: require('./models/staff/details'),
      StaffDetailsFilter: require('./models/staff/detailsFilter'),
      StaffDetailsTable: require('./models/staff/detailsTable'),
      StaffsCitiesWidget: require('./models/staff/cities'),
      StaffsCompaniesWidget: require('./models/staff/companies'),
      StaffsCountWidget: require('./models/staff/count'),
      StaffsDateWidget: require('./models/staff/date'),
      StaffsFilter: require('./models/staff/filter'),
      TemplateReport: require('./models/reports/template'),
      TypeReport: require('./models/reports/type'),
      User: require('./models/user'),
      UserCity: require('./models/userCity'),
      UserCompany: require('./models/userCompany'),
      UserEvent: require('./models/statistics/userEvent'),
      UserEventCount: require('./models/statistics/userEventCount'),
      UsersStatisticsFilter: require('./models/statistics/usersFilter')
    };

    this.collections = {
      AutoReports: require('./collections/auto-reports'),
      CompanyCity: require('./collections/company-city'),
      DynamicPriceCities: require('./collections/dynamic-price-cities'),
      DynamicPriceCompanies: require('./collections/dynamic-price-companies'),
      ExistsReports: require('./collections/reports/exists'),
      MatchingCity: require('./collections/matching-city'),
      MatchingDest: require('./collections/matching-dest-names'),
      MatchingSource: require('./collections/matching-source-names'),
      PercentRatio: require('./collections/percent-ratio'),
      Sku: require('./collections/sku'),
      StaffDetails: require('./collections/staffDetails'),
      Staffs: require('./collections/staffs'),
      TemplateReports: require('./collections/reports/template'),
      TypeReports: require('./collections/reports/type'),
      UserCities: require('./collections/userCities'),
      UserCompanies: require('./collections/userCompanies'),
      Users: require('./collections/users'),
      UsersStatistics: require('./collections/usersStatistics')
    };

    this.views = {
      AddAutoReport: require('./views/reports/auto/add'),
      AutoReport: require('./views/reports/auto/report'),
      AutoReports: require('./views/reports/auto'),
      Breadcrumbs: require('./views/breadcrumbs'),
      Comparison: require('./views/matching/comparison'),
      ComparisonDestList: require('./views/matching/dest-list'),
      ComparisonDestName: require('./views/matching/dest-name'),
      ComparisonSourceList: require('./views/matching/source-list'),
      ComparisonSourceName: require('./views/matching/source-name'),
      Control: require('./views/control'),
      DateRangePicker: require('./views/dateRangePicker'),
      EditUser: require('./views/users/edit'),
      ExistsReportDetails: require('./views/reports/exists/details'),
      ExistsReportDetailsTable: require('./views/reports/exists/details/table'),
      ExistsReportDynamicPrice: require('./views/reports/exists/details/dynamic-price'),
      ExistsReports: require('./views/reports/exists'),
      ExistsReportsItem: require('./views/reports/exists/item'),
      Feedback: require('./views/feedback'),
      GenerateReports: require('./views/reports/generate'),
      GenerateReportsStep1: require('./views/reports/generate/steps/1'),
      GenerateReportsStep2: require('./views/reports/generate/steps/2'),
      GenerateReportsStep3: require('./views/reports/generate/steps/3'),
      GenerateReportsStep4: require('./views/reports/generate/steps/4'),
      Header: require('./views/header'),
      Loading: require('./views/loading'),
      MatchingCity: require('./views/widgets/matching'),
      MatchingStatistics: require('./views/statistics/matching'),
      MessagesControl: require('./views/control/messages'),
      Modal: require('./views/modal'),
      Pagination: require('./views/pagination'),
      PercentRatio: require('./views/widgets/percent-ratio'),
      PercentRatioStatistics: require('./views/statistics/percent-ratio'),
      Popover: require('./views/popover'),
      Reports: require('./views/reports'),
      Select2: require('./views/select2'),
      Sidebar: require('./views/sidebar'),
      SkuStatistics: require('./views/statistics/sku'),
      StaffDetails: require('./views/staffDetails'),
      StaffDetailsBadCompliance: require('./views/staffDetails/badCompliance'),
      StaffDetailsDynamicPriceCities: require('./views/staffDetails/dynamic-price-cities'),
      StaffDetailsDynamicPriceCompanies: require('./views/staffDetails/dynamic-price-companies'),
      StaffDetailsFilter: require('./views/staffDetails/filter'),
      StaffDetailsTable: require('./views/staffDetails/table'),
      StaffDetailsWidgets: require('./views/staffDetails/widgets'),
      Staffs: require('./views/staffs'),
      StaffsActions: require('./views/staffs/actions'),
      StaffsExtremum: require('./views/staffs/extremum'),
      StaffsFilter: require('./views/staffs/filter'),
      StaffsPriceHistory: require('./views/staffs/price-history'),
      StaffsRow: require('./views/staffs/row'),
      StaffsTable: require('./views/staffs/table'),
      StaffsWidget: require('./views/staffs/widget'),
      StandardMessagesControl: require('./views/control/standard-messages'),
      Statistics: require('./views/statistics'),
      SystemConfig: require('./views/system-config'),
      TemplateReport: require('./views/reports/templates/template'),
      TemplatesReports: require('./views/reports/templates'),
      UploadingControl: require('./views/control/uploading-control'),
      UserSettings: require('./views/settings'),
      Users: require('./views/users'),
      UsersStatistics: require('./views/statistics/users'),
      UsersStatisticsFilter: require('./views/statistics/users/filter'),
      UsersStatisticsTable: require('./views/statistics/users/table'),
      UsersTable: require('./views/users/table'),
      UsersTableRow: require('./views/users/row'),
      Widgets: require('./views/widgets'),
      Wizard: require('./views/wizard')
    };

    this.initRoute = require('./route');

    this.debug(this);
  };

  App.prototype.render = function (view, params) {
    return this.initViews[view] ? this.initViews[view].render(params) : (function (me) {
      var v = new me.views[view[0].toUpperCase() + view.slice(1)](params);
      return v.render(params);
    })(this);
  }

  App.prototype.getView = function (view, params) {
    params || (params = {});
    return this.initViews[view] || new this.views[view[0].toUpperCase() + view.slice(1)](params);
  }

  App.prototype.remove = function (component, domain) {
    domain = domain || "initViews";
    if (!this[domain]) return;
    if (!this[domain][component]) return;
    if (!this[domain][component].remove) return;

    this[domain][component].remove();
  }
  //params:
  //name, attr, modelOpts, method, methodsOpts, isMethodArgs isCollection, isRollback, bruteForce 
  App.prototype.callModelMethod = function (params) {
    var type = _.getType(params);
    if (type !== 'object') {
      var models = [];
      if (type === 'array') {
        params.forEach(function (p) {
          models.push(this.callModelMethod(p));
        }.bind(this));
      }
      return models;
    }

    var checkInit = (function (n, is) {
      return is ? (app.initCollections[n] instanceof Backbone.Collection) : (app.initModels[n] instanceof Backbone.Model);
    })(params.name, params.isCollection);

    var exist = (function (n, is) {
      var model = is ? app.collections : app.models;
      return model[n[0].toUpperCase() + n.slice(1)];
    })(params.name, params.isCollection);

    var initModel = function (n, is) {
      return is ? app.initCollections[n] : app.initModels[n];
    };

    var createAndFetch = function (m, p) {
      var model = checkInit ? initModel(params.name, params.isCollection) : new m(p.attr, p.modelOpts);
      var method = model[p.method] ? p.method : "fetch";

      if (method == "fetch" && model.isFetched.state() === "resolved") return;
      p.isMethodArgs ? model[method].apply(model, p.methodsOpts) : model[method](p.methodsOpts);
    }

    if (!checkInit || params.bruteForce) {
      if (exist) createAndFetch(exist, params);
    } else if (params.isRollback) {
      initModel(params.name, params.isCollection).rollback();
    }

    return initModel(params.name, params.isCollection);
  }

  App.prototype.reset = function (inSystem) {
    this.theme = "azure";
    this.fixedComponents.length = 0;
    this.isMinSidebar = false;
    this.select2Inverted = false;
    this.select2Checkboxed = false;
  }

  App.prototype.debug = function (message, stream) {
    if (!this.config.mode_debug) return false;
    console[stream] || (stream = 'debug');
    console[stream].apply(console, [].concat(message, [].slice.call(arguments, 2)));
  }

  App.prototype.error = function (className, method, message) {
    if (!this.config.mode_debug) return false;
    console.error("(class " + className + ": " + method + ") ", message);
  }

  App.prototype.defineVariable = function (prefix, defaultVariable, cb) {
    var me = this,
      oldValue, variable;

    try {
      localStorage[prefix] = variable = JSON.parse(defaultVariable);
    } catch (e) {
      localStorage[prefix] = variable = defaultVariable;
    }

    if (!_.isFunction(cb)) cb = function () {};

    Object.defineProperty(this, prefix, {
      get: function () {
        try {
          return typeof variable !== 'undefined' ? variable : JSON.parse(localStorage[prefix]);
        } catch (e) {
          app.error("App", "defineVariable", e);
          return defaultVariable;
        }
      },
      set: function (newValue) {
        oldValue = variable;
        localStorage[prefix] = variable = newValue;
        cb.call(me, newValue, oldValue);
      },
      enumerable: true,
      configurable: true
    });

    return this;
  }

  App.prototype.dataBinding = function (model, cb) {
    Object.observe(model, cb.bind(this));
    return this;
  }

  App.prototype.viewsQueue = function (views) {
    if (!_.isArray(views)) return;

    (function deferred(views, callback) {
      if (_.isEmpty(views)) return;

      var me = this;
      var success = views.length !== 1 ? function () {
        deferred.call(me, views.slice(1), callback);
      } : _.isFunction(callback) ? callback : function () {};


      var defaultMethod = 'render';
      var appMethod = views[0].appMethod ? views[0].appMethod : defaultMethod;

      if (typeof this[appMethod] !== 'function') {
        throw new TypeError("(Method: " + appMethod + ") " + this.errors.System.ViewsQueueFunction);
      }

      var view = this[appMethod](views[0].viewName, views[0].params);

      if (view instanceof Backbone.View) {
        view.dfd.then(success);
      } else {
        success();
      }
    }).apply(this, arguments);
  }

  App.prototype.notify = function (message, position, timeout, theme, icon, closable) {
    if (window.Notification) {
      var isBlock = false;
      var delayNotify = setTimeout(function () {
        createCustomNotification();
        app.playAlertMp3();
        isBlock = true;
      }, 10000);
      Notification.requestPermission(function () {
        clearTimeout(delayNotify);
        if (isBlock) return;
        var notification = Notification.permission === 'granted' ? createBrowserNotification : createCustomNotification;
        notification();
        app.playAlertMp3();
      });
    } else {
      createCustomNotification();
      app.playAlertMp3();
    }

    function createCustomNotification() {
      toastr.options.positionClass = 'toast-' + position;
      toastr.options.extendedTimeOut = 0; //1000;
      toastr.options.timeOut = timeout;
      toastr.options.closeButton = closable;
      toastr.options.iconClass = icon + ' toast-' + theme;
      toastr.custom(message);
    }

    function createBrowserNotification() {
      var type = {
          success: "Действие успешно выполнено",
          info: "Уведомление",
          warning: "Предупреждение!",
          error: "Произошла ошибка!"
        },
        th, t;

      if (type[theme]) {
        t = type[theme];
        th = theme;
      } else {
        t = type.info;
        th = "info";
      }

      var notification = new Notification(t, {
        body: message,
        icon: "/images/notify/" + th + ".png"
      });
      notification.onshow = function () {
        setTimeout(function () {
          notification.close();
        }, +timeout || 3000);
      };
    }
  }

  App.prototype.playAlertMp3 = function () {
    if (navigator.browserDetect.browser !== "Explorer") {
      this._audioAlert || (this._audioAlert = new Audio("/sound/alert.mp3"));
      this._audioAlert.currentTime = 0;
      this._audioAlert.play();
    }
  }

  return App;
}