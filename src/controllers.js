var appControllers = angular.module('testApp.controllers', []);

appControllers.controller('testController', testController);
appControllers.controller('modalNuevoEventoCtrl', modalNuevoEventoCtrl);
appControllers.controller('modalDetalleEventoCtrl', modalDetalleEventoCtrl);

function testController($uibModal, testService, eventService) {
    let vm = this;
    let calendar;

    vm.init = function() {
        var element = document.getElementById('calendar');
        calendar = new FullCalendar.Calendar(element, {
          locale: 'es',
          headerToolbar: {
            start:   'prev',
            center: 'title',
            end:  'next'
          },
          titleFormat: { year: 'numeric', month: 'long' },
          initialView: 'dayGridMonth',
          validRange: {
            start: testService.nowDate(-300).toISOString().slice(0, 10)
          },
          moreLinkClick: 'popover',
          dayMaxEvents: 2,
          views: {
            dayGridMonth: {
              dayMaxEventRows: 2,
            }
          },
          height: 'auto',
          themeSystem: 'bootstrap',
          editable: false,
          eventStartEditable: false,
          eventDurationEditable: false,
          dateClick: dayClicked,
          eventClick: eventClicked
        });
        calendar.render();
    }

    function dayClicked(info) {
      var modalInstance = $uibModal.open({
        templateUrl: './src/templates/nuevoEvento.html',
        controller: 'modalNuevoEventoCtrl as modalCtrl',
        size: 'md',
        backdrop: 'static',
        backdropClass: 'modal-backdrop-angular',
        resolve: {
          eventInfo : function() {
              return info;
          }
        }
      });

      modalInstance.result.then(function(event) {
        let calendarEvent = eventService.nuevoEvento(event);
        calendar.addEvent(calendarEvent);
      });
    }

    function eventClicked(info) {
      let closePopoverElement = document.querySelector('span.fc-popover-close');
      if(closePopoverElement)
        eventFire(closePopoverElement, 'click');

      var modalInstance = $uibModal.open({
        templateUrl: './src/templates/detalleEvento.html',
        controller: 'modalDetalleEventoCtrl as modalCtrl',
        size: 'md',
        backdrop: 'static',
        backdropClass: 'modal-backdrop-angular',
        resolve: {
          eventInfo : function() {
              return info;
          }
        }
      });

      modalInstance.result.then(function(response) {
        if (typeof response === 'string'){
          eventService.eliminarEvento(response);
          calendar.getEventById(response).remove();
        }
        else{
          eventService.editarEvento(response);
          calendar.getEventById(response.id).remove();
          let newEvent = eventService.nuevoEventoCalendar(response);
          calendar.addEvent(newEvent);
          calendar.render();
        }
      });
    }

    function eventFire(el, etype){
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }
};

function modalNuevoEventoCtrl($scope, $uibModalInstance, eventInfo, testService, TipoEvento, TipoPeriodicidad) {
  var vm = this;
  vm.hora = eventInfo.date;
  vm.hora.setHours(8);
  vm.hora.setMinutes(0);
  vm.error = false;

  vm.eventoNuevo = {
    tipoRepeticion: null,
    tipoEvento: TipoEvento.Facturacion,
    fechaInicio: eventInfo.date,  
    fechaFin: undefined,
    descripcion: null,
  };

  vm.nombreOpciones = Object.keys(TipoPeriodicidad);

  vm.addEvent = function() {
    let condFechaFin = (vm.eventoNuevo.fechaFin && vm.eventoNuevo.tipoRepeticion !== '0') || (!vm.eventoNuevo.fechaFin && vm.eventoNuevo.tipoRepeticion === '0')
    if($scope.modalForm.$valid && vm.eventoNuevo.fechaInicio && condFechaFin){
      vm.eventoNuevo.fechaInicio = testService.setHourInDate(vm.eventoNuevo.fechaInicio, vm.hora)
      if(vm.eventoNuevo.fechaFin)
        vm.eventoNuevo.fechaFin = testService.setHourInDate(vm.eventoNuevo.fechaFin, vm.hora)
      $uibModalInstance.close(vm.eventoNuevo);
    }
    else
      vm.error = true;
  }

  vm.closeModal = function() {
    $uibModalInstance.dismiss();
  }

  vm.fechaMin = function() {
    let now = testService.nowDate(-300);
    let result = now.toISOString().slice(0, 10);
    return result;
  }

  vm.fechaMax = function() {
    let minDate = testService.nowDate(-300);
    let year = minDate.getFullYear();
    let in10Years = new Date(year + 10, minDate.getMonth(), minDate.getDate());
    let result = in10Years.toISOString().slice(0, 10);
    return result;
  }
};

function modalDetalleEventoCtrl($scope, $uibModalInstance, eventInfo, testService, TipoPeriodicidad) {
  var vm = this;
  vm.error = false;

  let fechaInicio, fechaFin;
  if(eventInfo.event._def.recurringDef){
    fechaInicio = eventInfo.event._def.recurringDef.typeData.rruleSet._rrule[0].options.dtstart;
    fechaFin = eventInfo.event._def.recurringDef.typeData.rruleSet._rrule[0].options.until;
  }
  else{
    fechaInicio = eventInfo.event._instance.range.start;
    fechaFin = eventInfo.event._instance.range.end;
  }
 
  vm.evento = {
    id: eventInfo.event._def.publicId,
    tipoEvento: eventInfo.event._def.extendedProps.tipoEvento,
    tipoRepeticion: eventInfo.event._def.extendedProps.tipoRepeticion,
    fechaInicio,
    fechaFin,
    descripcion: eventInfo.event._def.title,
  };
  
  vm.hora = testService.getHourInDate(vm.evento.fechaInicio).toISOString().slice(11,16);

  vm.nombreOpciones = Object.keys(TipoPeriodicidad).map((key, index) => {
    return { 
      key,
      value: index
    }
  });
  
  vm.editEvent = function() {
    let condFechaFin = (vm.evento.fechaFin && vm.evento.tipoRepeticion !== '0') || vm.evento.tipoRepeticion === '0';
    if($scope.modalForm.$valid && vm.evento.fechaInicio && condFechaFin){
      vm.evento.fechaInicio = testService.setHourInDate(vm.evento.fechaInicio, vm.hora)
      if(vm.evento.fechaFin && vm.evento.tipoRepeticion !== '0')
        vm.evento.fechaFin = testService.setHourInDate(vm.evento.fechaFin, vm.hora)
      else{
        vm.evento.fechaFin = new Date(vm.evento.fechaInicio.getTime() + 1000*60*60);
      }
      $uibModalInstance.close(vm.evento);
    }
    else
      vm.error = true;
  }

  vm.deleteEvent = function() {
    $uibModalInstance.close(vm.evento.id);
  }

  vm.closeModal = function() {
    $uibModalInstance.dismiss();
  }

  vm.fechaMin = function() {
    let now = new Date();
    let result = now.toISOString().slice(0, 10);
    return result;
  }

  vm.fechaMax = function() {
    let minDate = new Date();
    let year = minDate.getFullYear();
    let in10Years = new Date(year + 10, minDate.getMonth(), minDate.getDate());
    let result = in10Years.toISOString().slice(0, 10);
    return result;
  }
};