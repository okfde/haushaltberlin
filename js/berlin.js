OpenSpending = 'OpenSpending' in window ? OpenSpending : {};

$(function(){

  var drillDownTemplate = {
    'functions': ['Hauptfunktion', 'Oberfunktion', 'Funktion'],
    'groups': ['Hauptgruppe', 'Obergruppe', 'Gruppe'],
    'plans': ['Einzelplan', 'to']
  };

  var context = {
    dataset: "berlin_de",
    siteUrl: "http://openspending.org",
    embed: true,
    pagesize: 1000
  };


  OpenSpending.BerlinVis = Backbone.Router.extend({
    routes: {
        '': 'start',
        '*args': 'dispatch'
    },
    initialize: function(){
      this.currentDrillDowns = [];
      this.currentDrilldown = undefined;
      this.currentDrillDownLabels = {};
    },

    start: function() {
      this.navigate(this.buildUrl(true), {trigger: true});
    },

    dispatch: function(args) {
      var parts = args.split('/'), drillDown;
      if (parts[parts.length - 1] === '') {
        parts.pop();
      }
      this.state = {};

      var typ = parts[2];
      if (typ === '3') {
        // Bezirke
        drillDown = ['Bereich'];
      } else {
        // Verfassungsorgane
        // Senatsverwaltungen
        drillDown = [];
      }
      this.drillDownType = parts[3];

      this.state.cuts = {};
      this.state.cuts.Titelart = parts[1];
      this.state.cuts["Typ.name"] = typ;
      this.state.cuts["time.year"] = parts[0];

      this.possibleDrillDowns = drillDown.concat(drillDownTemplate[this.drillDownType]);

      this.currentDrillDowns = [];

      for (var i = 4; i < parts.length; i += 1){
        this.currentDrillDowns.push(this.possibleDrillDowns[i - 4]);
        this.state.cuts[this.possibleDrillDowns[i - 4]] = parts[i];
      }

      this.updateUI();

      if (this.possibleDrillDowns[i - 4] !== undefined) {
        this.state.drilldowns = [this.possibleDrillDowns[i - 4]];
        this.render();
      }
    },

    nextDrillDown: function(value, label) {
      var dd = this.state.drilldowns[0];
      if (this.currentDrillDowns.length >= this.possibleDrillDowns.length - 1){
        return;
      }
      this.currentDrillDownLabels[dd] = label;
      this.currentDrillDowns.push(dd);
      this.state.cuts[dd] = value;
      this.navigate(this.buildUrl(), {trigger: true});
    },

    render: function(){
      this.treetable = OpenSpending.Treetable({
        table: $('#table'),
        treemap: $('#treemap')
      }, context, this.state);
      var self = this;
      this.treetable.render(this.state, this.moreDrillDowns, function(value, label){
        self.nextDrillDown(value, label);
      });
    },

    updateUI: function(){
      $('#time').val(this.state.cuts['time.year']);
      $('#titelart').val(this.state.cuts.Titelart);
      $('#typ').val(this.state.cuts['Typ.name']);
      $('#drilldown').val(this.drillDownType);
      // var breadcrumbs = $('#breadcrumbs').html(null);
      // for (var i = 0; i < this.currentDrillDowns.length; i += 1) {
      //   breadcrumbs
      //     .append($('<dt>').text(this.currentDrillDowns[i]))
      //     .append($('<dd>').text(this.currentDrillDownLabels[this.currentDrillDowns[i]]));
      // }
    },

    buildUrl: function(start, drilldowns){
      var parts = [
        $('#time').val(),
        $('#titelart').val(),
        $('#typ').val(),
        $('#drilldown').val()
      ];
      if (!start) {
        drilldowns = drilldowns || this.currentDrillDowns;
        for (var i = 0; i < drilldowns.length; i += 1) {
          parts.push(this.state.cuts[drilldowns[i]]);
        }
      }
      return parts.join('/');
    }
  });

  OpenSpending.app = new OpenSpending.BerlinVis(context, {'year': '2012'}, ['group', 'to']);

  $('#navigation select').change(function(e){
    e.preventDefault();
    OpenSpending.app.start();
  });

  Backbone.history.start();
});