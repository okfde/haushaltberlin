/* globals $, Backbone, OpenSpending */
window.OpenSpending = 'OpenSpending' in window ? OpenSpending : {};

$(function(){
  'use strict';

  var drillDownTemplate = {
    'functions': ['Hauptfunktion', 'Oberfunktion', 'Funktion'],
    'groups': ['Hauptgruppe', 'Obergruppe', 'Gruppe'],
    'plans': ['Einzelplan', 'to'],
    'areas': ['Typ']
  };

  var context = {
    dataset: 'berlin_de',
    siteUrl: 'https://openspending.org',
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
    
    jump: function(drilldowns) {
      this.navigate(this.buildUrl(false, drilldowns), {trigger: true});
    },

    dispatch: function(args) {
      var parts = args.split('/');
      if (parts[parts.length - 1] === '') {
        parts.pop();
      }
      this.state = {};
      this.state.cuts = {};
      this.state.cuts['time.year'] = parts[0];
      this.state.cuts.Titelart = parts[1];
      this.drillDownType = parts[3];

      var drillDown = [];
      var typ = parts[2];

      if (typ !== 'all') {
        this.state.cuts.Typ = typ;
        if (typ === '3') {
          drillDown = ['Bereich'];
        } else if (parseInt(typ, 10) > 30) {
          this.state.cuts.Typ = '3';
          this.state.cuts.Bereich = typ;
        }
        if (this.drillDownType === 'areas') {
          $('#drilldown').val('plans');
          return this.navigate(this.buildUrl(), {trigger: true});
        }
      }

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

    hasNextDrillDown: function(){
      return this.currentDrillDowns.length < this.possibleDrillDowns.length - 1;
    },

    nextDrillDown: function(value, label) {
      var dd = this.state.drilldowns[0];
      if (!this.hasNextDrillDown()){
        return false;
      }
      this.currentDrillDownLabels[dd] = label;
      this.currentDrillDowns.push(dd);
      this.state.cuts[dd] = value;
      this.navigate(this.buildUrl(), {trigger: true});
      return true;
    },

    render: function(){
      this.treetable = OpenSpending.Treetable({
        table: $('#table'),
        treemap: $('#treemap')
      }, context, this.state);
      var self = this;
      this.treetable.render(this.state, function(){
        return self.hasNextDrillDown();
      }, function(value, label){
        return self.nextDrillDown(value, label);
      });
    },

    updateUI: function(){
      $('#time').val(this.state.cuts['time.year']);
      $('#titelart').val(this.state.cuts.Titelart);
      if (this.state.cuts.Typ === '3' && this.state.cuts.Bereich) {
        $('#typ').val(this.state.cuts.Bereich);
      } else {
        $('#typ').val(this.state.cuts.Typ || 'all');
      }
      $('#drilldown').find('option[value="areas"]').remove();
      if($('#typ').val() === 'all') {
        $('#drilldown').append('<option value="areas">Bereich</option>');
      }
      $('#drilldown').val(this.drillDownType);
      //Create the first breadcrumb, as this is the drilldown type it is handled differently
      var basichtml = "<a id=\"drilldowntypelink\" href>" + $("#drilldown option[value='"+this.drillDownType+"']").text() + "</a>";
      //Final breadcrumb html
      var navhtml = "";
      
      //Grab data for function
      var state = this.state;
      var labels = this.currentDrillDownLabels;
      
      //Array for holding the current drilldowns
      var ddarray = [];
      //Counter
      var c = 0;  
      
      //Assume we know where we are
      var simpleNav = false;
      
      //Go through each drilldown level possible and if it is in the current state, generate a link
      _.each(drillDownTemplate[this.drillDownType], function(value) {
        if (state.cuts[value] != undefined) {
          //Link
          navhtml += (" &raquo; <a class=\"drilldownsingle\" dest=\"" + value + "\"href>" + labels[value] + "</a>");
          //Build up drilldown array for where we want to go
          ddarray[c] = value;
          c++;
        }
        //Inconsistency caused by reloading/going to a specific URL. No navigation so no breadcrumbs possible (at the moment)
        if ((state.cuts[value] != undefined) && (labels[value] == undefined)) simpleNav = true;
      });
      
      //Show some kind of explanation
      if (simpleNav) navhtml = basichtml + " (direkte Anzeige)";
      //Or the full breadcrumbs
      else navhtml = basichtml + navhtml;
      
      var currentTemplate = drillDownTemplate[this.drillDownType];
      $('#navigationbreadcrumbs').html(navhtml);
      $('#drilldowntypelink').click(function(e){
        e.preventDefault();
        OpenSpending.app.start();
      });
      $('.drilldownsingle').click(function(e){
        e.preventDefault();
        //This is the deepest level we want to go
        var ddlevel = e.currentTarget.attributes.dest.nodeValue;
        var startUndefining = false;
        //Once we reach that in the state, remove everything that's left
        for (var i = 0; i < currentTemplate.length; i += 1){
          if (startUndefining) delete state.cuts[currentTemplate[i]];
          if (currentTemplate[i] == ddlevel) startUndefining = true;
        }
        //Now go there
        OpenSpending.app.jump(ddarray);
      });
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

  OpenSpending.app = new OpenSpending.BerlinVis(context, {'year': '2014'}, ['group', 'to']);
  

       
       

  $('#refresh').click(function(e){
    e.preventDefault();
    OpenSpending.app.start();
  });

  $('#navigation select').change(function(e){
    e.preventDefault();
    OpenSpending.app.start();
  });

  if (document.location.search.indexOf('nonav') !== -1){
    $('#navigation').hide();
  }

  Backbone.history.start();
});