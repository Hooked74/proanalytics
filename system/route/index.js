'use strict';
var SystemRoute = Backbone.Router.extend({
  routes: {
    "": "widgets",
    "staffs(/)": "staffs",
    "staffs/*id": "staffDetails",
    "reports/exists/*id": "existsReportDetails",
    "reports(/)*request": "reports",    
    "comparison(/)": "comparison",
    "users(/)*request": "users",
    "settings(/)": "settings",
    "feedback(/)": "feedback",
    "statistics(/)*request": "statistics",
    "control(/)*request": "control",
    "*request": "pageNotFound"
  },

  initialize: function () {
    var queue = [{
      viewName: 'loading'
    },
    {
      viewName: 'breadcrumbs'
    },
    {
      viewName: 'header'
    },
    {
      viewName: 'systemConfig'
    },
    {
      viewName: 'sidebar'
    },
    {
      viewName: 'loading',
      appMethod: 'remove'
    }];

    this.createNecessaryModels();

    app.viewsQueue(queue, function () {
      Backbone.history.start();
      app.events.trigger('sidebar', app.isMinSidebar);  
    });
  },

  createNecessaryModels: function () {
    app.callModelMethod([{
      name: "filter",
      modelOpts: {
        addInit: true
      }
    }, {
      name: "account",
      modelOpts: {
        addInit: true
      }
    }]);    
  },

  widgets: function () {
    app.render('widgets');
  },

  reports: function (request) {
    switch (request) {
    case 'new':
      app.render('generateReports');
      break;
    case 'exists':
      app.render('existsReports');
      break;
    case 'auto':
      app.render('autoReports');
      break; 
    case 'templates':
      app.render('templatesReports');
      break;
    default:
      app.render('reports');
    }
  },

  existsReportDetails: function (id) {
    app.render('existsReportDetails', {
      reportId: id
    });  
  },

  comparison: function () {
    var account = app.initModels.account.toJSON();
    if(account.isAdmin === 1 || account.isMatching === 1) {
      app.render('comparison');
    }
  },

  users: function (request) {
    switch (request) {
      //    case 'add':
      //      app.render('usersAdd');
      //      break;
      default: app.render('users');
    }
  },

  settings: function () {
    app.render('userSettings');
  },

  staffs: function () {
    app.render('staffs');
  },

  staffDetails: function (id) {
    app.render('staffDetails', {
      staffId: id
    });
  },

  feedback: function () {
    app.render('feedback');
  },

  statistics: function (request) {
    switch (request) {
    case 'users':
      app.render('usersStatistics');
      break;
    case 'sku':
      app.render('skuStatistics');
      break;
    case 'matching':
      app.render('matchingStatistics');
      break;
    case 'percent':
      app.render('percentRatioStatistics');
      break;
    default:
      app.render('statistics');
    }
  },

  control: function (request) {
    switch (request) {
    case 'messages':
      app.render('messagesControl');
      break;
    case 'standard-messages':
      app.render('standardMessagesControl');
      break;
    case 'uploading-control':
      app.render('uploadingControl');
      break;
    default:
      app.render('control');
    }
  },

  pageNotFound: function (request) {
    this.navigate("");
  }
});

module.exports = new SystemRoute();
