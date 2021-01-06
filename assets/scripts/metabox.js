"use strict";

/**
 * Metabox script handler.
 */

/* global ajaxurl:true */
(function () {
  if ('undefined' === typeof wp) {
    return;
  }

  var __ = wp.i18n.__;
  var metabox = document.querySelector('#social-planner-metabox > .inside'); // Stop if settings element not exists.

  if (null === metabox) {
    return;
  }

  if ('undefined' === typeof window.socialPlannerMetabox) {
    return;
  }

  var config = window.socialPlannerMetabox || {};
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
   * Send AJAX request to server.
   *
   * @param {HTMLElement} parent Parent DOM element to replace and show warning.
   * @param {Object} data Additional data array.
   * @param {Function} callback Callback function on success only.
   */


  var sendRequest = function sendRequest(parent, data, callback) {
    if (!config.action || !config.nonce) {
      return showWarning(parent, __('Incorrect configuration of metabox options.', 'social-planner'));
    }

    var postID = document.getElementById('post_ID');

    if (null === postID) {
      return showWarning(parent, __('Post ID element is not defined.', 'social-planner'));
    }

    var formData = new window.FormData();
    formData.append('action', config.action);
    formData.append('nonce', config.nonce);
    formData.append('post', postID.value);

    for (var key in data) {
      formData.append(key, data[key]);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', ajaxurl);

    xhr.onerror = function () {
      return showWarning(parent, __('Something went wrong. Try to reload page.', 'social-planner'));
    };

    xhr.onload = function () {
      var response = JSON.parse(xhr.responseText);

      if (!response.success) {
        return showWarning(parent, __('Something went wrong. Try to reload page.', 'social-planner'));
      } // Retrun callback if exists.


      if (typeof callback === 'function') {
        callback(response);
      }
    };

    xhr.send(formData);
  };
  /**
   * Return Date object with server timezone.
   *
   * @param {number} timestamp Optional timestamp.
   */


  var getServerDate = function getServerDate(timestamp) {
    timestamp = timestamp || Date.now(); // Set default config offset.

    config.offset = parseInt(config.offset) || 0; // Get client timezone offset.

    var timezone = new Date().getTimezoneOffset(); // Get UTC timestamp with timezone offset.

    var UTC = Date.now() + timezone * 60 * 1000; // Update timestamp with server offset.

    timestamp = new Date(UTC + config.offset * 1000); // Get date using server timestamp.

    return new Date(timestamp);
  };
  /**
   * Parse datetime string.
   *
   * @param {HTMLElement} parent Parent element.
   * @param {string} index Unique task key.
   */


  var createTime = function createTime(parent, index) {
    var date = getServerDate();
    var time = {
      hour: ('0' + date.getHours()).slice(-2),
      minute: ('0' + date.getMinutes()).slice(-2)
    };
    var meta = config.meta + '[' + index + ']'; // Create hour input.

    var hour = document.createElement('input');
    hour.setAttribute('type', 'text');
    hour.setAttribute('name', meta + '[hour]');
    hour.value = time.hour;
    parent.appendChild(hour);
    hour.addEventListener('change', function () {
      if (!hour.value.match(/^\d+$/)) {
        return hour.value = time.hour;
      }

      hour.value = ('0' + parseInt(hour.value)).slice(-2);

      if (hour.value > 23 || hour.value < 0) {
        return hour.value = time.hour;
      }

      time.hour = hour.value;
    });
    var colon = document.createElement('span');
    colon.textContent = ':';
    parent.appendChild(colon); // Create minute input.

    var minute = document.createElement('input');
    minute.setAttribute('type', 'text');
    minute.setAttribute('name', meta + '[minute]');
    minute.value = time.minute;
    parent.appendChild(minute);
    minute.addEventListener('change', function () {
      if (!minute.value.match(/^\d+$/)) {
        return minute.value = time.minute;
      }

      minute.value = ('0' + minute.value).slice(-2);

      if (minute.value > 59 || minute.value < 0) {
        return minute.value = time.minute;
      }

      time.minute = minute.value;
    });
  };
  /**
   * Helper to create option inside select box
   *
   * @param {HTMLElement} select Parent select element.
   * @param {string} content Option text content.
   * @param {string} value Optional option value.
   */


  var createOption = function createOption(select, content, value) {
    var option = document.createElement('option');
    option.textContent = content;
    option.value = value || '';
    select.appendChild(option);
    return option;
  };
  /**
   * Create task snippet poster.
   *
   * @param {HTMLElement} parent Snippet DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var createPoster = function createPoster(parent, index, data) {
    if (!wp.media) {
      return;
    }

    var poster = document.createElement('figure');
    poster.classList.add('social-planner-poster');
    parent.appendChild(poster);
    var meta = config.meta + '[' + index + ']'; // Create choose button.

    var choose = document.createElement('button');
    choose.classList.add('choose');
    choose.setAttribute('type', 'button');
    choose.textContent = '+'; // Append choose button only for new tasks.

    if (!data.result.sent && !data.schedule) {
      poster.appendChild(choose);
    } // Create image object.


    var image = document.createElement('img'); // Create hidden input with attachment id.

    var attachment = document.createElement('input');
    attachment.setAttribute('type', 'hidden');
    attachment.setAttribute('name', meta + '[attachment]');

    if (data.task.attachment) {
      attachment.value = data.task.attachment;
    }

    poster.appendChild(attachment); // Create hidden input with thumbnail image.

    var thumbnail = document.createElement('input');
    thumbnail.setAttribute('type', 'hidden');
    thumbnail.setAttribute('name', meta + '[thumbnail]');

    if (data.task.thumbnail) {
      thumbnail.value = data.task.thumbnail; // Create image if thumbnail not empty.

      image.setAttribute('src', data.task.thumbnail);
      poster.appendChild(image);
    }

    poster.appendChild(thumbnail); // Choose button listener.

    choose.addEventListener('click', function () {
      var frame = wp.media({
        title: __('Choose poster image', 'social-planner'),
        multiple: false
      });
      frame.on('select', function () {
        var selection = frame.state().get('selection').first().toJSON();
        var url = selection.url; // Set attachment id value.

        attachment.value = selection.id; // Set thumbnail as selection if exists

        if ('undefined' !== typeof selection.sizes.thumbnail) {
          url = selection.sizes.thumbnail.url;
        }

        thumbnail.value = url;
        image.setAttribute('src', url);

        if (!image.parentNode) {
          poster.insertBefore(image, choose);
        }
      });
      frame.open();
    }); // Create remove button.

    var remove = document.createElement('button');
    remove.classList.add('remove');
    remove.setAttribute('type', 'button'); // Append remove button only for new tasks.

    if (!data.result.sent && !data.schedule) {
      poster.appendChild(remove);
    } // Remove button listener.


    remove.addEventListener('click', function (e) {
      e.stopPropagation(); // Clear hidden inputs values.

      attachment.value = '';
      thumbnail.value = '';
      poster.removeChild(image);
    });
    return poster;
  };
  /**
   * Create task snippet poster.
   *
   * @param {HTMLElement} parent Task DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var createSnippet = function createSnippet(parent, index, data) {
    var snippet = document.createElement('div');
    snippet.classList.add('social-planner-snippet');
    parent.appendChild(snippet);
    var meta = config.meta + '[' + index + ']'; // Create excerpt textrea.

    var excerpt = document.createElement('textarea');
    excerpt.classList.add('social-planner-excerpt');
    excerpt.setAttribute('placeholder', __('Social networks summary', 'social-planner'));
    excerpt.setAttribute('name', meta + '[excerpt]');

    if (data.result.sent) {
      excerpt.setAttribute('readonly', 'readonly');
    }

    if (data.schedule) {
      excerpt.setAttribute('readonly', 'readonly');
    }

    if (data.task.excerpt) {
      excerpt.textContent = data.task.excerpt;
    }

    snippet.appendChild(excerpt);
    createPoster(snippet, index, data);
  };
  /**
   * Draw task sent time.
   *
   * @param {HTMLElement} parent Scheduler DOM element.
   * @param {Object} data Task params.
   */


  var drawSentTime = function drawSentTime(parent, data) {
    var icon = document.createElement('span');
    icon.classList.add('social-planner-calendar');
    parent.appendChild(icon);
    var text = document.createElement('span');
    text.textContent = __('Sent:', 'social-planner');
    parent.appendChild(text);
    var time = document.createElement('strong');
    time.textContent = data.result.sent;
    parent.appendChild(time);
  };
  /**
   * Remove task by index.
   *
   * @param {string} index Unique task key.
   */


  var removeTask = function removeTask(index) {
    delete config.tasks[index]; // Create new tasks list.

    createTasksList();
  };
  /**
   * Cancel the task.
   *
   * @param {HTMLElement} parent Scheduler DOM element.
   * @param {string} index Unique task key.
   * @param {Function} callback Callback function on success .
   */


  var cancelTask = function cancelTask(parent, index, callback) {
    var spinner = document.createElement('span');
    spinner.classList.add('spinner', 'is-active');
    parent.appendChild(spinner);
    var data = {
      handler: 'cancel',
      key: index
    };
    sendRequest(parent, data, callback);
  };
  /**
   * Draw task scheduled time.
   *
   * @param {HTMLElement} parent Scheduler DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var drawScheduledTime = function drawScheduledTime(parent, index, data) {
    var icon = document.createElement('span');
    icon.classList.add('social-planner-clock');
    parent.appendChild(icon);
    var text = document.createElement('span');
    text.textContent = __('Scheduled for:', 'social-planner');
    parent.appendChild(text);
    var time = document.createElement('strong');
    time.textContent = data.schedule;
    parent.appendChild(time);
    var cancel = document.createElement('button');
    cancel.classList.add('button-link');
    cancel.textContent = __('Cancel', 'social-planner');
    cancel.addEventListener('click', function (e) {
      e.preventDefault();
      cancelTask(parent, index, function () {
        delete config.schedules[index]; // Create new tasks list.

        createTasksList();
      });
    });
    parent.appendChild(cancel);
  };
  /**
   * Create task scheduler block.
   *
   * @param {HTMLElement} parent Task DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var createScheduler = function createScheduler(parent, index, data) {
    var scheduler = document.createElement('div');
    scheduler.classList.add('social-planner-scheduler');
    parent.appendChild(scheduler); // Check if task sent right away.

    if (data.result.sent) {
      return drawSentTime(scheduler, data);
    } // Don't create scheduler for already planned tasks.


    if (data.schedule) {
      return drawScheduledTime(scheduler, index, data);
    }

    var meta = config.meta + '[' + index + ']'; // Create delay select.

    var date = document.createElement('select');
    date.setAttribute('name', meta + '[date]');
    scheduler.appendChild(date);
    var time = document.createElement('div');
    time.classList.add('social-planner-time');
    scheduler.appendChild(time); // Create default option.

    createOption(date, __('Do not send automatically', 'social-planner')); // Create send immediately option.

    createOption(date, __('Publish immediately', 'social-planner'), 'now');
    config.calendar = config.calendar || {};

    for (var name in config.calendar) {
      createOption(date, config.calendar[name], name);
    }

    date.addEventListener('change', function () {
      // Remove time element children.
      while (time.firstChild) {
        time.removeChild(time.lastChild);
      } // Show time only if the date.


      if (date.value && date.value !== 'now') {
        createTime(time, index);
      }
    });
  };
  /**
   * Create preview setting element.
   *
   * @param {HTMLElement} parent Task DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var createPreview = function createPreview(parent, index, data) {
    var preview = document.createElement('label');
    preview.classList.add('social-planner-preview');
    parent.appendChild(preview);
    var meta = config.meta + '[' + index + ']'; // Create preview checkbox.

    var checkbox = document.createElement('input');
    checkbox.setAttribute('name', meta + '[preview]');
    checkbox.value = 1;
    preview.appendChild(checkbox);
    var title = document.createElement('span');
    preview.appendChild(title); // Preview should be hidden input for readonly tasks.

    if (data.result.sent || data.schedule) {
      checkbox.setAttribute('type', 'hidden');
      title.textContent = __('Preview disabled', 'social-planner');

      if (!data.task.preview) {
        checkbox.value = 0; // Set empty-preview title.

        title.textContent = __('Preview enabled', 'social-planner');
      }

      return;
    }

    checkbox.setAttribute('type', 'checkbox');

    if (data.task.preview) {
      checkbox.setAttribute('checked', 'checked');
    }

    title.textContent = __('Disable preview', 'social-planner');
  };
  /**
   * Create non-publihsed target.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {Object} provider Provider object.
   */


  var createTargetCheckbox = function createTargetCheckbox(parent, provider) {
    var label = document.createElement('label');
    label.classList.add('social-planner-checkbox');
    parent.appendChild(label); // Create checkbox input.

    var input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    label.appendChild(input);
    var span = document.createElement('span');
    span.textContent = provider.label;
    label.appendChild(span);
    return input;
  };
  /**
   * Create scheduled target.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {Object} provider Provider object.
   */


  var createTargetScheduled = function createTargetScheduled(parent, provider) {
    var label = document.createElement('label');
    label.classList.add('social-planner-scheduled');
    parent.appendChild(label); // Create checkbox input.

    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    label.appendChild(input);
    var span = document.createElement('span');
    span.textContent = provider.label;
    label.appendChild(span);
    return input;
  };
  /**
   * Create target with error.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {Object} message Link params.
   * @param {Object} provider Provider object.
   */


  var createTargetError = function createTargetError(parent, message, provider) {
    var error = document.createElement('button');
    error.classList.add('social-planner-error');
    error.textContent = provider.label;
    error.addEventListener('click', function (e) {
      e.preventDefault();
      var extended = parent.querySelector('.social-planner-extended');

      if (null !== extended) {
        return parent.removeChild(extended);
      }

      var content = '<strong>' + __('Sent error:', 'social-planner') + '</strong>';
      extended = document.createElement('p');
      extended.classList.add('social-planner-extended');
      extended.textContent = message;
      extended.innerHTML = content + extended.textContent;
      parent.appendChild(extended);
    });
    parent.appendChild(error);
  };
  /**
   * Create target with link to sent message.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {Object} message Link params.
   * @param {Object} provider Provider object.
   */


  var createTargetLink = function createTargetLink(parent, message, provider) {
    var link = document.createElement('a');
    link.classList.add('social-planner-link');
    link.textContent = provider.label;
    link.setAttribute('href', message);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
    parent.appendChild(link);
  };
  /**
   * Create target with sent message id.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {Object} message Link params.
   * @param {Object} provider Provider object.
   */


  var createTargetInfo = function createTargetInfo(parent, message, provider) {
    var info = document.createElement('button');
    info.classList.add('social-planner-info');
    info.textContent = provider.label;
    info.setAttribute('type', 'button');
    info.addEventListener('click', function (e) {
      e.preventDefault();
      var extended = parent.querySelector('.social-planner-extended');

      if (null !== extended) {
        return parent.removeChild(extended);
      }

      var content = '<strong>' + __('Sent message:', 'social-planner') + '</strong>';
      extended = document.createElement('p');
      extended.classList.add('social-planner-extended');
      extended.textContent = message;
      extended.innerHTML = content + message;
      parent.appendChild(extended);
    });
    parent.appendChild(info);
  };
  /**
   * Create target for sent tasks.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {string} meta Task meta prefix.
   * @param {Object} data Task params.
   */


  var createSentTargets = function createSentTargets(parent, meta, data) {
    var targets = data.task.targets || [];

    for (var i = 0; i < targets.length; i++) {
      var key = targets[i];

      if (!config.providers[key]) {
        continue;
      } // Get provider by key.


      var provider = config.providers[key];

      if (!provider.label) {
        continue;
      }

      var input = document.createElement('input');
      input.value = key;
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', meta + '[targets][]');
      parent.appendChild(input); // If target in links list.

      if (data.result.links && data.result.links[key]) {
        var _message = data.result.links[key]; // Simple check if message is a link.

        if ('http' === _message.substring(0, 4)) {
          createTargetLink(parent, _message, provider);
        } else {
          createTargetInfo(parent, _message, provider);
        }

        continue;
      } // Set default message.


      var message = __('The reason for this error is unknown', 'social-planner'); // Update message if target in errors list.


      if (data.result.errors && data.result.errors[key]) {
        message = data.result.errors[key];
      }

      createTargetError(parent, message, provider);
    }
  };
  /**
   * Create target for unsent tasks.
   *
   * @param {HTMLElement} parent Targets DOM element.
   * @param {string} meta Task meta prefix.
   * @param {Object} data Task params.
   */


  var createUnsentTargets = function createUnsentTargets(parent, meta, data) {
    var targets = data.task.targets || [];

    for (var key in config.providers) {
      var provider = config.providers[key];

      if (!provider.label) {
        continue;
      } // For not scheduled tasks.


      if (!data.schedule) {
        var input = createTargetCheckbox(parent, provider);
        input.setAttribute('name', meta + '[targets][]');
        input.value = key; // Check if provider key in targets array.

        if (targets.indexOf(key) >= 0) {
          input.setAttribute('checked', 'checked');
        }

        continue;
      } // Create hidden inputs for scheduled tasks.


      if (targets.indexOf(key) >= 0) {
        var _input = createTargetScheduled(parent, provider);

        _input.setAttribute('name', meta + '[targets][]');

        _input.value = key;
      }
    }
  };
  /**
   * Create targets element.
   *
   * @param {HTMLElement} parent Task DOM element.
   * @param {string} index Unique task key.
   * @param {Object} data Task params.
   */


  var createTargets = function createTargets(parent, index, data) {
    var targets = document.createElement('div');
    targets.classList.add('social-planner-targets');
    parent.appendChild(targets);
    var meta = config.meta + '[' + index + ']'; // Show target for sent tasks.

    if (data.result.sent) {
      return createSentTargets(targets, meta, data);
    }

    return createUnsentTargets(targets, meta, data);
  };
  /**
   * Generate new index and create empty task.
   *
   * @param {HTMLElement} parent List DOM element.
   */


  var createEmptyTask = function createEmptyTask(parent) {
    // Generate unique task index from timestamp.
    var index = new Date().getTime().toString(36);
    appendTask(parent, index);
  };
  /**
   * Append task.
   *
   * @param {HTMLElement} parent List DOM element.
   * @param {string} index Unique task key.
   */


  var appendTask = function appendTask(parent, index) {
    var data = {};
    var task = document.createElement('fieldset');
    task.classList.add('social-planner-task');
    parent.appendChild(task);
    data.task = {}; // Append task data.

    if (config.tasks && config.tasks[index]) {
      data.task = config.tasks[index];
    }

    data.result = {}; // Append task results.

    if (config.results && config.results[index]) {
      data.result = config.results[index];
    }

    data.schedule = null; // Append task schedule.

    if (config.schedules && config.schedules[index]) {
      data.schedule = config.schedules[index];
    } // Add element with list of targets.


    createTargets(task, index, data); // Create remove button.

    var remove = document.createElement('button');
    remove.classList.add('social-planner-remove');
    remove.setAttribute('type', 'button');
    task.appendChild(remove);
    remove.addEventListener('click', function () {
      if (!data.schedule) {
        return removeTask(index);
      }

      var scheduler = task.querySelector('.social-planner-scheduler'); // Cancel this task first.

      cancelTask(scheduler, index, function () {
        return removeTask(index);
      });
    }); // Add snippet element.

    createSnippet(task, index, data); // Add advanced settings element.

    createPreview(task, index, data); // Add scheduler element.

    createScheduler(task, index, data);
  };
  /**
   * Create button to append new task.
   *
   * @param {HTMLElement} list List DOM Element
   */


  var createAppend = function createAppend(list) {
    var append = document.createElement('button');
    append.classList.add('social-planner-append', 'button');
    append.setAttribute('type', 'button');
    append.textContent = __('Add task', 'social-planner');
    append.addEventListener('click', function () {
      createEmptyTask(list);
    });
    metabox.appendChild(append);
  };
  /**
   * Create metabox tasks list.
   */


  var createTasksList = function createTasksList() {
    var list = metabox.querySelector('.social-planner-list');

    if (null === list) {
      list = document.createElement('div');
      list.classList.add('social-planner-list');
      metabox.appendChild(list);
    } // Clear list children.


    while (list.firstChild) {
      list.removeChild(list.lastChild);
    } // Define tasks if not yet.


    config.tasks = config.tasks || {};

    for (var index in config.tasks) {
      appendTask(list, index);
    } // Append at least one task.


    if (!list.hasChildNodes()) {
      createEmptyTask(list);
    }

    return list;
  };
  /**
   * Get new config with AJAX call and reinit metabox.
   */


  var reinitMetabox = function reinitMetabox() {
    var data = {
      handler: 'update'
    };
    sendRequest(parent, data, function (response) {
      config = response.data || {}; // Create new tasks list.

      createTasksList();
    });
  };
  /**
   * Wait Gutenber post saving and reinit tasks list.
   */


  var subscribeOnSaving = function subscribeOnSaving() {
    var wasSavingPost = wp.data.select('core/edit-post').isSavingMetaBoxes();
    wp.data.subscribe(function () {
      var isSavingPost = wp.data.select('core/edit-post').isSavingMetaBoxes();

      if (wasSavingPost && !isSavingPost) {
        reinitMetabox();
      }

      wasSavingPost = isSavingPost;
    });
  };
  /**
   * Init metabox.
   */


  var initMetabox = function initMetabox() {
    if (!config.meta || !config.providers) {
      return showWarning(metabox, __('Need to configure the plugin on the settings page.', 'social-planner'));
    }

    var list = createTasksList(); // Add append button.

    createAppend(list); // Subscribe and update on Gutenberg post saving.

    subscribeOnSaving();
  };

  initMetabox();
})();