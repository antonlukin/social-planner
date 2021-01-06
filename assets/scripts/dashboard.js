"use strict";

/**
 * Dashboard script handler.
 */
(function () {
  if ('undefined' === typeof wp) {
    return;
  }

  var __ = wp.i18n.__; // Find dashboard element.

  var dashboard = document.querySelector('#social-planner-dashboard > .inside'); // Stop if settings element not exists.

  if (null === dashboard) {
    return;
  }

  if ('undefined' === typeof window.socialPlannerDashboard) {
    return;
  }

  var config = window.socialPlannerDashboard || {};
  /**
   * Show warning message.
   *
   * @param {HTMLElement} parent Parent DOM element.
   * @param {string} message Error text message.
   */

  var showWarning = function showWarning(parent, message) {
    var warning = document.createElement('p');
    warning.classList.add('social-planner-warning');
    warning.textContent = message;

    while (parent.firstChild) {
      parent.removeChild(parent.lastChild);
    }

    parent.appendChild(warning);
  };
  /**
   * Create scheduled task header.
   *
   * @param {Object} data Task data from config.
   */


  var createTaskHeader = function createTaskHeader(data) {
    var header = document.createElement('div');
    header.classList.add('social-planner-header');

    if (data.scheduled) {
      var scheduled = document.createElement('strong');
      scheduled.textContent = data.scheduled;
      header.appendChild(scheduled);
    }

    if (data.postlink && data.editlink) {
      var link = document.createElement('a');
      link.setAttribute('href', data.editlink);
      link.textContent = data.postlink;
      header.appendChild(link);
    }

    return header;
  };
  /**
   * Create scheduled task content.
   *
   * @param {Object} data Task data from config.
   */


  var createTaskContent = function createTaskContent(data) {
    var content = document.createElement('div');
    content.classList.add('social-planner-content');

    if (data.excerpt) {
      var excerpt = document.createElement('div');
      excerpt.classList.add('social-planner-excerpt');
      excerpt.innerHTML = data.excerpt;
      content.appendChild(excerpt);
    }

    if (data.thumbnail) {
      var thumbnail = document.createElement('img');
      thumbnail.classList.add('social-planner-thumbnail');
      thumbnail.setAttribute('src', data.thumbnail);
      content.appendChild(thumbnail);
    }

    return content;
  };
  /**
   * Create scheduled task targets.
   *
   * @param {Object} data Task data from config.
   */


  var createTaskTargets = function createTaskTargets(data) {
    var targets = document.createElement('div');
    targets.classList.add('social-planner-targets');
    data.networks = data.networks || [];

    for (var i = 0; i < data.networks.length; i++) {
      var network = document.createElement('span');
      network.classList.add('social-planner-network');
      network.textContent = data.networks[i];
      targets.appendChild(network);
    }

    return targets;
  };
  /**
   * Create scheduled task.
   *
   * @param {Object} data Task data from config.
   */


  var createTask = function createTask(data) {
    var task = document.createElement('div');
    task.classList.add('social-planner-task');
    var header = createTaskHeader(data);
    task.appendChild(header);
    var content = createTaskContent(data);
    task.appendChild(content);
    var targets = createTaskTargets(data);
    task.appendChild(targets);
    return task;
  };
  /**
   * Init dashboard.
   */


  var initDashboard = function initDashboard() {
    if (!config.tasks) {
      return showWarning(dashboard, __('Nothing planned.', 'social-planner'));
    }

    config.tasks = config.tasks || [];
    var list = document.createElement('div');
    list.classList.add('social-planner-list');
    dashboard.appendChild(list);

    for (var i = 0; i < config.tasks.length; i++) {
      var task = createTask(config.tasks[i]);
      list.appendChild(task);
    }
  };

  initDashboard();
})();