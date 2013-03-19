OpenSpending.Treetable = function (elements, context) {

  var truncateName = function(name, maxlen, repl){
    maxlen = maxlen || 30;
    repl = repl || '...';
    if (name.length > maxlen) {
      return name.substring(0, maxlen - repl.length) + repl;
    }
    return name;
  };

  function render(state, moreDrillDowns, callback) {
    var treemap;

    var treemap_ctx = _.extend(context, {
      click: function(node) {
        callback(node.data.name, node.data.title);
      },
      createLabel: function(widget, domElement, node) {
        if ((node.data.value / treemap.total) > 0.03) {
          domElement.innerHTML = "<div class='desc'><div class='amount'>" + OpenSpending.Utils.formatAmountWithCommas(node.data.value, 0, treemap.currency) +
          "</div><div class='lbl'>" + truncateName(node.name) + "</div></div>";
        }
      },
      hasClick: function(node) {
        return moreDrillDowns();
      },
      tooltipMessage: function(widget, node) {
        var percentualValue = (node.data.value * 100)/widget.total;
        return node.name + ":<br/>" + OpenSpending.Utils.formatAmountWithCommas(node.data.value, 0, treemap.currency) + " (" + percentualValue.toFixed(2) + "%)";
      }
    });

    var aggregateTable = new OpenSpending.AggregateTable(elements.table, context, state);
    $.when(aggregateTable).then(function(widget) {
      widget.$e.unbind('click', 'td a');
      widget.$e.on('click', 'td a', function(e) {
        e.preventDefault();
        var name = $(e.target).attr('data-name') + '';
        callback(name, $(e.target).text());
        return false;
      });
      if (moreDrillDowns()) {
        widget.$e.removeClass('no-links');
      } else {
        widget.$e.addClass('no-links');
      }
      // Workaround for race condition. Check openspendingjs' issue #12.
      if (widget.dataTable) {
        widget.update(state);
      }
    });
    $.when(new OpenSpending.Treemap(elements.treemap, treemap_ctx, state)).then(function(tm){
      treemap = tm;
    });
  }
  return {
    render: render
  };
};
